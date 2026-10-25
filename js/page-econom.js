/* /econom — список задач — page-econom.js */
document.addEventListener('DOMContentLoaded', () => {
  renderHeader('', 'econom');
  renderFooter();

  let activeType = 'all';

  const box = document.getElementById('econom-page');
  box.innerHTML = `
    <div class="page-head">
      <nav class="breadcrumbs"><a href="index.html">Главная</a><span class="sep">/</span><span class="current">Экономник покупок</span></nav>
      <h1>Экономник покупок</h1>
      <p>Выбери задачу — получи 3 варианта бюджета: экономный, стандартный, люкс. С ценами, отзывами и составом.</p>
    </div>
    <div class="filter-bar">
      <div class="chips" id="type-chips">
        <button class="chip active" data-type="all">Все</button>
        ${TASK_TYPES.map(t => `<button class="chip" data-type="${t.id}">${t.name}</button>`).join('')}
      </div>
    </div>
    <div id="tasks-grid"></div>`;

  function render() {
    const grid = document.getElementById('tasks-grid');
    const list = activeType === 'all' ? TASKS : TASKS.filter(t => t.type === activeType);
    if (!list.length) {
      grid.innerHTML = `
        <div class="empty">
          <div class="icon">${icon("box")}</div>
          <h3>Задач в этой категории пока нет</h3>
          <p>Мы постоянно добавляем новые комплекты — загляните позже</p>
          <div class="btns"><button class="btn btn-secondary" onclick="document.querySelector('[data-type=all]').click()">Показать все</button></div>
        </div>`;
      return;
    }
    grid.innerHTML = `<div class="grid-tasks cols-4">${list.map(taskCardHtml).join('')}</div>`;
  }

  document.getElementById('type-chips').addEventListener('click', e => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    document.querySelectorAll('#type-chips .chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    activeType = chip.dataset.type;
    render();
  });

  render();
});
