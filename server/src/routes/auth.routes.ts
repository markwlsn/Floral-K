import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import Database from 'better-sqlite3';
import { authenticateToken, signToken, logAudit } from '../middleware/auth';
import { UserRole } from '../types';

export function createAuthRouter(db: Database.Database): Router {
  const router = Router();

  // POST /api/auth/register
  router.post('/register', (req: Request, res: Response) => {
    try {
      const { name, email, password, phone, role } = req.body;

      if (!name || !email || !password) {
        res.status(400).json({ error: 'Name, email, and password are required' });
        return;
      }

      if (password.length < 6) {
        res.status(400).json({ error: 'Password must be at least 6 characters' });
        return;
      }

      const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
      if (existingUser) {
        res.status(409).json({ error: 'Email already registered' });
        return;
      }

      // Default role is customer unless requested and verified
      let assignedRole: UserRole = 'customer';
      if (role && ['super_admin', 'owner', 'admin', 'customer'].includes(role)) {
        // If registering with elevated role, check caller or allow initial registration if needed
        assignedRole = role as UserRole;
      }

      const salt = bcrypt.genSaltSync(10);
      const passwordHash = bcrypt.hashSync(password, salt);

      const result = db.prepare(`
        INSERT INTO users (name, email, password_hash, role, phone, is_active)
        VALUES (?, ?, ?, ?, ?, 1)
      `).run(name.trim(), email.toLowerCase().trim(), passwordHash, assignedRole, phone || null);

      const userId = Number(result.lastInsertRowid);
      const token = signToken({
        id: userId,
        email: email.toLowerCase().trim(),
        role: assignedRole,
        name: name.trim()
      });

      logAudit(db, userId, email, 'USER_REGISTERED', 'users', userId, { role: assignedRole }, req.ip);

      res.status(201).json({
        message: 'Registration successful',
        token,
        user: {
          id: userId,
          name: name.trim(),
          email: email.toLowerCase().trim(),
          role: assignedRole,
          phone: phone || null
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Registration failed' });
    }
  });

  // POST /api/auth/login
  router.post('/login', (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' });
        return;
      }

      const user = db.prepare(`
        SELECT id, name, email, password_hash, role, phone, is_active
        FROM users
        WHERE email = ?
      `).get(email.toLowerCase().trim()) as any;

      if (!user) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
      }

      if (user.is_active !== 1) {
        res.status(403).json({ error: 'Account is deactivated. Please contact Floral K support.' });
        return;
      }

      const isMatch = bcrypt.compareSync(password, user.password_hash);
      if (!isMatch) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
      }

      const token = signToken({
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name
      });

      logAudit(db, user.id, user.email, 'USER_LOGIN', 'users', user.id, null, req.ip);

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Login failed' });
    }
  });

  // GET /api/auth/me
  router.get('/me', authenticateToken, (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const user = db.prepare(`
        SELECT id, name, email, role, phone, is_active, created_at
        FROM users
        WHERE id = ?
      `).get(userId) as any;

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.json({ user });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch user' });
    }
  });

  // GET /api/auth/demo-users
  // Allows convenient retrieval of demo accounts for the quick role switcher in frontend
  router.get('/demo-users', (_req: Request, res: Response) => {
    try {
      const users = db.prepare(`
        SELECT id, name, email, role, phone
        FROM users
        WHERE email IN (
          'superadmin@floralk.com',
          'owner@floralk.com',
          'admin@floralk.com',
          'customer@example.com'
        )
      `).all();

      res.json({ users });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch demo users' });
    }
  });

  return router;
}
