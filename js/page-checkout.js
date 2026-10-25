/* /checkout + успех заказа — page-checkout.js */
document.addEventListener('DOMContentLoaded', () => {
  renderHeader('', 'checkout');
  renderFooter();

  const root = document.getElementById('checkout-page');

  if (!Cart.count()) {
    root.innerHTML = `
      <h1>Оформление заказа</h1>
      <div class="empty">
        <div class="icon">${icon("cart")}</div>
        <h3>Корзина пуста</h3>
        <p>Добавьте товары, чтобы оформить заказ</p>
        <div class="btns"><a class="btn btn-primary" href="catalog.html">В каталог</a><a class="btn btn-secondary" href="econom.html">Собрать комплект</a></div>
      </div>`;
    return;
  }

  const state = { delivery: 'pickup', payment: 'cash' };
  const deliveryPrice = () => STORE.delivery[state.delivery];

  root.innerHTML = `
    <nav class="breadcrumbs"><a href="index.html">Главная</a><span class="sep">/</span><a href="cart.html">Корзина</a><span class="sep">/</span><span class="current">Оформление</span></nav>
    <h1 class="mb-24">Оформление заказа</h1>

    <div class="checkout-layout">
      <div>
        <!-- Шаг 1. Доставка -->
        <div class="checkout-step">
          <div class="step-head"><span class="step-num">1</span><h3>Доставка</h3></div>
          <label class="radio-card selected" data-d="pickup">
            <input type="radio" name="delivery" value="pickup" checked>
            <span>
              <span class="rc-title">${icon("store", 17)} Самовывоз</span>
              <span class="rc-sub">${STORE.address} · ${STORE.hours}</span>
            </span>
            <span class="rc-price">0 ₽</span>
          </label>
          <label class="radio-card" data-d="city">
            <input type="radio" name="delivery" value="city">
            <span>
              <span class="rc-title">${icon("truck", 17)} По городу</span>
              <span class="rc-sub">Ишимбай · 1–2 дня</span>
            </span>
            <span class="rc-price">300 ₽</span>
          </label>
          <label class="radio-card" data-d="district">
            <input type="radio" name="delivery" value="district">
            <span>
              <span class="rc-title">${icon("pickup", 17)} По району</span>
              <span class="rc-sub">Ишимбайский район · 2–3 дня</span>
            </span>
            <span class="rc-price">500 ₽</span>
          </label>
          <div class="address-fields" id="address-fields">
            <div class="field" style="margin:0"><label>Улица <span class="req">*</span></label><input class="input" id="a-street" placeholder="ул. Ленина"></div>
            <div class="field" style="margin:0"><label>Дом <span class="req">*</span></label><input class="input" id="a-house" placeholder="10"></div>
            <div class="field" style="margin:0"><label>Квартира</label><input class="input" id="a-apt" placeholder="5"></div>
          </div>
        </div>

        <!-- Шаг 2. Контакты -->
        <div class="checkout-step">
          <div class="step-head"><span class="step-num">2</span><h3>Контактные данные</h3></div>
          <div class="form-grid">
            <div class="field" id="f-name">
              <label>Имя <span class="req">*</span></label>
              <input class="input" id="c-name" placeholder="Иван Петров">
              <span class="hint">Укажите имя</span>
            </div>
            <div class="field" id="f-phone">
              <label>Телефон <span class="req">*</span></label>
              <input class="input" id="c-phone" type="tel" placeholder="+7 (___) ___-__-__">
              <span class="hint">Укажите телефон (минимум 10 цифр)</span>
            </div>
          </div>
          <div class="field" id="f-email" style="max-width:420px">
            <label>Email <span class="req">*</span></label>
            <input class="input" id="c-email" type="email" placeholder="ivan@mail.ru">
            <span class="hint">Укажите корректный email</span>
          </div>
        </div>

        <!-- Шаг 3. Оплата -->
        <div class="checkout-step">
          <div class="step-head"><span class="step-num">3</span><h3>Оплата</h3></div>
          <div class="pay-grid">
            <label class="radio-card selected" data-p="cash">
              <input type="radio" name="payment" value="cash" checked>
              <span><span class="rc-title">${icon("cash", 17)} При получении</span><span class="rc-sub">Наличные или карта</span></span>
            </label>
            <label class="radio-card" data-p="invoice">
              <input type="radio" name="payment" value="invoice">
              <span><span class="rc-title">${icon("receipt", 17)} По счёту</span><span class="rc-sub">Для юрлиц, реквизиты на email</span></span>
            </label>
          </div>
        </div>

        <!-- Шаг 4. Комментарий -->
        <div class="checkout-step">
          <div class="step-head"><span class="step-num">4</span><h3>Комментарий к заказу</h3></div>
          <textarea class="textarea" id="c-comment" maxlength="300" placeholder="Например: позвонить за час до доставки"></textarea>
          <div class="small muted text-right mt-8"><span id="char-count">0</span>/300</div>
        </div>
      </div>

      <!-- Итого -->
      <aside class="summary-card" id="checkout-summary"></aside>
    </div>

    <div class="sticky-checkout">
      <div class="row">
        <span class="sum" id="sticky-sum"></span>
        <button class="btn btn-primary" onclick="document.getElementById('confirm-btn').click()">Подтвердить заказ</button>
      </div>
    </div>`;

  /* ---------- Радиокнопки ---------- */
  document.querySelectorAll('.radio-card[data-d]').forEach(card => {
    card.onclick = () => {
      document.querySelectorAll('.radio-card[data-d]').forEach(c => { c.classList.remove('selected'); c.querySelector('input').checked = false; });
      card.classList.add('selected');
      card.querySelector('input').checked = true;
      state.delivery = card.dataset.d;
      document.getElementById('address-fields').classList.toggle('visible', state.delivery !== 'pickup');
      renderSummary();
    };
  });
  document.querySelectorAll('.radio-card[data-p]').forEach(card => {
    card.onclick = () => {
      document.querySelectorAll('.radio-card[data-p]').forEach(c => { c.classList.remove('selected'); c.querySelector('input').checked = false; });
      card.classList.add('selected');
      card.querySelector('input').checked = true;
      state.payment = card.dataset.p;
    };
  });

  document.getElementById('c-comment').addEventListener('input', e => {
    document.getElementById('char-count').textContent = e.target.value.length;
  });

  /* Маска телефона */
  document.getElementById('c-phone').addEventListener('input', e => {
    let d = e.target.value.replace(/\D/g, '');
    if (d.startsWith('8')) d = '7' + d.slice(1);
    if (!d.startsWith('7')) d = '7' + d;
    d = d.slice(0, 11);
    let out = '+7';
    if (d.length > 1) out += ` (${d.slice(1, 4)}`;
    if (d.length >= 5) out += `) ${d.slice(4, 7)}`;
    if (d.length >= 8) out += `-${d.slice(7, 9)}`;
    if (d.length >= 10) out += `-${d.slice(9, 11)}`;
    e.target.value = out;
  });

  /* ---------- Итого ---------- */
  function renderSummary() {
    const items = Cart.items();
    const t = Cart.totals();
    const grand = t.total + deliveryPrice();
    document.getElementById('checkout-summary').innerHTML = `
      <h3 class="mb-16">Ваш заказ</h3>
      ${items.map(it => `
        <div class="line" style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;gap:8px">
          <span class="muted">${esc(it.product.name)} × ${it.qty}</span>
          <b class="nowrap">${fmt(it.product.price * it.qty)}</b>
        </div>`).join('')}
      <hr style="border:none;border-top:1px solid var(--border);margin:10px 0">
      <div class="line"><span>Товары</span><span>${fmt(t.oldSum)}</span></div>
      ${t.savings > 0 ? `<div class="line"><span>Скидка (в т.ч. за комплект)</span><span class="green">−${fmt(t.savings)}</span></div>` : ''}
      <div class="line"><span>Доставка</span><span>${deliveryPrice() === 0 ? 'Бесплатно' : fmt(deliveryPrice())}</span></div>
      <div class="line total"><span>К оплате</span><span>${fmt(grand)}</span></div>
      ${t.savings > 0 ? `<div class="mt-8 saving small">${icon("piggy", 14)} Ты экономишь ${fmt(t.savings)} на этом заказе</div>` : ''}
      <button class="btn btn-primary btn-block btn-lg mt-16" id="confirm-btn">Подтвердить заказ</button>
      <p class="small muted mt-8">Нажимая кнопку, вы соглашаетесь с условиями обработки персональных данных.</p>`;
    document.getElementById('sticky-sum').textContent = `К оплате ${fmt(grand)}`;
    document.getElementById('confirm-btn').onclick = submitOrder;
  }

  /* ---------- Валидация и отправка ---------- */
  function validate() {
    let ok = true;
    const name = document.getElementById('c-name').value.trim();
    const phone = document.getElementById('c-phone').value.replace(/\D/g, '');
    const email = document.getElementById('c-email').value.trim();

    setField('f-name', name.length >= 2); if (name.length < 2) ok = false;
    setField('f-phone', phone.length >= 11); if (phone.length < 11) ok = false;
    setField('f-email', /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)); if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) ok = false;

    if (state.delivery !== 'pickup') {
      const street = document.getElementById('a-street').value.trim();
      const house = document.getElementById('a-house').value.trim();
      if (!street || !house) { ok = false; toast('Укажите адрес доставки', 'error'); }
    }
    if (!ok) toast('Проверьте заполнение полей', 'error');
    return ok;
  }
  function setField(id, ok) {
    const el = document.getElementById(id);
    el.classList.toggle('error', !ok);
    el.classList.toggle('ok', ok);
  }

  function submitOrder() {
    if (!validate()) return;
    const btn = document.getElementById('confirm-btn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Отправляем…';
    const orderNo = 1040 + Math.floor(Math.random() * 60);
    setTimeout(() => {
      Cart.clear();
      location.href = `success.html?n=${orderNo}`;
    }, 900);
  }

  renderSummary();
});
