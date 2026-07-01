// ============================================================
// utils.js — Utility helpers
// ============================================================
window.App = window.App || {};

(function() {
  const App = window.App;

  App.uuid = function() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  };

  App.formatTime = function(ts) {
    const d = new Date(ts);
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    if (App.isSameDay(d, now)) return `今天 ${time}`;
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (App.isSameDay(d, yesterday)) return `昨天 ${time}`;
    if (d.getFullYear() === now.getFullYear()) return `${d.getMonth() + 1}月${d.getDate()}日 ${time}`;
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${time}`;
  };

  App.formatDateLabel = function(ts) {
    const d = new Date(ts);
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    if (App.isSameDay(d, now)) return '今天';
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (App.isSameDay(d, yesterday)) return '昨天';
    const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${dayNames[d.getDay()]}`;
  };

  App.formatDuration = function(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  App.isSameDay = function(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  };

  App.startOfDay = function(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };

  App.endOfDay = function(date) {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d.getTime();
  };

  App.dateKey = function(ts) {
    const d = new Date(ts);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  App.debounce = function(fn, delay) {
    let timer = null;
    return function(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  };

  App.escapeHTML = function(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  };

  App.formatSize = function(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  App.weekRangeStr = function(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d);
    monday.setDate(diff);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const pad = (n) => String(n).padStart(2, '0');
    return `${monday.getMonth() + 1}/${pad(monday.getDate())} - ${sunday.getMonth() + 1}/${pad(sunday.getDate())}`;
  };

  App.monthRangeStr = function(date) {
    return `${date.getFullYear()}年${date.getMonth() + 1}月`;
  };

  App.getWeekDates = function(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const dt = new Date(monday);
      dt.setDate(monday.getDate() + i);
      dates.push(dt);
    }
    return dates;
  };

  App.getMonthDays = function(year, month) {
    const days = [];
    const date = new Date(year, month, 1);
    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  };

  App.WEEKDAY_NAMES = ['日', '一', '二', '三', '四', '五', '六'];

})();
