/* ============================================================
   ХозМастер — econom.js : логика калькулятора (глава 1)
   P  = Σ price × qty
   D  = Σ (oldPrice − price) × qty
   K  = 5% × P, если позиций ≥ 3
   S  = D + K ; К оплате = P − K
   ============================================================ */

const Econom = {
  productById(id) {
    return PRODUCTS.find(p => p.id === id) || null;
  },

  taskBySlug(slug) {
    return TASKS.find(t => t.slug === slug) || null;
  },

  /* Расчёт варианта: возвращает {items, P, D, K, S, total, count, itemCount} */
  calcVariant(task, level) {
    const def = task.variants[level];
    if (!def) return null;
    const items = def.items
      .map(({ id, qty }) => {
        const p = Econom.productById(id);
        return p ? { product: p, qty } : null;
      })
      .filter(Boolean);

    const P = items.reduce((s, it) => s + it.product.price * it.qty, 0);
    const D = items.reduce((s, it) => s + ((it.product.oldPrice || it.product.price) - it.product.price) * it.qty, 0);
    const K = items.length >= 3 ? Math.round(P * 0.05) : 0;
    const S = D + K;

    return {
      items, P, D, K, S,
      total: P - K,                 // к оплате при добавлении всего комплекта
      count: items.length,          // число позиций
      itemCount: items.reduce((s, it) => s + it.qty, 0), // число товаров
    };
  },

  /* Все 3 варианта задачи */
  allVariants(task) {
    return ['econom', 'standard', 'lux'].map(level => ({
      level,
      ...Econom.calcVariant(task, level),
    }));
  },

  levelName(level) {
    return { econom: 'Экономный', standard: 'Стандартный', lux: 'Люкс' }[level] || level;
  },

  variantName(task, level) {
    const pref = { econom: 'Экономный', standard: 'Стандартный', lux: 'Люкс' }[level];
    const cap = task.short.charAt(0).toUpperCase() + task.short.slice(1);
    return `${pref === 'Люкс' ? 'Люкс' : pref.toLowerCase() === cap.toLowerCase() ? pref : pref} ${task.short}`;
  },

  variantTitle(task, level) {
    const word = { econom: 'Экономный', standard: 'Стандартный', lux: 'Премиальный' }[level];
    return `${word} ${task.short}`;
  },

  /* Цена «от» для карточки задачи (минимум среди 3 вариантов) */
  fromPrice(task) {
    const vs = Econom.allVariants(task);
    return Math.min(...vs.map(v => v.P));
  },

  /* Комплекты, в которые входит товар (глава 5) */
  kitsForProduct(productId) {
    const out = [];
    TASKS.forEach(task => {
      ['econom', 'standard', 'lux'].forEach(level => {
        const def = task.variants[level];
        if (def.items.some(i => i.id === productId)) {
          const v = Econom.calcVariant(task, level);
          out.push({ task, level, variant: v });
        }
      });
    });
    return out;
  },

  /* Экономия отдельного товара */
  productSaving(p) {
    return p.oldPrice ? (p.oldPrice - p.price) : 0;
  },

  productDiscountPercent(p) {
    return p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
  },

  /* Отзывы товара (детерминированная генерация из пула) */
  productReviews(p) {
    const seed = p.id.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
    const n = Math.min(p.reviews, 4);
    const out = [];
    for (let i = 0; i < n; i++) {
      const r = REVIEW_POOL[(seed + i * 3) % REVIEW_POOL.length];
      const rating = 4 + ((seed + i) % 2);
      const day = ((seed + i * 7) % 27) + 1;
      const month = ((seed + i) % 4) + 6; // июнь–сентябрь
      out.push({ ...r, rating, date: `${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')}.2026` });
    }
    return out;
  },

  /* Гистограмма рейтинга товара */
  ratingHistogram(p) {
    const total = p.reviews;
    const r = p.rating;
    const dist = [0, 0, 0, 0, 0]; // индекс 0 = 5 звёзд
    const five = Math.round(total * Math.max(0, Math.min(1, (r - 3) / 2)));
    dist[0] = five;
    dist[1] = Math.round((total - five) * 0.6);
    dist[2] = total - five - dist[1];
    if (dist[2] < 0) { dist[2] = 0; dist[1] = total - five; }
    return dist;
  },
};
