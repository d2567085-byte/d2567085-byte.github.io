/* ============================================================
   ХозМастер — ui.js : хелперы, шапка/футер, чат «Помощник»,
   тосты, модалки, кнопки «В корзину»
   Иконки — SVG-набор из icons.js (эмодзи в интерфейсе не используются)
   ============================================================ */

/* ---------- Хелперы ---------- */
function fmt(n) {
  return new Intl.NumberFormat('ru-RU').format(Math.round(n)) + ' ₽';
}
function plural(n, one, few, many) {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}
function qs(name) {
  return new URLSearchParams(location.search).get(name);
}
function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

/* Фото-плитка товара: настоящая фотография.
   Фолбэк (если фото не загрузится) — фирменная SVG-иконка категории.
   opts.eager = true — для главного фото карточки товара (LCP, без lazy). */
function photo(p, cls = '', imgStyle = '', opts = {}) {
  const light = `hsl(${p.hue || 210}, 45%, 92%)`;
  const dark = `hsl(${p.hue || 210}, 40%, 82%)`;
  const cat = (typeof CATEGORIES !== 'undefined' && CATEGORIES.find(c => c.id === p.cat)) || null;
  const fallback = `<span class="ph-fallback">${icon(cat ? cat.icon : 'box')}</span>`;
  const img = p.id
    ? `<img src="img/products/${p.id}.jpg" alt="${esc(p.name || '')}" loading="${opts.eager ? 'eager' : 'lazy'}"${opts.eager ? ' fetchpriority="high"' : ''} onerror="this.remove()"${imgStyle ? ` style="${imgStyle}"` : ''}>`
    : '';
  return `<div class="ph ${cls}" style="background:linear-gradient(135deg,${light},${dark})">${fallback}${img}</div>`;
}

/* Звёзды рейтинга */
function stars(rating, size = 14) {
  let s = '';
  for (let i = 1; i <= 5; i++) {
    s += i <= Math.round(rating) ? icon('star') : `<span class="off">${icon('star')}</span>`;
  }
  return `<span class="stars" style="font-size:${size}px">${s}</span>`;
}

/* Наличие */
function stockHtml(p) {
  if (p.stock === 'in') return `<span class="stock-in">${icon('check', 13)} В наличии</span>`;
  if (p.stock === 'order') return `<span class="stock-order">${icon('clock', 13)} Под заказ (2–3 дня)</span>`;
  return `<span class="stock-out">${icon('close', 13)} Нет в наличии</span>`;
}

/* Бейджи карточки товара */
function badgesHtml(p) {
  const b = [];
  const saving = Econom.productSaving(p);
  if (saving > 0) b.push(`<span class="badge badge-benefit">${icon('sparkle', 12)} Выгода ${fmt(saving)}</span>`);
  if (p.rating >= 4.7) b.push(`<span class="badge badge-hit">${icon('flame', 12)} Хит</span>`);
  if (p.stock === 'out') b.push('<span class="badge badge-out">Нет в наличии</span>');
  return b.join('');
}

/* ---------- Карточка товара (общая) ----------
   opts.rmFav — крестик «Удалить из избранного» (страница /favorites).
   Инструменты Д-1/Д-2: весы и сердечко в правом верхнем углу (hover). */
function productCardHtml(p, opts) {
  const o = (opts && typeof opts === 'object') ? opts : {};
  const benefits = badgesHtml(p);
  const inFav = typeof Favorites !== 'undefined' && Favorites.has(p.id);
  const inCmp = typeof Compare !== 'undefined' && Compare.has(p.id);
  return `
  <div class="card-product" onclick="location.href='product.html?id=${p.id}'">
    <div class="badges">${benefits}</div>
    <div class="tools">
      ${o.rmFav ? `<button class="tool-btn js-rmfav" data-id="${p.id}" aria-label="Удалить из избранного" title="Удалить из избранного">${icon('close', 15)}</button>` : ''}
      <button class="tool-btn js-fav ${inFav ? 'active' : ''}" data-id="${p.id}" aria-label="В избранное" aria-pressed="${inFav}" title="В избранное">${icon('heart', 16)}</button>
      <button class="tool-btn js-cmp ${inCmp ? 'active' : ''}" data-id="${p.id}" aria-label="Сравнить" aria-pressed="${inCmp}" title="Сравнить">${icon('scale', 16)}</button>
    </div>
    ${photo(p)}
    <div class="body">
      <div class="name">${esc(p.name)}</div>
      ${stockHtml(p)}
      <div class="price-row">
        <span class="price">${fmt(p.price)}</span>
        ${p.oldPrice ? `<span class="price-old">${fmt(p.oldPrice)}</span>` : ''}
      </div>
      <div class="actions">
        ${p.stock === 'out'
          ? `<button class="btn btn-secondary btn-small btn-block js-notify" data-id="${p.id}">${icon('bell', 15)} Сообщить о поступлении</button>`
          : `<button class="btn btn-primary btn-small btn-block add-to-cart" data-id="${p.id}">${icon('cart', 15)} В корзину</button>`}
      </div>
    </div>
  </div>`;
}

