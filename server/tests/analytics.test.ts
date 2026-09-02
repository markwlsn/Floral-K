import request from 'supertest';
import { createTestContext, TestContext } from './testHelper';

describe('Executive Analytics & Inventory Health Tests', () => {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = createTestContext();
  });

  afterEach(() => {
    ctx.db.close();
  });

  it('should return sales overview, gross profit and margins to Owner', async () => {
    const res = await request(ctx.app)
      .get('/api/analytics/overview')
      .set('Authorization', `Bearer ${ctx.tokens.owner}`);

    expect(res.status).toBe(200);
    expect(res.body.overview).toBeDefined();
    expect(res.body.overview.grossRevenue).toBeGreaterThan(0);
    expect(res.body.overview.totalOrders).toBeGreaterThan(0);
    expect(res.body.overview.grossProfit).toBeGreaterThan(0);
    expect(res.body.overview.profitMarginPercent).toBeGreaterThan(0);
    expect(Array.isArray(res.body.overview.salesBySource)).toBe(true);
  });

  it('should return top selling products to Owner', async () => {
    const res = await request(ctx.app)
      .get('/api/analytics/top-products')
      .set('Authorization', `Bearer ${ctx.tokens.owner}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.topProducts)).toBe(true);
    expect(res.body.topProducts.length).toBeGreaterThan(0);
  });

  it('should return inventory asset valuation and low stock alerts to Super Admin', async () => {
    const res = await request(ctx.app)
      .get('/api/analytics/inventory-health')
      .set('Authorization', `Bearer ${ctx.tokens.superAdmin}`);

    expect(res.status).toBe(200);
    expect(res.body.valuation.totalUnitsInStock).toBeGreaterThan(0);
    expect(res.body.valuation.valuationAtRetail).toBeGreaterThan(0);
    expect(res.body.valuation.valuationAtCost).toBeGreaterThan(0);
  });

  it('should forbid Customer from viewing analytics (403)', async () => {
    const res = await request(ctx.app)
      .get('/api/analytics/overview')
      .set('Authorization', `Bearer ${ctx.tokens.customer}`);

    expect(res.status).toBe(403);
  });
});
