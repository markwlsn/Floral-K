import request from 'supertest';
import { createTestContext, TestContext } from './testHelper';

describe('Web Checkout & Order Fulfillment Tests', () => {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = createTestContext();
  });

  afterEach(() => {
    ctx.db.close();
  });

  it('should process a successful web checkout and decrement product stock', async () => {
    // Check initial stock for product 1
    const initialProduct = ctx.db.prepare('SELECT stock FROM products WHERE id = 1').get() as { stock: number };
    const initialStock = initialProduct.stock;

    const checkoutPayload = {
      items: [
        { productId: 1, quantity: 2 }
      ],
      customerName: 'Eleanor Roosevelt',
      customerEmail: 'eleanor@example.com',
      customerPhone: '+1 (555) 321-7788',
      orderType: 'online_delivery',
      deliveryDate: '2026-09-10',
      deliveryTimeSlot: '1:00 PM - 4:00 PM',
      recipientName: 'Theodore Roosevelt',
      recipientPhone: '+1 (555) 321-9900',
      deliveryAddress: '1600 Pennsylvania Avenue, Washington DC',
      cardMessage: 'With deep admiration and eternal respect.',
      discountCode: 'FLORAL10',
      paymentMethod: 'card'
    };

    const res = await request(ctx.app)
      .post('/api/orders/checkout')
      .send(checkoutPayload);

    expect(res.status).toBe(201);
    expect(res.body.order).toBeDefined();
    expect(res.body.order.orderNumber).toMatch(/^FK-\d{8}-\d{4}$/);
    expect(res.body.order.discount).toBeGreaterThan(0);
    expect(res.body.order.total).toBeGreaterThan(0);

    // Verify stock was decremented
    const updatedProduct = ctx.db.prepare('SELECT stock FROM products WHERE id = 1').get() as { stock: number };
    expect(updatedProduct.stock).toBe(initialStock - 2);

    // Verify public tracking works for this new order
    const trackRes = await request(ctx.app).get(`/api/orders/track/${res.body.order.orderNumber}`);
    expect(trackRes.status).toBe(200);
    expect(trackRes.body.order.order_number).toBe(res.body.order.orderNumber);
    expect(trackRes.body.order.items.length).toBe(1);
    expect(trackRes.body.order.card_message).toBe('With deep admiration and eternal respect.');
  });

  it('should reject checkout if requested quantity exceeds available stock', async () => {
    const res = await request(ctx.app)
      .post('/api/orders/checkout')
      .send({
        items: [
          { productId: 1, quantity: 99999 }
        ],
        customerName: 'Greedy Buyer',
        customerPhone: '+1 (555) 000-0000',
        deliveryAddress: '123 Fake St'
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/insufficient stock/i);
  });

  it('should reject checkout with empty items array', async () => {
    const res = await request(ctx.app)
      .post('/api/orders/checkout')
      .send({
        items: [],
        customerName: 'Empty Cart',
        customerPhone: '+1 555 111 2222',
        deliveryAddress: '123 Test St'
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/cannot be empty/i);
  });

  it('should allow Admin to transition order status through fulfillment pipeline', async () => {
    // Order 1 is seeded as 'pending'
    const res = await request(ctx.app)
      .patch('/api/orders/1/status')
      .set('Authorization', `Bearer ${ctx.tokens.admin}`)
      .send({
        status: 'arranging',
        notes: 'Florist assembling Scarlet Royale with fresh copper wrap.'
      });

    expect(res.status).toBe(200);
    expect(res.body.order.status).toBe('arranging');
    expect(res.body.order.notes).toMatch(/Florist assembling/);
  });

  it('should forbid Customer from changing order status', async () => {
    const res = await request(ctx.app)
      .patch('/api/orders/1/status')
      .set('Authorization', `Bearer ${ctx.tokens.customer}`)
      .send({
        status: 'delivered'
      });

    expect(res.status).toBe(403);
  });
});
