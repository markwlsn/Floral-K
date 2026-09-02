import { Router, Request, Response } from 'express';
import Database from 'better-sqlite3';
import { authenticateToken, requireRole } from '../middleware/auth';

export function createAnalyticsRouter(db: Database.Database): Router {
  const router = Router();

  // Protect all analytics endpoints for Owner and Super Admin
  router.use(authenticateToken, requireRole(['owner', 'super_admin']));

  // GET /api/analytics/overview
  router.get('/overview', (_req: Request, res: Response) => {
    try {
      // 1. Overall sales & gross profit
      const salesOverview = db.prepare(`
        SELECT
          COUNT(id) as total_orders,
          COALESCE(SUM(total), 0) as gross_revenue,
          COALESCE(AVG(total), 0) as average_order_value
        FROM orders
        WHERE payment_status = 'paid'
      `).get() as any;

      // 2. Cost of goods sold for paid orders
      const cogsResult = db.prepare(`
        SELECT COALESCE(SUM(oi.cost_price * oi.quantity), 0) as total_cogs
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        WHERE o.payment_status = 'paid'
      `).get() as any;

      const grossRevenue = parseFloat(salesOverview.gross_revenue.toFixed(2));
      const totalCogs = parseFloat(cogsResult.total_cogs.toFixed(2));
      const grossProfit = parseFloat((grossRevenue - totalCogs).toFixed(2));
      const profitMarginPercent = grossRevenue > 0
        ? parseFloat(((grossProfit / grossRevenue) * 100).toFixed(1))
        : 0;

      // 3. Today's stats
      const todayStats = db.prepare(`
        SELECT
          COUNT(id) as today_orders,
          COALESCE(SUM(total), 0) as today_revenue
        FROM orders
        WHERE payment_status = 'paid' AND DATE(created_at) = DATE('now')
      `).get() as any;

      // 4. Sales by source (Web vs POS)
      const salesBySource = db.prepare(`
        SELECT source, COUNT(id) as count, COALESCE(SUM(total), 0) as revenue
        FROM orders
        WHERE payment_status = 'paid'
        GROUP BY source
      `).all();

      // 5. Orders by fulfillment status
      const ordersByStatus = db.prepare(`
        SELECT status, COUNT(id) as count
        FROM orders
        GROUP BY status
      `).all();

      // 6. Last 7 days revenue breakdown
      const last7Days = db.prepare(`
        SELECT
          DATE(created_at) as date,
          COUNT(id) as order_count,
          COALESCE(SUM(total), 0) as revenue
        FROM orders
        WHERE payment_status = 'paid' AND created_at >= DATETIME('now', '-7 days')
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `).all();

      res.json({
        overview: {
          grossRevenue,
          totalOrders: salesOverview.total_orders,
          averageOrderValue: parseFloat(salesOverview.average_order_value.toFixed(2)),
          totalCogs,
          grossProfit,
          profitMarginPercent,
          todayRevenue: parseFloat(todayStats.today_revenue.toFixed(2)),
          todayOrders: todayStats.today_orders,
          salesBySource,
          ordersByStatus,
          revenueTimeline: last7Days
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch analytics overview' });
    }
  });

  // GET /api/analytics/top-products
  router.get('/top-products', (_req: Request, res: Response) => {
    try {
      const topProducts = db.prepare(`
        SELECT
          oi.product_id,
          oi.product_name,
          oi.product_sku,
          SUM(oi.quantity) as total_quantity_sold,
          SUM(oi.subtotal) as total_revenue_generated
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        WHERE o.payment_status = 'paid'
        GROUP BY oi.product_id
        ORDER BY total_quantity_sold DESC
        LIMIT 5
      `).all();

      res.json({ topProducts });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch top products' });
    }
  });

  // GET /api/analytics/inventory-health
  router.get('/inventory-health', (_req: Request, res: Response) => {
    try {
      const inventoryValuation = db.prepare(`
        SELECT
          COUNT(id) as total_products,
          COALESCE(SUM(stock), 0) as total_units_in_stock,
          COALESCE(SUM(stock * cost_price), 0) as inventory_valuation_cost,
          COALESCE(SUM(stock * price), 0) as inventory_valuation_retail
        FROM products
        WHERE is_available = 1
      `).get() as any;

      const lowStockProducts = db.prepare(`
        SELECT id, name, sku, stock, min_stock_alert, price
        FROM products
        WHERE stock <= min_stock_alert AND is_available = 1
        ORDER BY stock ASC
      `).all();

      res.json({
        valuation: {
          totalProducts: inventoryValuation.total_products,
          totalUnitsInStock: inventoryValuation.total_units_in_stock,
          valuationAtCost: parseFloat(inventoryValuation.inventory_valuation_cost.toFixed(2)),
          valuationAtRetail: parseFloat(inventoryValuation.inventory_valuation_retail.toFixed(2))
        },
        lowStockAlerts: lowStockProducts
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch inventory health' });
    }
  });

  return router;
}
