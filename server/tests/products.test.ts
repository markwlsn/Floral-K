import request from 'supertest';
import { createTestContext, TestContext } from './testHelper';

describe('Product Catalog & Inventory Tests', () => {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = createTestContext();
  });

  afterEach(() => {
    ctx.db.close();
  });

  it('should fetch all categories with product counts', async () => {
    const res = await request(ctx.app).get('/api/products/categories');
    expect(res.status).toBe(200);
    expect(res.body.categories.length).toBeGreaterThan(0);
    expect(res.body.categories[0].name).toBe('Romance & Roses');
  });

  it('should fetch public products list', async () => {
    const res = await request(ctx.app).get('/api/products');
    expect(res.status).toBe(200);
    expect(res.body.products.length).toBeGreaterThan(0);
    expect(res.body.products[0]).toHaveProperty('name');
    expect(res.body.products[0]).toHaveProperty('price');
    expect(Array.isArray(res.body.products[0].images)).toBe(true);
  });

  it('should filter products by category slug', async () => {
    const res = await request(ctx.app).get('/api/products?category=romance-roses');
    expect(res.status).toBe(200);
    expect(res.body.products.every((p: any) => p.category_slug === 'romance-roses')).toBe(true);
  });

  it('should search products by keyword', async () => {
    const res = await request(ctx.app).get('/api/products?search=Peony');
    expect(res.status).toBe(200);
    expect(res.body.products.length).toBeGreaterThan(0);
    expect(res.body.products[0].name).toMatch(/Peony/i);
  });

  it('should allow Admin to create a new product', async () => {
    const newProduct = {
      name: 'Spring Blossom Melody',
      sku: 'FK-SPR-001',
      category_id: 2,
      price: 79.99,
      cost_price: 25.0,
      stock: 20,
      min_stock_alert: 5,
      description: 'Charming blend of pink tulips, yellow daffodils, and white freesia.',
      images: ['https://images.unsplash.com/photo-1526047932273-341f2a7631f9'],
      flower_types: ['Tulips', 'Daffodils', 'Freesia'],
      occasion_tags: ['Spring', 'Birthday', 'Cheer'],
      is_featured: 1
    };

    const res = await request(ctx.app)
      .post('/api/products')
      .set('Authorization', `Bearer ${ctx.tokens.admin}`)
      .send(newProduct);

    expect(res.status).toBe(201);
    expect(res.body.product.name).toBe('Spring Blossom Melody');
    expect(res.body.product.sku).toBe('FK-SPR-001');
  });

  it('should forbid Customer from creating a product (403 Forbidden)', async () => {
    const res = await request(ctx.app)
      .post('/api/products')
      .set('Authorization', `Bearer ${ctx.tokens.customer}`)
      .send({
        name: 'Unauthorized Flower',
        sku: 'FK-UNAUTH-001',
        category_id: 1,
        price: 99.0
      });

    expect(res.status).toBe(403);
  });

  it('should allow Admin to update product stock and price', async () => {
    const res = await request(ctx.app)
      .put('/api/products/1')
      .set('Authorization', `Bearer ${ctx.tokens.admin}`)
      .send({
        price: 139.0,
        stock: 50
      });

    expect(res.status).toBe(200);
    expect(res.body.product.price).toBe(139.0);
    expect(res.body.product.stock).toBe(50);
  });
});
