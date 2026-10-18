/* ============================================================
   cart.js — In-memory cart backed by localStorage
   ============================================================ */

const Cart = (() => {
  const KEY = 'ecommerce_cart';

  const load = () => {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
  };
  const save = (items) => localStorage.setItem(KEY, JSON.stringify(items));

  return {
    /** @returns {Array} current cart items */
    get items() { return load(); },

    /** Add or increment a product */
    addItem(product, qty = 1) {
      const items = load();
      const existing = items.find(i => i.id === product.id);
      if (existing) {
        existing.quantity = Math.min(existing.quantity + qty, product.stock || 999);
      } else {
        items.push({
          id:       product.id,
          name:     product.name,
          price:    parseFloat(product.price),
          image_url: product.image_url,
          stock:    product.stock,
          quantity: qty,
        });
      }
      save(items);
      Cart.updateBadge();
    },

    /** Change quantity for an item; removes if qty <= 0 */
    setQty(productId, qty) {
      let items = load();
      if (qty <= 0) {
        items = items.filter(i => i.id !== productId);
      } else {
        const item = items.find(i => i.id === productId);
        if (item) item.quantity = qty;
      }
      save(items);
      Cart.updateBadge();
    },

    removeItem(productId) {
      save(load().filter(i => i.id !== productId));
      Cart.updateBadge();
    },

    clear() { localStorage.removeItem(KEY); Cart.updateBadge(); },

    count() { return load().reduce((s, i) => s + i.quantity, 0); },

    subtotal() {
      return load().reduce((s, i) => s + i.price * i.quantity, 0);
    },

    /** Update the badge in the navbar */
    updateBadge() {
      const badge = document.getElementById('cart-badge');
      if (!badge) return;
      const c = Cart.count();
      badge.textContent = c;
      badge.style.display = c ? 'inline' : 'none';
    }
  };
})();

/* ============================================================
   ui.js — Shared UI utilities (toast, spinner, format)
   ============================================================ */

/** Show a toast notification */
function showToast(message, type = 'success') {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    document.body.appendChild(toast);
  }
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  toast.className = `toast-${type}`;
  toast.innerHTML = `<span>${icons[type] || ''}</span><span>${message}</span>`;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 3500);
}

