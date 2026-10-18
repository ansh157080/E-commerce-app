const express = require('express');
const db      = require('../config/db');
const { authenticate, adminOnly } = require('../middleware/auth');

const router = express.Router();

// ─── POST /api/orders ── authenticated user places an order ──────────────────
// Body: { items: [{product_id, quantity}], shipping_address, phone }
router.post('/', authenticate, async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { items, shipping_address, phone } = req.body;

    // Validate inputs
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item.' });
    }
    if (!shipping_address || shipping_address.trim().length < 10) {
      return res.status(400).json({ error: 'Please provide a complete shipping address (min 10 chars).' });
    }
    const phoneRegex = /^[0-9+\-\s]{7,20}$/;
    if (!phone || !phoneRegex.test(phone.trim())) {
      return res.status(400).json({ error: 'Please provide a valid phone number.' });
    }

    // Validate each item
    for (const item of items) {
      if (!item.product_id || !item.quantity || item.quantity < 1) {
        return res.status(400).json({ error: 'Each item must have a valid product_id and quantity >= 1.' });
      }
    }

    await conn.beginTransaction();

    let totalAmount = 0;
    const resolvedItems = [];

    // Lock product rows and verify stock
    for (const item of items) {
      const [rows] = await conn.query(
        'SELECT id, name, price, stock FROM products WHERE id = ? FOR UPDATE',
        [item.product_id]
      );
      if (rows.length === 0) {
        await conn.rollback();
        return res.status(404).json({ error: `Product ID ${item.product_id} not found.` });
      }
      const product = rows[0];
      if (product.stock < item.quantity) {
        await conn.rollback();
        return res.status(400).json({
          error: `Insufficient stock for "${product.name}". Available: ${product.stock}, Requested: ${item.quantity}`
        });
      }
      // Use server-side price — never trust client totals
      totalAmount += parseFloat(product.price) * item.quantity;
      resolvedItems.push({ product, quantity: item.quantity, unit_price: parseFloat(product.price) });
    }

    // Create order
    const [orderResult] = await conn.query(
      'INSERT INTO orders (user_id, total_amount, shipping_address, phone, status) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, totalAmount.toFixed(2), shipping_address.trim(), phone.trim(), 'Pending']
    );
    const orderId = orderResult.insertId;

    // Insert order items and deduct stock
    for (const { product, quantity, unit_price } of resolvedItems) {
      await conn.query(
        'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
        [orderId, product.id, quantity, unit_price]
      );
      await conn.query('UPDATE products SET stock = stock - ? WHERE id = ?', [quantity, product.id]);
    }

    await conn.commit();

    res.status(201).json({
      message: 'Order placed successfully!',
      order: { id: orderId, total_amount: totalAmount.toFixed(2), status: 'Pending' }
    });
  } catch (err) {
    await conn.rollback();
    console.error('POST /orders error:', err);
    res.status(500).json({ error: 'Failed to place order. Please try again.' });
  } finally {
    conn.release();
  }
});

// ─── GET /api/orders/my ── authenticated user's own orders ───────────────────
router.get('/my', authenticate, async (req, res) => {
  try {
    const [orders] = await db.query(
      'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );

    // Fetch items for each order
    const result = await Promise.all(orders.map(async (order) => {
      const [items] = await db.query(
        `SELECT oi.*, p.name AS product_name, p.image_url
         FROM order_items oi
         JOIN products p ON p.id = oi.product_id
         WHERE oi.order_id = ?`,
        [order.id]
      );
      return { ...order, items };
    }));

    res.json(result);
  } catch (err) {
    console.error('GET /orders/my error:', err);
    res.status(500).json({ error: 'Failed to fetch orders.' });
  }
});

// ─── GET /api/orders ── admin: all orders ────────────────────────────────────
router.get('/', authenticate, adminOnly, async (req, res) => {
  try {
    const [orders] = await db.query(
      `SELECT o.*, u.name AS customer_name, u.email AS customer_email
       FROM orders o
       JOIN users u ON u.id = o.user_id
       ORDER BY o.created_at DESC`
    );

    const result = await Promise.all(orders.map(async (order) => {
      const [items] = await db.query(
        `SELECT oi.*, p.name AS product_name
         FROM order_items oi
         JOIN products p ON p.id = oi.product_id
         WHERE oi.order_id = ?`,
        [order.id]
      );
      return { ...order, items };
    }));

    res.json(result);
  } catch (err) {
    console.error('GET /orders error:', err);
    res.status(500).json({ error: 'Failed to fetch orders.' });
  }
});

// ─── GET /api/orders/stats ── admin dashboard stats ──────────────────────────
router.get('/stats', authenticate, adminOnly, async (req, res) => {
  try {
    const [[{ totalProducts }]]  = await db.query('SELECT COUNT(*) AS totalProducts FROM products');
    const [[{ totalOrders }]]    = await db.query('SELECT COUNT(*) AS totalOrders FROM orders');
    const [[{ totalRevenue }]]   = await db.query("SELECT COALESCE(SUM(total_amount),0) AS totalRevenue FROM orders WHERE status != 'Cancelled'");
    const [[{ totalUsers }]]     = await db.query("SELECT COUNT(*) AS totalUsers FROM users WHERE role='user'");
    res.json({ totalProducts, totalOrders, totalRevenue, totalUsers });
  } catch (err) {
    console.error('GET /orders/stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats.' });
  }
});

// ─── PATCH /api/orders/:id/status ── admin: update order status ──────────────
router.patch('/:id/status', authenticate, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
    }

    const [result] = await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Order not found.' });

    res.json({ message: 'Order status updated.', status });
  } catch (err) {
    console.error('PATCH /orders/:id/status error:', err);
    res.status(500).json({ error: 'Failed to update order status.' });
  }
});

module.exports = router;
