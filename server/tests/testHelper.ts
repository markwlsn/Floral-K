import Database from 'better-sqlite3';
import { createApp } from '../src/app';
import { getDatabase } from '../src/db/database';
import { seedDatabase } from '../src/db/seeder';
import { signToken } from '../src/middleware/auth';
import { Express } from 'express';

export interface TestContext {
  db: Database.Database;
  app: Express;
  tokens: {
    superAdmin: string;
    owner: string;
    admin: string;
    customer: string;
  };
}

export function createTestContext(): TestContext {
  // Use in-memory SQLite for fast, isolated test runs
  const db = getDatabase(':memory:');
  seedDatabase(db);
  const app = createApp(db);

  const tokens = {
    superAdmin: signToken({ id: 1, email: 'superadmin@floralk.com', role: 'super_admin', name: 'Elena Vance' }),
    owner: signToken({ id: 2, email: 'owner@floralk.com', role: 'owner', name: 'Klara Kensington' }),
    admin: signToken({ id: 3, email: 'admin@floralk.com', role: 'admin', name: 'Liam Rivera' }),
    customer: signToken({ id: 4, email: 'customer@example.com', role: 'customer', name: 'Sophia Miller' })
  };

  return { db, app, tokens };
}
