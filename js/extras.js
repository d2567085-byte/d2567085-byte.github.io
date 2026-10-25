/* ============================================================
   ХозМастер — extras.js : «КНИГА ДОПОЛНЕНИЙ» (главы Д-1…Д-10)
   Сравнение, избранное, история просмотров (localStorage),
   быстрый заказ, уведомление о поступлении, чат с менеджером,
   PWA-баннер, бонусы за отзывы.
   Подключается после ui.js, до page-*.js.
   ============================================================ */

/* ---------- Хранилище списка id товаров (общая фабрика) ---------- */
function makeIdStore(key, badgeSel, limit) {
  return {
    KEY: key,
    BADGE: badgeSel,
    LIMIT: limit || 0,
    state: [],

    init() {
      try {
        const raw = localStorage.getItem(this.KEY);
        if (raw) this.state = JSON.parse(raw) || [];
      } catch (e) { this.state = []; }
      this.updateBadge();
    },

    save() {
      localStorage.setItem(this.KEY, JSON.stringify(this.state));
      this.updateBadge();
    },

    has(id) { return this.state.includes(id); },

    /* 'ok' | 'already' | 'full' */
    add(id) {
      if (this.has(id)) return 'already';
      if (this.LIMIT && this.state.length >= this.LIMIT) return 'full';
      this.state.push(id);
      this.save();
      return 'ok';
    },

    remove(id) {
      const i = this.state.indexOf(id);
      if (i > -1) { this.state.splice(i, 1); this.save(); return true; }
      return false;
    },

    clear() { this.state = []; this.save(); },

    items() {
      return this.state.map(id => Econom.productById(id)).filter(Boolean);
    },

    count() { return this.state.length; },

    updateBadge() {
      if (!this.BADGE) return;
      document.querySelectorAll(this.BADGE).forEach(el => {
        const c = this.count();
        el.textContent = c;
        el.style.display = c > 0 ? 'flex' : 'none';
      });
    },
  };
}

/* Д-1: Сравнение (до 4 товаров) */
const Compare = makeIdStore('hm_compare', '.cart-count[data-compare-badge]', 4);

/* Д-2: Избранное */
const Favorites = makeIdStore('hm_favorites', '.cart-count[data-fav-badge]', 0);

/* Д-5: История просмотров (последние 12, свежие сверху) */
const History = {
  KEY: 'hm_history',
  state: [],

  init() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (raw) this.state = JSON.parse(raw) || [];
    } catch (e) { this.state = []; }
  },

  add(id) {
    this.state = [id, ...this.state.filter(x => x !== id)].slice(0, 12);
    localStorage.setItem(this.KEY, JSON.stringify(this.state));
  },

  items() {
    return this.state.map(id => Econom.productById(id)).filter(Boolean);
  },
};

/* Синхронизация состояния кнопок избранного/сравнения на странице */
function syncFavButtons(id, on) {
  document.querySelectorAll(`.js-fav[data-id="${CSS.escape(id)}"]`).forEach(b => {
    b.classList.toggle('active', on);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
    if (!b.classList.contains('tool-btn')) {
      b.innerHTML = on ? `${icon('check', 16)} В избранном` : `${icon('heart', 16)} В избранное`;
    }
  });
}
function syncCmpButtons(id, on) {
  document.querySelectorAll(`.js-cmp[data-id="${CSS.escape(id)}"]`).forEach(b => {
    b.classList.toggle('active', on);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
    if (!b.classList.contains('tool-btn')) {
      b.innerHTML = on ? `${icon('check', 16)} В сравнении` : `${icon('scale', 16)} Сравнить`;
    }
  });
}

/* Глобальное делегирование: сердечко, весы, «сообщить о поступлении», крестик удаления.
   Capture-фаза: перехватываем клик до onclick карточки товара (иначе был бы переход). */
