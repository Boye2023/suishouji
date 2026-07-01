// ============================================================
// state.js — Pub/sub state manager
// ============================================================
window.App = window.App || {};

(function() {
  const App = window.App;
  const listeners = {};
  const state = {
    currentPage: 'home',
    noteType: 'text',
    searchQuery: '',
    selectedDate: null,
    user: null,
    pendingImage: null,
    weekOffset: 0,
    monthOffset: 0,
  };

  App.subscribe = function(key, fn) {
    if (!listeners[key]) listeners[key] = new Set();
    listeners[key].add(fn);
    return () => { listeners[key]?.delete(fn); };
  };

  App.emit = function(key, data) {
    if (listeners[key]) {
      listeners[key].forEach(fn => { try { fn(data); } catch(e) { console.error(e); } });
    }
  };

  App.getState = function(key) { return state[key]; };

  App.setState = function(key, value) {
    const old = state[key];
    state[key] = value;
    App.emit(key, value);
    App.emit('change', { key, oldValue: old, newValue: value });
  };

})();
