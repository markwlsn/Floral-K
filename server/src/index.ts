import { createApp } from './app';
import { getDatabase } from './db/database';
import { seedDatabase } from './db/seeder';
import { config } from './config';

const db = getDatabase();
seedDatabase(db);

const app = createApp(db);

const server = app.listen(config.port, () => {
  console.log(`====================================================`);
  console.log(`🌸 Floral K API Server running on port ${config.port}`);
  console.log(`🌸 Environment: ${config.nodeEnv}`);
  console.log(`🌸 Health: http://localhost:${config.port}/api/health`);
  console.log(`🌸 Seeded Roles for Demo/Testing:`);
  console.log(`   - Super Admin: superadmin@floralk.com / SuperAdmin123!`);
  console.log(`   - Owner:       owner@floralk.com / Owner123!`);
  console.log(`   - Admin/Staff: admin@floralk.com / Admin123!`);
  console.log(`   - Customer:    customer@example.com / Customer123!`);
  console.log(`====================================================`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
