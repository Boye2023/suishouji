// ============================================================
// search-bar.js — Search input with debounce
// ============================================================
window.App = window.App || {};

(function() {
  const App = window.App;
  let onSearchCallback = null;

  App.initSearchBar = function(onSearch) {
    onSearchCallback = onSearch;
    const searchInput = document.getElementById('searchInput');
    const clearBtn = document.getElementById('btnClearSearch');
    if (!searchInput) return;

    const debouncedSearch = App.debounce((query) => { onSearchCallback(query); }, 300);

    searchInput.addEventListener('input', () => {
      const query = searchInput.value.trim();
      if (query) clearBtn.classList.remove('hidden');
      else clearBtn.classList.add('hidden');
      debouncedSearch(query);
    });

    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      clearBtn.classList.add('hidden');
      onSearchCallback('');
      searchInput.focus();
    });

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); onSearchCallback(searchInput.value.trim()); }
    });
  };

  App.clearSearch = function() {
    const input = document.getElementById('searchInput');
    const clearBtn = document.getElementById('btnClearSearch');
    if (input) { input.value = ''; clearBtn.classList.add('hidden'); if (onSearchCallback) onSearchCallback(''); }
  };

})();
