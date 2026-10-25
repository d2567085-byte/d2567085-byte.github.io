/* Главная страница — page-home.js */
document.addEventListener('DOMContentLoaded', () => {
  renderHeader('', 'home');
  renderFooter();
  renderHero();
  renderEconomWidget();
  renderHelper();
  renderCats();
  renderHits();
  renderPromos();
  renderWhy();
  renderBrands();
  renderAbout();
  if (typeof Viewed !== 'undefined') Viewed.renderAll(); // Д-5: «Вы смотрели»
});

/* ---------- Баннер-слайдер ---------- */
/* Полноэкранные фотобаннеры: яркие фото (Wikimedia Commons, свободные лицензии)
   в site/img/banners/ + цветной градиент-оверлей под текст слева */
const SLIDES = [
  { cls: 's1', kicker: 'Зимний сезон', h: 'Снегоуборщики Ресанта и PATRIOT', p: 'Самоходные, с электрозапуском. Выгода до 4 000 ₽', cta: 'Выбрать снегоуборщик', link: "catalog.html?cat=sneg", bg: 'img/banners/hero-winter.jpg' },
  { cls: 's2', kicker: 'Тепло в доме', h: 'Газовые котлы Лемакс и БАКСИ', p: 'Подбор под площадь дома. Гарантия до 5 лет', cta: 'Выбрать котёл', link: "catalog.html?cat=kotly", bg: 'img/banners/hero-warm.jpg' },
  { cls: 's3', kicker: 'Калькулятор бюджета', h: 'ЭКОНОМНИК ПОКУПОК', p: 'Выбери задачу — получи 3 варианта бюджета: экономный, стандартный, люкс', cta: 'Собрать комплект', link: "econom.html", bg: 'img/banners/hero-econom.jpg' },
];

function renderHero() {
  const el = document.getElementById('hero');
  el.className = 'hero';
  el.innerHTML = `
    <div class="slides" id="hero-slides">
      ${SLIDES.map((s, i) => `
        <div class="slide ${s.cls}">
          <div class="bg"><img src="${s.bg}" alt="" ${i === 0 ? '' : 'loading="lazy"'}></div>
          <div class="content">
            <div class="kicker">${s.kicker}</div>
            <h2>${s.h}</h2>
            <p>${s.p}</p>
            <a class="btn btn-primary" href="${s.link}">${s.cta}</a>
          </div>
        </div>`).join('')}
    </div>
    <button class="arrow prev" onclick="heroGo(-1)" aria-label="Назад">${icon("chevronLeft", 22)}</button>
    <button class="arrow next" onclick="heroGo(1)" aria-label="Вперёд">${icon("chevronRight", 22)}</button>
    <div class="dots">${SLIDES.map((_, i) => `<button class="dot ${i === 0 ? 'active' : ''}" onclick="heroSet(${i})" aria-label="Слайд ${i + 1}"></button>`).join('')}</div>`;

  let cur = 0;
  window.heroSet = i => {
    cur = i;
    document.getElementById('hero-slides').style.transform = `translateX(-${i * 100}%)`;
    el.querySelectorAll('.dot').forEach((d, j) => d.classList.toggle('active', j === i));
  };
  window.heroGo = d => heroSet((cur + d + SLIDES.length) % SLIDES.length);
  setInterval(() => heroGo(1), 5000);

  /* свайп */
  let x0 = null;
  el.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
  el.addEventListener('touchend', e => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 40) heroGo(dx < 0 ? 1 : -1);
    x0 = null;
  });
}

/* ---------- Виджет «Экономник покупок» (глава 2) ---------- */
function renderEconomWidget() {
  const tasks = TASKS.slice(0, 6);
  document.getElementById('econom-widget').innerHTML = `
    <div class="econom-widget">
      <div class="head">
        <h2>Экономник покупок</h2>
        <p>Выбери задачу — получи 3 варианта бюджета: экономный, стандартный, люкс. С ценами и отзывами</p>
      </div>
      <div class="grid-tasks">${tasks.map(taskCardHtml).join('')}</div>
      <a href="econom.html" class="btn btn-secondary btn-block mt-24">Смотреть все задачи</a>
    </div>`;
}