document.addEventListener('click', e => {
  const rm = e.target.closest('.js-rmfav');
  if (rm) {
    e.stopPropagation(); e.preventDefault();
    Favorites.remove(rm.dataset.id);
    toast('Удалено из избранного', '', 2000);
    document.dispatchEvent(new CustomEvent('hm:fav-changed'));
    return;
  }
  const fav = e.target.closest('.js-fav');
  if (fav) {
    e.stopPropagation(); e.preventDefault();
    const id = fav.dataset.id;
    if (Favorites.has(id)) {
      Favorites.remove(id);
      syncFavButtons(id, false);
      toast('Удалено из избранного', '', 2000);
    } else {
      Favorites.add(id);
      syncFavButtons(id, true);
      toast('Товар в избранном', 'success', 2000);
    }
    document.dispatchEvent(new CustomEvent('hm:fav-changed'));
    return;
  }
  const cmp = e.target.closest('.js-cmp');
  if (cmp) {
    e.stopPropagation(); e.preventDefault();
    const id = cmp.dataset.id;
    if (Compare.has(id)) {
      Compare.remove(id);
      syncCmpButtons(id, false);
      toast('Удалено из сравнения', '', 2000);
    } else {
      const r = Compare.add(id);
      if (r === 'full') { toast('В сравнении уже 4 товара — удалите лишнее', 'error', 3000); return; }
      syncCmpButtons(id, true);
      toast('Товар добавлен к сравнению', 'success', 2000);
    }
    document.dispatchEvent(new CustomEvent('hm:cmp-changed'));
    return;
  }
  const notify = e.target.closest('.js-notify');
  if (notify) {
    e.stopPropagation(); e.preventDefault();
    openNotifyModal(Econom.productById(notify.dataset.id));
  }
}, true);

/* ---------- Замена контента открытой модалки ---------- */
function modalInner(html) {
  const m = document.querySelector('.modal-overlay .modal');
  if (m) m.innerHTML = `<button class="close" onclick="closeModal()" aria-label="Закрыть">${icon('close', 18)}</button>${html}`;
}

/* ---------- Заявки (прототип: складываем в localStorage) ---------- */
function saveLead(type, data) {
  try {
    const leads = JSON.parse(localStorage.getItem('hm_leads') || '[]');
    leads.push({ type, date: new Date().toISOString(), ...data });
    localStorage.setItem('hm_leads', JSON.stringify(leads));
  } catch (e) { /* ignore */ }
}

/* ============================================================
   Д-3. Быстрый заказ «Купить в 1 клик»
   Состояния: обычное → загрузка → успех / ошибка (валидация)
   ============================================================ */
function openOneClickModal(p, qty = 1) {
  openModal(`
    <h3>Купить в 1 клик</h3>
    <p class="muted small mb-16">${esc(p.name)}${qty > 1 ? ` × ${qty}` : ''} — <b>${fmt(p.price * qty)}</b></p>
    <div class="field" id="oc-f-phone">
      <label>Телефон <span class="req">*</span></label>
      <input class="input" id="oc-phone" type="tel" placeholder="+7 (___) ___-__-__">
      <span class="hint">Укажите телефон</span>
    </div>
    <div class="field">
      <label>Имя <span class="muted small">(необязательно)</span></label>
      <input class="input" id="oc-name" type="text" placeholder="Как к вам обращаться">
    </div>
    <button class="btn btn-primary btn-block" id="oc-submit" onclick="submitOneClickModal('${p.id}', ${qty})">Отправить</button>
    <p class="small muted mt-8">${icon('clock', 14)} Менеджер свяжется с вами в течение 15 минут (8:30–19:30).</p>`);
  setTimeout(() => { const el = document.getElementById('oc-phone'); if (el) el.focus(); }, 250);
}

function submitOneClickModal(id, qty) {
  const field = document.getElementById('oc-f-phone');
  const phone = document.getElementById('oc-phone').value.trim();
  if (phone.replace(/\D/g, '').length < 10) {
    field.classList.add('error');
    toast('Укажите корректный телефон', 'error');
    return;
  }
  field.classList.remove('error');
  const btn = document.getElementById('oc-submit');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Отправляем…';
  const name = document.getElementById('oc-name').value.trim();
  setTimeout(() => {
    saveLead('oneclick', { productId: id, qty, phone, name });
    modalInner(`
      <div class="modal-success">
        <div class="ms-ico">${icon('checkCircle', 46)}</div>
        <h3>Спасибо! Менеджер свяжется с вами</h3>
        <p class="muted small">Заявка принята. Перезвоним в течение 15 минут (8:30–19:30) и подтвердим заказ.</p>
        <button class="btn btn-primary btn-block mt-16" onclick="closeModal()">Отлично</button>
      </div>`);
    toast('Заявка отправлена! Мы позвоним в течение 15 минут', 'success', 4000);
  }, 900);
}

/* ============================================================
   Д-4. Уведомления о наличии («Сообщить о поступлении»)
   ============================================================ */
