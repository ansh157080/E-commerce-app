-- ============================================================
-- Ansh Mart — Database Schema & Sample Data
-- Run this file in phpMyAdmin or MySQL CLI before starting the server
-- ============================================================

-- Create database
CREATE DATABASE IF NOT EXISTS ecommerce_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE ecommerce_db;

-- ============================================================
-- Table: users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id            INT          NOT NULL AUTO_INCREMENT,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('user','admin') NOT NULL DEFAULT 'user',
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- Table: products
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id          INT            NOT NULL AUTO_INCREMENT,
  name        VARCHAR(200)   NOT NULL,
  description TEXT,
  price       DECIMAL(10,2)  NOT NULL,
  image_url   VARCHAR(500),
  category    VARCHAR(100)   NOT NULL,
  stock       INT            NOT NULL DEFAULT 0,
  created_at  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- Table: orders
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id               INT            NOT NULL AUTO_INCREMENT,
  user_id          INT            NOT NULL,
  total_amount     DECIMAL(10,2)  NOT NULL,
  shipping_address TEXT           NOT NULL,
  phone            VARCHAR(20)    NOT NULL,
  status           ENUM('Pending','Processing','Shipped','Delivered') NOT NULL DEFAULT 'Pending',
  created_at       DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- Table: order_items
-- ============================================================
CREATE TABLE IF NOT EXISTS order_items (
  id          INT           NOT NULL AUTO_INCREMENT,
  order_id    INT           NOT NULL,
  product_id  INT           NOT NULL,
  quantity    INT           NOT NULL,
  unit_price  DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (id),
  FOREIGN KEY (order_id)   REFERENCES orders(id)   ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- Sample Data: Admin user
-- Password: admin123  (bcrypt hash generated with saltRounds=10)
-- ============================================================
INSERT INTO users (name, email, password_hash, role) VALUES
('Admin User', 'admin@anshmart.com',
 '$2a$10$Pw2fT6aOj3MiI7edZxJXjuWwrO5DfC4IP1NHQ9wnxfbQD1iqHmIua',
 'admin');

-- ============================================================
-- Sample Data: Regular user
-- Password: user123
-- ============================================================
INSERT INTO users (name, email, password_hash, role) VALUES
('John Doe', 'john@example.com',
 '$2a$10$iFi/aVQJgLSDzjJwgcg78uHUu.xqOeShTWY.redTnoDqXMJ4qJMcS',
 'user');

-- ============================================================
-- Sample Data: Products (10 items across 4 categories)
-- ============================================================
INSERT INTO products (name, description, price, image_url, category, stock) VALUES
('Wireless Bluetooth Headphones',
 'Premium over-ear headphones with active noise cancellation, 30-hour battery life, and superior sound quality.',
 2499.00,
 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop',
 'Electronics', 50),

('Smartphone Fast Charger 65W',
 'Universal USB-C fast charger compatible with most smartphones. Charges your phone to 80% in just 35 minutes.',
 899.00,
 'https://images.unsplash.com/photo-1609592806596-b9d6e8e9f06d?w=400&h=400&fit=crop',
 'Electronics', 120),

('Mechanical Keyboard RGB',
 'Compact TKL mechanical keyboard with RGB backlighting, tactile switches, and durable aluminium frame.',
 3499.00,
 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=400&h=400&fit=crop',
 'Electronics', 35),

('Men Classic White Shirt',
 'Slim-fit Oxford shirt made from 100% premium cotton. Ideal for office and casual occasions.',
 799.00,
 'https://images.unsplash.com/photo-1620012253295-c15cc3e65df4?w=400&h=400&fit=crop',
 'Clothing', 200),

('Women Running Sneakers',
 'Lightweight, breathable running shoes with memory foam insoles and anti-slip outsole.',
 1599.00,
 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop',
 'Clothing', 80),

('Casual Hoodie Unisex',
 'Soft fleece hoodie available in multiple colours. Perfect for cool evenings and lounging.',
 1199.00,
 'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=400&h=400&fit=crop',
 'Clothing', 150),

('The Art of Clean Code',
 'A practical guide for developers to write maintainable, readable, and efficient code. By Robert C. Martin.',
 549.00,
 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&h=400&fit=crop',
 'Books', 75),

('Digital Marketing Mastery',
 'Comprehensive guide covering SEO, social media marketing, email campaigns, and paid advertising strategies.',
 399.00,
 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=400&fit=crop',
 'Books', 60),

('Stainless Steel Water Bottle 1L',
 'Vacuum-insulated double-wall bottle keeps drinks cold 24 hrs / hot 12 hrs. BPA-free and leak-proof.',
 699.00,
 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&h=400&fit=crop',
 'Home & Kitchen', 180),

('Ceramic Coffee Mug Set 6 pcs',
 'Elegant ceramic mugs with ergonomic handle. Microwave and dishwasher safe. Capacity: 350 ml each.',
 849.00,
 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400&h=400&fit=crop',
 'Home & Kitchen', 90);
