/* /cart — корзина с блоком экономии — page-cart.js */
document.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('cart-page');
  renderHeader('', 'cart');
  renderFooter();

  const root = document.getElementById('cart-page');

  function render() {
    const items = Cart.items();
    const t = Cart.totals();

    if (!items.length) {
      root.innerHTML = `
        <nav class="breadcrumbs"><a href="index.html">Главная</a><span class="sep">/</span><span class="current">Корзина</span></nav>
        <h1>Корзина</h1>
        <div class="empty">
          <div class="icon">${icon("cart")}</div>
          <h3>В корзине пока пусто</h3>
          <p>Загляни в каталог или собери готовый комплект в Экономнике покупок — это выгоднее</p>
          <div class="btns">
            <a class="btn btn-primary" href="catalog.html">В каталог</a>
            <a class="btn btn-secondary" href="econom.html">${icon("calculator", 16)} Открыть Экономник</a>
          </div>
        </div>`;
      return;
    }

    const remaining = Math.max(0, STORE.freeDeliveryFrom - t.subtotal);
    const freeDelivery = remaining === 0;
    const progress = Math.min(100, Math.round(t.subtotal / STORE.freeDeliveryFrom * 100));

    root.innerHTML = `
      <nav class="breadcrumbs"><a href="index.html">Главная</a><span class="sep">/</span><span class="current">Корзина</span></nav>
      <h1 class="mb-24">Корзина <span class="muted" style="font-size:18px;font-weight:400">(${t.count} ${plural(t.count, 'товар', 'товара', 'товаров')})</span></h1>

      <div class="cart-layout">
        <div>
          <!-- Таблица (desktop/tablet) -->
          <table class="table cart-items-table">
            <thead><tr><th>Товар</th><th>Цена</th><th>Кол-во</th><th class="num">Сумма</th><th></th></tr></thead>
            <tbody>
              ${items.map(it => cartRow(it)).join('')}
            </tbody>
          </table>

          <!-- Карточки (mobile) -->
          <div class="cart-cards">
            ${items.map(it => `
              <div class="cart-card">
                ${photo(it.product, 'sm')}
                <div class="info">
                  <a class="n" href="product.html?id=${it.product.id}">${esc(it.product.name)}</a>
                  <div class="p">${fmt(it.product.price)} ${it.product.oldPrice ? `<span class="price-old">${fmt(it.product.oldPrice)}</span>` : ''}</div>
                  <div class="bottom-row">
                    <span class="stepper">
                      <button onclick="cartQty('${it.id}',-1)" aria-label="Меньше">−</button>
                      <span class="qty">${it.qty}</span>
                      <button onclick="cartQty('${it.id}',1)" aria-label="Больше">+</button>
                    </span>
                    <b>${fmt(it.product.price * it.qty)}</b>
                    <button class="btn-ghost" onclick="cartRemove('${it.id}')" aria-label="Удалить">${icon("trash", 17)}</button>
                  </div>
                </div>
              </div>`).join('')}
          </div>

          <!-- Блок «Экономник покупок» (глава 6) -->
          <div class="econom-cart-block">
            <div class="head">
              <div>
                ${t.savings > 0
                  ? `<div class="t1">${icon("piggy", 15)} Ты уже сэкономил ${fmt(t.savings)}</div>`
                  : `<div class="t1">${icon("piggy", 15)} Добавь выгодные товары — сэкономь до 30%</div>`}
                ${freeDelivery
                  ? `<div class="t2" style="color:var(--success);font-weight:600">Доставка бесплатно! ${icon("party", 15)} Ты забрал максимум выгоды</div>`
                  : `<div class="t2">Добавь ещё ${fmt(remaining)} — получи бесплатную доставку</div>`}
              </div>
              <a class="btn btn-secondary hide-mobile" href="catalog.html?filter=discount">Смотреть выгодные товары</a>
            </div>
            <div class="progress"><div class="progress-fill ${freeDelivery ? 'done' : ''}" style="width:${progress}%"></div></div>
            <div class="progress-labels"><span>${fmt(t.subtotal)}</span><span>бесплатная доставка от ${fmt(STORE.freeDeliveryFrom)}</span></div>
            <a class="btn btn-secondary btn-block show-mobile mt-16" href="catalog.html?filter=discount">Смотреть выгодные товары</a>
          </div>
        </div>

        <!-- Итого -->
        <aside class="summary-card">
          <h3 class="mb-16">Итого</h3>
          <div class="line"><span>Товары (${t.count})</span><span>${fmt(t.oldSum)}</span></div>
          ${t.productDiscount > 0 ? `<div class="line"><span>Скидки по товарам</span><span class="green">−${fmt(t.productDiscount)}</span></div>` : ''}
          ${t.setDiscount > 0 ? `<div class="line"><span>Скидка за комплекты −5%</span><span class="green">−${fmt(t.setDiscount)}</span></div>` : ''}
          <div class="line"><span>Доставка</span><span class="muted">Укажу при оформлении</span></div>
          <div class="line total"><span>К оплате</span><span>${fmt(t.total)}</span></div>
          <div class="promo-row">
            <input class="input" id="promo-input" type="text" placeholder="Промокод">
            <button class="btn btn-secondary" onclick="applyPromo()">Применить</button>
          </div>
          <a class="btn btn-primary btn-block btn-lg" href="checkout.html">Оформить заказ</a>
          <a class="btn btn-ghost btn-block mt-8" href="catalog.html">Продолжить покупки</a>
        </aside>
      </div>

      <!-- Sticky-панель (mobile) -->
      <div class="sticky-checkout">
        <div class="row">
          <span class="sum">К оплате ${fmt(t.total)}</span>
          <a class="btn btn-primary" href="checkout.html">Оформить заказ</a>
        </div>
      </div>`;
  }

  function cartRow(it) {
    const p = it.product;
    return `
      <tr data-row="${p.id}">
        <td>
          <div class="cart-item-cell">
            ${photo(p, 'sm')}
            <div>
              <a href="product.html?id=${p.id}" style="font-weight:500">${esc(p.name)}</a>
              <div class="small muted">Арт. ${p.art}</div>
              ${stockHtml(p)}
            </div>
          </div>
        </td>
        <td>${fmt(p.price)}${p.oldPrice ? `<div class="price-old" style="margin:0">${fmt(p.oldPrice)}</div>` : ''}</td>
        <td>
          <span class="stepper">
            <button onclick="cartQty('${p.id}',-1)" aria-label="Меньше">−</button>
            <span class="qty">${it.qty}</span>
            <button onclick="cartQty('${p.id}',1)" aria-label="Больше">+</button>
          </span>
        </td>
        <td class="num"><b>${fmt(p.price * it.qty)}</b></td>
        <td class="text-right"><button class="btn-ghost" onclick="cartRemove('${p.id}')" aria-label="Удалить">${icon("trash", 17)}</button></td>
      </tr>`;
  }

  window.cartQty = (id, d) => {
    const it = Cart.state.items.find(x => x.id === id);
    if (!it) return;
    Cart.setQty(id, it.qty + d);
    render();
  };

  window.cartRemove = id => {
    const removed = Cart.remove(id);
    if (!removed) return;
    render();
    const p = Econom.productById(id);
    toast(`«${esc(p ? p.name : 'Товар')}» удалён из корзины`, '', 5000, () => { Cart.restore(removed); render(); });
  };

  window.applyPromo = () => {
    const code = document.getElementById('promo-input').value.trim().toUpperCase();
    if (!code) return;
    if (code === 'ХОЗМАСТЕР' || code === 'HOZMASTER') {
      toast('Промокод применён! (в прототипе скидка не начисляется)', 'success');
    } else {
      toast('Промокод не найден', 'error');
    }
  };

  render();
});