function openNotifyModal(p) {
  if (!p) return;
  openModal(`
    <h3>Сообщить о поступлении</h3>
    <p class="muted small mb-16">${esc(p.name)} — ${fmt(p.price)}</p>
    <div class="chips mb-16" id="nt-type">
      <button type="button" class="chip chip-toggle active" data-t="phone">${icon('phone', 14)} Телефон</button>
      <button type="button" class="chip chip-toggle" data-t="email">${icon('send', 14)} Email</button>
    </div>
    <div class="field" id="nt-field">
      <label id="nt-label">Телефон <span class="req">*</span></label>
      <input class="input" id="nt-value" type="tel" placeholder="+7 (___) ___-__-__">
      <span class="hint" id="nt-hint">Укажите телефон</span>
    </div>
    <button class="btn btn-primary btn-block" id="nt-submit" onclick="submitNotifyModal('${p.id}')">Сообщить</button>
    <p class="small muted mt-8">${icon('bell', 14)} Как только товар появится в наличии — сразу напишем вам.</p>`);
  document.querySelectorAll('#nt-type .chip-toggle').forEach(ch => {
    ch.onclick = () => {
      document.querySelectorAll('#nt-type .chip-toggle').forEach(x => x.classList.remove('active'));
      ch.classList.add('active');
      const t = ch.dataset.t;
      const inp = document.getElementById('nt-value');
      document.getElementById('nt-label').innerHTML = (t === 'phone' ? 'Телефон' : 'Email') + ' <span class="req">*</span>';
      inp.type = t === 'phone' ? 'tel' : 'email';
      inp.placeholder = t === 'phone' ? '+7 (___) ___-__-__' : 'you@mail.ru';
      inp.value = '';
      document.getElementById('nt-hint').textContent = t === 'phone' ? 'Укажите телефон' : 'Укажите корректный email';
      document.getElementById('nt-field').classList.remove('error');
    };
  });
  setTimeout(() => { const el = document.getElementById('nt-value'); if (el) el.focus(); }, 250);
}

function submitNotifyModal(id) {
  const active = document.querySelector('#nt-type .chip-toggle.active');
  const type = active ? active.dataset.t : 'phone';
  const value = document.getElementById('nt-value').value.trim();
  const field = document.getElementById('nt-field');
  const ok = type === 'phone'
    ? value.replace(/\D/g, '').length >= 10
    : /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value);
  if (!ok) {
    field.classList.add('error');
    toast(type === 'phone' ? 'Укажите корректный телефон' : 'Укажите корректный email', 'error');
    return;
  }
  field.classList.remove('error');
  const btn = document.getElementById('nt-submit');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Отправляем…';
  setTimeout(() => {
    try {
      const list = JSON.parse(localStorage.getItem('hm_notify') || '[]');
      list.push({ id, type, value, date: new Date().toISOString() });
      localStorage.setItem('hm_notify', JSON.stringify(list));
    } catch (e) { /* ignore */ }
    modalInner(`
      <div class="modal-success">
        <div class="ms-ico">${icon('bell', 46)}</div>
        <h3>Мы сообщим, когда товар появится</h3>
        <p class="muted small">Подписка оформлена: напишем на ${type === 'phone' ? 'телефон' : 'email'} сразу после поступления.</p>
        <button class="btn btn-primary btn-block mt-16" onclick="closeModal()">Хорошо</button>
      </div>`);
    toast('Мы сообщим, когда товар появится', 'success', 4000);
  }, 900);
}

/* ============================================================
   Д-8. Чат с менеджером (живой человек рядом с «Помощником»)
   ============================================================ */
function openManagerForm(prefill) {
  openModal(`
    <h3>Связаться с менеджером</h3>
    <p class="muted small mb-16">«Помощник» — это ИИ. Если нужен живой человек — оставьте заявку, менеджер перезвонит.</p>
    <div class="field" id="mg-f-name">
      <label>Имя <span class="req">*</span></label>
      <input class="input" id="mg-name" type="text" placeholder="Как вас зовут">
      <span class="hint">Укажите имя</span>
    </div>
    <div class="field" id="mg-f-phone">
      <label>Телефон <span class="req">*</span></label>
      <input class="input" id="mg-phone" type="tel" placeholder="+7 (___) ___-__-__">
      <span class="hint">Укажите телефон</span>
    </div>
    <div class="field">
      <label>Вопрос</label>
      <textarea class="textarea" id="mg-q" placeholder="Опишите ваш вопрос...">${esc(prefill || '')}</textarea>
    </div>
    <button class="btn btn-primary btn-block" id="mg-submit" onclick="submitManagerForm()">Отправить</button>`);
  setTimeout(() => { const el = document.getElementById('mg-name'); if (el) el.focus(); }, 250);
}

