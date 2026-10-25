/* ============================================================
   ХозМастер — cart.js : корзина (localStorage)
   Структура: { items:[{id, qty}], setDiscount: 0 }
   ============================================================ */

const Cart = {
  KEY: 'hm_cart',

  load() {
    try {
      const raw = localStorage.getItem(Cart.KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore */ }
    return { items: [], setDiscount: 0 };
  },

  save(state) {
    localStorage.setItem(Cart.KEY, JSON.stringify(state));
    Cart.updateBadge();
  },

  state: null,

  init() {
    Cart.state = Cart.load();
    Cart.updateBadge();
  },

  items() {
    return Cart.state.items
      .map(it => ({ ...it, product: Econom.productById(it.id) }))
      .filter(it => it.product);
  },

  count() {
    return Cart.state.items.reduce((s, it) => s + it.qty, 0);
  },

  add(id, qty = 1) {
    const found = Cart.state.items.find(it => it.id === id);
    if (found) found.qty += qty;
    else Cart.state.items.push({ id, qty });
    Cart.save(Cart.state);
  },

  setQty(id, qty) {
    const found = Cart.state.items.find(it => it.id === id);
    if (!found) return;
    found.qty = Math.max(1, qty);
    Cart.save(Cart.state);
  },

  remove(id) {
    const idx = Cart.state.items.findIndex(it => it.id === id);
    if (idx === -1) return null;
    const [removed] = Cart.state.items.splice(idx, 1);
    Cart.save(Cart.state);
    return removed;
  },

  restore(removed) {
    if (!removed) return;
    Cart.state.items.push(removed);
    Cart.save(Cart.state);
  },

  clear() {
    Cart.state = { items: [], setDiscount: 0 };
    Cart.save(Cart.state);
  },

  /* Добавить весь вариант комплекта + скидка за комплект K */
  addVariant(task, level) {
    const v = Econom.calcVariant(task, level);
    v.items.forEach(it => Cart.add(it.product.id, it.qty));
    Cart.state.setDiscount += v.K;
    Cart.save(Cart.state);
    return v;
  },

  /* Итоги: subtotal (по актуальным ценам), productDiscount, setDiscount, total, savings */
  totals() {
    const items = Cart.items();
    const subtotal = items.reduce((s, it) => s + it.product.price * it.qty, 0);
    const productDiscount = items.reduce((s, it) => s + Econom.productSaving(it.product) * it.qty, 0);
    const setDiscount = Cart.state.setDiscount;
    const savings = productDiscount + setDiscount;
    const oldSum = items.reduce((s, it) => s + (it.product.oldPrice || it.product.price) * it.qty, 0);
    const total = Math.max(0, subtotal - setDiscount); // К оплате без доставки: P − K (глава 1)
    return { subtotal, total, productDiscount, setDiscount, savings, oldSum, count: items.length };
  },

  updateBadge() {
    document.querySelectorAll('.cart-count[data-cart-badge]').forEach(el => {
      const c = Cart.count();
      el.textContent = c;
      el.style.display = c > 0 ? 'flex' : 'none';
    });
  },
};
