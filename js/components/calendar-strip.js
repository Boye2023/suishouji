// ============================================================
// calendar-strip.js — Horizontal scrollable calendar
// ============================================================
window.App = window.App || {};

(function() {
  const App = window.App;

  App.renderCalendarStrip = async function(selectedDate = null) {
    const stripEl = document.getElementById('calendarStrip');
    if (!stripEl) return;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const startDate = new Date(today); startDate.setDate(today.getDate() - 15);
    const endDate = new Date(today); endDate.setDate(today.getDate() + 14);
    endDate.setHours(23, 59, 59, 999);

    const notes = await App.getAllNotes({ startDate: startDate.getTime(), endDate: endDate.getTime(), limit: 10000 });
    const dateMap = {};
    for (const note of notes) {
      const key = App.dateKey(note.createdAt);
      if (!dateMap[key]) dateMap[key] = { count: 0, firstThumbnail: null, hasImage: false };
      dateMap[key].count++;
      if (note.type === 'image' && note.imageThumbnail && !dateMap[key].hasImage) {
        dateMap[key].hasImage = true;
        dateMap[key].firstThumbnail = note.imageThumbnail;
      }
    }

    stripEl.innerHTML = '';
    const current = new Date(startDate);
    while (current <= endDate) {
      stripEl.appendChild(renderDayCell(current, dateMap, selectedDate));
      current.setDate(current.getDate() + 1);
    }

    setTimeout(() => {
      const todayEl = stripEl.querySelector('.calendar-day--today');
      if (todayEl) todayEl.scrollIntoView({ inline: 'center', behavior: 'smooth' });
    }, 100);
  };

  function renderDayCell(date, dateMap, selectedDate) {
    const key = App.dateKey(date);
    const info = dateMap[key];
    const today = new Date(); today.setHours(0, 0, 0, 0);

    const cell = document.createElement('div');
    cell.className = 'calendar-day';
    cell.dataset.date = date.toISOString();
    if (App.isSameDay(date, today)) cell.classList.add('calendar-day--today');
    if (selectedDate && App.isSameDay(date, selectedDate)) cell.classList.add('calendar-day--selected');

    const weekday = document.createElement('div');
    weekday.className = 'calendar-day__weekday';
    weekday.textContent = App.WEEKDAY_NAMES[date.getDay()];
    cell.appendChild(weekday);

    const dateEl = document.createElement('div');
    dateEl.className = 'calendar-day__date';
    dateEl.textContent = date.getDate();
    cell.appendChild(dateEl);

    if (info && info.hasImage && info.firstThumbnail) {
      const thumb = document.createElement('img');
      thumb.className = 'calendar-day__thumbnail';
      thumb.src = URL.createObjectURL(info.firstThumbnail);
      cell.appendChild(thumb);
    } else if (info && info.count > 0) {
      const dot = document.createElement('div');
      dot.className = 'calendar-day__dot';
      cell.appendChild(dot);
    } else {
      const spacer = document.createElement('div');
      spacer.style.cssText = 'width:32px;height:32px;';
      cell.appendChild(spacer);
    }

    if (info && info.count > 0) {
      const badge = document.createElement('div');
      badge.className = 'calendar-day__badge';
      badge.textContent = info.count > 99 ? '99+' : String(info.count);
      cell.appendChild(badge);
    }

    cell.addEventListener('click', () => {
      const prev = document.querySelector('.calendar-day--selected');
      if (prev) prev.classList.remove('calendar-day--selected');
      cell.classList.add('calendar-day--selected');
      window.dispatchEvent(new CustomEvent('calendar-date-selected', { detail: { date: new Date(date) } }));
    });

    return cell;
  }

  App.setupCalendarListener = function(onDateSelected) {
    window.addEventListener('calendar-date-selected', (e) => {
      if (onDateSelected) onDateSelected(e.detail.date);
    });
  };

})();
