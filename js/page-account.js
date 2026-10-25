/* Личный кабинет: профиль, заказы, детали, баллы, эконом — page-account.js */
document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page; // profile | orders | order | loyalty | econom
  renderHeader('', 'account');
  renderFooter();

  const MENU = [
    { id: 'profile', href: 'account.html', ic: "user", name: 'Профиль' },
    { id: 'orders', href: 'account-orders.html', ic: "box", name: 'История заказов' },
    { id: 'loyalty', href: 'account-loyalty.html', ic: "star", name: 'Баллы' },
    { id: 'econom', href: 'account-econom.html', ic: "piggy", name: 'Экономник покупок' },
  ];
  const activeMenu = page === 'order' ? 'orders' : page;

  const root = document.getElementById('account-page');
  root.innerHTML = `
    <nav class="breadcrumbs"><a href="index.html">Главная</a><span class="sep">/</span><span class="current">Личный кабинет</span></nav>
    <div class="show-mobile mb-16"><button class="btn btn-secondary btn-block" onclick="toggleAccountMenu()">${icon("menu", 16)} Меню кабинета</button></div>
    <div class="account-layout">
      <aside class="account-menu" id="account-menu">
        ${MENU.map(m => `<a href="${m.href}" class="${m.id === activeMenu ? 'active' : ''}"><span class="ic">${icon(m.ic, 18)}</span>${m.name}</a>`).join('')}
        <a href="index.html"><span class="ic">${icon("logout", 18)}</span>Выйти</a>
      </aside>
      <div id="account-content"></div>
    </div>`;

  window.toggleAccountMenu = () => {
    document.getElementById('account-menu').classList.toggle('open');
  };

  const content = document.getElementById('account-content');

  /* ---------- Статусы заказов ---------- */
  const STATUS = {
    new: { cls: 'pill-new', name: 'Новый' },
    packing: { cls: 'pill-packing', name: 'Собирается' },
    shipping: { cls: 'pill-shipping', name: 'В пути' },
    done: { cls: 'pill-done', name: 'Выдан' },
    cancel: { cls: 'pill-cancel', name: 'Отменён' },
  };
  const DELIVERY_NAME = { pickup: 'Самовывоз (0 ₽)', city: 'По городу (300 ₽)', district: 'По району (500 ₽)' };

  function orderSum(o) {
    return o.items.reduce((s, it) => s + (Econom.productById(it.id)?.price || 0) * it.qty, 0)
      + (STORE.delivery[o.delivery] || 0) - (o.discount || 0);
  }
  function orderCount(o) { return o.items.reduce((s, it) => s + it.qty, 0); }

  /* ================= ПРОФИЛЬ ================= */
  if (page === 'profile') {
    content.innerHTML = `
      <h1 class="mb-24">Профиль</h1>
      <div class="profile-card">
        <div class="profile-head">
          <div class="profile-avatar">ИП</div>
          <div>
            <h3>Иван Петров</h3>
            <div class="small muted">Клиент с марта 2026 · Уровень: Экономный покупатель ${icon("piggy", 14)}</div>
            <button class="btn btn-ghost btn-small" onclick="toast('В прототипе загрузка фото недоступна')">Изменить фото</button>
          </div>
        </div>
        <div class="form-grid">
          <div class="field" id="pf-name"><label>Имя <span class="req">*</span></label><input class="input" id="p-name" value="Иван Петров"><span class="hint">Укажите имя</span></div>
          <div class="field" id="pf-phone"><label>Телефон <span class="req">*</span></label><input class="input" id="p-phone" value="+7 (927) 123-45-67"><span class="hint">Укажите телефон</span></div>
          <div class="field" id="pf-email"><label>Email <span class="req">*</span></label><input class="input" id="p-email" value="ivan@mail.ru"><span class="hint">Укажите корректный email</span></div>
        </div>
        <div class="row gap-12">
          <button class="btn btn-primary" onclick="saveProfile()">Сохранить</button>
        </div>
        <div class="mt-24">
          <details>
            <summary style="cursor:pointer;font-weight:600">Сменить пароль</summary>
            <div class="form-grid mt-16">
              <div class="field"><label>Текущий пароль</label><input class="input" type="password" placeholder="••••••"></div>
              <div class="field"></div>
              <div class="field"><label>Новый пароль</label><input class="input" type="password" placeholder="••••••"></div>
              <div class="field"><label>Повторите новый</label><input class="input" type="password" placeholder="••••••"></div>
            </div>
            <button class="btn btn-secondary btn-small" onclick="toast('Пароль изменён (в прототипе)','success')">Сохранить пароль</button>
          </details>
        </div>
      </div>
      <div class="mt-24" data-viewed="grid" data-limit="4" style="display:none"></div>`;
    if (typeof Viewed !== 'undefined') Viewed.renderAll(); // Д-5: «Вы смотрели» в кабинете
    window.saveProfile = () => {
      const name = document.getElementById('p-name').value.trim();
      const phone = document.getElementById('p-phone').value.replace(/\D/g, '').length >= 10;
      const email = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(document.getElementById('p-email').value.trim());
      let ok = true;
      const set = (id, good) => { document.getElementById(id).classList.toggle('error', !good); document.getElementById(id).classList.toggle('ok', good); if (!good) ok = false; };
      set('pf-name', name.length >= 2); set('pf-phone', phone); set('pf-email', email);
      if (ok) toast('Изменения сохранены', 'success');
      else toast('Проверьте поля формы', 'error');
    };
  }

  /* ================= ЗАКАЗЫ ================= */
  if (page === 'orders') {
    content.innerHTML = `
      <h1 class="mb-24">История заказов</h1>
      <table class="table table-zebra desktop-table">
        <thead><tr><th>№ заказа</th><th>Дата</th><th>Статус</th><th>Товаров</th><th class="num">Сумма</th><th class="num">Экономия</th></tr></thead>
        <tbody>
          ${ORDERS.map(o => `
            <tr onclick="location.href='account-order.html?id=${o.id}'" style="cursor:pointer">
              <td><b style="color:var(--primary)">№${o.id}</b></td>
              <td>${o.date}</td>
              <td><span class="pill ${STATUS[o.status].cls}">${STATUS[o.status].name}</span></td>
              <td>${orderCount(o)}</td>
              <td class="num"><b>${fmt(orderSum(o))}</b></td>
              <td class="num tx-plus">${o.status !== 'cancel' ? '+' + fmt(o.saved) : '—'}</td>
            </tr>`).join('')}
        </tbody>
      </table>
      <div class="mobile-cards">
        ${ORDERS.map(o => `
          <a class="m-card" href="account-order.html?id=${o.id}">
            <div class="mc-head"><b>Заказ №${o.id}</b><span class="pill ${STATUS[o.status].cls}">${STATUS[o.status].name}</span></div>
            <div class="mc-row"><span class="k">${o.date} · ${orderCount(o)} тов.</span><b>${fmt(orderSum(o))}</b></div>
            ${o.status !== 'cancel' ? `<div class="mc-row"><span class="k">Экономия</span><span class="tx-plus">+${fmt(o.saved)}</span></div>` : ''}
          </a>`).join('')}
      </div>`;
  }

  /* ================= ДЕТАЛИ ЗАКАЗА ================= */
  if (page === 'order') {
    const oid = +(qs('id') || ORDERS[0].id);
    const o = ORDERS.find(x => x.id === oid) || ORDERS[0];
    /* Д-6: трекер статусов в реальном времени */
    const steps = ['Новый', 'В обработке', 'Собран', 'Доставлен'];
    const stage = o.status === 'done' ? 4 : o.status === 'shipping' ? 3 : o.status === 'packing' ? 2 : o.status === 'cancel' ? -1 : 1;
    content.innerHTML = `
      <nav class="breadcrumbs"><a href="account.html">Кабинет</a><span class="sep">/</span><a href="account-orders.html">Заказы</a><span class="sep">/</span><span class="current">№${o.id}</span></nav>
      <div class="row gap-16" style="flex-wrap:wrap">
        <h1>Заказ №${o.id} от ${o.date}</h1>
        <span class="pill ${STATUS[o.status].cls}">${STATUS[o.status].name}</span>
      </div>
      ${o.status !== 'cancel' ? `
      <div class="order-progress">
        ${steps.map((s, i) => `
          <div class="op-step ${i < stage ? 'done' : ''} ${i === stage - 1 ? 'current' : ''}">
            <span class="op-dot">${i < stage ? icon("check", 12) : i + 1}</span>
            <span class="op-label">${s}</span>
          </div>`).join('')}
      </div>
      <div class="op-meta">
        ${o.statusDate ? `<div class="op-date">${icon("clock", 15)} Статус обновлён: <b>${esc(o.statusDate)}</b></div>` : ''}
        ${o.managerComment ? `<div class="op-comment">${icon("chat", 16)} <div><b>Комментарий менеджера:</b> ${esc(o.managerComment)}</div></div>` : ''}
      </div>` : `
      <div class="order-cancel-note">
        ${icon("close", 18)}
        <div><b>Заказ отменён</b>${o.statusDate ? ` <span class="muted small">(${esc(o.statusDate)})</span>` : ''}
        ${o.managerComment ? `<div class="small mt-8" style="font-weight:500">${esc(o.managerComment)}</div>` : ''}</div>
      </div>`}
      <div class="profile-card">
        <h3 class="mb-16">Состав заказа</h3>
        <table class="table desktop-table">
          <thead><tr><th>Товар</th><th>Кол-во</th><th>Цена</th><th class="num">Сумма</th></tr></thead>
          <tbody>
            ${o.items.map(it => {
              const p = Econom.productById(it.id); if (!p) return '';
              return `<tr>
                <td><div class="cart-item-cell">${photo(p, 'sm')}<a href="product.html?id=${p.id}">${esc(p.name)}</a></div></td>
                <td>${it.qty}</td><td>${fmt(p.price)}</td><td class="num"><b>${fmt(p.price * it.qty)}</b></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
        <div class="mobile-cards">
          ${o.items.map(it => {
            const p = Econom.productById(it.id); if (!p) return '';
            return `<div class="m-card"><div class="mc-row"><span class="k">${esc(p.name)}</span><b>${fmt(p.price)} × ${it.qty}</b></div></div>`;
          }).join('')}
        </div>
        <div class="variant-totals mt-16">
          <div class="line"><span>Товары</span><span>${fmt(o.items.reduce((s, it) => s + (Econom.productById(it.id)?.price || 0) * it.qty, 0))}</span></div>
          <div class="line"><span>Доставка (${DELIVERY_NAME[o.delivery]})</span><span>${STORE.delivery[o.delivery] === 0 ? 'Бесплатно' : fmt(STORE.delivery[o.delivery])}</span></div>
          <div class="line"><span>Оплата</span><span>${o.payment}</span></div>
          <div class="line total"><span>Итого</span><span>${fmt(orderSum(o))}</span></div>
          ${o.status !== 'cancel' ? `<div class="line"><span class="saving">${icon("piggy", 14)} Ты сэкономил</span><span class="saving">${fmt(o.saved)}</span></div>` : ''}
        </div>
        <div class="row gap-12 mt-24" style="flex-wrap:wrap">
          <button class="btn btn-primary" onclick="repeatOrder(${o.id})">Повторить заказ</button>
          <button class="btn btn-secondary" onclick="toast('Чек отправлен на email (в прототипе)','success')">Скачать чек</button>
          <button class="btn-ghost" onclick="Chat.toggle(true)">Написать в поддержку</button>
        </div>
      </div>
      ${o.status === 'done' ? '<div class="order-feedback" id="order-feedback"></div>' : ''}`;
    window.repeatOrder = oid2 => {
      const oo = ORDERS.find(x => x.id === oid2);
      oo.items.forEach(it => Cart.add(it.id, it.qty));
      toast('Товары заказа добавлены в корзину', 'success');
      setTimeout(() => location.href = 'cart.html', 900);
    };

    /* ---------- Д-7: обратная связь по доставленному заказу ---------- */
    if (o.status === 'done') {
      const FB_KEY = 'hm_order_feedback';
      const loadFb = () => { try { return JSON.parse(localStorage.getItem(FB_KEY) || '{}'); } catch (e) { return {}; } };
      let fbRating = 0;

      const renderFeedback = () => {
        const box = document.getElementById('order-feedback');
        if (!box) return;
        const fb = loadFb()[o.id];
        if (fb) {
          box.classList.add('done');
          box.innerHTML = `
            <div class="fb-success">
              <span class="fb-ico">${icon("checkCircle", 30)}</span>
              <div>
                <h3 style="margin-bottom:4px">Спасибо за отзыв!</h3>
                <div class="small muted">Ваша оценка: ${stars(fb.rating, 14)} · <b class="tx-plus">+50 баллов</b> начислены на бонусный счёт</div>
                ${fb.text ? `<div class="small mt-8" style="font-style:italic">«${esc(fb.text)}»</div>` : ''}
              </div>
            </div>`;
          return;
        }
        box.classList.remove('done');
        box.innerHTML = `
          <h3 class="mb-8">${icon("star", 18)} Оцените заказ</h3>
          <p class="small muted mb-16">Доставка, товар, работа менеджера — ваше мнение помогает нам становиться лучше. За оценку — <b class="tx-plus">+50 баллов</b>.</p>
          <div class="fb-stars" id="fb-stars">
            ${[1, 2, 3, 4, 5].map(n => `<button type="button" class="fb-star ${n <= fbRating ? 'on' : ''}" data-n="${n}" aria-label="Оценка ${n}">${icon("star", 28)}</button>`).join('')}
          </div>
          <div class="field"><textarea class="textarea" id="fb-text" placeholder="Расскажите, как всё прошло (необязательно)..."></textarea></div>
          <button class="btn btn-primary" id="fb-submit" onclick="submitOrderFeedback(${o.id})">Отправить</button>`;
        box.querySelectorAll('.fb-star').forEach(s => {
          s.onclick = () => {
            fbRating = +s.dataset.n;
            box.querySelectorAll('.fb-star').forEach(x => x.classList.toggle('on', +x.dataset.n <= fbRating));
          };
        });
      };

      window.submitOrderFeedback = oid3 => {
        if (!fbRating) { toast('Поставьте оценку от 1 до 5 звёзд', 'error'); return; }
        const btn = document.getElementById('fb-submit');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner"></span> Отправляем…';
        const text = document.getElementById('fb-text').value.trim();
        setTimeout(() => {
          const all = loadFb();
          all[oid3] = { rating: fbRating, text, date: new Date().toISOString() };
          localStorage.setItem(FB_KEY, JSON.stringify(all));
          renderFeedback();
          toast('Спасибо за отзыв! +50 баллов начислены', 'success', 4000);
        }, 800);
      };

      renderFeedback();
    }
  }

  /* ================= БАЛЛЫ ================= */
  if (page === 'loyalty') {
    content.innerHTML = `
      <h1 class="mb-24">Баллы</h1>
      <div class="loyalty-balance">
        <div>
          <div class="sum">${LOYALTY.balance} баллов</div>
          <div class="hint">1 балл = 1 ₽ · можно списать до 30% суммы заказа</div>
        </div>
        <a class="btn btn-primary" href="catalog.html?filter=discount">Потратить в каталоге</a>
      </div>
      <div class="loyalty-rules">
        <div class="loyalty-rule"><div class="ic">${icon("cart")}</div><div class="t">5% баллами за каждый заказ</div></div>
        <div class="loyalty-rule"><div class="ic">${icon("edit")}</div><div class="t">+100 баллов за отзыв</div></div>
        <div class="loyalty-rule"><div class="ic">${icon("users")}</div><div class="t">+500 баллов за друга</div></div>
      </div>
      <div class="review-bonus-block">
        <div>
          <h3>${icon("camera", 18)} Бонусы за отзывы</h3>
          <p class="small muted mt-8">Оставьте отзыв с фото — получите <b class="tx-plus">+50 баллов</b> на бонусный счёт</p>
        </div>
        <button class="btn btn-primary" onclick="openReviewModal('Отзыв о магазине ХозМастер')">${icon("edit", 15)} Оставить отзыв</button>
      </div>
      <div class="profile-card">
        <h3 class="mb-16">Транзакции</h3>
        <table class="table table-zebra desktop-table">
          <thead><tr><th>Дата</th><th>Операция</th><th class="num">Начисление</th><th class="num">Баланс</th></tr></thead>
          <tbody>
            ${LOYALTY.transactions.map(tx => `
              <tr><td>${tx.date}</td><td>${esc(tx.op)}</td>
              <td class="num ${tx.delta > 0 ? 'tx-plus' : 'tx-minus'}">${tx.delta > 0 ? '+' : ''}${tx.delta}</td>
              <td class="num"><b>${tx.balance}</b></td></tr>`).join('')}
          </tbody>
        </table>
        <div class="mobile-cards">
          ${LOYALTY.transactions.map(tx => `
            <div class="m-card">
              <div class="mc-head"><span class="small muted">${tx.date}</span><span class="${tx.delta > 0 ? 'tx-plus' : 'tx-minus'}">${tx.delta > 0 ? '+' : ''}${tx.delta} б.</span></div>
              <div class="mc-row"><span class="k">${esc(tx.op)}</span><span class="v">баланс ${tx.balance}</span></div>
            </div>`).join('')}
        </div>
      </div>`;
  }

  /* ================= ЭКОНОМНИК (глава 7) ================= */
  if (page === 'econom') {
    let period = 'month';
    const render = () => {
      const data = ECONOM_HISTORY[period];
      const levels = ECONOM_HISTORY.levels;
      let lvlIdx = 0;
      levels.forEach((l, i) => { if (data.total >= l.threshold) lvlIdx = i; });
      const cur = levels[lvlIdx], next = levels[lvlIdx + 1];
      const progress = next ? Math.min(100, Math.round((data.total - cur.threshold) / (next.threshold - cur.threshold) * 100)) : 100;
      const left = next ? next.threshold - data.total : 0;

      content.innerHTML = `
        <h1 class="mb-24">Экономник покупок</h1>
        <div class="econom-balance">
          <div>
            <div class="sum">${icon("piggy", 15)} Ты сэкономил ${fmt(data.total)} за ${period === 'month' ? 'месяц' : 'год'}</div>
            <div class="small muted">${data.period}</div>
          </div>
          <div class="period">
            <button class="${period === 'month' ? 'active' : ''}" onclick="setPeriod('month')">Месяц</button>
            <button class="${period === 'year' ? 'active' : ''}" onclick="setPeriod('year')">Год</button>
          </div>
        </div>

        <div class="level-card">
          <span class="medal">${icon("medal")}</span>
          <div style="flex:1;min-width:200px">
            <b>Ты — ${cur.name}!</b>
            ${next
              ? `<div class="small muted mt-8">До «${next.name}» осталось ${fmt(left)}</div>
                 <div class="progress mt-8"><div class="progress-fill" style="width:${progress}%"></div></div>`
              : `<div class="small muted mt-8">Максимальный уровень достигнут! ${icon("party", 15)}</div>`}
          </div>
        </div>

        <div class="profile-card mb-24">
          <h3 class="mb-16">История экономии</h3>
          <table class="table table-zebra desktop-table">
            <thead><tr><th>Дата</th><th>Заказ</th><th class="num">Сумма экономии</th></tr></thead>
            <tbody>
              ${ECONOM_HISTORY.rows.map(r => `
                <tr><td>${r.date}</td><td><a href="account-order.html?id=${r.order}" style="color:var(--primary);font-weight:600">№${r.order}</a></td>
                <td class="num tx-plus">+${fmt(r.amount)}</td></tr>`).join('')}
            </tbody>
          </table>
          <div class="mobile-cards">
            ${ECONOM_HISTORY.rows.map(r => `
              <a class="m-card" href="account-order.html?id=${r.order}">
                <div class="mc-head"><b>Заказ №${r.order}</b><span class="tx-plus">+${fmt(r.amount)}</span></div>
                <div class="mc-row"><span class="k">${r.date}</span></div>
              </a>`).join('')}
          </div>
        </div>

        <a class="btn btn-primary btn-lg" href="catalog.html?filter=discount">Смотреть выгодные товары</a>
        <a class="btn btn-secondary mt-8" href="econom.html">${icon("calculator", 16)} Собрать новый комплект</a>`;
    };
    window.setPeriod = p => { period = p; render(); };
    render();
  }
});
