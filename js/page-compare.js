/* /compare — сравнение товаров (глава Д-1) — page-compare.js */
document.addEventListener('DOMContentLoaded', () => {
  renderHeader('', 'compare');
  renderFooter();

  const root = document.getElementById('compare-page');

  /* Состояние «загрузка» */
  root.innerHTML = `
    <div class="compare-loading"><span class="spinner"></span> Загружаем сравнение…</div>`;

  /* Строки таблицы: базовые + объединение характеристик всех товаров */
  function buildRows(items) {
    const rows = [
      ['Цена', p => `<b class="cmp-price-cell">${fmt(p.price)}</b>`, p => String(p.price)],
      ['Бренд', p => esc(p.brand), p => p.brand],
      ['Артикул', p => esc(p.art), p => p.art],
      ['Наличие', p => stockHtml(p), p => p.stock],
      ['Рейтинг', p => `${stars(p.rating)} <span class="small">${p.rating.toFixed(1)} (${p.reviews})</span>`, p => String(p.rating)],
    ];
    const keys = [];
    items.forEach(p => Object.keys(p.specs || {}).forEach(k => { if (!keys.includes(k)) keys.push(k); }));
    keys.forEach(k => rows.push([k, p => (p.specs && p.specs[k] !== undefined) ? `<b>${esc(p.specs[k])}</b>` : '<span class="muted">—</span>', p => (p.specs && p.specs[k] !== undefined) ? String(p.specs[k]) : '']));
    return rows;
  }

  function tableHtml(items) {
    const rows = buildRows(items);
    return `
    <div class="compare-scroll">
      <table class="compare-table">
        <tr class="cmp-head">
          <td class="cmp-label">
            <span class="cmp-count">${items.length} из 4</span>
            <button class="btn btn-ghost btn-small cmp-clear" onclick="clearCompare()">${icon("trash", 14)} Очистить всё</button>
          </td>
          ${items.map(p => `
          <td class="cmp-col">
            <button class="cmp-remove js-cmp-remove" data-id="${p.id}" aria-label="Удалить из сравнения" title="Удалить из сравнения">${icon("close", 14)}</button>
            <a class="cmp-photo" href="product.html?id=${p.id}">${photo(p)}</a>
            <a class="cmp-name" href="product.html?id=${p.id}">${esc(p.name)}</a>
            ${p.stock === 'out'
              ? `<button class="btn btn-secondary btn-small btn-block js-notify" data-id="${p.id}">${icon("bell", 14)} О поступлении</button>`
              : `<button class="btn btn-primary btn-small btn-block add-to-cart" data-id="${p.id}">${icon("cart", 14)} В корзину</button>`}
          </td>`).join('')}
        </tr>
        ${rows.map(([label, view, raw]) => {
          const vals = items.map(raw);
          const diff = items.length > 1 && new Set(vals).size > 1;
          return `
          <tr class="${diff ? 'cmp-diff' : ''}">
            <td class="cmp-label">${esc(label)}${diff ? `<span class="cmp-diff-mark" title="Значения различаются">${icon("sparkle", 11)}</span>` : ''}</td>
            ${items.map(p => `<td>${view(p)}</td>`).join('')}
          </tr>`;
        }).join('')}
      </table>
    </div>
    ${items.length < 2 ? `<p class="small muted mt-16">${icon("info", 14)} Добавьте ещё товары — сравнение характеристик появится, когда в таблице 2 товара и больше (до 4).</p>` : ''}`;
  }

  function emptyHtml() {
    return `
    <div class="empty">
      <div class="icon">${icon("scale")}</div>
      <h3>Добавьте товары для сравнения</h3>
      <p>Нажмите иконку весов на карточке в каталоге или кнопку «Сравнить» в товаре — можно добавить до 4 штук</p>
      <div class="btns">
        <a class="btn btn-primary" href="catalog.html">Перейти в каталог</a>
        <a class="btn btn-secondary" href="catalog.html?cat=sneg">Сравнить снегоуборщики</a>
      </div>
    </div>`;
  }

  function render() {
    try {
      const items = Compare.items();
      root.innerHTML = `
        <nav class="breadcrumbs">
          <a href="index.html">Главная</a><span class="sep">/</span>
          <span class="current">Сравнение товаров</span>
        </nav>
        <div class="page-head"><h1>${icon("scale", 26)} Сравнение товаров</h1></div>
        ${items.length ? tableHtml(items) : emptyHtml()}`;
      Compare.updateBadge();
    } catch (err) {
      /* Состояние «ошибка» */
      root.innerHTML = `
        <div class="empty">
          <div class="icon" style="color:var(--danger)">${icon("info")}</div>
          <h3>Не удалось загрузить сравнение</h3>
          <p>Данные повреждены или товар больше не доступен</p>
          <div class="btns">
            <button class="btn btn-primary" onclick="Compare.clear();location.reload()">Сбросить и обновить</button>
            <a class="btn btn-secondary" href="catalog.html">В каталог</a>
          </div>
        </div>`;
    }
  }

  /* Удаление товара из сравнения (крестик в колонке) */
  document.addEventListener('click', e => {
    const rm = e.target.closest('.js-cmp-remove');
    if (!rm) return;
    Compare.remove(rm.dataset.id);
    toast('Товар удалён из сравнения', '', 2000);
    render();
  });

  window.clearCompare = () => {
    Compare.clear();
    toast('Список сравнения очищен', '', 2000);
    render();
  };

  /* Перерисовка при изменении сравнения (кнопки-весы в карточках «В корзину») */
  document.addEventListener('hm:cmp-changed', render);

  setTimeout(render, 300); // короткое состояние «загрузка» → данные
});
