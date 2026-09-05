import { Router, Request, Response } from 'express';
import Database from 'better-sqlite3';
import { authenticateToken, optionalAuth, requireRole, logAudit } from '../middleware/auth';
import { OrderStatus, PaymentMethod, OrderType } from '../types';

function generateOrderNumber(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `FK-${dateStr}-${randomNum}`;
}

export function createOrderRouter(db: Database.Database): Router {
  const router = Router();

  // GET /api/orders/track/:orderNumber (Public Order Tracking)
  router.get('/track/:orderNumber', (req: Request, res: Response) => {
    try {
      const orderNumber = String(req.params.orderNumber);

      const order = db.prepare(`
        SELECT id, order_number, customer_name, customer_phone, order_type, status,
               payment_status, delivery_date, delivery_time_slot, recipient_name,
               delivery_address, card_message, source, created_at, updated_at
        FROM orders
        WHERE order_number = ?
      `).get(orderNumber.trim()) as any;

      if (!order) {
        res.status(404).json({ error: 'Order not found with that order number' });
        return;
      }

      const items = db.prepare(`
        SELECT product_name, product_sku, unit_price, quantity, subtotal
        FROM order_items
        WHERE order_id = ?
      `).all(order.id);

      // Mask sensitive phone number for privacy: +1 (555) ***-1234
      const maskedPhone = order.customer_phone
        ? order.customer_phone.replace(/\d(?=\d{4})/g, '*')
        : null;

      res.json({
        order: {
          ...order,
          customer_phone: maskedPhone,
          items
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to track order' });
    }
  });

  // POST /api/orders/checkout (Customer / Guest Web Checkout)
  router.post('/checkout', optionalAuth, (req: Request, res: Response) => {
    try {
      const {
        items,
        customerName,
        customerEmail,
        customerPhone,
        orderType = 'online_delivery',
        deliveryDate,
        deliveryTimeSlot,
        recipientName,
        recipientPhone,
        deliveryAddress,
        cardMessage,
        notes,
        discountCode,
        paymentMethod = 'card'
      } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        res.status(400).json({ error: 'Cart cannot be empty' });
        return;
      }

      if (!customerName || !customerPhone) {
        res.status(400).json({ error: 'Customer name and phone number are required' });
        return;
      }

      if (orderType === 'online_delivery' && !deliveryAddress) {
        res.status(400).json({ error: 'Delivery address is required for delivery orders' });
        return;
      }

      // Strict Store Pickup Reservation Rule:
      // Store pickup requires prepaid online payment to prevent florist bouquet ghosting and stem spoilage
      if (orderType === 'online_pickup' && paymentMethod === 'cod') {
        res.status(400).json({
          error: 'In-store pickup requires a prepaid online reservation (QRPH, GCash, Maya, or Card) to guarantee fresh blooms and prevent no-shows.'
        });
        return;
      }

      // Fetch store settings for tax and delivery fees
      const taxRateSetting = db.prepare("SELECT value FROM store_settings WHERE key = 'tax_rate'").get() as { value: string } | undefined;
      const deliveryFeeSetting = db.prepare("SELECT value FROM store_settings WHERE key = 'standard_delivery_fee'").get() as { value: string } | undefined;
      const freeDeliverySetting = db.prepare("SELECT value FROM store_settings WHERE key = 'free_delivery_threshold'").get() as { value: string } | undefined;

      const taxRate = taxRateSetting ? parseFloat(taxRateSetting.value) : 0.0825;
      const baseDeliveryFee = deliveryFeeSetting ? parseFloat(deliveryFeeSetting.value) : 15.00;
      const freeDeliveryThreshold = freeDeliverySetting ? parseFloat(freeDeliverySetting.value) : 120.00;

      // Validate products and stock inside a transaction
      const orderTransaction = db.transaction(() => {
        let subtotal = 0;
        let totalCostPrice = 0;
        const verifiedItems: any[] = [];

        for (const item of items) {
          const product = db.prepare('SELECT * FROM products WHERE id = ?').get(item.productId) as any;
          if (!product) {
            throw new Error(`Product with ID ${item.productId} does not exist`);
          }
          if (product.is_available !== 1) {
            throw new Error(`Product "${product.name}" is currently unavailable`);
          }
          if (product.stock < item.quantity) {
            throw new Error(`Insufficient stock for "${product.name}". Available: ${product.stock}, requested: ${item.quantity}`);
          }

          const lineSubtotal = product.price * item.quantity;
          subtotal += lineSubtotal;
          totalCostPrice += (product.cost_price || 0) * item.quantity;

          verifiedItems.push({
            productId: product.id,
            productName: product.name,
            productSku: product.sku,
            unitPrice: product.price,
            costPrice: product.cost_price || 0,
            quantity: item.quantity,
            subtotal: lineSubtotal
          });
        }

        // Apply discount if provided
        let discountAmount = 0;
        if (discountCode) {
          const discount = db.prepare(`
            SELECT * FROM discounts
            WHERE code = ? AND is_active = 1
          `).get(discountCode.toUpperCase().trim()) as any;

          if (discount) {
            if (discount.expires_at && new Date(discount.expires_at) < new Date()) {
              // expired
            } else if (subtotal < discount.min_spend) {
              // doesn't meet min spend
            } else if (discount.max_uses && discount.used_count >= discount.max_uses) {
              // limit reached
            } else {
              if (discount.discount_type === 'percentage') {
                discountAmount = parseFloat(((subtotal * discount.value) / 100).toFixed(2));
              } else {
                discountAmount = Math.min(subtotal, discount.value);
              }
              // Increment used count
              db.prepare('UPDATE discounts SET used_count = used_count + 1 WHERE id = ?').run(discount.id);
            }
          }
        }

        // Calculate delivery fee
        let deliveryFee = 0;
        if (orderType === 'online_delivery') {
          deliveryFee = subtotal >= freeDeliveryThreshold ? 0.0 : baseDeliveryFee;
        }

        const taxableAmount = Math.max(0, subtotal - discountAmount);
        const tax = parseFloat((taxableAmount * taxRate).toFixed(2));
        const total = parseFloat((taxableAmount + deliveryFee + tax).toFixed(2));

        const orderNumber = generateOrderNumber();
        const customerId = req.user ? req.user.id : null;
        const paymentStatus = paymentMethod === 'cod' ? 'pending' : 'paid';

        // Insert Order
        const insertOrderStmt = db.prepare(`
          INSERT INTO orders (
            order_number, customer_id, customer_name, customer_email, customer_phone,
            order_type, status, payment_status, payment_method, subtotal, discount,
            delivery_fee, tax, total, delivery_date, delivery_time_slot,
            recipient_name, recipient_phone, delivery_address, card_message, notes,
            source, created_by_user_id
          ) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'web', ?)
        `);

        const orderResult = insertOrderStmt.run(
          orderNumber,
          customerId,
          customerName.trim(),
          customerEmail ? customerEmail.trim() : null,
          customerPhone.trim(),
          orderType as OrderType,
          paymentStatus,
          paymentMethod as PaymentMethod,
          subtotal,
          discountAmount,
          deliveryFee,
          tax,
          total,
          deliveryDate || null,
          deliveryTimeSlot || null,
          recipientName ? recipientName.trim() : customerName.trim(),
          recipientPhone ? recipientPhone.trim() : customerPhone.trim(),
          deliveryAddress || null,
          cardMessage || null,
          notes || null,
          customerId
        );

        const orderId = Number(orderResult.lastInsertRowid);

        // Insert items & decrement stock
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

        return {
          orderId,
          orderNumber,
          subtotal,
          discountAmount,
          deliveryFee,
          tax,
          total,
          items: verifiedItems
        };
      });

      const orderData = orderTransaction();

      logAudit(
        db,
        req.user ? req.user.id : null,
        customerEmail || null,
        'WEB_CHECKOUT_COMPLETED',
        'orders',
        orderData.orderId,
        { orderNumber: orderData.orderNumber, total: orderData.total },
        req.ip
      );

      res.status(201).json({
        message: 'Order created successfully',
        order: {
          id: orderData.orderId,
          orderNumber: orderData.orderNumber,
          customerName,
          customerEmail,
          customerPhone,
          orderType,
          deliveryDate,
          deliveryTimeSlot,
          recipientName,
          deliveryAddress,
          cardMessage,
          subtotal: orderData.subtotal,
          discount: orderData.discountAmount,
          deliveryFee: orderData.deliveryFee,
          tax: orderData.tax,
          total: orderData.total,
          status: 'pending',
          paymentStatus: 'paid',
          items: orderData.items
        }
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Checkout failed' });
    }
  });

  // GET /api/orders (List orders with role-based filtering)
  router.get('/', authenticateToken, (req: Request, res: Response) => {
    try {
      const user = req.user!;
      const { status, source, date, search } = req.query;

      let query = `
        SELECT o.*, u.name as user_account_name, u.email as user_account_email
        FROM orders o
        LEFT JOIN users u ON u.id = o.customer_id
        WHERE 1=1
      `;
      const params: any[] = [];

      // If customer, restrict to their own orders only
      if (user.role === 'customer') {
        query += ` AND o.customer_id = ?`;
        params.push(user.id);
      }

      if (status) {
        query += ` AND o.status = ?`;
        params.push(String(status));
      }

      if (source) {
        query += ` AND o.source = ?`;
        params.push(String(source));
      }

      if (date) {
        query += ` AND DATE(o.created_at) = ?`;
        params.push(String(date));
      }

      if (search) {
        query += ` AND (o.order_number LIKE ? OR o.customer_name LIKE ? OR o.customer_phone LIKE ? OR o.recipient_name LIKE ?)`;
        const term = `%${search}%`;
        params.push(term, term, term, term);
      }

      query += ` ORDER BY o.created_at DESC`;

      const orders = db.prepare(query).all(...params) as any[];

      // Populate item counts and items for each order
      const ordersWithItems = orders.map((o) => {
        const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(o.id);
        return {
          ...o,
          items
        };
      });

      res.json({ orders: ordersWithItems, total: ordersWithItems.length });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch orders' });
    }
  });

  // GET /api/orders/:id (Single order detail)
  router.get('/:id', authenticateToken, (req: Request, res: Response) => {
    try {
      const user = req.user!;
      const { id } = req.params;

      const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(Number(id)) as any;
      if (!order) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }

      // If customer, ensure they own the order
      if (user.role === 'customer' && order.customer_id !== user.id) {
        res.status(403).json({ error: 'Access denied to this order' });
        return;
      }

      const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);

      res.json({ order: { ...order, items } });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch order details' });
    }
  });

  // PATCH /api/orders/:id/status (Admin, Owner, Super Admin update fulfillment)
  router.patch('/:id/status', authenticateToken, requireRole(['admin', 'owner', 'super_admin']), (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;

      const validStatuses: OrderStatus[] = [
        'pending',
        'confirmed',
        'arranging',
        'ready_for_pickup',
        'out_for_delivery',
        'delivered',
        'cancelled'
      ];

      if (!status || !validStatuses.includes(status)) {
        res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
        return;
      }

      const existing = db.prepare('SELECT * FROM orders WHERE id = ?').get(Number(id)) as any;
      if (!existing) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }

      // If cancelling order, restore inventory stock
      if (status === 'cancelled' && existing.status !== 'cancelled') {
        const items = db.prepare('SELECT product_id, quantity FROM order_items WHERE order_id = ?').all(Number(id)) as any[];
        const restoreStock = db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?');
        for (const it of items) {
          restoreStock.run(it.quantity, it.product_id);
        }
      }

      db.prepare(`
        UPDATE orders
        SET status = ?, notes = COALESCE(?, notes), updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(status, notes || null, Number(id));

      logAudit(
        db,
        req.user!.id,
        req.user!.email,
        'ORDER_STATUS_UPDATED',
        'orders',
        String(id),
        { previousStatus: existing.status, newStatus: status, notes }
      );

      const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(Number(id));
      const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(Number(id));

      res.json({
        message: 'Order status updated successfully',
        order: { ...(updated as any), items }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to update order status' });
    }
  });

  return router;
}