/* ---------- Карточка задачи (общая) ---------- */
function taskCardHtml(task) {
  const v = Econom.allVariants(task);
  const minItems = Math.min(...v.map(x => x.count));
  const maxItems = Math.max(...v.map(x => x.count));
  const from = Econom.fromPrice(task);
  return `
  <button class="card-task" onclick="location.href='task.html?task=${task.slug}'">
    <span class="icon">${icon(task.icon)}</span>
    <span class="name">${esc(task.name)}</span>
    <span class="count">${minItems}–${maxItems} ${plural(maxItems, 'товар', 'товара', 'товаров')} в комплекте</span>
    <span class="from">От ${fmt(from)}</span>
    <span class="btn btn-primary btn-small">Собрать</span>
  </button>`;
}

/* ---------- Тосты ---------- */
function toast(msg, type = '', duration = 3000, undoFn = null) {
  let box = document.querySelector('.toasts');
  if (!box) { box = document.createElement('div'); box.className = 'toasts'; document.body.appendChild(box); }
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${msg}</span>`;
  if (undoFn) {
    const u = document.createElement('span');
    u.className = 'undo'; u.textContent = 'Вернуть';
    u.onclick = () => { undoFn(); el.remove(); };
    el.appendChild(u);
  }
  box.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; setTimeout(() => el.remove(), 300); }, duration);
}

/* ---------- Модалки ---------- */
function openModal(html) {
  let ov = document.querySelector('.modal-overlay');
  if (!ov) {
    ov = document.createElement('div');
    ov.className = 'modal-overlay';
    ov.addEventListener('click', e => { if (e.target === ov) closeModal(); });
    document.body.appendChild(ov);
  }
  ov.innerHTML = `<div class="modal"><button class="close" onclick="closeModal()" aria-label="Закрыть">${icon('close', 18)}</button>${html}</div>`;
  requestAnimationFrame(() => ov.classList.add('open'));
}
function closeModal() {
  const ov = document.querySelector('.modal-overlay');
  if (ov) { ov.classList.remove('open'); setTimeout(() => ov.remove(), 200); }
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeModal(); } });

/* ---------- Кнопка «В корзину» (делегирование) ----------
   Capture-фаза: клик по кнопке внутри кликабельной карточки товара
   не должен вызывать переход на страницу товара. */
document.addEventListener('click', e => {
  const btn = e.target.closest('.add-to-cart');
  if (!btn || btn.disabled) return;
  e.stopPropagation();
  const id = btn.dataset.id;
  Cart.add(id, 1);
  const old = btn.innerHTML;
  btn.classList.add('btn-success');
  btn.innerHTML = `${icon('check', 15)} В корзине`;
  setTimeout(() => { btn.classList.remove('btn-success'); btn.innerHTML = old; }, 1600);
  toast('Товар добавлен в корзину', 'success', 2000);
}, true);

/* ============================================================
   ШАПКА / ФУТЕР / НАВИГАЦИЯ
   ============================================================ */
function renderHeader(activeCat = '', page = '') {
  const header = document.getElementById('site-header');
  if (!header) return;
  header.innerHTML = `
  <div class="topbar">
    <div class="container">
      <div class="left">
        <span>${icon('pin', 14)} ${STORE.address}</span>
        <span class="hide-mobile">${icon('clock', 14)} ${STORE.hours}</span>
      </div>
      <div class="phones">
        <a href="tel:${STORE.phone1.replace(/[^+\d]/g,'')}">${STORE.phone1}</a>
        <a href="tel:${STORE.phone2.replace(/[^+\d]/g,'')}" class="hide-mobile">${STORE.phone2}</a>
      </div>
    </div>
  </div>
  <div class="mainbar">
    <div class="container">
      <button class="burger" onclick="toggleDrawer(true)" aria-label="Меню">${icon('menu', 24)}</button>
      <a href="index.html" class="logo">${logoHtml({ size: 40 })}</a>
      <form class="search" onsubmit="return doSearch(event)">
        <input class="input" id="site-search" type="text" placeholder="Поиск товаров..." autocomplete="off">
        <button class="btn btn-primary btn-ico" type="submit" aria-label="Найти">${icon('search', 18)}</button>
      </form>
      <div class="right">
        <a class="phone hide-mobile" href="tel:${STORE.phone1.replace(/[^+\d]/g,'')}">${STORE.phone1}</a>
        <a class="icon-link opt" href="compare.html" title="Сравнение товаров"><span class="ic">${icon('scale', 22)}</span><span>Сравнение</span><i class="cart-count" data-compare-badge style="display:none">0</i></a>
        <a class="icon-link opt" href="favorites.html" title="Избранное"><span class="ic">${icon('heart', 22)}</span><span>Избранное</span><i class="cart-count" data-fav-badge style="display:none">0</i></a>
        <a class="icon-link" href="account.html"><span class="ic">${icon('user', 22)}</span><span>Войти</span></a>
        <a class="icon-link" href="cart.html"><span class="ic">${icon('cart', 22)}</span><span>Корзина</span><i class="cart-count" data-cart-badge>0</i></a>
      </div>
    </div>
  </div>
  <nav class="catnav">
    <div class="container">
      ${CATEGORIES.map(c => `<a href="catalog.html?cat=${c.id}" class="${activeCat === c.id ? 'active' : ''}">${c.name}</a>`).join('')}
      <a href="econom.html" class="econom-link ${page === 'econom' ? 'active' : ''}">${icon('calculator', 15)} Экономник покупок</a>
    </div>
  </nav>
  <div class="drawer-overlay" onclick="toggleDrawer(false)"></div>
  <div class="drawer" id="main-drawer">
    <button class="close" onclick="toggleDrawer(false)" aria-label="Закрыть">${icon('close', 20)}</button>
    <a href="index.html" class="logo" style="font-size:18px">${logoHtml({ size: 32 })}</a>
    <form class="search mobile-search" style="margin-top:16px" onsubmit="return doSearch(event)">
      <input class="input" type="text" placeholder="Поиск товаров...">
      <button class="btn btn-primary btn-ico" type="submit" aria-label="Найти">${icon('search', 18)}</button>
    </form>
    <h4>Каталог</h4>
    ${CATEGORIES.map(c => `<a class="item" href="catalog.html?cat=${c.id}"><span class="ic">${icon(c.icon, 18)}</span>${c.name}</a>`).join('')}
    <h4>Сервисы</h4>
    <a class="item" href="econom.html"><span class="ic">${icon('calculator', 18)}</span>Экономник покупок</a>
    <a class="item" href="favorites.html"><span class="ic">${icon('heart', 18)}</span>Избранное</a>
    <a class="item" href="compare.html"><span class="ic">${icon('scale', 18)}</span>Сравнение</a>
    <a class="item" href="account.html"><span class="ic">${icon('user', 18)}</span>Личный кабинет</a>
    <a class="item" href="account-econom.html"><span class="ic">${icon('ruble', 18)}</span>Моя экономия</a>
    <h4>Контакты</h4>
    <a class="item" href="tel:${STORE.phone1.replace(/[^+\d]/g,'')}"><span class="ic">${icon('phone', 18)}</span>${STORE.phone1}</a>
    <div class="item" style="cursor:default"><span class="ic">${icon('pin', 18)}</span>${STORE.address}</div>
    <div class="item" style="cursor:default"><span class="ic">${icon('clock', 18)}</span>${STORE.hours}</div>
  </div>`;
  Cart.updateBadge();
  if (typeof Compare !== 'undefined') Compare.updateBadge();
  if (typeof Favorites !== 'undefined') Favorites.updateBadge();
}

function toggleDrawer(open) {
  const d = document.getElementById('main-drawer');
  const ov = document.querySelector('.drawer-overlay');
  if (!d || !ov) return;
  d.classList.toggle('open', open);
  ov.classList.toggle('open', open);
  document.body.style.overflow = open ? 'hidden' : '';
}

function doSearch(e) {
  e.preventDefault();
  const form = e.target.closest('form');
  const input = form.querySelector('input');
  const q = input.value.trim();
  location.href = 'catalog.html' + (q ? `?q=${encodeURIComponent(q)}` : '');
  return false;
}

function renderFooter() {
  const f = document.getElementById('site-footer');
  if (!f) return;
  f.innerHTML = `
  <div class="container">
    <div class="cols">
      <div>
        <a href="index.html" class="logo" style="color:#fff">${logoHtml({ size: 40 })}</a>
        <p class="slogan">«${STORE.slogan}»</p>
        <div class="socials">
          <a href="#" aria-label="ВКонтакте">VK</a>
          <a href="#" aria-label="Telegram">TG</a>
          <a href="#" aria-label="Одноклассники">OK</a>
        </div>
      </div>
      <div>
        <h4>Каталог</h4>
        ${CATEGORIES.slice(0, 6).map(c => `<a href="catalog.html?cat=${c.id}">${c.name}</a>`).join('')}
      </div>
      <div>
        <h4>Покупателям</h4>
        <a href="econom.html">Экономник покупок</a>
        <a href="favorites.html">Избранное</a>
        <a href="compare.html">Сравнение товаров</a>
        <a href="cart.html">Корзина</a>
        <a href="checkout.html">Оформление заказа</a>
        <a href="account-orders.html">Мои заказы</a>
        <a href="account-loyalty.html">Баллы</a>
      </div>
      <div>
        <h4>Контакты</h4>
        <a href="tel:${STORE.phone1.replace(/[^+\d]/g,'')}">${icon('phone', 15)} ${STORE.phone1}</a>
        <a href="tel:${STORE.phone2.replace(/[^+\d]/g,'')}">${icon('phone', 15)} ${STORE.phone2}</a>
        <a>${icon('pin', 15)} ${STORE.address}</a>
        <a>${icon('clock', 15)} ${STORE.hours}</a>
        <a>${icon('truck', 15)} Самовывоз 0 ₽ · Город 300 ₽ · Район 500 ₽</a>
      </div>
    </div>
    <div class="bottom">
      <span>© 2026 ХозМастер, Ишимбай. Все права защищены.</span>
      <span>Дизайн-прототип · Экономник покупок v1.0</span>
    </div>
  </div>
  <nav class="bottom-nav">
    <div class="row">
      <a href="index.html" class="${location.pathname.endsWith('index.html') || location.pathname.endsWith('/site/') ? 'active' : ''}"><span class="ic">${icon('home', 20)}</span>Главная</a>
      <a href="catalog.html" class="${location.pathname.includes('catalog') ? 'active' : ''}"><span class="ic">${icon('grid', 20)}</span>Каталог</a>
      <a href="econom.html" class="${location.pathname.includes('econom') && !location.pathname.includes('account') ? 'active' : ''}"><span class="ic">${icon('calculator', 20)}</span>Экономник</a>
      <a href="cart.html" class="${location.pathname.includes('cart') ? 'active' : ''}"><span class="ic">${icon('cart', 20)}</span>Корзина<i class="cart-count" data-cart-badge style="top:-2px;right:8px">0</i></a>
      <a href="account.html" class="${location.pathname.includes('account') ? 'active' : ''}"><span class="ic">${icon('user', 20)}</span>Кабинет</a>
    </div>
  </nav>`;
}

/* ============================================================
   ЧАТ «ПОМОЩНИК» (глава 8)
   ============================================================ */
const Chat = {
  open: false,
  started: false,

  render() {
    if (document.querySelector('.chat-fab')) return;
    const fab = document.createElement('button');
    fab.className = 'chat-fab';
    fab.setAttribute('aria-label', 'Помощник');
    fab.innerHTML = icon('chat', 26);
    fab.onclick = () => Chat.toggle();
    document.body.appendChild(fab);

    const win = document.createElement('div');
    win.className = 'chat-window';
    win.id = 'chat-window';
    win.innerHTML = `
      <div class="chat-head">
        <span class="avatar">${icon('bot', 18)}</span>
        <div><div class="t">Помощник</div><div class="st">онлайн</div></div>
        <button class="close" onclick="Chat.toggle(false)" aria-label="Закрыть чат">${icon('close', 18)}</button>
      </div>
      <div class="chat-body" id="chat-body"></div>
      <div class="chat-chips" id="chat-chips">
        ${['Ремонт ванной', 'Утепление', 'Снегоуборка', 'Покос травы', 'Отопление'].map(t => `<button class="chip" data-task="${t}">${t}</button>`).join('')}
      </div>
      <div class="chat-manager">
        <button type="button" class="btn btn-secondary btn-small" onclick="openManagerForm()">${icon('user', 14)} Связаться с менеджером</button>
      </div>
      <form class="chat-input" onsubmit="return Chat.send(event)">
        <input class="input" id="chat-text" type="text" placeholder="Опишите, что нужно сделать..." autocomplete="off">
        <button class="send" type="submit" aria-label="Отправить">${icon('send', 18)}</button>
      </form>`;
    document.body.appendChild(win);

    document.getElementById('chat-chips').addEventListener('click', e => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      Chat.userMessage(chip.dataset.task);
      Chat.botAnswer(chip.dataset.task);
    });
  },

  toggle(force) {
    const win = document.getElementById('chat-window');
    const fab = document.querySelector('.chat-fab');
    Chat.open = force !== undefined ? force : !Chat.open;
    win.classList.toggle('open', Chat.open);
    fab.classList.toggle('hidden', Chat.open);
    if (Chat.open && !Chat.started) {
      Chat.started = true;
      Chat.botMessage(`Привет! Я помогу подобрать товары и собрать комплект ${icon('calculator', 15)}<br>Опиши задачу или выбери чип ниже ${icon('chevronDown', 15)}`);
    }
    if (Chat.open) setTimeout(() => document.getElementById('chat-text').focus(), 250);
  },

  now() {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  },

  scrollDown() {
    const body = document.getElementById('chat-body');
    body.scrollTop = body.scrollHeight;
  },

  userMessage(text) {
    document.getElementById('chat-body').insertAdjacentHTML('beforeend',
      `<div class="msg user">${esc(text)}<span class="time">${Chat.now()}</span></div>`);
    Chat.scrollDown();
  },

  botMessage(html) {
    document.getElementById('chat-body').insertAdjacentHTML('beforeend',
      `<div class="msg bot">${html}<span class="time">${Chat.now()}</span></div>`);
    Chat.scrollDown();
  },

  typing(on) {
    const body = document.getElementById('chat-body');
    let t = document.getElementById('chat-typing');
    if (on) {
      if (!t) {
        body.insertAdjacentHTML('beforeend', '<div class="msg bot typing" id="chat-typing"><i></i><i></i><i></i></div>');
        Chat.scrollDown();
      }
    } else if (t) t.remove();
  },

  /* Соответствие запроса задаче */
  matchTask(text) {
    const t = text.toLowerCase();
    const map = [
      { keys: ['крас', 'покрас', 'стен'], slug: 'pokras-sten' },
      { keys: ['ванн', 'туалет', 'сантех', 'унитаз'], slug: 'remont-vannoy' },
      { keys: ['утепл', 'тепло', 'холодн'], slug: 'uteplenie' },
      { keys: ['снег', 'сугроб', 'лед', 'лёд'], slug: 'snegouborka' },
      { keys: ['трав', 'газон', 'покос', 'коси'], slug: 'pokos-travy' },
      { keys: ['отопл', 'котёл', 'котел', 'радиат', 'обогре'], slug: 'otoplenie' },
      { keys: ['крепёж', 'крепеж', 'болт', 'саморез', 'анкер'], slug: 'krepezh-remont' },
    ];
    for (const m of map) if (m.keys.some(k => t.includes(k))) return Econom.taskBySlug(m.slug);
    return null;
  },

  send(e) {
    e.preventDefault();
    const input = document.getElementById('chat-text');
    const text = input.value.trim();
    if (!text) return false;
    input.value = '';
    Chat.userMessage(text);
    Chat.botAnswer(text);
    return false;
  },

  botAnswer(text) {
    Chat.typing(true);
    const task = Chat.matchTask(text);
    setTimeout(() => {
      Chat.typing(false);
      if (!task) {
        Chat.botMessage(`Не нашёл готовую задачу под такой запрос.<br>Посмотри все комплекты в Экономнике покупок — там 7 задач и 3 варианта бюджета на каждую.<br>
          <div class="chat-variants"><a class="chat-variant" href="econom.html" style="justify-content:center;font-weight:600">${icon('calculator', 16)} Открыть Экономник покупок</a></div>`);
        return;
      }
      const vs = Econom.allVariants(task);
      const lead = {
        'pokras-sten': `Понял! Для покраски стен ~20 м² понадобится: краска (2 слоя), грунтовка, валики, малярный скотч.`,
        'remont-vannoy': `Отлично! Для ремонта ванной нужны: смеситель, сантехника, клей, затирка и крепёж.`,
        'uteplenie': `Сделаем тепло! Для утепления нужны: утеплитель, пароизоляция и монтажная пена.`,
        'snegouborka': `Зима не застанет врасплох! Для уборки снега: лопата/снегоуборщик, реагент, ледоруб.`,
        'pokos-travy': `Газон будет как картинка! Для покоса: триммер или газонокосилка, леска, шланг.`,
        'otoplenie': `Тепло в доме — это святое! Для отопления: котёл, радиаторы, трубы, насос.`,
        'krepezh-remont': `Без крепежа никуда! Собрал базовый запас: анкеры, саморезы, дюбели.`,
      }[task.slug] || 'Собрал для тебя 3 варианта:';

      const cards = vs.map(v => {
        const it = v.items[0];
        return `
        <div class="chat-variant">
          ${photo(it.product, 'xs')}
          <div class="info">
            <div class="n">${Econom.levelName(v.level)} — ${task.name}</div>
            <div class="p"><b>${fmt(v.P)}</b> · ${v.count} поз. · <span class="saving">${icon('piggy', 13)} выгода ${fmt(v.S)}</span></div>
          </div>
          <button class="btn btn-primary btn-small" onclick="Chat.addVariant('${task.slug}','${v.level}',this)">Добавить</button>
        </div>`;
      }).join('');

      Chat.botMessage(`${lead} Вот 3 варианта:
        <div class="chat-variants">${cards}
        <button class="btn btn-primary btn-small btn-block" onclick="Chat.addAll('${task.slug}',this)">Добавить всё (Люкс)</button>
        </div>`);
    }, 900 + Math.random() * 600);
  },

  addVariant(slug, level, btn) {
    const task = Econom.taskBySlug(slug);
    const v = Cart.addVariant(task, level);
    btn.outerHTML = `<span class="stock-in" style="white-space:nowrap">${icon('check', 13)} В корзине</span>`;
    toast(`«${task.name} — ${Econom.levelName(level)}» в корзине. Экономия ${fmt(v.S)}`, 'success');
  },

  addAll(slug, btn) {
    Chat.addVariant(slug, 'lux', btn);
  },
};

/* ---------- Модальное окно отзыва ---------- */
function openReviewModal(title) {
  openModal(`
    <h3>Оставить отзыв</h3>
    <p class="muted small mb-16">${esc(title)}</p>
    <div class="field">
      <label>Ваша оценка</label>
      <div class="chips" id="review-stars">
        ${[5,4,3,2,1].map(n => `<button type="button" class="chip chip-stars" data-n="${n}">${('<span class="st-on">' + icon('star', 14) + '</span>').repeat(n)}${('<span class="st-off">' + icon('star', 14) + '</span>').repeat(5 - n)} ${n}</button>`).join('')}
      </div>
    </div>
    <div class="field"><label>Имя <span class="req">*</span></label><input class="input" id="rv-name" placeholder="Как вас зовут"></div>
    <div class="field"><label>Город</label><input class="input" id="rv-city" placeholder="Ишимбай" value="Ишимбай"></div>
    <div class="field"><label>Отзыв <span class="req">*</span></label><textarea class="textarea" id="rv-text" placeholder="Что понравилось, что нет..."></textarea></div>
    <button class="btn btn-primary btn-block" onclick="submitReview()">Отправить</button>
  `);
}
function submitReview() {
  const name = document.getElementById('rv-name').value.trim();
  const text = document.getElementById('rv-text').value.trim();
  if (!name || !text) { toast('Заполните имя и текст отзыва', 'error'); return; }
  closeModal();
  toast('Спасибо! Отзыв появится после модерации', 'success', 4000);
}

/* ---------- Инициализация ---------- */
document.addEventListener('DOMContentLoaded', () => {
  Cart.init();
  Chat.render();
});