/* ---------- Блок «Помощник» ---------- */
function renderHelper() {
  const box = document.getElementById('helper-block');
  box.innerHTML = `
    <div class="helper-block">
      <h2>${icon("bot", 26)} Не знаешь, что нужно? Спроси Помощника</h2>
      <p>Опиши задачу своими словами — подберу товары и соберу 3 варианта бюджета</p>
      <form class="form" onsubmit="return helperAsk(event)">
        <input class="input" id="helper-text" type="text" placeholder="Например: хочу покрасить стены в комнате" autocomplete="off">
        <button class="btn btn-primary" type="submit">Подобрать</button>
      </form>
      <div class="chips">
        ${['Ремонт ванной', 'Утепление', 'Снегоуборка', 'Покос травы', 'Отопление'].map(t => `<button class="chip" onclick="helperChip('${t}')">${t}</button>`).join('')}
      </div>
    </div>`;
  window.helperAsk = e => {
    e.preventDefault();
    const text = document.getElementById('helper-text').value.trim();
    Chat.toggle(true);
    if (text) { Chat.userMessage(text); Chat.botAnswer(text); }
    return false;
  };
  window.helperChip = t => { Chat.toggle(true); Chat.userMessage(t); Chat.botAnswer(t); };
}

/* ---------- Популярные категории ---------- */
function renderCats() {
  document.getElementById('cats').innerHTML = CATEGORIES.map(c => `
    <a class="cat-item" href="catalog.html?cat=${c.id}">
      <div class="icon">${icon(c.icon)}</div>
      <div class="n">${c.name}</div>
    </a>`).join('');
}

/* ---------- Хиты продаж ---------- */
function renderHits() {
  const hits = PRODUCTS.filter(p => p.oldPrice && p.rating >= 4.5 && p.stock === 'in').slice(0, 4);
  document.getElementById('hits').innerHTML = `
    <div class="grid-products">${hits.map(productCardHtml).join('')}</div>`;
}

/* ---------- Акции ---------- */
function renderPromos() {
  document.getElementById('promos').innerHTML = `
    <div class="grid-promos">${PROMOS.map(pr => `
      <a class="promo-tile" href="${pr.link}">
        ${pr.photo ? `<img class="bg" src="${pr.photo}" alt="" loading="lazy">` : ''}
        <span class="ov" style="background:${pr.bg}"></span>
        <span class="art">${icon(pr.icon)}</span>
        <h3>${pr.title}</h3>
        <div class="t">${pr.sub}</div>
        <div class="link">Смотреть ${icon("arrowRight", 15)}</div>
      </a>`).join('')}</div>`;
}

/* ---------- Почему мы ---------- */
function renderWhy() {
  document.getElementById('why').innerHTML = `
    <div class="grid-why">${WHY_US.map(w => `
      <div class="why-item">
        <div class="icon">${icon(w.icon)}</div>
        <h3>${w.t}</h3>
        <p>${w.d}</p>
      </div>`).join('')}</div>`;
}

/* ---------- Бренды ---------- */
function renderBrands() {
  document.getElementById('brands').innerHTML = `
    <div class="grid-brands">${BRANDS.map(b => `<div class="brand-tile">${b}</div>`).join('')}</div>`;
}

/* ---------- О магазине ---------- */
function renderAbout() {
  document.getElementById('about').innerHTML = `
    <div class="about-grid">
      <div class="about-info">
        <div class="line"><span class="ic">${icon("pin", 18)}</span><div><b>Адрес</b><br>${STORE.address}</div></div>
        <div class="line"><span class="ic">${icon("clock", 18)}</span><div><b>Режим работы</b><br>${STORE.hours}</div></div>
        <div class="line"><span class="ic">${icon("phone", 18)}</span><div><b>Телефоны</b><br>${STORE.phone1}<br>${STORE.phone2}</div></div>
        <div class="line"><span class="ic">${icon("truck", 18)}</span><div><b>Доставка</b><br>Самовывоз 0 ₽ · По городу 300 ₽ · По району 500 ₽<br><span class="small muted">Бесплатно при заказе от ${fmt(STORE.freeDeliveryFrom)}</span></div></div>
        <div class="line"><span class="ic">${icon("card", 18)}</span><div><b>Оплата</b><br>При получении (наличные, карта) или по счёту для юрлиц</div></div>
      </div>
      <div class="map-placeholder">
        <div class="roads"></div>
        <div class="pin">${icon("pin")}</div>
        <div class="label">
          <b>${STORE.address}</b>
          <span>Карта · ежедневно 8:30–19:30</span>
        </div>
      </div>
    </div>`;
}
