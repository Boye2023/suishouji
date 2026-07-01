// ============================================================
// memory-bank.js — Memory Bank page
// ============================================================
window.App = window.App || {};

(function() {
  const App = window.App;
  let currentSelectedDate = null;
  let currentSearchQuery = '';

  App.mountMemoryBankPage = async function() {
    await App.renderCalendarStrip(null);

    App.setupCalendarListener(async (date) => {
      currentSelectedDate = date;
      App.clearSearch();
      currentSearchQuery = '';
      await App.renderTimeline({ selectedDate: date, searchQuery: '', reset: true });
      App.initTimeline();
    });

    App.initSearchBar(async (query) => {
      currentSearchQuery = query;
      if (query) { currentSelectedDate = null; await App.renderCalendarStrip(null); }
      await App.renderTimeline({ searchQuery: query, selectedDate: null, reset: true });
      App.initTimeline();
    });

    await App.renderTimeline({ reset: true });
    App.initTimeline();
    App.setupDeleteListener();
  };

  App.unmountMemoryBankPage = function() {};

  App.refreshMemoryBank = async function() {
    await App.renderCalendarStrip(currentSelectedDate);
    await App.renderTimeline({ searchQuery: currentSearchQuery, selectedDate: currentSelectedDate, reset: true });
    App.initTimeline();
  };

})();
