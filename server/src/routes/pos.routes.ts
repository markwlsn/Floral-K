import { Router, Request, Response } from 'express';
import Database from 'better-sqlite3';
import { authenticateToken, requireRole, logAudit } from '../middleware/auth';
import { PaymentMethod } from '../types';

function generatePosOrderNumber(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `FK-POS-${dateStr}-${randomNum}`;
}

export function createPosRouter(db: Database.Database): Router {
  const router = Router();

  // Protect all POS routes to Staff / Admin / Owner / Super Admin
  router.use(authenticateToken, requireRole(['admin', 'owner', 'super_admin']));

  // GET /api/pos/quick-catalog (Fast product lookup for POS register grid)
  router.get('/quick-catalog', (_req: Request, res: Response) => {
    try {
      const products = db.prepare(`
        SELECT p.id, p.name, p.sku, p.barcode, p.price, p.stock, p.min_stock_alert,
               p.category_id, c.name as category_name, p.images
        FROM products p
        JOIN categories c ON c.id = p.category_id
        WHERE p.is_available = 1
        ORDER BY p.stock > 0 DESC, p.name ASC
      `).all() as any[];

      const formatted = products.map((p) => ({
        ...p,
        images: typeof p.images === 'string' ? JSON.parse(p.images || '[]') : p.images || []
      }));

      res.json({ products: formatted });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch POS catalog' });
    }
  });

  // GET /api/pos/register/status
  router.get('/register/status', (req: Request, res: Response) => {
    try {
      const cashierId = req.user!.id;
      const activeSession = db.prepare(`
        SELECT s.*, u.name as cashier_name
        FROM pos_sessions s
        JOIN users u ON u.id = s.cashier_id
        WHERE s.cashier_id = ? AND s.status = 'open'
        ORDER BY s.opened_at DESC
        LIMIT 1
      `).get(cashierId) as any;

      res.json({ activeSession: activeSession || null });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to check register status' });
    }
  });

  // POST /api/pos/register/open
  router.post('/register/open', (req: Request, res: Response) => {
    try {
      const cashierId = req.user!.id;
      const { openingCash = 150.0, notes } = req.body;

      const existingSession = db.prepare(`
        SELECT id FROM pos_sessions WHERE cashier_id = ? AND status = 'open'
      `).get(cashierId);

      if (existingSession) {
        res.status(400).json({ error: 'You already have an open register session' });
        return;
      }

      const result = db.prepare(`
        INSERT INTO pos_sessions (cashier_id, opening_cash, total_sales, status, notes)
        VALUES (?, ?, 0.0, 'open', ?)
      `).run(cashierId, Number(openingCash), notes || null);

      const sessionId = Number(result.lastInsertRowid);
      logAudit(db, cashierId, req.user!.email, 'POS_REGISTER_OPENED', 'pos_sessions', sessionId, { openingCash });

      const session = db.prepare('SELECT * FROM pos_sessions WHERE id = ?').get(sessionId);
      res.status(201).json({ message: 'Register opened successfully', session });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to open register' });
    }
  });

  // POST /api/pos/register/close
  router.post('/register/close', (req: Request, res: Response) => {
    try {
      const cashierId = req.user!.id;
      const { closingCash, notes } = req.body;

      const session = db.prepare(`
        SELECT * FROM pos_sessions WHERE cashier_id = ? AND status = 'open'
      `).get(cashierId) as any;

      if (!session) {
        res.status(400).json({ error: 'No active open register session found for current cashier' });
        return;
      }

      const expectedCash = session.opening_cash + session.total_sales;
      const discrepancy = closingCash !== undefined ? Number(closingCash) - expectedCash : 0;

      db.prepare(`
        UPDATE pos_sessions
        SET closed_at = CURRENT_TIMESTAMP, closing_cash = ?, status = 'closed', notes = COALESCE(?, notes)
        WHERE id = ?
      `).run(closingCash !== undefined ? Number(closingCash) : expectedCash, notes || null, session.id);

      logAudit(db, cashierId, req.user!.email, 'POS_REGISTER_CLOSED', 'pos_sessions', session.id, {
        openingCash: session.opening_cash,
        totalSales: session.total_sales,
        closingCash: closingCash || expectedCash,
        discrepancy
      });

      const closed = db.prepare('SELECT * FROM pos_sessions WHERE id = ?').get(session.id);
      res.json({
        message: 'Register closed successfully',
        session: closed,
        summary: {
          openingCash: session.opening_cash,
          totalSales: session.total_sales,
          expectedCash,
          closingCash: closingCash || expectedCash,
          discrepancy
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to close register' });
    }
  });

  // POST /api/pos/orders (Process rapid walk-in POS order)
  router.post('/orders', (req: Request, res: Response) => {
    try {
      const {
        items,
        customerName = 'Walk-in Guest',
        customerPhone,
        customerEmail,
        paymentMethod = 'cash',
        amountTendered,
        discountAmount = 0,
        notes
      } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        res.status(400).json({ error: 'At least one item is required' });
        return;
      }

      const taxRateSetting = db.prepare("SELECT value FROM store_settings WHERE key = 'tax_rate'").get() as { value: string } | undefined;
      const storeNameSetting = db.prepare("SELECT value FROM store_settings WHERE key = 'store_name'").get() as { value: string } | undefined;
      const storeAddressSetting = db.prepare("SELECT value FROM store_settings WHERE key = 'store_address'").get() as { value: string } | undefined;
      const storePhoneSetting = db.prepare("SELECT value FROM store_settings WHERE key = 'store_phone'").get() as { value: string } | undefined;
      const receiptFooterSetting = db.prepare("SELECT value FROM store_settings WHERE key = 'pos_receipt_footer'").get() as { value: string } | undefined;

      const taxRate = taxRateSetting ? parseFloat(taxRateSetting.value) : 0.0825;

      const posTx = db.transaction(() => {
        let subtotal = 0;
        let totalCostPrice = 0;
        const verifiedItems: any[] = [];

        for (const item of items) {
          const product = db.prepare('SELECT * FROM products WHERE id = ?').get(item.productId) as any;
          if (!product) {
            throw new Error(`Product with ID ${item.productId} not found`);
          }
          if (product.stock < item.quantity) {
            throw new Error(`Insufficient stock for "${product.name}". Available: ${product.stock}, requested: ${item.quantity}`);
          }

          const unitPrice = item.unitPrice !== undefined ? Number(item.unitPrice) : product.price;
          const lineSubtotal = unitPrice * item.quantity;
          subtotal += lineSubtotal;
          totalCostPrice += (product.cost_price || 0) * item.quantity;

          verifiedItems.push({
            productId: product.id,
            productName: product.name,
            productSku: product.sku,
            unitPrice,
            costPrice: product.cost_price || 0,
            quantity: item.quantity,
            subtotal: lineSubtotal
          });
        }

        const effectiveDiscount = Math.min(subtotal, Math.max(0, Number(discountAmount) || 0));
        const taxableAmount = subtotal - effectiveDiscount;
        const tax = parseFloat((taxableAmount * taxRate).toFixed(2));
        const total = parseFloat((taxableAmount + tax).toFixed(2));

        const orderNumber = generatePosOrderNumber();
        const cashierId = req.user!.id;

        // Cash tender calculation
        const tendered = amountTendered !== undefined ? Number(amountTendered) : total;
        if (paymentMethod === 'cash' && tendered < total) {
          throw new Error(`Amount tendered ($${tendered.toFixed(2)}) is less than the total balance ($${total.toFixed(2)})`);
        }
        const changeDue = paymentMethod === 'cash' ? parseFloat((tendered - total).toFixed(2)) : 0.0;

        const posNotes = paymentMethod === 'cash'
          ? `Cash Tendered: $${tendered.toFixed(2)}, Change: $${changeDue.toFixed(2)}${notes ? ' | ' + notes : ''}`
          : (notes || 'POS Card/Digital Payment');

        // Create order
        const insertOrderStmt = db.prepare(`
          INSERT INTO orders (
            order_number, customer_name, customer_email, customer_phone,
            order_type, status, payment_status, payment_method, subtotal, discount,
            delivery_fee, tax, total, delivery_date, delivery_time_slot,
            recipient_name, recipient_phone, delivery_address, card_message, notes,
            source, created_by_user_id
          ) VALUES (?, ?, ?, ?, 'pos_walkin', 'delivered', 'paid', ?, ?, ?, 0.0, ?, ?, DATE('now'), 'Walk-in', ?, ?, 'Floral K Storefront Counter', 'Direct Store Purchase', ?, 'pos', ?)
        `);

        const orderResult = insertOrderStmt.run(
          orderNumber,
          customerName.trim(),
          customerEmail ? customerEmail.trim() : null,
          customerPhone ? customerPhone.trim() : null,
          paymentMethod as PaymentMethod,
          subtotal,
          effectiveDiscount,
          tax,
          total,
          customerName.trim(),
          customerPhone || null,
          posNotes,
          cashierId
        );

        const orderId = Number(orderResult.lastInsertRowid);

        // Deduct inventory & record items
        const insertItemStmt = db.prepare(`
          INSERT INTO order_items (
            order_id, product_id, product_name, product_sku, unit_price, cost_price, quantity, subtotal
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const updateStockStmt = db.prepare(`
          UPDATE products
          SET stock = stock - ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `);

        for (const item of verifiedItems) {
          insertItemStmt.run(
            orderId,
            item.productId,
            item.productName,
            item.productSku,
            item.unitPrice,
            item.costPrice,
            item.quantity,
            item.subtotal
          );

          updateStockStmt.run(item.quantity, item.productId);
        }

        // Update active POS session total sales if open
        db.prepare(`
          UPDATE pos_sessions
          SET total_sales = total_sales + ?
          WHERE cashier_id = ? AND status = 'open'
        `).run(total, cashierId);

        // Printable thermal receipt data structure
        const receipt = {
          storeName: storeNameSetting ? storeNameSetting.value : 'Floral K Boutique & Atelier',
          storeAddress: storeAddressSetting ? storeAddressSetting.value : '742 Blossom Boulevard, Floral District',
          storePhone: storePhoneSetting ? storePhoneSetting.value : '+1 (555) 356-7255',
          orderNumber,
          date: new Date().toISOString(),
          cashierName: req.user!.name,
          customerName: customerName.trim(),
          items: verifiedItems,
          subtotal,
          discount: effectiveDiscount,
          tax,
          total,
          paymentMethod,
          amountTendered: tendered,
          changeDue,
          footer: receiptFooterSetting ? receiptFooterSetting.value : 'Thank you for choosing Floral K!'
        };

        return { orderId, orderNumber, receipt, total };
      });

      const txResult = posTx();

      logAudit(
        db,
        req.user!.id,
        req.user!.email,
        'POS_SALE_COMPLETED',
        'orders',
        txResult.orderId,
        { orderNumber: txResult.orderNumber, total: txResult.total, paymentMethod },
        req.ip
      );

      res.status(201).json({
        message: 'POS transaction completed successfully',
        orderId: txResult.orderId,
        orderNumber: txResult.orderNumber,
        receipt: txResult.receipt
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'POS transaction failed' });
    }
  });

  return router;
}
