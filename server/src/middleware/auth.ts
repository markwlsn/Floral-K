import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import Database from 'better-sqlite3';
import { config } from '../config';
import { AuthUserPayload, UserRole } from '../types';

export function signToken(payload: AuthUserPayload): string {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: '7d'
  });
}

export function authenticateToken(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Authentication token required' });
    return;
  }

  jwt.verify(token, config.jwtSecret, (err, decoded) => {
    if (err || !decoded) {
      res.status(403).json({ error: 'Invalid or expired token' });
      return;
    }
    req.user = decoded as AuthUserPayload;
    next();
  });
}

export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  jwt.verify(token, config.jwtSecret, (err, decoded) => {
    if (!err && decoded) {
      req.user = decoded as AuthUserPayload;
    }
    next();
  });
}

export function requireRole(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: `Access denied. Required role: ${allowedRoles.join(', ')}`,
        currentRole: req.user.role
      });
      return;
    }

    next();
  };
}

export function logAudit(
  db: Database.Database,
  userId: number | null | undefined,
  userEmail: string | null | undefined,
  action: string,
  entity: string,
  entityId?: string | number | null,
  details?: Record<string, any> | string | null,
  ipAddress?: string
): void {
  try {
    const detailsStr = typeof details === 'object' ? JSON.stringify(details) : (details || null);
    db.prepare(`
      INSERT INTO audit_logs (user_id, user_email, action, entity, entity_id, details, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId || null,
      userEmail || null,
      action,
      entity,
      entityId ? String(entityId) : null,
      detailsStr,
      ipAddress || null
    );
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}
