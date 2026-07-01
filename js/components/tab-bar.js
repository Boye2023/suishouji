// ============================================================
// tab-bar.js — Bottom tab navigation
// ============================================================
window.App = window.App || {};

(function() {
  const App = window.App;

  App.initTabBar = function() {
    const tabItems = document.querySelectorAll('.tab-bar__item');
    tabItems.forEach(item => {
      item.addEventListener('click', () => {
        const page = item.dataset.page;
        if (page && page !== App.getState('currentPage')) {
          App.switchPage(page);
        }
      });
    });
    window.addEventListener('navigate', (e) => { App.switchPage(e.detail.page, false); });
  };

  App.switchPage = function(page, updateState = true) {
    document.querySelectorAll('.tab-bar__item').forEach(item => {
      item.classList.toggle('tab-bar__item--active', item.dataset.page === page);
    });
    document.querySelectorAll('.page').forEach(p => {
      p.classList.toggle('page--active', p.id === `page-${page}`);
    });
    if (updateState) App.setState('currentPage', page);
    const pageEl = document.getElementById(`page-${page}`);
    if (pageEl) pageEl.scrollTop = 0;
    window.dispatchEvent(new CustomEvent('page-changed', { detail: { page } }));
  };

})();