function submitManagerForm() {
  let ok = true;
  const nameF = document.getElementById('mg-f-name');
  const phoneF = document.getElementById('mg-f-phone');
  const name = document.getElementById('mg-name').value.trim();
  const phone = document.getElementById('mg-phone').value.trim();
  if (name.length < 2) { nameF.classList.add('error'); ok = false; } else nameF.classList.remove('error');
  if (phone.replace(/\D/g, '').length < 10) { phoneF.classList.add('error'); ok = false; } else phoneF.classList.remove('error');
  if (!ok) { toast('Проверьте имя и телефон', 'error'); return; }
  const btn = document.getElementById('mg-submit');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Отправляем…';
  const q = document.getElementById('mg-q').value.trim();
  setTimeout(() => {
    saveLead('manager', { name, phone, question: q });
    modalInner(`
      <div class="modal-success">
        <div class="ms-ico">${icon('checkCircle', 46)}</div>
        <h3>Заявка отправлена</h3>
        <p class="muted small">Менеджер свяжется с вами в течение 15 минут (8:30–19:30).</p>
        <button class="btn btn-primary btn-block mt-16" onclick="closeModal()">Отлично</button>
      </div>`);
    toast('Менеджер свяжется с вами в течение 15 минут', 'success', 4000);
  }, 900);
}

/* ============================================================
   Д-5. Блоки «Вы смотрели»
   Контейнеры: <div data-viewed="scroll|grid" data-limit="N"
               data-exclude="productId" data-title="...">
   Пусто — блок скрывается. Страницы вызывают Viewed.renderAll()
   после своей отрисовки.
   ============================================================ */
const Viewed = {
  renderAll() {
    document.querySelectorAll('[data-viewed]').forEach(box => {
      const mode = box.dataset.viewed; // scroll | grid
      const limit = +(box.dataset.limit || 6);
      const exclude = box.dataset.exclude || '';
      const title = box.dataset.title || 'Вы смотрели';
      const list = History.items().filter(p => p.id !== exclude).slice(0, limit);
      if (!list.length) { box.style.display = 'none'; box.innerHTML = ''; return; }
      box.style.display = '';
      box.innerHTML = `
        ${mode === 'scroll'
          ? `<h2 class="section-title">${icon('eye', 22)} ${title}</h2>
             <div class="viewed-scroll">${list.map(productCardHtml).join('')}</div>`
          : `<h3 class="mb-16">${icon('eye', 18)} ${title}</h3>
             <div class="viewed-grid">${list.map(productCardHtml).join('')}</div>`}`;
    });
  },
};

/* ============================================================
   Д-10. Бонусы за отзывы: расширяем форму отзыва из ui.js
   (фото — необязательно; за отзыв с фото — +50 баллов)
   ============================================================ */
window.openReviewModal = function (title) {
  openModal(`
    <h3>Оставить отзыв</h3>
    <p class="muted small mb-16">${esc(title)}</p>
    <div class="review-bonus-note">${icon('sparkle', 16)} <span>За отзыв с фото — <b>+50 баллов</b> на бонусный счёт</span></div>
    <div class="field">
      <label>Ваша оценка</label>
      <div class="chips" id="review-stars">
        ${[5, 4, 3, 2, 1].map(n => `<button type="button" class="chip chip-stars" data-n="${n}">${('<span class="st-on">' + icon('star', 14) + '</span>').repeat(n)}${('<span class="st-off">' + icon('star', 14) + '</span>').repeat(5 - n)} ${n}</button>`).join('')}
      </div>
    </div>
    <div class="field"><label>Имя <span class="req">*</span></label><input class="input" id="rv-name" placeholder="Как вас зовут"></div>
    <div class="field"><label>Город</label><input class="input" id="rv-city" placeholder="Ишимбай" value="Ишимбай"></div>
    <div class="field"><label>Отзыв <span class="req">*</span></label><textarea class="textarea" id="rv-text" placeholder="Что понравилось, что нет..."></textarea></div>
    <div class="field">
      <label>Фото <span class="muted small">(необязательно — +50 баллов)</span></label>
      <label class="photo-pick">
        <input type="file" id="rv-photo" accept="image/*" hidden>
        <span class="pp-btn">${icon('camera', 16)} Прикрепить фото</span>
        <span class="pp-name" id="rv-photo-name">Файл не выбран</span>
      </label>
    </div>
    <button class="btn btn-primary btn-block" id="rv-submit" onclick="submitReview()">Отправить</button>
  `);
  const fileInput = document.getElementById('rv-photo');
  if (fileInput) {
    fileInput.onchange = () => {
      document.getElementById('rv-photo-name').textContent =
        fileInput.files && fileInput.files[0] ? fileInput.files[0].name : 'Файл не выбран';
    };
  }
};

