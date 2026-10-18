# Ansh Mart — E-Commerce Web Application

A complete full-stack online shopping application for Ansh Mart.

---

## 🛠️ Technology Stack

| Layer      | Technology                            |
|------------|---------------------------------------|
| Frontend   | HTML5, CSS3 (Vanilla), JavaScript (ES6) |
| Backend    | Node.js, Express.js                   |
| Database   | MySQL (via XAMPP / MySQL Workbench)   |
| Auth       | JWT (jsonwebtoken), bcryptjs          |
| API        | REST API with JSON                    |

---

## ✨ Features

### Customer
- Browse products with search and category filters
- Product detail modal
- Shopping cart (add, update qty, remove, clear)
- Checkout with shipping form (Cash on Delivery)
- Order history with status tracking
- User registration & login

### Admin
- Secure admin login with role-based access
- Dashboard with stats (products, orders, revenue, users)
- Product CRUD (add, edit, delete with confirmation)
- View all customer orders with items
- Update order status (Pending → Processing → Shipped → Delivered)

---

## 📁 Project Structure

```
E-commerce_app/
├── backend/
│   ├── config/
│   │   └── db.js              # MySQL connection pool
│   ├── middleware/
│   │   └── auth.js            # JWT authenticate + adminOnly guards
│   ├── routes/
│   │   ├── auth.js            # POST /api/auth/register, /login
│   │   ├── products.js        # CRUD /api/products
│   │   └── orders.js          # /api/orders (place, list, admin)
│   ├── .env                   # Your local env vars (not committed)
│   ├── .env.example           # Template for env vars
│   ├── package.json
│   └── server.js              # Express app entry point
├── frontend/
│   ├── css/
│   │   └── style.css          # Global styles
│   ├── js/
│   │   ├── api.js             # Fetch wrapper with JWT injection
│   │   └── app.js             # Cart, Toast, Navbar, CartSidebar
│   ├── index.html             # Home page
│   ├── products.html          # Product catalog
│   ├── checkout.html          # Checkout form
│   ├── orders.html            # My orders
│   ├── login.html             # Login / Register
│   └── admin.html             # Admin dashboard
├── database.sql               # MySQL schema + sample data
├── .gitignore
└── README.md
```

---

## ⚙️ Local Setup (Windows + XAMPP)

### Prerequisites
- [XAMPP](https://www.apachefriends.org/) — for MySQL
- [Node.js](https://nodejs.org/) v18+ — for the backend

### Step 1 — Start MySQL via XAMPP
1. Open XAMPP Control Panel
2. Click **Start** next to **MySQL**

### Step 2 — Create Database

**Option A — phpMyAdmin (recommended for beginners):**
1. Open `http://localhost/phpmyadmin`
2. Click **Import** → Choose File → select `database.sql`
3. Click **Go**

**Option B — MySQL CLI:**
```bash
mysql -u root -p < database.sql
```
*(Leave password blank if XAMPP has no root password)*

### Step 3 — Configure Backend Environment
```bash
cd backend
copy .env.example .env
```
Open `backend/.env` and update if needed:
```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=        # leave blank for XAMPP default
DB_NAME=ecommerce_db
JWT_SECRET=anshmart_ecommerce_secret_key_2024_change_in_prod
JWT_EXPIRES_IN=24h
```

### Step 4 — Install Dependencies & Start Backend
```bash
cd backend
npm install
npm start
```
You should see:
```
✅  MySQL connected successfully
🚀  Server running at http://localhost:5000
```

### Step 5 — Open Frontend
Open `frontend/index.html` in your browser.

> **Best option:** Use VS Code **Live Server** extension (right-click `index.html` → *Open with Live Server*) to avoid any CORS file:// issues.

---

## 🔑 Test Accounts

| Role  | Email                  | Password  |
|-------|------------------------|-----------|
| Admin | admin@anshmart.com      | admin123  |
| User  | john@example.com       | user123   |

---

## 📡 API Endpoints

### Auth
| Method | Endpoint              | Description           | Auth Required |
|--------|-----------------------|-----------------------|---------------|
| POST   | /api/auth/register    | Register new user     | No            |
| POST   | /api/auth/login       | Login                 | No            |

### Products
| Method | Endpoint              | Description               | Auth Required |
|--------|-----------------------|---------------------------|---------------|
| GET    | /api/products         | List all (search, filter) | No            |
| GET    | /api/products/categories | Distinct categories    | No            |
| GET    | /api/products/:id     | Single product            | No            |
| POST   | /api/products         | Create product            | Admin         |
| PUT    | /api/products/:id     | Update product            | Admin         |
| DELETE | /api/products/:id     | Delete product            | Admin         |

### Orders
| Method | Endpoint              | Description               | Auth Required |
|--------|-----------------------|---------------------------|---------------|
| POST   | /api/orders           | Place order (COD)         | User          |
| GET    | /api/orders/my        | My order history          | User          |
| GET    | /api/orders           | All orders                | Admin         |
| GET    | /api/orders/stats     | Dashboard stats           | Admin         |
| PATCH  | /api/orders/:id/status| Update order status       | Admin         |

---

## 🔒 Security Features
- Passwords hashed with **bcrypt** (10 salt rounds)
- JWT tokens for stateless authentication
- Role-based API guards (user / admin)
- Parameterized SQL queries (no SQL injection)
- Server-side price calculation (cart totals never trusted from browser)
- Stock verified with `FOR UPDATE` locks inside DB transactions
- Credentials stored in `.env`, never hardcoded

---

## 🧪 Testing Checklist

| Test                                      | How to Test                                                     |
|-------------------------------------------|-----------------------------------------------------------------|
| User Registration                         | Login page → Sign up tab                                        |
| User Login                                | Login with `john@example.com` / `user123`                       |
| Admin Login                               | Login with `admin@anshmart.com` / `admin123`                     |
| Browse Products                           | Products page, search bar, category pills                       |
| Add to Cart                               | Click "Add to Cart" — badge updates, cart sidebar opens         |
| Cart Quantity Update                      | Open cart sidebar → +/- buttons                                 |
| Checkout & Place Order                    | Go to checkout, fill form, click Place Order                    |
| Stock Validation                          | Add more items than stock; server returns error                 |
| View My Orders                            | "My Orders" page after placing order                            |
| Admin Product CRUD                        | Admin dashboard → Products tab → Add/Edit/Delete               |
| Admin Order Status Update                 | Admin dashboard → Orders tab → change dropdown                  |
| User cannot access admin APIs             | Call `/api/orders` without admin token → 403 Forbidden          |

---

## 🐛 Known Limitations
- No email confirmation on registration
- No real payment gateway (COD only as required)
- No image upload (uses image URLs)
- Cart is stored in localStorage (clears on browser data wipe)

---

## 📄 License
Built for Ansh Mart by the developer.
