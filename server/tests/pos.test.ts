import request from 'supertest';
import { createTestContext, TestContext } from './testHelper';

describe('Point-of-Sale (POS) Engine Tests', () => {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = createTestContext();
  });

  afterEach(() => {
    ctx.db.close();
  });

  it('should fetch POS quick-catalog with barcode and stock', async () => {
    const res = await request(ctx.app)
      .get('/api/pos/quick-catalog')
      .set('Authorization', `Bearer ${ctx.tokens.admin}`);

    expect(res.status).toBe(200);
    expect(res.body.products.length).toBeGreaterThan(0);
    expect(res.body.products[0]).toHaveProperty('barcode');
    expect(res.body.products[0]).toHaveProperty('stock');
  });

  it('should allow Cashier/Admin to open a POS register session', async () => {
    const res = await request(ctx.app)
      .post('/api/pos/register/open')
      .set('Authorization', `Bearer ${ctx.tokens.admin}`)
      .send({
        openingCash: 200.0,
        notes: 'Morning shift float in register #1'
      });

    expect(res.status).toBe(201);
    expect(res.body.session.status).toBe('open');
    expect(res.body.session.opening_cash).toBe(200.0);
  });

  it('should process a fast walk-in POS sale with cash tender and generate printable receipt', async () => {
    // Open session first
    await request(ctx.app)
      .post('/api/pos/register/open')
      .set('Authorization', `Bearer ${ctx.tokens.admin}`)
      .send({ openingCash: 150.0 });

    const initialProduct = ctx.db.prepare('SELECT stock FROM products WHERE id = 3').get() as { stock: number };

    const posSalePayload = {
      items: [
        { productId: 3, quantity: 1, unitPrice: 88.0 }
      ],
      customerName: 'Counter Customer',
      paymentMethod: 'cash',
      amountTendered: 100.0,
      notes: 'Customer requested complimentary florist gift card'
    };

    const res = await request(ctx.app)
      .post('/api/pos/orders')
      .set('Authorization', `Bearer ${ctx.tokens.admin}`)
      .send(posSalePayload);

    expect(res.status).toBe(201);
    expect(res.body.orderNumber).toMatch(/^FK-POS-/);
    expect(res.body.receipt).toBeDefined();
    expect(res.body.receipt.storeName).toBe('Floral K Boutique & Atelier');
    expect(res.body.receipt.amountTendered).toBe(100.0);
    expect(res.body.receipt.changeDue).toBeGreaterThan(0);
    expect(res.body.receipt.cashierName).toBe('Liam Rivera');

    // Verify stock was decremented
    const updatedProduct = ctx.db.prepare('SELECT stock FROM products WHERE id = 3').get() as { stock: number };
    expect(updatedProduct.stock).toBe(initialProduct.stock - 1);
  });

  it('should reject cash POS sale if tendered amount is insufficient', async () => {
    const res = await request(ctx.app)
      .post('/api/pos/orders')
      .set('Authorization', `Bearer ${ctx.tokens.admin}`)
      .send({
        items: [{ productId: 1, quantity: 1, unitPrice: 129.0 }],
        paymentMethod: 'cash',
        amountTendered: 50.0 // Insufficient!
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/less than the total balance/i);
  });

  it('should allow Cashier to close register session and compute discrepancy', async () => {
    // Open register
    await request(ctx.app)
      .post('/api/pos/register/open')
      .set('Authorization', `Bearer ${ctx.tokens.admin}`)
      .send({ openingCash: 100.0 });

    // Close register
    const res = await request(ctx.app)
      .post('/api/pos/register/close')
      .set('Authorization', `Bearer ${ctx.tokens.admin}`)
      .send({
        closingCash: 100.0,
        notes: 'End of shift count balanced'
      });

    expect(res.status).toBe(200);
    expect(res.body.session.status).toBe('closed');
    expect(res.body.summary.discrepancy).toBe(0);
  });

  it('should forbid Customer from accessing POS endpoints', async () => {
    const res = await request(ctx.app)
      .get('/api/pos/quick-catalog')
      .set('Authorization', `Bearer ${ctx.tokens.customer}`);

    expect(res.status).toBe(403);
  });
});
