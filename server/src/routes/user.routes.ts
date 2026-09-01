import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import Database from 'better-sqlite3';
import { authenticateToken, requireRole, logAudit } from '../middleware/auth';
import { UserRole } from '../types';

export function createUserRouter(db: Database.Database): Router {
  const router = Router();

  // Protect all user management endpoints for Owner and Super Admin
  router.use(authenticateToken, requireRole(['owner', 'super_admin']));

  // GET /api/users
  router.get('/', (req: Request, res: Response) => {
    try {
      const { role, search } = req.query;

      let query = `
        SELECT id, name, email, role, phone, is_active, created_at, updated_at
        FROM users
        WHERE 1=1
      `;
      const params: any[] = [];

      if (role) {
        query += ` AND role = ?`;
        params.push(String(role));
      }

      if (search) {
        query += ` AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)`;
        const term = `%${search}%`;
        params.push(term, term, term);
      }

      query += ` ORDER BY created_at DESC`;

      const users = db.prepare(query).all(...params);
      res.json({ users, total: users.length });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch users' });
    }
  });

  // POST /api/users (Create staff/admin user)
  router.post('/', (req: Request, res: Response) => {
    try {
      const { name, email, password, role = 'admin', phone } = req.body;

      if (!name || !email || !password) {
        res.status(400).json({ error: 'Name, email, and password are required' });
        return;
      }

      // Only super_admin can create another super_admin
      if (role === 'super_admin' && req.user!.role !== 'super_admin') {
        res.status(403).json({ error: 'Only Super Admin can create Super Admin accounts' });
        return;
      }

      const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
      if (existing) {
        res.status(409).json({ error: 'User with this email already exists' });
        return;
      }

      const salt = bcrypt.genSaltSync(10);
      const passwordHash = bcrypt.hashSync(password, salt);

      const result = db.prepare(`
        INSERT INTO users (name, email, password_hash, role, phone, is_active)
        VALUES (?, ?, ?, ?, ?, 1)
      `).run(name.trim(), email.toLowerCase().trim(), passwordHash, role as UserRole, phone || null);

      const newUserId = Number(result.lastInsertRowid);
      logAudit(db, req.user!.id, req.user!.email, 'USER_CREATED', 'users', newUserId, { name, email, role });

      const newUser = db.prepare('SELECT id, name, email, role, phone, is_active, created_at FROM users WHERE id = ?').get(newUserId);
      res.status(201).json({ message: 'User created successfully', user: newUser });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to create user' });
    }
  });

  // PATCH /api/users/:id/role
  router.patch('/:id/role', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { role } = req.body;

      const validRoles: UserRole[] = ['super_admin', 'owner', 'admin', 'customer'];
      if (!role || !validRoles.includes(role)) {
        res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
        return;
      }

      // Only super_admin can promote to or demote from super_admin
      if ((role === 'super_admin') && req.user!.role !== 'super_admin') {
        res.status(403).json({ error: 'Only Super Admin can assign Super Admin role' });
        return;
      }

      const targetUser = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(Number(id)) as any;
      if (!targetUser) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      if (targetUser.role === 'super_admin' && req.user!.role !== 'super_admin') {
        res.status(403).json({ error: 'Cannot alter role of a Super Admin' });
        return;
      }

      db.prepare(`
        UPDATE users
        SET role = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(role, Number(id));

      logAudit(db, req.user!.id, req.user!.email, 'USER_ROLE_CHANGED', 'users', String(id), {
        previousRole: targetUser.role,
        newRole: role
      });

      const updated = db.prepare('SELECT id, name, email, role, phone, is_active, created_at, updated_at FROM users WHERE id = ?').get(Number(id));
      res.json({ message: 'Role updated successfully', user: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to update user role' });
    }
  });

  // PATCH /api/users/:id/status (Toggle Active / Deactivated)
  router.patch('/:id/status', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      if (Number(id) === req.user!.id) {
        res.status(400).json({ error: 'Cannot deactivate your own account' });
        return;
      }

      db.prepare(`
        UPDATE users
        SET is_active = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(isActive ? 1 : 0, Number(id));

      logAudit(db, req.user!.id, req.user!.email, 'USER_STATUS_TOGGLED', 'users', String(id), { isActive: !!isActive });

      const updated = db.prepare('SELECT id, name, email, role, phone, is_active FROM users WHERE id = ?').get(Number(id));
      res.json({ message: `User ${isActive ? 'activated' : 'deactivated'} successfully`, user: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to update user status' });
    }
  });

  // DELETE /api/users/:id
  router.delete('/:id', (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      if (Number(id) === req.user!.id) {
        res.status(400).json({ error: 'Cannot delete your own account' });
        return;
      }

      const target = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(Number(id)) as any;
      if (!target) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      if (target.role === 'super_admin' && req.user!.role !== 'super_admin') {
        res.status(403).json({ error: 'Cannot delete Super Admin account' });
        return;
      }

      db.prepare('DELETE FROM users WHERE id = ?').run(Number(id));
      logAudit(db, req.user!.id, req.user!.email, 'USER_DELETED', 'users', String(id), { email: target.email });

      res.json({ message: 'User deleted successfully' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to delete user' });
    }
  });

  return router;
}
