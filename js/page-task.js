/* /econom/{task} — страница задачи с 3 вариантами — page-task.js */
document.addEventListener('DOMContentLoaded', () => {
  renderHeader('', 'econom');
  renderFooter();

  const slug = qs('task') || TASKS[0].slug;
  const task = Econom.taskBySlug(slug) || TASKS[0];
  let level = ['econom', 'standard', 'lux'].includes(qs('variant')) ? qs('variant') : 'econom';

  /* Локальные изменения состава: { productId: qty } ; qty=0 — исключён */
  let overrides = {};

  const root = document.getElementById('task-page');
  root.innerHTML = `
    <nav class="breadcrumbs">
      <a href="index.html">Главная</a><span class="sep">/</span>
      <a href="econom.html">Экономник покупок</a><span class="sep">/</span>
      <span class="current">${esc(task.name)}</span>
    </nav>
    <div class="page-head">
      <h1>${esc(task.name)}: 3 варианта бюджета</h1>
      <p>${esc(task.desc)}</p>
    </div>
    <div class="tabs full" id="variant-tabs" style="max-width:860px;margin:24px auto 0">
      ${['econom', 'standard', 'lux'].map(l => {
        const v = Econom.calcVariant(task, l);
        return `<button class="tab ${l === level ? 'active' : ''}" data-level="${l}">
          ${Econom.levelName(l)}<span class="tab-price">от ${fmt(v.P)}</span>
        </button>`;
      }).join('')}
    </div>
    <div id="variant-root"></div>
    <div id="reviews-root"></div>
    <div id="similar-root"></div>`;

  document.getElementById('variant-tabs').addEventListener('click', e => {
    const tab = e.target.closest('.tab');
    if (!tab) return;
    document.querySelectorAll('#variant-tabs .tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    level = tab.dataset.level;
    overrides = {};
    renderVariant();
  });

  /* ---------- Расчёт варианта с учётом изменений пользователя ---------- */
  function currentVariant() {
    const base = Econom.calcVariant(task, level);
    const items = base.items.map(it => {
      const q = overrides[it.product.id] !== undefined ? overrides[it.product.id] : it.qty;
      return { ...it, qty: q, excluded: q === 0 };
    }).filter(it => !it.excluded || true); // держим исключённые для отображения
    const active = items.filter(it => !it.excluded);
    const P = active.reduce((s, it) => s + it.product.price * it.qty, 0);
    const D = active.reduce((s, it) => s + Econom.productSaving(it.product) * it.qty, 0);
    const K = active.length >= 3 ? Math.round(P * 0.05) : 0;
    return { items, active, P, D, K, S: D + K, total: P - K, base };
  }

  function renderVariant() {
    const v = currentVariant();
    const anyOut = v.active.some(it => it.product.stock === 'out');
    document.getElementById('variant-root').innerHTML = `
      <div class="variant-card">
        <div class="variant-head">
          <div>
            <span class="lvl">${Econom.levelName(level)} вариант</span>
            <h2>${esc(Econom.variantTitle(task, level))}</h2>
            <div class="rating-line mt-8">${stars(taskRating())} <span>${taskRating().toFixed(1)} из 5 (${task.reviews.length} ${plural(task.reviews.length, 'отзыв', 'отзыва', 'отзывов')})</span></div>
          </div>
          <div class="prices">
            <div class="price price-lg">От ${fmt(v.P)}</div>
            ${v.S > 0 ? `<div class="saving saving-lg mt-8">${icon("piggy", 15)} Ты экономишь ${fmt(v.S)}</div>` : ''}
          </div>
        </div>

        <table class="variant-table">
          <thead><tr><th style="width:45%">Товар</th><th>Цена</th><th>Кол-во</th><th class="num">Сумма</th><th class="num hide-mobile">Выгода</th></tr></thead>
          <tbody>
            ${v.items.map(it => {
              const p = it.product;
              const sum = p.price * it.qty;
              const ben = Econom.productSaving(p) * it.qty;
              return `
              <tr class="${it.excluded ? 'excluded' : ''}" data-pid="${p.id}">
                <td>
                  <div class="p-cell">
                    ${photo(p, 'sm')}
                    <div>
                      <a class="pname" href="product.html?id=${p.id}">${esc(p.name)}</a>
                      <div class="part">Арт. ${p.art} · ${stockText(p)}</div>
                    </div>
                  </div>
                </td>
                <td data-label="Цена">
                  <b>${fmt(p.price)}</b>
                  ${p.oldPrice ? `<div class="price-old" style="margin:0">${fmt(p.oldPrice)}</div>` : ''}
                </td>
                <td data-label="Кол-во">
                  <span class="stepper">
                    <button onclick="taskQty('${p.id}',-1)" ${it.excluded ? 'disabled' : ''} aria-label="Меньше">−</button>
                    <span class="qty">${it.qty}</span>
                    <button onclick="taskQty('${p.id}',1)" aria-label="Больше">+</button>
                  </span>
                  ${it.excluded ? `<button class="btn-ghost small" style="font-size:11px;color:var(--primary)" onclick="taskRestore('${p.id}')">Вернуть</button>` : ''}
                </td>
                <td class="num" data-label="Сумма"><b>${fmt(sum)}</b></td>
                <td class="num hide-mobile" data-label="Выгода">${ben > 0 ? `<span class="tx-plus">−${fmt(ben)}</span>` : '—'}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>

        <div class="variant-totals">
          <div class="line"><span>Товары (${v.active.length} поз.)</span><span>${fmt(v.P)}</span></div>
          <div class="line discount"><span>Скидка по товарам</span><span>−${fmt(v.D)}</span></div>
          ${v.K > 0 ? `<div class="line discount"><span>Скидка за комплект −5% (позиций ≥ 3)</span><span>−${fmt(v.K)}</span></div>` : ''}
          <div class="line total"><span>Итого</span><span>${fmt(v.total)}</span></div>
        </div>

        <div class="variant-actions">
          <button class="btn btn-primary btn-lg" id="add-all-btn" ${!v.active.length || anyOut ? 'disabled' : ''}>
            ${icon("cart", 16)} Добавить всё в корзину
          </button>
          <button class="btn btn-secondary btn-lg" id="download-btn">${icon("doc", 16)} Скачать список</button>
        </div>
        ${anyOut ? '<p class="small mt-8" style="color:var(--danger)">Части товаров нет в наличии — исключите их из состава или выберите другой вариант.</p>' : ''}
      </div>`;

    document.getElementById('add-all-btn').onclick = () => addAll(v);
    document.getElementById('download-btn').onclick = () => downloadList(v);
  }

  function stockText(p) {
    return p.stock === 'in' ? '<span class="stock-in">В наличии</span>' : p.stock === 'order' ? '<span class="stock-order">Под заказ</span>' : '<span class="stock-out">Нет в наличии</span>';
  }

  function taskRating() {
    const avg = task.reviews.reduce((s, r) => s + r.rating, 0) / task.reviews.length;
    return avg || 4.5;
  }

  /* ---------- Количество / исключение ---------- */
  window.taskQty = (pid, d) => {
    const base = Econom.calcVariant(task, level).items.find(i => i.product.id === pid);
    const cur = overrides[pid] !== undefined ? overrides[pid] : base.qty;
    overrides[pid] = Math.max(0, cur + d);
    renderVariant();
  };
  window.taskRestore = pid => {
    delete overrides[pid];
    renderVariant();
  };

  /* ---------- Добавить всё в корзину ---------- */
  function addAll(v) {
    const btn = document.getElementById('add-all-btn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Добавляем…';
    setTimeout(() => {
      v.active.forEach(it => Cart.add(it.product.id, it.qty));
      Cart.state.setDiscount += v.K;
      Cart.save(Cart.state);
      btn.innerHTML = `${icon("check", 15)} Добавлено`;
      btn.classList.add('btn-success');
      toast(`Комплект в корзине! Экономия ${fmt(v.S)} · скидка за комплект −5% применена`, 'success', 4000);
      setTimeout(() => {
        btn.innerHTML = `${icon("cart", 16)} Добавить всё в корзину`;
        btn.classList.remove('btn-success');
        btn.disabled = false;
      }, 2000);
    }, 700);
  }

  /* ---------- Скачать список (TXT в прототипе) ---------- */
  function downloadList(v) {
    const btn = document.getElementById('download-btn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Формируем…';
    setTimeout(() => {
      const lines = [
        `ХозМастер — ${STORE.address}`,
        `Комплект: ${task.name} — ${Econom.levelName(level)}`,
        '─'.repeat(46),
        ...v.active.map((it, i) => `${i + 1}. ${it.product.name} × ${it.qty} = ${fmt(it.product.price * it.qty)}`),
        '─'.repeat(46),
        `Товары: ${fmt(v.P)}`,
        `Скидка по товарам: −${fmt(v.D)}`,
        `Скидка за комплект −5%: −${fmt(v.K)}`,
        `ИТОГО: ${fmt(v.total)}`,
        `ВЫ ЭКОНОМИТЕ: ${fmt(v.S)}`,
        '',
        `${STORE.phone1}, ${STORE.hours}`,
      ];
      const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/plain;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `hozmaster-${task.slug}-${level}.txt`;
      a.click();
      URL.revokeObjectURL(a.href);
      btn.disabled = false;
      btn.innerHTML = `${icon("doc", 16)} Скачать список`;
      toast('Список скачан (в полной версии — PDF)', 'success');
    }, 600);
  }

  /* ---------- Отзывы о комплекте ---------- */
  function renderReviews() {
    const avg = taskRating();
    document.getElementById('reviews-root').innerHTML = `
      <div class="reviews-block">
        <h2 class="mb-16">Отзывы о комплекте</h2>
        <div class="rating-summary">
          <div>
            <div class="big">${avg.toFixed(1)}</div>
            ${stars(avg, 18)}
            <div class="small muted mt-8">${task.reviews.length} ${plural(task.reviews.length, 'отзыв', 'отзыва', 'отзывов')}</div>
          </div>
          <div style="flex:1"></div>
          <button class="btn btn-primary" onclick="openReviewModal('Комплект «${esc(task.name)}»')">Оставить отзыв</button>
        </div>
        ${task.reviews.map(r => `
          <div class="review-item">
            <div class="head">
              <span class="avatar">${esc(r.name.charAt(0))}</span>
              <div>
                <div class="who">${esc(r.name)} <span class="meta">· ${esc(r.city)}</span></div>
                <div class="meta">${r.date} · ${Econom.levelName(r.variant)} вариант</div>
              </div>
              <div style="margin-left:auto">${stars(r.rating)}</div>
            </div>
            <div class="text">${esc(r.text)}</div>
          </div>`).join('')}
      </div>`;
  }

  /* ---------- Похожие задачи ---------- */
  function renderSimilar() {
    const sim = task.similar.map(s => Econom.taskBySlug(s)).filter(Boolean);
    if (!sim.length) return;
    document.getElementById('similar-root').innerHTML = `
      <div class="similar-tasks">
        <h2 class="mb-16">Похожие задачи</h2>
        <div class="grid-tasks cols-3">${sim.map(taskCardHtml).join('')}</div>
      </div>`;
  }

  renderVariant();
  renderReviews();
  renderSimilar();
});