/** Format currency */
function formatCurrency(amount) {
  return '₹' + parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Format date */
function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** Status badge HTML */
function statusBadge(status) {
  const cls = { Pending: 'pending', Processing: 'processing', Shipped: 'shipped', Delivered: 'delivered' };
  return `<span class="badge badge-${(cls[status] || 'pending')}">${status}</span>`;
}

/** Show spinner inside a container */
function showSpinner(container) {
  container.innerHTML = `<div class="spinner-wrap"><div class="spinner"></div></div>`;
}

/** Redirect if not logged in */
function requireAuth() {
  if (!getToken()) { window.location.href = 'login.html'; return false; }
  return true;
}

/** Redirect if not admin */
function requireAdmin() {
  const user = getUser();
  if (!getToken() || !user || user.role !== 'admin') {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

/** Render the navbar and highlight active link */
function renderNavbar(activePage) {
  const user = getUser();
  const token = getToken();
  const isAdmin = user && user.role === 'admin';

  const links = [
    { href: 'index.html',   label: '🏠', text: 'Home',     page: 'home' },
    { href: 'products.html', label: '🛍️', text: 'Products', page: 'products' },
  ];

  if (!isAdmin) {
    links.push({ href: '#', label: '🛒', text: 'Cart', page: 'cart', id: 'nav-cart' });
  }

  if (token) {
    if (!isAdmin) {
      links.push({ href: 'orders.html', label: '📦', text: 'My Orders', page: 'orders' });
    }
    if (isAdmin) {
      links.push({ href: 'admin.html', label: '⚙️', text: 'Admin', page: 'admin' });
    }
    links.push({ href: '#', label: `👋 ${user.name.split(' ')[0]}`, text: '', page: 'user', id: 'nav-user', noLink: true });
    links.push({ href: '#', label: '🚪', text: 'Logout', page: 'logout', id: 'nav-logout', isLogout: true });
  } else {
    links.push({ href: 'login.html', label: '🔑', text: 'Login', page: 'login' });
  }

  const nav = document.getElementById('navbar');
  if (!nav) return;

  nav.innerHTML = `
    <a href="index.html" class="navbar-brand">Ansh <span>Mart</span></a>
    <ul class="navbar-nav">
      ${links.map(l => {
        if (l.noLink) {
          return `<li><span class="nav-link" style="cursor:default;color:var(--primary);font-weight:700">${l.label}</span></li>`;
        }
        if (l.isLogout) {
          return `<li><button class="btn-logout" id="nav-logout">🚪 <span class="nav-text">Logout</span></button></li>`;
        }
        const badge = l.page === 'cart' ? `<span class="cart-badge" id="cart-badge" style="display:none">0</span>` : '';
        return `<li><a href="${l.href}" class="nav-link${activePage === l.page ? ' active' : ''}" id="${l.id||''}">${l.label} <span class="nav-text">${l.text}</span>${badge}</a></li>`;
      }).join('')}
    </ul>
  `;

  // Pre-build cart sidebar in closed state
  buildCartSidebar();

  // Cart badge init
  Cart.updateBadge();

  // Cart click
  const cartLink = document.getElementById('nav-cart');
  if (cartLink) cartLink.addEventListener('click', e => { e.preventDefault(); openCart(); });

  // Logout
  const logoutBtn = document.getElementById('nav-logout');
  if (logoutBtn) logoutBtn.addEventListener('click', () => {
    clearAuth();
    Cart.clear();
    showToast('Logged out successfully.', 'info');
    setTimeout(() => window.location.href = 'index.html', 700);
  });
}

/* ============================================================
   Cart Sidebar (shared)
   ============================================================ */
function openCart() {
  buildCartSidebar();
  const overlay = document.getElementById('overlay');
  const sidebar = document.getElementById('cart-sidebar');
  if (!overlay || !sidebar) return;
  renderCartSidebar();
  overlay.classList.add('visible');
  sidebar.classList.add('open');
}

function closeCart() {
  document.getElementById('overlay')?.classList.remove('visible');
  document.getElementById('cart-sidebar')?.classList.remove('open');
}

function buildCartSidebar() {
  if (document.getElementById('cart-sidebar')) return;

  // overlay
  const overlay = document.createElement('div');
  overlay.id = 'overlay';
  overlay.className = 'overlay';
  overlay.addEventListener('click', closeCart);
  document.body.appendChild(overlay);

  // sidebar
  const sidebar = document.createElement('div');
  sidebar.id = 'cart-sidebar';
  sidebar.className = 'sidebar';
  sidebar.innerHTML = `
    <div class="sidebar-header">
      <h3>🛒 Shopping Cart</h3>
      <button class="sidebar-close" id="cart-close" aria-label="Close cart">×</button>
    </div>
    <div class="sidebar-body" id="cart-body"></div>
    <div class="sidebar-footer" id="cart-footer"></div>
  `;
  document.body.appendChild(sidebar);
  document.getElementById('cart-close').addEventListener('click', closeCart);

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeCart();
  });

  renderCartSidebar();
}

function renderCartSidebar() {
  const body   = document.getElementById('cart-body');
  const footer = document.getElementById('cart-footer');
  if (!body || !footer) return;

  const items = Cart.items;

  if (items.length === 0) {
    body.innerHTML = `
      <div class="empty-state" style="padding:2rem 1rem;">
        <div class="icon">🛒</div>
        <h3>Your cart is empty</h3>
        <p>Browse products and add items to your cart.</p>
      </div>`;
    footer.innerHTML = '';
    return;
  }

  body.innerHTML = items.map(item => `
    <div class="cart-item" data-id="${item.id}">
      <img src="${item.image_url || 'https://placehold.co/64x64?text=Product'}" alt="${item.name}" class="cart-item-img"
           onerror="this.src='https://placehold.co/64x64?text=No+Image'">
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">${formatCurrency(item.price)}</div>
        <div class="qty-control">
          <button class="qty-btn" data-action="dec" data-id="${item.id}">−</button>
          <span class="qty-value">${item.quantity}</span>
          <button class="qty-btn" data-action="inc" data-id="${item.id}" data-stock="${item.stock}">+</button>
        </div>
        <button class="remove-item" data-id="${item.id}">🗑 Remove</button>
      </div>
    </div>
  `).join('');

  const subtotal = Cart.subtotal();
  const shipping = subtotal > 0 ? (subtotal >= 999 ? 0 : 99) : 0;
  const total    = subtotal + shipping;

  footer.innerHTML = `
    <div class="cart-totals">
      <div class="cart-totals-row"><span>Subtotal</span><span>${formatCurrency(subtotal)}</span></div>
      <div class="cart-totals-row"><span>Shipping</span><span>${shipping === 0 && subtotal > 0 ? '<span style="color:var(--success)">FREE</span>' : formatCurrency(shipping)}</span></div>
      <div class="cart-totals-row total"><span>Total</span><span>${formatCurrency(total)}</span></div>
    </div>
    <button class="btn btn-primary" style="width:100%;margin-top:1rem" id="cart-checkout-btn">
      Proceed to Checkout →
    </button>
    <button class="btn btn-secondary" style="width:100%;margin-top:.5rem" id="cart-clear-btn">
      Clear Cart
    </button>
  `;

  // Event listeners
  body.querySelectorAll('.qty-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id     = parseInt(btn.dataset.id);
      const stock  = parseInt(btn.dataset.stock || 999);
      const item   = Cart.items.find(i => i.id === id);
      if (!item) return;
      const newQty = btn.dataset.action === 'inc'
        ? Math.min(item.quantity + 1, stock)
        : item.quantity - 1;
      Cart.setQty(id, newQty);
      renderCartSidebar();
    });
  });

  body.querySelectorAll('.remove-item').forEach(btn => {
    btn.addEventListener('click', () => {
      Cart.removeItem(parseInt(btn.dataset.id));
      renderCartSidebar();
    });
  });

  document.getElementById('cart-clear-btn')?.addEventListener('click', () => {
    Cart.clear();
    renderCartSidebar();
  });

  document.getElementById('cart-checkout-btn')?.addEventListener('click', () => {
    if (!getToken()) {
      closeCart();
      showToast('Please log in to checkout.', 'info');
      setTimeout(() => window.location.href = 'login.html', 800);
      return;
    }
    closeCart();
    window.location.href = 'checkout.html';
  });
}
