/* /product/{id} — карточка товара — page-product.js */
document.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('product-page');
  const id = qs('id') || PRODUCTS[0].id;
  const p = Econom.productById(id) || PRODUCTS[0];
  const cat = CATEGORIES.find(c => c.id === p.cat);
  renderHeader(p.cat, 'product');
  renderFooter();

  /* Д-5: запоминаем просмотр товара */
  if (typeof History !== 'undefined') History.add(p.id);

  const inFav = typeof Favorites !== 'undefined' && Favorites.has(p.id);
  const inCmp = typeof Compare !== 'undefined' && Compare.has(p.id);

  const saving = Econom.productSaving(p);
  const percent = Econom.productDiscountPercent(p);
  const kits = Econom.kitsForProduct(p.id);

  /* «Виды» галереи: общий план и два укрупнённых фрагмента одного фото */
  const VIEWS = [
    { title: 'Общий вид', css: '' },
    { title: 'Фрагмент сверху', css: 'transform:scale(1.8);transform-origin:30% 30%' },
    { title: 'Фрагмент снизу', css: 'transform:scale(1.8);transform-origin:70% 70%' },
  ];

  const root = document.getElementById('product-page');
  root.innerHTML = `
    <nav class="breadcrumbs">
      <a href="index.html">Главная</a><span class="sep">/</span>
      <a href="catalog.html">Каталог</a><span class="sep">/</span>
      ${cat ? `<a href="catalog.html?cat=${cat.id}">${cat.name}</a><span class="sep">/</span>` : ''}
      <span class="current">${esc(p.name)}</span>
    </nav>

    <div class="product-layout">
      <!-- Галерея -->
      <div class="gallery">
        <div class="main" onclick="openLightbox()">
          <div class="badges">${badgesHtml(p)}</div>
          ${photo(p, "", "", { eager: true })}
        </div>
        <div class="thumbs">
          ${VIEWS.map((v, i) => `
            <div class="thumb ${i === 0 ? 'active' : ''}" onclick="switchThumb(this, ${i})" title="${v.title}">
              ${photo(p, 'sm', v.css)}
            </div>`).join('')}
        </div>
      </div>

      <!-- Информация -->
      <div class="product-info">
        <h1>${esc(p.name)}</h1>
        <div class="art-row">
          <span class="small muted">Арт. ${p.art}</span>
          <a href="#reviews" class="small">${stars(p.rating)} ${p.rating.toFixed(1)} (${p.reviews})</a>
          ${stockHtml(p)}
        </div>
        <div class="price-row">
          <span class="price price-xl">${fmt(p.price)}</span>
          ${p.oldPrice ? `<span class="price-old" style="font-size:18px">${fmt(p.oldPrice)}</span><span class="badge badge-percent">−${percent}%</span>` : ''}
        </div>
        <p class="short">${esc(p.desc)}</p>

        <div class="econom-mini">
          ${saving > 0 ? `<span class="s1">${icon("piggy", 16)} Ты экономишь ${fmt(saving)}</span>` : `<span class="s1">${icon("calculator", 15)} Экономник покупок</span>`}
          <span class="s2">${saving > 0 ? `Купи сейчас — скидка ${percent}%` : 'Собери комплект и сэкономь ещё больше'}</span>
        </div>

        <div class="buy-row">
          <span class="stepper">
            <button onclick="pQty(-1)" aria-label="Меньше">−</button>
            <span class="qty" id="p-qty">1</span>
            <button onclick="pQty(1)" aria-label="Больше">+</button>
          </span>
          ${p.stock === 'out'
            ? `<button class="btn btn-secondary btn-lg" onclick="openNotifyModal(Econom.productById('${p.id}'))">${icon("bell", 16)} Сообщить о поступлении</button>`
            : `<button class="btn btn-primary btn-lg" id="p-add">${icon("cart", 16)} В корзину</button>`}
          <button class="btn btn-secondary btn-lg" onclick="openOneClick()">Купить в 1 клик</button>
        </div>

        <div class="cmp-fav-row">
          <button class="btn btn-secondary js-cmp ${inCmp ? 'active' : ''}" data-id="${p.id}" aria-pressed="${inCmp}">${inCmp ? `${icon("check", 16)} В сравнении` : `${icon("scale", 16)} Сравнить`}</button>
          <button class="btn btn-ghost js-fav ${inFav ? 'active' : ''}" data-id="${p.id}" aria-pressed="${inFav}">${inFav ? `${icon("check", 16)} В избранном` : `${icon("heart", 16)} В избранное`}</button>
        </div>

        <div class="delivery-line">
          <span>${icon("store", 15)} Самовывоз 0 ₽</span>
          <span>${icon("truck", 15)} По городу 300 ₽</span>
          <span>${icon("pickup", 15)} По району 500 ₽</span>
        </div>
      </div>
    </div>

    <!-- Характеристики / Описание / Документы -->
    <div class="product-tabs">
      <div class="tabs">
        <button class="tab active" data-panel="specs" onclick="switchPanel(this)">Характеристики</button>
        <button class="tab" data-panel="desc" onclick="switchPanel(this)">Описание</button>
        <button class="tab" data-panel="docs" onclick="switchPanel(this)">Документы</button>
      </div>
      <div class="tab-panel active" id="panel-specs">
        <table class="specs-table">
          <tr><td>Бренд</td><td><b>${p.brand}</b></td></tr>
          <tr><td>Артикул</td><td>${p.art}</td></tr>
          <tr><td>Наличие</td><td>${stockHtml(p)}</td></tr>
          ${Object.entries(p.specs).map(([k, v]) => `<tr><td>${esc(k)}</td><td><b>${esc(v)}</b></td></tr>`).join('')}
        </table>
      </div>
      <div class="tab-panel" id="panel-desc">
        <p style="max-width:720px">${esc(p.desc)}</p>
        <p class="muted mt-16">Магазин «ХозМастер» — ${STORE.address}. ${STORE.hours}. Поможем подобрать аналог, если нужного нет в наличии: ${STORE.phone1}.</p>
      </div>
      <div class="tab-panel" id="panel-docs">
        <p><a class="btn btn-secondary btn-small" href="#" onclick="toast('В прототипе документы недоступны');return false">${icon("doc", 15)} Паспорт изделия (PDF)</a></p>
        <p class="mt-16"><a class="btn btn-secondary btn-small" href="#" onclick="toast('В прототипе документы недоступны');return false">${icon("doc", 15)} Гарантийный талон (PDF)</a></p>
      </div>
    </div>

    <!-- Часто покупают -->
    <div class="fbt-block">
      <h3>С этим товаром часто покупают</h3>
      <div class="fbt-items" id="fbt-items"></div>
      <div class="row gap-16" style="flex-wrap:wrap">
        <b id="fbt-sum"></b>
        <button class="btn btn-secondary btn-small" id="fbt-add">Добавить выбранные</button>
      </div>
    </div>

    <!-- Собери комплект -->
    <div id="kit-banner-root"></div>

    <!-- Входит в комплекты (глава 5) -->
    ${kits.length ? `
    <div class="kits-links">
      <h3 class="mb-16">${icon("puzzle", 20)} Этот товар входит в комплекты</h3>
      ${kits.slice(0, 4).map(k => `
        <a class="kit-link" href="task.html?task=${k.task.slug}&variant=${k.level}">
          <span class="ic">${icon(k.task.icon, 16)}</span>
          <span>${esc(k.task.name)} — <b>${Econom.levelName(k.level)}</b></span>
          <span class="muted small nowrap">от ${fmt(k.variant.P)} · выгода ${fmt(k.variant.S)}</span>
          <span class="arr">${icon("arrowRight", 16)}</span>
        </a>`).join('')}
      <a href="econom.html" class="btn btn-secondary mt-8">Собрать свой комплект</a>
    </div>` : `
    <div class="kits-links">
      <h3 class="mb-16">${icon("puzzle", 20)} Экономник покупок</h3>
      <p class="muted mb-16">Этот товар пока не входит в готовые комплекты — но вы можете собрать свой.</p>
      <a href="econom.html" class="btn btn-secondary">Собрать свой комплект</a>
    </div>`}

    <!-- Отзывы -->
    <div class="reviews-block" id="reviews" style="max-width:none">
      <h2 class="mb-16">Отзывы о товаре</h2>
      <div class="rating-summary">
        <div>
          <div class="big">${p.rating.toFixed(1)}</div>
          ${stars(p.rating, 18)}
          <div class="small muted mt-8">${p.rating.toFixed(1)} из 5 (${p.reviews} ${plural(p.reviews, 'отзыв', 'отзыва', 'отзывов')})</div>
        </div>
        <div class="rating-histogram" id="histogram"></div>
        <div style="flex:1"></div>
        <button class="btn btn-primary" onclick="openReviewModal('${esc(p.name)}')">Оставить отзыв</button>
      </div>
      <div id="reviews-list"></div>
    </div>

    <!-- Похожие товары -->
    <div class="section" style="padding-left:0;padding-right:0">
      <h2 class="mb-16">Похожие товары</h2>
      <div class="grid-products" id="similar-products"></div>
    </div>

    <!-- Д-5: Вы смотрели -->
    <div class="section" data-viewed="grid" data-limit="4" data-exclude="${p.id}" style="padding-left:0;padding-right:0;display:none"></div>`;

  /* ---------- Состояние ---------- */
  let qty = 1;
  window.pQty = d => {
    qty = Math.max(1, qty + d);
    document.getElementById('p-qty').textContent = qty;
  };

  const pAdd = document.getElementById('p-add');
  if (pAdd) pAdd.onclick = function () {
    const btn = this;
    Cart.add(p.id, qty);
    btn.innerHTML = '<span class="spinner"></span> Добавляем…';
    btn.disabled = true;
    setTimeout(() => {
      btn.innerHTML = `${icon("check", 15)} Добавлено`;
      btn.classList.add('btn-success');
      toast(`${esc(p.name)} × ${qty} — в корзине`, 'success');
      setTimeout(() => { btn.innerHTML = `${icon("cart", 16)} В корзину`; btn.classList.remove('btn-success'); btn.disabled = false; }, 1800);
    }, 600);
  };

  /* Д-3: быстрый заказ (модалка из extras.js: телефон + имя, загрузка → успех) */
  window.openOneClick = () => openOneClickModal(p, qty);

  window.switchThumb = (el, i) => {
    document.querySelectorAll('.thumb').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
    const img = document.querySelector('.gallery .main .ph img');
    if (img) img.style.cssText = VIEWS[i].css;
  };

  window.openLightbox = () => openModal(`
    <div style="text-align:center">
      <div style="max-width:420px;margin:0 auto">${photo(p, "", "", { eager: true })}</div>
      <p class="mt-16"><b>${esc(p.name)}</b></p>
    </div>`);

  window.switchPanel = btn => {
    document.querySelectorAll('.product-tabs .tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.tab-panel').forEach(pn => pn.classList.remove('active'));
    document.getElementById('panel-' + btn.dataset.panel).classList.add('active');
  };

  /* ---------- Часто покупают ---------- */
  const fbt = PRODUCTS.filter(x => x.id !== p.id && (x.cat === p.cat || kits.some(k => k.variant.items.some(i => i.product.id === x.id)))).slice(0, 4);
  const fallback = PRODUCTS.filter(x => x.id !== p.id).slice(0, 4);
  const fbtList = fbt.length >= 2 ? fbt : fallback;
  document.getElementById('fbt-items').innerHTML = fbtList.map(x => `
    <label class="fbt-item">
      <div class="row gap-8">
        <input type="checkbox" class="fbt-cb" value="${x.id}" checked style="width:18px;height:18px;accent-color:var(--primary)">
        <span class="small"><b>${fmt(x.price)}</b></span>
      </div>
      ${photo(x, 'sm')}
      <span class="n">${esc(x.name)}</span>
    </label>`).join('');
  const fbtSum = () => {
    const sel = [...document.querySelectorAll('.fbt-cb:checked')].map(cb => Econom.productById(cb.value));
    const sum = sel.reduce((s, x) => s + x.price, 0) + p.price;
    document.getElementById('fbt-sum').textContent = `Итого за ${sel.length + 1} товара: ${fmt(sum)}`;
  };
  document.querySelectorAll('.fbt-cb').forEach(cb => cb.onchange = fbtSum);
  fbtSum();
  document.getElementById('fbt-add').onclick = () => {
    Cart.add(p.id, qty);
    document.querySelectorAll('.fbt-cb:checked').forEach(cb => Cart.add(cb.value, 1));
    toast('Выбранные товары в корзине', 'success');
  };

  /* ---------- Баннер «Собери комплект» ---------- */
  if (kits.length) {
    const k = kits[0];
    document.getElementById('kit-banner-root').innerHTML = `
      <div class="kit-banner">
        <div>
          <h3>${icon("calculator", 20)} Собери комплект — сэкономь ещё ${fmt(Math.round(k.variant.P * 0.05))}</h3>
          <p style="opacity:.85;font-size:13px;margin-top:4px">«${esc(k.task.name)} — ${Econom.levelName(k.level)}»: ${k.variant.count} поз. · итого ${fmt(k.variant.total)}</p>
          <div class="kit-saving mt-8">Выгода комплекта: ${fmt(k.variant.S)}</div>
        </div>
        <div class="kit-items">
          ${k.variant.items.slice(0, 4).map(it => photo(it.product, 'sm')).join('')}
        </div>
        <a class="btn btn-primary" href="task.html?task=${k.task.slug}&variant=${k.level}">Смотреть комплект</a>
      </div>`;
  }

  /* ---------- Гистограмма и отзывы ---------- */
  const hist = Econom.ratingHistogram(p);
  const total = hist.reduce((a, b) => a + b, 0) || 1;
  document.getElementById('histogram').innerHTML = hist.map((c, i) => `
    <div class="h-row">
      <span class="h-star">${5 - i} ${icon("star", 13)}</span>
      <span class="h-track"><span class="h-fill" style="width:${Math.round(c / total * 100)}%"></span></span>
      <span>${c}</span>
    </div>`).join('');

  const revs = Econom.productReviews(p);
  document.getElementById('reviews-list').innerHTML = revs.map(r => `
    <div class="review-item">
      <div class="head">
        <span class="avatar">${esc(r.name.charAt(0))}</span>
        <div>
          <div class="who">${esc(r.name)} <span class="meta">· ${esc(r.city)}</span></div>
          <div class="meta">${r.date}</div>
        </div>
        <div style="margin-left:auto">${stars(r.rating)}</div>
      </div>
      <div class="text">${esc(r.text)}</div>
    </div>`).join('') +
    (p.reviews > revs.length ? `<p class="mt-16"><button class="btn btn-secondary btn-small" onclick="toast('Показаны последние отзывы')">Показать ещё ${p.reviews - revs.length}</button></p>` : '');

  /* ---------- Похожие ---------- */
  const similar = PRODUCTS.filter(x => x.id !== p.id && x.cat === p.cat).slice(0, 4);
  document.getElementById('similar-products').innerHTML =
    (similar.length ? similar : PRODUCTS.filter(x => x.id !== p.id).slice(0, 4)).map(productCardHtml).join('');

  /* ---------- Д-5: «Вы смотрели» ---------- */
  if (typeof Viewed !== 'undefined') Viewed.renderAll();
});
