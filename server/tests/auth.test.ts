import request from 'supertest';
import { createTestContext, TestContext } from './testHelper';

describe('Authentication & RBAC Tests', () => {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = createTestContext();
  });

  afterEach(() => {
    ctx.db.close();
  });

  it('should register a new customer successfully', async () => {
    const res = await request(ctx.app)
      .post('/api/auth/register')
      .send({
        name: 'Jane Doe',
        email: 'jane.doe@example.com',
        password: 'Password123!',
        phone: '+1 555-443-2211'
      });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('jane.doe@example.com');
    expect(res.body.user.role).toBe('customer');
  });

  it('should reject registration if email is duplicate', async () => {
    const res = await request(ctx.app)
      .post('/api/auth/register')
      .send({
        name: 'Duplicate Elena',
        email: 'superadmin@floralk.com',
        password: 'Password123!'
      });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already registered/i);
  });

  it('should reject registration if password is too short', async () => {
    const res = await request(ctx.app)
      .post('/api/auth/register')
      .send({
        name: 'Short Pass',
        email: 'short@example.com',
        password: '123'
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/at least 6 characters/i);
  });

  it('should login seeded super admin with correct password', async () => {
    const res = await request(ctx.app)
      .post('/api/auth/login')
      .send({
        email: 'superadmin@floralk.com',
        password: 'SuperAdmin123!'
      });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('super_admin');
  });

  it('should reject login with wrong password', async () => {
    const res = await request(ctx.app)
      .post('/api/auth/login')
      .send({
        email: 'superadmin@floralk.com',
        password: 'WrongPassword999'
      });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid email or password/i);
  });

  it('should return current user profile from /api/auth/me with valid token', async () => {
    const res = await request(ctx.app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${ctx.tokens.owner}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('owner@floralk.com');
    expect(res.body.user.role).toBe('owner');
  });

  it('should return 401 when accessing /api/auth/me without token', async () => {
    const res = await request(ctx.app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});
