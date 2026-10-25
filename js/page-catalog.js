/* /catalog — каталог с фильтром «Только выгодные» — page-catalog.js */
document.addEventListener('DOMContentLoaded', () => {
  const catId = qs('cat') || '';
  const q = qs('q') || '';
  const cat = CATEGORIES.find(c => c.id === catId) || null;
  renderHeader(catId, 'catalog');
  renderFooter();

  /* Подтипы для отдельных категорий */
  const TYPE_GROUPS = {
    sneg: { name: 'Тип', opts: [['manual', 'Ручной инвентарь', ['sn-1', 'sn-2', 'sn-3']], ['moto', 'Снегоуборщики', ['sn-4', 'sn-5']] ] },
    gazon: { name: 'Тип', opts: [['trimmer', 'Триммеры', ['ga-1', 'ga-4']], ['mower', 'Газонокосилки', ['ga-2', 'ga-3']], ['water', 'Полив', ['ga-5', 'ga-6']] ] },
    kotly: { name: 'Мощность', opts: [['low', 'До 13 кВт', ['ot-1']], ['mid', '14–20 кВт', ['ot-2']], ['high', 'Более 20 кВт', ['ot-3']] ] },
  };

  const state = {
    priceMin: null, priceMax: null,
    brands: [], types: [], stockIn: false, stockOrder: false,
    onlyBenefit: qs('filter') === 'discount',
    sort: 'popular', shown: 12,
  };

  const allProducts = () => {
    let list = PRODUCTS.slice();
    if (catId) list = list.filter(p => p.cat === catId);
    if (q) {
      const ql = q.toLowerCase();
      list = list.filter(p => (p.name + ' ' + p.brand + ' ' + p.desc).toLowerCase().includes(ql));
    }
    return list;
  };

  const priceBounds = () => {
    const list = allProducts();
    const prices = list.map(p => p.price);
    return [Math.min(...prices, 0), Math.max(...prices, 50000)];
  };

  function applyFilters() {
    let list = allProducts();
    const tg = TYPE_GROUPS[catId];
    if (state.priceMin !== null) list = list.filter(p => p.price >= state.priceMin);
    if (state.priceMax !== null) list = list.filter(p => p.price <= state.priceMax);
    if (state.brands.length) list = list.filter(p => state.brands.includes(p.brand));
    if (tg && state.types.length) {
      const ids = tg.opts.filter(o => state.types.includes(o[0])).flatMap(o => o[2]);
      list = list.filter(p => ids.includes(p.id));
    }
    if (state.stockIn) list = list.filter(p => p.stock === 'in');
    if (state.stockOrder) list = list.filter(p => p.stock === 'order');
    if (state.onlyBenefit) list = list.filter(p => p.oldPrice);

    switch (state.sort) {
      case 'price-asc': list.sort((a, b) => a.price - b.price); break;
      case 'price-desc': list.sort((a, b) => b.price - a.price); break;
      case 'new': list.sort((a, b) => b.art.localeCompare(a.art)); break;
      case 'benefit': list.sort((a, b) => (Econom.productSaving(b) / (b.price || 1)) - (Econom.productSaving(a) / (a.price || 1))); break;
      default: list.sort((a, b) => (b.rating * b.reviews) - (a.rating * a.reviews));
    }
    return list;
  }

  const root = document.getElementById('catalog-page');
  const title = q ? `Поиск: «${esc(q)}»` : cat ? `${cat.name} в Ишимбае` : 'Каталог товаров';

  root.innerHTML = `
    <nav class="breadcrumbs">
      <a href="index.html">Главная</a><span class="sep">/</span>
      <a href="catalog.html">Каталог</a>${cat ? `<span class="sep">/</span><span class="current">${cat.name}</span>` : ''}
    </nav>
    <div class="page-head"><h1>${title}</h1></div>
    <div class="catalog-layout">
      <aside class="filters" id="filters-panel"></aside>
      <div>
        <div class="mobile-catalog-btns show-mobile">
          <button class="btn btn-secondary btn-block" onclick="toggleFilters(true)">Фильтры <b id="f-count"></b></button>
        </div>
        <div class="active-filters" id="active-filters"></div>
        <div class="catalog-toolbar">
          <span class="count" id="found-count"></span>
          <div class="sort">
            <label for="sort-sel" class="small muted nowrap">Сортировка:</label>
            <select class="select" id="sort-sel">
              <option value="popular">По популярности</option>
              <option value="price-asc">Цена ↑</option>
              <option value="price-desc">Цена ↓</option>
              <option value="new">Новинки</option>
              <option value="benefit">Сначала выгодные</option>
            </select>
          </div>
        </div>
        <div class="grid-products" id="products-grid"></div>
        <div class="empty" id="catalog-empty" style="display:none">
          <div class="icon">${icon("search")}</div>
          <h3>Ничего не найдено</h3>
          <p>Попробуйте изменить фильтры или сбросить их</p>
          <div class="btns"><button class="btn btn-secondary" onclick="resetFilters()">Сбросить фильтры</button></div>
        </div>
        <div class="mt-24 text-right" id="more-wrap"></div>
      </div>
    </div>
    <div class="filters-drawer" id="filters-drawer" onclick="if(event.target===this)toggleFilters(false)">
      <div class="fd-panel">
        <div class="fd-head"><h3>Фильтры</h3><button class="btn-ghost" onclick="toggleFilters(false)" style="font-size:20px">${icon("close", 20)}</button></div>
        <div id="filters-mobile"></div>
        <button class="btn btn-primary btn-block mt-16" onclick="toggleFilters(false)">Показать результаты</button>
      </div>
    </div>`;

  window.toggleFilters = open => {
    document.getElementById('filters-drawer').classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  };
  window.resetFilters = () => {
    state.priceMin = null; state.priceMax = null; state.brands = []; state.types = [];
    state.stockIn = false; state.stockOrder = false; state.onlyBenefit = false;
    renderFilters(); renderProducts();
  };

  /* ---------- Фильтры ---------- */
  function filtersHtml() {
    const [lo, hi] = priceBounds();
    const pmin = state.priceMin !== null ? state.priceMin : lo;
    const pmax = state.priceMax !== null ? state.priceMax : hi;
    const list = allProducts();
    const brandsInList = [...new Set(list.map(p => p.brand))];
    const tg = TYPE_GROUPS[catId];
    return `
      <div class="filter-group">
        <label class="only-benefit"><input type="checkbox" id="f-benefit" ${state.onlyBenefit ? 'checked' : ''}> ${icon("flame", 15)} Только выгодные</label>
        <div class="small muted mt-8">Товары со скидкой — выгода видна сразу</div>
      </div>
      <div class="filter-group">
        <div class="fg-head" onclick="this.parentElement.classList.toggle('collapsed')">Цена, ₽ <span class="arr">${icon("chevronDown", 14)}</span></div>
        <div class="fg-body">
          <div class="dual-range">
            <div class="track"></div>
            <div class="track-active" id="range-active"></div>
            <input type="range" id="r-min" min="${lo}" max="${hi}" value="${pmin}" step="10">
            <input type="range" id="r-max" min="${lo}" max="${hi}" value="${pmax}" step="10">
          </div>
          <div class="range-inputs">
            <input class="input" id="in-min" type="number" value="${pmin}" min="${lo}" max="${hi}">
            <input class="input" id="in-max" type="number" value="${pmax}" min="${lo}" max="${hi}">
          </div>
        </div>
      </div>
      <div class="filter-group">
        <div class="fg-head" onclick="this.parentElement.classList.toggle('collapsed')">Бренд <span class="arr">${icon("chevronDown", 14)}</span></div>
        <div class="fg-body">
          ${brandsInList.map(b => {
            const cnt = list.filter(p => p.brand === b).length;
            return `<label class="checkbox"><input type="checkbox" class="f-brand" value="${b}" ${state.brands.includes(b) ? 'checked' : ''}> ${b} <span class="cnt">${cnt}</span></label>`;
          }).join('')}
        </div>
      </div>
      ${tg ? `
      <div class="filter-group">
        <div class="fg-head" onclick="this.parentElement.classList.toggle('collapsed')">${tg.name} <span class="arr">${icon("chevronDown", 14)}</span></div>
        <div class="fg-body">
          ${tg.opts.map(o => {
            const cnt = list.filter(p => o[2].includes(p.id)).length;
            return `<label class="checkbox"><input type="checkbox" class="f-type" value="${o[0]}" ${state.types.includes(o[0]) ? 'checked' : ''}> ${o[1]} <span class="cnt">${cnt}</span></label>`;
          }).join('')}
        </div>
      </div>` : ''}
      <div class="filter-group">
        <div class="fg-head" onclick="this.parentElement.classList.toggle('collapsed')">Наличие <span class="arr">${icon("chevronDown", 14)}</span></div>
        <div class="fg-body">
          <label class="checkbox"><input type="checkbox" id="f-in" ${state.stockIn ? 'checked' : ''}> В наличии</label>
          <label class="checkbox"><input type="checkbox" id="f-order" ${state.stockOrder ? 'checked' : ''}> Под заказ</label>
        </div>
      </div>
      <button class="btn btn-ghost btn-block" onclick="resetFilters()">Сбросить фильтры</button>`;
  }

  function renderFilters() {
    const html = filtersHtml();
    document.getElementById('filters-panel').innerHTML = html;
    document.getElementById('filters-mobile').innerHTML = html;
    bindFilters(document.getElementById('filters-panel'));
    bindFilters(document.getElementById('filters-mobile'));
    updateRangeTrack();
  }

  function bindFilters(scope) {
    if (!scope) return;
    const benefit = scope.querySelector('#f-benefit');
    if (benefit) benefit.onchange = () => { state.onlyBenefit = benefit.checked; state.shown = 12; syncCheckbox('f-benefit', benefit.checked); renderProducts(); renderActiveFilters(); };
    const rmin = scope.querySelector('#r-min'), rmax = scope.querySelector('#r-max');
    if (rmin && rmax) {
      const onRange = () => {
        let a = +rmin.value, b = +rmax.value;
        if (a > b) { [a, b] = [b, a]; }
        state.priceMin = a; state.priceMax = b;
        const imin = scope.querySelector('#in-min'), imax = scope.querySelector('#in-max');
        if (imin) imin.value = a; if (imax) imax.value = b;
        updateRangeTrack(); renderProducts();
      };
      rmin.oninput = onRange; rmax.oninput = onRange;
    }
    const imin = scope.querySelector('#in-min'), imax = scope.querySelector('#in-max');
    if (imin && imax) {
      const onNum = () => {
        state.priceMin = +imin.value || null; state.priceMax = +imax.value || null;
        syncInput('in-min', imin.value); syncInput('in-max', imax.value);
        renderProducts();
      };
      imin.onchange = onNum; imax.onchange = onNum;
    }
    scope.querySelectorAll('.f-brand').forEach(cb => cb.onchange = () => {
      state.brands = [...document.querySelectorAll('.f-brand')].filter(x => x.checked).map(x => x.value);
      state.brands = [...new Set(state.brands)];
      syncAll('.f-brand'); renderProducts(); renderActiveFilters();
    });
    scope.querySelectorAll('.f-type').forEach(cb => cb.onchange = () => {
      state.types = [...document.querySelectorAll('.f-type')].filter(x => x.checked).map(x => x.value);
      state.types = [...new Set(state.types)];
      syncAll('.f-type'); renderProducts(); renderActiveFilters();
    });
    const fin = scope.querySelector('#f-in'), fo = scope.querySelector('#f-order');
    if (fin) fin.onchange = () => { state.stockIn = fin.checked; syncCheckbox('f-in', fin.checked); renderProducts(); renderActiveFilters(); };
    if (fo) fo.onchange = () => { state.stockOrder = fo.checked; syncCheckbox('f-order', fo.checked); renderProducts(); renderActiveFilters(); };
  }

  function syncCheckbox(id, checked) { document.querySelectorAll(`#${CSS.escape(id)}`).forEach(el => el.checked = checked); }
  function syncInput(id, val) { document.querySelectorAll(`#${CSS.escape(id)}`).forEach(el => el.value = val); }
  function syncAll(sel) {
    const vals = [...new Set([...document.querySelectorAll(sel)].filter(x => x.checked).map(x => x.value))];
    document.querySelectorAll(sel).forEach(el => el.checked = vals.includes(el.value));
  }

  function updateRangeTrack() {
    document.querySelectorAll('.dual-range').forEach(dr => {
      const rmin = dr.querySelector('#r-min'), rmax = dr.querySelector('#r-max');
      const act = dr.querySelector('.track-active');
      if (!rmin || !act) return;
      const lo = +rmin.min, hi = +rmin.max;
      const a = (+rmin.value - lo) / (hi - lo) * 100, b = (+rmax.value - lo) / (hi - lo) * 100;
      act.style.left = Math.min(a, b) + '%';
      act.style.width = Math.abs(b - a) + '%';
    });
  }

  function renderActiveFilters() {
    const chips = [];
    if (state.onlyBenefit) chips.push([`${icon("flame", 13)} Только выгодные`, () => { state.onlyBenefit = false; }]);
    if (state.priceMin !== null) chips.push([`Цена от ${fmt(state.priceMin)}`, () => { state.priceMin = null; }]);
    if (state.priceMax !== null) chips.push([`Цена до ${fmt(state.priceMax)}`, () => { state.priceMax = null; }]);
    state.brands.forEach(b => chips.push([b, () => { state.brands = state.brands.filter(x => x !== b); }]));
    if (state.stockIn) chips.push(['В наличии', () => { state.stockIn = false; }]);
    if (state.stockOrder) chips.push(['Под заказ', () => { state.stockOrder = false; }]);
    const box = document.getElementById('active-filters');
    box.innerHTML = chips.map((c, i) => `<button class="chip" data-i="${i}">${c[0]}<span class="x">${icon("close", 12)}</span></button>`).join('');
    box.querySelectorAll('.chip').forEach((el, i) => el.onclick = () => { chips[i][1](); renderFilters(); renderProducts(); renderActiveFilters(); });
    const fc = document.getElementById('f-count');
    if (fc) fc.textContent = chips.length ? `(${chips.length})` : '';
  }

  /* ---------- Сетка товаров ---------- */
  function renderProducts() {
    const list = applyFilters();
    const grid = document.getElementById('products-grid');
    const empty = document.getElementById('catalog-empty');
    document.getElementById('found-count').textContent = `Найдено ${list.length} ${plural(list.length, 'товар', 'товара', 'товаров')}`;
    empty.style.display = list.length ? 'none' : 'block';
    grid.innerHTML = list.slice(0, state.shown).map(productCardHtml).join('');
    const more = document.getElementById('more-wrap');
    more.innerHTML = list.length > state.shown
      ? `<button class="btn btn-secondary" onclick="showMore()">Показать ещё (${list.length - state.shown})</button>`
      : '';
  }

  window.showMore = () => { state.shown += 12; renderProducts(); };
  document.getElementById('sort-sel').onchange = e => { state.sort = e.target.value; renderProducts(); };

  renderFilters();
  renderActiveFilters();
  renderProducts();
});
