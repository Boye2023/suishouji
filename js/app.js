// ============================================================
// app.js — Application entry point, router, initialization
// ============================================================
window.App = window.App || {};

(function() {
  const App = window.App;

  const pages = {
    home: { mount: null, unmount: null },
    memory: { mount: null, unmount: null },
    profile: { mount: null, unmount: null }
  };

  let activePage = 'home';

  async function init() {
    console.log('随手记 — 轻量碎片记录');
    console.log('Initializing...');

    // Register page handlers (set up by their respective modules)
    pages.home.mount = App.mountHomePage;
    pages.home.unmount = App.unmountHomePage;
    pages.memory.mount = App.mountMemoryBankPage;
    pages.memory.unmount = App.unmountMemoryBankPage;
    pages.profile.mount = App.mountProfilePage;
    pages.profile.unmount = App.unmountProfilePage;

    // Init tab bar
    App.initTabBar();

    // Mount home page
    await mountPage('home');

    // Listen for page changes
    App.subscribe('currentPage', async (page) => {
      if (page !== activePage) await switchToPage(page);
    });

    window.addEventListener('page-changed', async (e) => {
      if (e.detail.page !== activePage) await switchToPage(e.detail.page);
    });

    window.addEventListener('navigate', async (e) => {
      await switchToPage(e.detail.page);
    });

    // Check memory bank page when it becomes active
    window.addEventListener('page-changed', async (e) => {
      if (e.detail.page === 'memory' && App.refreshMemoryBank) {
        await App.refreshMemoryBank();
      }
      if (e.detail.page === 'profile') {
        // Refresh stats
        const counts = await App.getNoteCounts();
        const statTotal = document.getElementById('statTotal');
        if (statTotal) statTotal.textContent = counts.total;
        document.getElementById('statText').textContent = counts.text;
        document.getElementById('statImage').textContent = counts.image;
        document.getElementById('statVoice').textContent = counts.voice;
      }
    });

    if (!window.indexedDB) {
      alert('您的浏览器不支持 IndexedDB，部分功能可能无法使用。');
    }

    console.log('随手记 初始化完成');
  }

  async function switchToPage(page) {
    if (page === activePage) return;
    console.log(`Switching: ${activePage} → ${page}`);

    if (pages[activePage] && pages[activePage].unmount) {
      pages[activePage].unmount();
    }

    const tabItem = document.querySelector(`.tab-bar__item[data-page="${page}"]`);
    if (tabItem && !tabItem.classList.contains('tab-bar__item--active')) {
      App.switchPage(page, false);
    }

    await mountPage(page);
    activePage = page;
  }

  async function mountPage(page) {
    if (pages[page] && pages[page].mount) {
      try {
        await pages[page].mount();
      } catch(err) {
        console.error(`Error mounting "${page}":`, err);
      }
    }
  }

  // ============================================================
  // Service Worker
  // ============================================================
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    });
  }

  // ============================================================
  // Boot
  // ============================================================
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled rejection:', event.reason);
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