window.submitReview = function () {
  const name = document.getElementById('rv-name').value.trim();
  const text = document.getElementById('rv-text').value.trim();
  if (!name || !text) { toast('Заполните имя и текст отзыва', 'error'); return; }
  const btn = document.getElementById('rv-submit');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Отправляем…';
  const photoEl = document.getElementById('rv-photo');
  const withPhoto = !!(photoEl && photoEl.files && photoEl.files.length);
  setTimeout(() => {
    saveLead('review', { name, text, withPhoto, city: document.getElementById('rv-city').value.trim() });
    closeModal();
    if (withPhoto) toast('Спасибо! +50 баллов начислены', 'success', 4000);
    else toast('Спасибо! Отзыв появится после модерации', 'success', 4000);
  }, 800);
};

/* ============================================================
   Д-9. PWA: иконки, манифест, баннер «Установить приложение»
   (mobile, после 2-го визита; «Установить» / «Позже»)
   ============================================================ */
const PWA = {
  deferredPrompt: null,

  init() {
    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault();
      PWA.deferredPrompt = e;
    });
    window.addEventListener('appinstalled', () => {
      PWA.hideBanner();
      toast('Приложение ХозМастер установлено!', 'success', 4000);
    });

    /* Считаем визиты (1 страница = 1 визит) */
    if (!sessionStorage.getItem('hm_visit_counted')) {
      sessionStorage.setItem('hm_visit_counted', '1');
      const visits = (+localStorage.getItem('hm_visits') || 0) + 1;
      localStorage.setItem('hm_visits', String(visits));
    }

    const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    const mobile = window.matchMedia('(max-width: 767px)').matches;
    const visits = +localStorage.getItem('hm_visits') || 0;
    if (mobile && !standalone && visits >= 2 && localStorage.getItem('hm_pwa_dismissed') !== '1') {
      setTimeout(PWA.showBanner, 1200);
    }
  },

  showBanner() {
    if (document.querySelector('.pwa-banner')) return;
    const el = document.createElement('div');
    el.className = 'pwa-banner';
    el.innerHTML = `
      <span class="pwa-ico"><img src="img/logo.svg" alt="ХозМастер" width="44" height="44"></span>
      <div class="pwa-text">
        <div class="t">Установите ХозМастер на телефон</div>
        <div class="d">Покупайте в 1 клик — как в приложении, без APK</div>
      </div>
      <div class="btns">
        <button class="btn btn-primary btn-small" onclick="PWA.install()">Установить</button>
        <button class="btn btn-ghost btn-small" onclick="PWA.later()">Позже</button>
      </div>`;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
  },

  hideBanner() {
    const el = document.querySelector('.pwa-banner');
    if (el) el.remove();
  },

  async install() {
    if (PWA.deferredPrompt) {
      PWA.deferredPrompt.prompt();
      try { await PWA.deferredPrompt.userChoice; } catch (e) { /* ignore */ }
      PWA.deferredPrompt = null;
    } else {
      openModal(`
        <h3>Установка приложения</h3>
        <p class="muted small mb-16">ХозМастер устанавливается прямо из браузера — без магазина приложений и APK.</p>
        <ol class="pwa-steps">
          <li>Откройте меню браузера <b>«⋮»</b> (или «Поделиться» в Safari)</li>
          <li>Выберите <b>«Установить приложение»</b> / <b>«На экран „Домой"»</b></li>
          <li>Подтвердите установку — иконка ХозМастер появится на рабочем столе</li>
        </ol>
        <button class="btn btn-primary btn-block mt-16" onclick="closeModal()">Понятно</button>`);
    }
  },

  later() {
    PWA.hideBanner();
    localStorage.setItem('hm_pwa_dismissed', '1');
  },
};

/* ---------- Инициализация ---------- */
Compare.init();
Favorites.init();
History.init();

document.addEventListener('DOMContentLoaded', () => {
  PWA.init();
  Viewed.renderAll();
});
window.addEventListener('load', () => Viewed.renderAll());
