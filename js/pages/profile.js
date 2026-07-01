// ============================================================
// profile.js — Profile page: login, stats, storage
// ============================================================
window.App = window.App || {};

(function() {
  const App = window.App;
  let weekOffset = 0, monthOffset = 0;

  App.mountProfilePage = async function() {
    await loadUserInfo();
    await loadQuickStats();
    await loadWeeklyReport();
    await loadMonthlyReport();
    await loadStorageInfo();
    initLoginModal();
    initWeekNav();
    initMonthNav();
  };

  App.unmountProfilePage = function() {};

  async function loadUserInfo() {
    const user = await App.getSetting('user');
    const nameEl = document.getElementById('profileName');
    const metaEl = document.getElementById('profileMeta');
    const avatarEl = document.getElementById('profileAvatar');
    const loginBtn = document.getElementById('btnLogin');
    if (user && user.name) {
      nameEl.textContent = user.name;
      metaEl.textContent = user.email || '已登录';
      avatarEl.classList.add('profile-card__avatar--logged-in');
      loginBtn.textContent = '退出';
      loginBtn.classList.add('profile-card__action--logout');
    } else {
      nameEl.textContent = '未登录';
      metaEl.textContent = '登录以同步数据';
      avatarEl.classList.remove('profile-card__avatar--logged-in');
      loginBtn.textContent = '登录';
      loginBtn.classList.remove('profile-card__action--logout');
    }
  }

  async function loadQuickStats() {
    const counts = await App.getNoteCounts();
    document.getElementById('statTotal').textContent = counts.total;
    document.getElementById('statText').textContent = counts.text;
    document.getElementById('statImage').textContent = counts.image;
    document.getElementById('statVoice').textContent = counts.voice;
  }

  async function loadWeeklyReport() {
    const refDate = new Date();
    refDate.setDate(refDate.getDate() + weekOffset * 7);
    document.getElementById('weekRange').textContent = App.weekRangeStr(refDate);
    await App.renderWeekChart('weekChart', refDate);
  }

  function initWeekNav() {
    document.getElementById('btnPrevWeek').addEventListener('click', () => { weekOffset--; loadWeeklyReport(); });
    document.getElementById('btnNextWeek').addEventListener('click', () => { if (weekOffset < 0) { weekOffset++; loadWeeklyReport(); } });
  }

  async function loadMonthlyReport() {
    const now = new Date();
    const refDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
    document.getElementById('monthRange').textContent = App.monthRangeStr(refDate);
    await App.renderMonthChart('monthBarChart', refDate.getFullYear(), refDate.getMonth());
    const startDate = new Date(refDate.getFullYear(), refDate.getMonth(), 1);
    const endDate = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 0, 23, 59, 59, 999);
    await App.renderDonutChart('monthDonutChart', startDate, endDate);
  }

  function initMonthNav() {
    document.getElementById('btnPrevMonth').addEventListener('click', () => { monthOffset--; loadMonthlyReport(); });
    document.getElementById('btnNextMonth').addEventListener('click', () => { if (monthOffset < 0) { monthOffset++; loadMonthlyReport(); } });
  }

  async function loadStorageInfo() {
    const usage = await App.getStorageUsage();
    const el = document.getElementById('storageUsage');
    const fill = document.getElementById('storageFill');
    if (usage.quota > 0) {
      const usedMB = (usage.usage / (1024 * 1024)).toFixed(1);
      const totalMB = (usage.quota / (1024 * 1024)).toFixed(0);
      el.textContent = `${usedMB} MB / ${totalMB} MB`;
      fill.style.width = `${Math.min(usage.percent, 100)}%`;
      if (usage.percent > 80) fill.style.background = 'var(--color-error)';
      else if (usage.percent > 60) fill.style.background = 'var(--color-warning)';
    } else { el.textContent = '--'; }
  }

  function initLoginModal() {
    const modal = document.getElementById('loginModal');
    const loginBtn = document.getElementById('btnLogin');
    const closeBtn = document.getElementById('btnCloseModal');
    const confirmBtn = document.getElementById('btnConfirmLogin');

    loginBtn.addEventListener('click', async () => {
      const user = await App.getSetting('user');
      if (user && user.name) {
        if (confirm('确定退出登录吗？数据不会丢失。')) {
          await App.setSetting('user', null);
          await loadUserInfo();
        }
        return;
      }
      modal.classList.remove('hidden');
    });

    closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.add('hidden'); });

    confirmBtn.addEventListener('click', async () => {
      const nickname = document.getElementById('inputNickname').value.trim();
      if (!nickname) { alert('请输入昵称'); return; }
      const email = document.getElementById('inputEmail').value.trim();
      await App.setSetting('user', { name: nickname, email: email || '', createdAt: Date.now() });
      modal.classList.add('hidden');
      document.getElementById('inputNickname').value = '';
      document.getElementById('inputEmail').value = '';
      await loadUserInfo();
    });
  }

})();
