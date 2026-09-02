import express, { Express } from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import { createAuthRouter } from './routes/auth.routes';
import { createProductRouter } from './routes/product.routes';
import { createOrderRouter } from './routes/order.routes';
import { createPosRouter } from './routes/pos.routes';
import { createAnalyticsRouter } from './routes/analytics.routes';
import { createUserRouter } from './routes/user.routes';
import { createSettingsRouter } from './routes/settings.routes';
import { errorHandler } from './middleware/errorHandler';

export function createApp(db: Database.Database): Express {
  const app = express();

  // Middleware
  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'Floral K API',
      timestamp: new Date().toISOString()
    });
  });

  // API Routes
  app.use('/api/auth', createAuthRouter(db));
  app.use('/api/products', createProductRouter(db));
  app.use('/api/orders', createOrderRouter(db));
  app.use('/api/pos', createPosRouter(db));
  app.use('/api/analytics', createAnalyticsRouter(db));
  app.use('/api/users', createUserRouter(db));
  app.use('/api/settings', createSettingsRouter(db));

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
}
