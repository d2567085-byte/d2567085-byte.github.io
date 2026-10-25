/* /favorites — избранное (глава Д-2) — page-favorites.js */
document.addEventListener('DOMContentLoaded', () => {
  renderHeader('', 'favorites');
  renderFooter();

  const root = document.getElementById('favorites-page');

  /* Состояние «загрузка» */
  root.innerHTML = `
    <div class="compare-loading"><span class="spinner"></span> Загружаем избранное…</div>`;

  function render() {
    const items = Favorites.items();
    root.innerHTML = `
      <nav class="breadcrumbs">
        <a href="index.html">Главная</a><span class="sep">/</span>
        <span class="current">Избранное</span>
      </nav>
      <div class="page-head row gap-16" style="justify-content:space-between;flex-wrap:wrap">
        <h1>${icon("heart", 24)} Избранное${items.length ? ` <span class="muted" style="font-size:18px;font-weight:600">· ${items.length} ${plural(items.length, 'товар', 'товара', 'товаров')}</span>` : ''}</h1>
        ${items.length >= 2 ? `<button class="btn btn-primary" onclick="addAllFavToCart()">${icon("cart", 16)} Добавить всё в корзину</button>` : ''}
      </div>
      ${items.length ? `
        <div class="grid-products">
          ${items.map(p => productCardHtml(p, { rmFav: true })).join('')}
        </div>
        <p class="small muted mt-16">${icon("info", 14)} Сердечко на карточке — добавить/убрать из избранного, крестик — удалить товар из списка.</p>` : `
        <div class="empty">
          <div class="icon">${icon("heart")}</div>
          <h3>Добавьте товары в избранное</h3>
          <p>Нажмите сердечко на карточке товара — и он сохранится здесь, чтобы не потерять</p>
          <div class="btns">
            <a class="btn btn-primary" href="catalog.html">Перейти в каталог</a>
            <a class="btn btn-secondary" href="catalog.html?filter=discount">Выгодные товары</a>
          </div>
        </div>`}`;
    Favorites.updateBadge();
  }

  window.addAllFavToCart = () => {
    const items = Favorites.items();
    const inStock = items.filter(p => p.stock !== 'out');
    inStock.forEach(p => Cart.add(p.id, 1));
    const skipped = items.length - inStock.length;
    toast(`Товары из избранного — в корзине${skipped ? ` (кроме ${skipped} без наличия)` : ''}`, 'success', 3500);
  };

  /* Перерисовка при удалении (крестик / сердечко на карточке) */
  document.addEventListener('hm:fav-changed', render);

  setTimeout(render, 250); // короткое состояние «загрузка» → данные
});
