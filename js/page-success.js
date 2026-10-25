/* success.html — экран успеха — page-success.js */
document.addEventListener('DOMContentLoaded', () => {
  renderHeader('', 'success');
  renderFooter();
  const n = qs('n') || '1042';
  document.getElementById('success-page').innerHTML = `
    <div class="success-page">
      <div class="icon">${icon("checkCircle")}</div>
      <h1>Заказ №${esc(n)} принят!</h1>
      <p class="muted mb-24">Мы позвоним с номера ${STORE.phone1} для подтверждения в рабочее время (${STORE.hours}).</p>
      <div class="empty" style="padding:0">
        <div class="btns">
          <a class="btn btn-primary" href="account-orders.html">В личный кабинет</a>
          <a class="btn btn-secondary" href="catalog.html">Продолжить покупки</a>
        </div>
      </div>
      <p class="small muted mt-24">${icon("piggy", 15)} Совет: собирайте комплекты в «Экономнике покупок» — экономия до 20% на каждом заказе.<br>
      <a href="econom.html" style="color:var(--primary);font-weight:600">Открыть Экономник ${icon("arrowRight", 14)}</a></p>
    </div>`;
});
