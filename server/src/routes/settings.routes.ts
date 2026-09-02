import { Router, Request, Response } from 'express';
import Database from 'better-sqlite3';
import { authenticateToken, requireRole, logAudit } from '../middleware/auth';

export function createSettingsRouter(db: Database.Database): Router {
  const router = Router();

  // GET /api/settings (Publicly readable store configuration)
  router.get('/', (_req: Request, res: Response) => {
    try {
      const rows = db.prepare('SELECT key, value FROM store_settings').all() as any[];
      const settings: Record<string, any> = {};

      for (const row of rows) {
        try {
          settings[row.key] = JSON.parse(row.value);
        } catch {
          settings[row.key] = row.value;
        }
      }

      res.json({ settings });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch settings' });
    }
  });

  // PUT /api/settings (Owner & Super Admin update store settings)
  router.put('/', authenticateToken, requireRole(['owner', 'super_admin']), (req: Request, res: Response) => {
    try {
      const { settings } = req.body;
      if (!settings || typeof settings !== 'object') {
        res.status(400).json({ error: 'Settings object is required' });
        return;
      }

      const upsert = db.prepare(`
        INSERT INTO store_settings (key, value)
        VALUES (?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
      `);

      for (const [key, val] of Object.entries(settings)) {
        const strVal = typeof val === 'object' ? JSON.stringify(val) : String(val);
        upsert.run(key, strVal);
      }

      logAudit(db, req.user!.id, req.user!.email, 'STORE_SETTINGS_UPDATED', 'store_settings', null, settings);

      res.json({ message: 'Settings updated successfully' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to update settings' });
    }
  });

  // GET /api/audit-logs (Super Admin & Owner)
  router.get('/audit-logs', authenticateToken, requireRole(['owner', 'super_admin']), (req: Request, res: Response) => {
    try {
      const { limit = 50, action } = req.query;

      let query = `
        SELECT * FROM audit_logs
        WHERE 1=1
      `;
      const params: any[] = [];

      if (action) {
        query += ` AND action = ?`;
        params.push(String(action));
      }

      query += ` ORDER BY created_at DESC LIMIT ?`;
      params.push(Number(limit));

      const logs = db.prepare(query).all(...params);
      res.json({ logs, total: logs.length });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch audit logs' });
    }
  });

  // GET /api/discounts (Admin, Owner, Super Admin)
  router.get('/discounts', authenticateToken, requireRole(['admin', 'owner', 'super_admin']), (_req: Request, res: Response) => {
    try {
      const discounts = db.prepare('SELECT * FROM discounts ORDER BY id DESC').all();
      res.json({ discounts });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch discounts' });
    }
  });

  // POST /api/discounts (Owner, Super Admin)
  router.post('/discounts', authenticateToken, requireRole(['owner', 'super_admin']), (req: Request, res: Response) => {
    try {
      const { code, discount_type, value, min_spend = 0, max_uses, expires_at } = req.body;

      if (!code || !discount_type || value === undefined) {
        res.status(400).json({ error: 'Code, discount_type, and value are required' });
        return;
      }

      const cleanCode = code.toUpperCase().trim();
      const existing = db.prepare('SELECT id FROM discounts WHERE code = ?').get(cleanCode);
      if (existing) {
        res.status(409).json({ error: 'Discount code already exists' });
        return;
      }

      const result = db.prepare(`
        INSERT INTO discounts (code, discount_type, value, min_spend, max_uses, expires_at, is_active)
        VALUES (?, ?, ?, ?, ?, ?, 1)
      `).run(cleanCode, discount_type, Number(value), Number(min_spend), max_uses ? Number(max_uses) : null, expires_at || null);

      const newId = Number(result.lastInsertRowid);
      logAudit(db, req.user!.id, req.user!.email, 'DISCOUNT_CREATED', 'discounts', newId, { code: cleanCode, value });

      const discount = db.prepare('SELECT * FROM discounts WHERE id = ?').get(newId);
      res.status(201).json({ message: 'Discount created successfully', discount });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to create discount' });
    }
  });

  // PATCH /api/discounts/:id/toggle (Owner, Super Admin)
  router.patch('/discounts/:id/toggle', authenticateToken, requireRole(['owner', 'super_admin']), (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const current = db.prepare('SELECT id, is_active FROM discounts WHERE id = ?').get(Number(id)) as any;
      if (!current) {
        res.status(404).json({ error: 'Discount not found' });
        return;
      }

      const nextStatus = current.is_active === 1 ? 0 : 1;
      db.prepare('UPDATE discounts SET is_active = ? WHERE id = ?').run(nextStatus, Number(id));

      res.json({ message: `Discount ${nextStatus === 1 ? 'activated' : 'deactivated'} successfully`, is_active: nextStatus });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to toggle discount' });
    }
  });

  // POST /api/discounts/validate (Public cart coupon verification)
  router.post('/discounts/validate', (req: Request, res: Response) => {
    try {
      const { code, subtotal = 0 } = req.body;
      if (!code) {
        res.status(400).json({ error: 'Code is required' });
        return;
      }

      const discount = db.prepare('SELECT * FROM discounts WHERE code = ? AND is_active = 1').get(code.toUpperCase().trim()) as any;
      if (!discount) {
        res.status(404).json({ error: 'Invalid or inactive promotional code' });
        return;
      }

      if (discount.expires_at && new Date(discount.expires_at) < new Date()) {
        res.status(400).json({ error: 'This promo code has expired' });
        return;
      }

      if (subtotal < discount.min_spend) {
        res.status(400).json({
          error: `Minimum spend of $${discount.min_spend.toFixed(2)} required for this code`
        });
        return;
      }

      if (discount.max_uses && discount.used_count >= discount.max_uses) {
        res.status(400).json({ error: 'This promo code has reached its maximum redemptions' });
        return;
      }

      let discountAmount = 0;
      if (discount.discount_type === 'percentage') {
        discountAmount = parseFloat(((subtotal * discount.value) / 100).toFixed(2));
      } else {
        discountAmount = Math.min(subtotal, discount.value);
      }

      res.json({
        valid: true,
        code: discount.code,
        discountType: discount.discount_type,
        value: discount.value,
        discountAmount
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to validate discount' });
    }
  });

  return router;
}
