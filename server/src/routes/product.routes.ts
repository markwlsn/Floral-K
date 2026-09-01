import { Router, Request, Response } from 'express';
import Database from 'better-sqlite3';
import { authenticateToken, requireRole, logAudit } from '../middleware/auth';

function formatProduct(p: any) {
  return {
    ...p,
    images: typeof p.images === 'string' ? JSON.parse(p.images || '[]') : p.images || [],
    flower_types: typeof p.flower_types === 'string' ? JSON.parse(p.flower_types || '[]') : p.flower_types || [],
    occasion_tags: typeof p.occasion_tags === 'string' ? JSON.parse(p.occasion_tags || '[]') : p.occasion_tags || []
  };
}

export function createProductRouter(db: Database.Database): Router {
  const router = Router();

  // GET /api/products/categories
  router.get('/categories', (_req: Request, res: Response) => {
    try {
      const categories = db.prepare(`
        SELECT c.*, COUNT(p.id) as product_count
        FROM categories c
        LEFT JOIN products p ON p.category_id = c.id AND p.is_available = 1
        GROUP BY c.id
        ORDER BY c.display_order ASC
      `).all();

      res.json({ categories });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch categories' });
    }
  });

  // GET /api/products
  router.get('/', (req: Request, res: Response) => {
    try {
      const {
        category,
        occasion,
        search,
        minPrice,
        maxPrice,
        featured,
        available,
        sortBy
      } = req.query;

      let query = `
        SELECT p.*, c.name as category_name, c.slug as category_slug
        FROM products p
        JOIN categories c ON c.id = p.category_id
        WHERE 1=1
      `;
      const params: any[] = [];

      if (category) {
        if (!isNaN(Number(category))) {
          query += ` AND p.category_id = ?`;
          params.push(Number(category));
        } else {
          query += ` AND c.slug = ?`;
          params.push(String(category));
        }
      }

      if (occasion) {
        query += ` AND p.occasion_tags LIKE ?`;
        params.push(`%${occasion}%`);
      }

      if (search) {
        query += ` AND (p.name LIKE ? OR p.description LIKE ? OR p.flower_types LIKE ? OR p.sku LIKE ?)`;
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm);
      }

      if (minPrice !== undefined && !isNaN(Number(minPrice))) {
        query += ` AND p.price >= ?`;
        params.push(Number(minPrice));
      }

      if (maxPrice !== undefined && !isNaN(Number(maxPrice))) {
        query += ` AND p.price <= ?`;
        params.push(Number(maxPrice));
      }

      if (featured !== undefined) {
        query += ` AND p.is_featured = ?`;
        params.push(Number(featured));
      }

      if (available !== undefined) {
        query += ` AND p.is_available = ?`;
        params.push(Number(available));
      }

      switch (sortBy) {
        case 'price_asc':
          query += ` ORDER BY p.price ASC`;
          break;
        case 'price_desc':
          query += ` ORDER BY p.price DESC`;
          break;
        case 'newest':
          query += ` ORDER BY p.created_at DESC`;
          break;
        case 'featured':
          query += ` ORDER BY p.is_featured DESC, p.id DESC`;
          break;
        default:
          query += ` ORDER BY p.is_featured DESC, p.id ASC`;
      }

      const rows = db.prepare(query).all(...params);
      const products = rows.map(formatProduct);

      res.json({ products, total: products.length });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch products' });
    }
  });

  // GET /api/products/:idOrSlug
  router.get('/:idOrSlug', (req: Request, res: Response) => {
    try {
      const { idOrSlug } = req.params;
      let product: any;

      if (!isNaN(Number(idOrSlug))) {
        product = db.prepare(`
          SELECT p.*, c.name as category_name, c.slug as category_slug
          FROM products p
          JOIN categories c ON c.id = p.category_id
          WHERE p.id = ?
        `).get(Number(idOrSlug));
      } else {
        product = db.prepare(`
          SELECT p.*, c.name as category_name, c.slug as category_slug
          FROM products p
          JOIN categories c ON c.id = p.category_id
          WHERE p.slug = ?
        `).get(idOrSlug);
      }

      if (!product) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }

      // Also fetch 3 related products from same category
      const relatedRows = db.prepare(`
        SELECT p.*, c.name as category_name
        FROM products p
        JOIN categories c ON c.id = p.category_id
        WHERE p.category_id = ? AND p.id != ? AND p.is_available = 1
        LIMIT 3
      `).all(product.category_id, product.id);

      res.json({
        product: formatProduct(product),
        related: relatedRows.map(formatProduct)
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch product' });
    }
  });

  // POST /api/products (Admin, Owner, Super Admin)
  router.post('/', authenticateToken, requireRole(['admin', 'owner', 'super_admin']), (req: Request, res: Response) => {
    try {
      const {
        name,
        slug,
        sku,
        category_id,
        price,
        compare_at_price,
        cost_price,
        stock,
        min_stock_alert,
        description,
        short_description,
        images,
        flower_types,
        occasion_tags,
        care_instructions,
        is_featured,
        is_available,
        barcode
      } = req.body;

      if (!name || !sku || !category_id || price === undefined) {
        res.status(400).json({ error: 'Name, SKU, category_id, and price are required' });
        return;
      }

      const generatedSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      const stmt = db.prepare(`
        INSERT INTO products (
          name, slug, sku, category_id, price, compare_at_price, cost_price,
          stock, min_stock_alert, description, short_description, images,
          flower_types, occasion_tags, care_instructions, is_featured,
          is_available, barcode
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        name,
        generatedSlug,
        sku,
        Number(category_id),
        Number(price),
        compare_at_price ? Number(compare_at_price) : null,
        cost_price ? Number(cost_price) : 0.0,
        stock !== undefined ? Number(stock) : 0,
        min_stock_alert !== undefined ? Number(min_stock_alert) : 5,
        description || '',
        short_description || '',
        JSON.stringify(images || []),
        JSON.stringify(flower_types || []),
        JSON.stringify(occasion_tags || []),
        care_instructions || null,
        is_featured ? 1 : 0,
        is_available !== undefined ? (is_available ? 1 : 0) : 1,
        barcode || null
      );

      const newId = Number(result.lastInsertRowid);
      logAudit(db, req.user!.id, req.user!.email, 'PRODUCT_CREATED', 'products', newId, { name, sku, price });

      const created = db.prepare('SELECT * FROM products WHERE id = ?').get(newId);
      res.status(201).json({ message: 'Product created successfully', product: formatProduct(created) });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to create product' });
    }
  });

  // PUT /api/products/:id (Admin, Owner, Super Admin)
  router.put('/:id', authenticateToken, requireRole(['admin', 'owner', 'super_admin']), (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(Number(id));
      if (!existing) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }

      const {
        name,
        sku,
        category_id,
        price,
        compare_at_price,
        cost_price,
        stock,
        min_stock_alert,
        description,
        short_description,
        images,
        flower_types,
        occasion_tags,
        care_instructions,
        is_featured,
        is_available,
        barcode
      } = req.body;

      db.prepare(`
        UPDATE products SET
          name = COALESCE(?, name),
          sku = COALESCE(?, sku),
          category_id = COALESCE(?, category_id),
          price = COALESCE(?, price),
          compare_at_price = ?,
          cost_price = COALESCE(?, cost_price),
          stock = COALESCE(?, stock),
          min_stock_alert = COALESCE(?, min_stock_alert),
          description = COALESCE(?, description),
          short_description = COALESCE(?, short_description),
          images = COALESCE(?, images),
          flower_types = COALESCE(?, flower_types),
          occasion_tags = COALESCE(?, occasion_tags),
          care_instructions = COALESCE(?, care_instructions),
          is_featured = COALESCE(?, is_featured),
          is_available = COALESCE(?, is_available),
          barcode = COALESCE(?, barcode),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        name ?? null,
        sku ?? null,
        category_id !== undefined ? Number(category_id) : null,
        price !== undefined ? Number(price) : null,
        compare_at_price !== undefined ? (compare_at_price ? Number(compare_at_price) : null) : (existing as any).compare_at_price,
        cost_price !== undefined ? Number(cost_price) : null,
        stock !== undefined ? Number(stock) : null,
        min_stock_alert !== undefined ? Number(min_stock_alert) : null,
        description ?? null,
        short_description ?? null,
        images ? JSON.stringify(images) : null,
        flower_types ? JSON.stringify(flower_types) : null,
        occasion_tags ? JSON.stringify(occasion_tags) : null,
        care_instructions ?? null,
        is_featured !== undefined ? (is_featured ? 1 : 0) : null,
        is_available !== undefined ? (is_available ? 1 : 0) : null,
        barcode ?? null,
        Number(id)
      );

      logAudit(db, req.user!.id, req.user!.email, 'PRODUCT_UPDATED', 'products', String(id), req.body);
      const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(Number(id));
      res.json({ message: 'Product updated successfully', product: formatProduct(updated) });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to update product' });
    }
  });

  // DELETE /api/products/:id (Owner, Super Admin)
  router.delete('/:id', authenticateToken, requireRole(['owner', 'super_admin']), (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(Number(id));
      if (!existing) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }

      // Check if product has order items
      const orderItemCount = db.prepare('SELECT COUNT(*) as count FROM order_items WHERE product_id = ?').get(Number(id)) as { count: number };
      if (orderItemCount.count > 0) {
        // Soft delete / make unavailable so existing orders are preserved
        db.prepare('UPDATE products SET is_available = 0, stock = 0 WHERE id = ?').run(Number(id));
        logAudit(db, req.user!.id, req.user!.email, 'PRODUCT_DEACTIVATED', 'products', String(id), { reason: 'Has order references' });
        res.json({ message: 'Product has order history; marked as unavailable instead of deleting' });
        return;
      }

      db.prepare('DELETE FROM products WHERE id = ?').run(Number(id));
      logAudit(db, req.user!.id, req.user!.email, 'PRODUCT_DELETED', 'products', String(id), null);
      res.json({ message: 'Product deleted successfully' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to delete product' });
    }
  });

  return router;
}
