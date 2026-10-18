const express = require('express');
const db      = require('../config/db');
const { authenticate, adminOnly } = require('../middleware/auth');

const router = express.Router();

// ─── GET /api/products ── public, with search & category filter ───────────────
router.get('/', async (req, res) => {
  try {
    const { search, category } = req.query;
    let sql    = 'SELECT * FROM products WHERE 1=1';
    const args = [];

    if (search && search.trim()) {
      sql += ' AND (name LIKE ? OR description LIKE ?)';
      const like = `%${search.trim()}%`;
      args.push(like, like);
    }
    if (category && category.trim() && category !== 'All') {
      sql += ' AND category = ?';
      args.push(category.trim());
    }
    sql += ' ORDER BY created_at DESC';

    const [rows] = await db.query(sql, args);
    res.json(rows);
  } catch (err) {
    console.error('GET /products error:', err);
    res.status(500).json({ error: 'Failed to fetch products.' });
  }
});

// ─── GET /api/products/categories ── distinct category list ──────────────────
router.get('/categories', async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT DISTINCT category FROM products ORDER BY category');
    res.json(rows.map(r => r.category));
  } catch (err) {
    console.error('GET /products/categories error:', err);
    res.status(500).json({ error: 'Failed to fetch categories.' });
  }
});

// ─── GET /api/products/:id ── single product ─────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Product not found.' });
    res.json(rows[0]);
  } catch (err) {
    console.error('GET /products/:id error:', err);
    res.status(500).json({ error: 'Failed to fetch product.' });
  }
});

// ─── POST /api/products ── admin only ────────────────────────────────────────
router.post('/', authenticate, adminOnly, async (req, res) => {
  try {
    const { name, description, price, image_url, category, stock } = req.body;

    if (!name || !price || !category) {
      return res.status(400).json({ error: 'Name, price and category are required.' });
    }
    if (isNaN(parseFloat(price)) || parseFloat(price) < 0) {
      return res.status(400).json({ error: 'Price must be a non-negative number.' });
    }
    const stockVal = parseInt(stock) || 0;
    if (stockVal < 0) {
      return res.status(400).json({ error: 'Stock cannot be negative.' });
    }

    const [result] = await db.query(
      'INSERT INTO products (name, description, price, image_url, category, stock) VALUES (?, ?, ?, ?, ?, ?)',
      [name.trim(), description || '', parseFloat(price), image_url || '', category.trim(), stockVal]
    );

    const [created] = await db.query('SELECT * FROM products WHERE id = ?', [result.insertId]);
    res.status(201).json({ message: 'Product created.', product: created[0] });
  } catch (err) {
    console.error('POST /products error:', err);
    res.status(500).json({ error: 'Failed to create product.' });
  }
});

// ─── PUT /api/products/:id ── admin only ─────────────────────────────────────
router.put('/:id', authenticate, adminOnly, async (req, res) => {
  try {
    const { name, description, price, image_url, category, stock } = req.body;

    if (!name || !price || !category) {
      return res.status(400).json({ error: 'Name, price and category are required.' });
    }
    if (isNaN(parseFloat(price)) || parseFloat(price) < 0) {
      return res.status(400).json({ error: 'Price must be a non-negative number.' });
    }
    const stockVal = parseInt(stock) || 0;

    const [result] = await db.query(
      `UPDATE products
       SET name=?, description=?, price=?, image_url=?, category=?, stock=?
       WHERE id=?`,
      [name.trim(), description || '', parseFloat(price), image_url || '', category.trim(), stockVal, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Product not found.' });

    const [updated] = await db.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    res.json({ message: 'Product updated.', product: updated[0] });
  } catch (err) {
    console.error('PUT /products/:id error:', err);
    res.status(500).json({ error: 'Failed to update product.' });
  }
});

// ─── DELETE /api/products/:id ── admin only ───────────────────────────────────
router.delete('/:id', authenticate, adminOnly, async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Product not found.' });
    res.json({ message: 'Product deleted.' });
  } catch (err) {
    console.error('DELETE /products/:id error:', err);
    res.status(500).json({ error: 'Failed to delete product.' });
  }
});

module.exports = router;
