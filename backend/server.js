require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

// Route handlers
const authRoutes    = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes   = require('./routes/orders');

const app  = express();
const PORT = process.env.PORT || 5000;

// ─── CORS ─────────────────────────────────────────────────────────────────────
// Allow all local origins (localhost, 127.0.0.1, Live Server, file://)
app.use(cors({
  origin: true,
  credentials: true,
}));

// ─── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Serve Frontend Static Files ──────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '../frontend')));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders',   orderRoutes);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ─── 404 handler for API routes ───────────────────────────────────────────────
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'API route not found.' });
});

// ─── Fallback to frontend index.html for page routes ──────────────────────────
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

// ─── Start server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀  Server running at http://localhost:${PORT}`);
  console.log(`📦  API base URL: http://localhost:${PORT}/api`);
});
