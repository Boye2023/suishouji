// ============================================================
// timeline.js — Infinite scroll timeline feed
// ============================================================
window.App = window.App || {};

(function() {
  const App = window.App;
  const PAGE_SIZE = 20;
  let allLoaded = false, currentNotes = [], observer = null, isLoading = false;

  App.initTimeline = function() {
    const sentinel = document.getElementById('timelineSentinel');
    if (observer) observer.disconnect();
    observer = new IntersectionObserver(async (entries) => {
      if (entries[0].isIntersecting && !isLoading && !allLoaded) await loadMore();
    }, { root: document.querySelector('.timeline'), rootMargin: '200px', threshold: 0 });
    observer.observe(sentinel);
  };

  App.renderTimeline = async function(options = {}) {
    const { searchQuery = '', selectedDate = null, reset = true } = options;
    const listEl = document.getElementById('timelineList');
    const emptyEl = document.getElementById('timelineEmpty');
    const loadingEl = document.getElementById('timelineLoading');
    const countEl = document.getElementById('memoryNoteCount');

    if (reset) { listEl.innerHTML = ''; allLoaded = false; currentNotes = []; isLoading = false; }

    try {
      isLoading = true;
      loadingEl.classList.remove('hidden');
      let notes;
      if (searchQuery) { notes = await App.searchNotes(searchQuery, PAGE_SIZE); }
      else if (selectedDate) { notes = await App.getNotesByDate(selectedDate); }
      else { notes = await App.getAllNotes({ limit: PAGE_SIZE }); }

      const counts = await App.getNoteCounts();
      if (countEl) countEl.textContent = `${counts.total} 条记录`;

      allLoaded = notes.length < PAGE_SIZE;
      currentNotes = notes;
      loadingEl.classList.add('hidden');

      if (notes.length === 0 && reset) { emptyEl.classList.remove('hidden'); listEl.innerHTML = ''; return; }
      emptyEl.classList.add('hidden');

      const grouped = groupByDate(notes);
      for (const [dateStr, dateNotes] of Object.entries(grouped)) {
        const divider = document.createElement('div');
        divider.className = 'timeline-date-divider';
        divider.textContent = App.formatDateLabel(dateNotes[0].createdAt);
        listEl.appendChild(divider);
        for (const note of dateNotes) { listEl.appendChild(App.renderNoteCard(note)); }
      }
    } catch(err) {
      console.error('Timeline error:', err);
    } finally {
      isLoading = false;
      loadingEl.classList.add('hidden');
    }
  };

  async function loadMore() {
    const listEl = document.getElementById('timelineList');
    const loadingEl = document.getElementById('timelineLoading');
    const searchInput = document.getElementById('searchInput');
    const selEl = document.querySelector('.calendar-day--selected');
    const searchQuery = searchInput ? searchInput.value.trim() : '';
    const selectedDate = selEl ? selEl.dataset.date : null;
    if (searchQuery || selectedDate) { allLoaded = true; return; }

    try {
      isLoading = true;
      loadingEl.classList.remove('hidden');
      const offset = currentNotes.length;
      const notes = await App.getAllNotes({ limit: PAGE_SIZE, offset });
      allLoaded = notes.length < PAGE_SIZE;
      if (notes.length > 0) {
        currentNotes = [...currentNotes, ...notes];
        const grouped = groupByDate(notes);
        for (const [dateStr, dateNotes] of Object.entries(grouped)) {
          const divider = document.createElement('div');
          divider.className = 'timeline-date-divider';
          divider.textContent = App.formatDateLabel(dateNotes[0].createdAt);
          listEl.appendChild(divider);
          for (const note of dateNotes) { listEl.appendChild(App.renderNoteCard(note)); }
        }
      }
    } catch(err) { console.error('Load more error:', err); }
    finally { isLoading = false; loadingEl.classList.add('hidden'); }
  }

  function groupByDate(notes) {
    const groups = {};
    for (const note of notes) {
      const key = App.dateKey(note.createdAt);
      if (!groups[key]) groups[key] = [];
      groups[key].push(note);
    }
    return groups;
  }

  App.refreshTimeline = async function() {
    await App.renderTimeline({ reset: true });
    App.initTimeline();
  };

  App.setupDeleteListener = function() {
    window.addEventListener('note-deleted', async (e) => {
      currentNotes = currentNotes.filter(n => n.id !== e.detail.id);
      const counts = await App.getNoteCounts();
      const countEl = document.getElementById('memoryNoteCount');
      if (countEl) countEl.textContent = `${counts.total} 条记录`;
      if (currentNotes.length === 0) {
        const emptyEl = document.getElementById('timelineEmpty');
        if (emptyEl) emptyEl.classList.remove('hidden');
      }
    });
  };

})();
