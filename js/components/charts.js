// ============================================================
// charts.js — SVG-based bar chart and donut chart
// ============================================================
window.App = window.App || {};

(function() {
  const App = window.App;

  App.renderWeekChart = async function(containerId, referenceDate) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const dates = App.getWeekDates(referenceDate);
    const startDate = App.startOfDay(dates[0]);
    const endDate = App.endOfDay(dates[6]);

    const notes = await App.getAllNotes({ startDate, endDate, limit: 10000 });
    const dayCounts = {}, dayTypes = {};
    for (const note of notes) {
      const key = App.dateKey(note.createdAt);
      if (!dayCounts[key]) { dayCounts[key] = 0; dayTypes[key] = { text: 0, image: 0, voice: 0 }; }
      dayCounts[key]++;
      if (dayTypes[key][note.type] !== undefined) dayTypes[key][note.type]++;
    }

    const data = dates.map(d => ({
      label: App.WEEKDAY_NAMES[d.getDay()],
      count: dayCounts[App.dateKey(d)] || 0
    }));
    const maxCount = Math.max(...data.map(d => d.count), 1);

    if (data.every(d => d.count === 0)) {
      container.innerHTML = '<div class="chart-empty">本周暂无记录</div>';
      return;
    }

    const width = container.clientWidth - 32 || 320;
    const height = 140;
    const pad = { top: 10, right: 10, bottom: 22, left: 10 };
    const cw = width - pad.left - pad.right, ch = height - pad.top - pad.bottom;
    const barWidth = Math.floor((cw / 7) - 6);
    const gap = (cw - barWidth * 7) / 6;

    let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;
    for (let i = 0; i <= 3; i++) {
      const y = pad.top + (ch / 3) * i;
      const val = Math.round(maxCount * (1 - i / 3));
      svg += `<line x1="${pad.left}" y1="${y}" x2="${width - pad.right}" y2="${y}" stroke="#F0F0F5" stroke-width="1"/>`;
      svg += `<text x="${pad.left - 4}" y="${y + 4}" text-anchor="end" font-size="10" fill="#C7C7CC">${val}</text>`;
    }
    let x = pad.left;
    const todayDayOfWeek = new Date().getDay();
    data.forEach((d, i) => {
      const barH = maxCount > 0 ? (d.count / maxCount) * ch : 0;
      const y = pad.top + ch - barH;
      const isToday = (i === todayDayOfWeek - 1) || (todayDayOfWeek === 0 && i === 6);
      svg += `<rect x="${x}" y="${y}" width="${barWidth}" height="${Math.max(barH, 1)}" rx="4" fill="#4A90D9" opacity="${isToday ? '1' : '0.6'}"/>`;
      if (d.count > 0) svg += `<text x="${x + barWidth / 2}" y="${y - 4}" text-anchor="middle" font-size="10" fill="#8E8E93" font-weight="600">${d.count}</text>`;
      svg += `<text x="${x + barWidth / 2}" y="${height - 4}" text-anchor="middle" font-size="10" fill="${isToday ? '#4A90D9' : '#8E8E93'}" font-weight="${isToday ? '600' : '400'}">${d.label}</text>`;
      x += barWidth + gap;
    });
    svg += '</svg>';
    container.innerHTML = svg;
  };

  App.renderMonthChart = async function(containerId, year, month) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const days = App.getMonthDays(year, month);
    const startDate = App.startOfDay(days[0]);
    const endDate = App.endOfDay(days[days.length - 1]);

    const notes = await App.getAllNotes({ startDate, endDate, limit: 10000 });
    const dayCounts = {};
    for (const note of notes) {
      const key = App.dateKey(note.createdAt);
      dayCounts[key] = (dayCounts[key] || 0) + 1;
    }
    const data = days.map(d => ({ date: d.getDate(), count: dayCounts[App.dateKey(d)] || 0 }));
    const maxCount = Math.max(...data.map(d => d.count), 1);

    if (data.every(d => d.count === 0)) {
      container.innerHTML = '<div class="chart-empty">本月暂无记录</div>';
      return;
    }

    const width = container.clientWidth - 32 || 320;
    const cellSize = Math.floor(width / 7) - 2;
    const firstDay = days[0].getDay();
    const offset = firstDay === 0 ? 6 : firstDay - 1;
    const rows = Math.ceil((offset + days.length) / 7);
    const height = rows * (cellSize + 2) + 18;

    let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;
    ['一','二','三','四','五','六','日'].forEach((day, i) => {
      svg += `<text x="${i * (cellSize + 2) + cellSize / 2}" y="10" text-anchor="middle" font-size="9" fill="#C7C7CC">${day}</text>`;
    });
    data.forEach((d, i) => {
      const col = (offset + i) % 7;
      const row = Math.floor((offset + i) / 7) + 1;
      const rx = col * (cellSize + 2);
      const ry = row * (cellSize + 2) + 5;
      const intensity = maxCount > 0 ? d.count / maxCount : 0;
      const alpha = 0.08 + intensity * 0.92;
      svg += `<rect x="${rx}" y="${ry}" width="${cellSize}" height="${cellSize}" rx="3" fill="#4A90D9" opacity="${alpha}"/>`;
      if (d.count > 0) svg += `<text x="${rx + cellSize / 2}" y="${ry + cellSize / 2 + 3}" text-anchor="middle" font-size="9" fill="${intensity > 0.6 ? 'white' : '#4A90D9'}" font-weight="600">${d.count}</text>`;
    });
    svg += '</svg>';
    container.innerHTML = svg;
  };

  App.renderDonutChart = async function(containerId, startDate, endDate) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const notes = await App.getAllNotes({ startDate: startDate.getTime(), endDate: endDate.getTime(), limit: 10000 });
    const counts = { text: 0, image: 0, voice: 0 };
    for (const note of notes) { if (counts[note.type] !== undefined) counts[note.type]++; }
    const total = counts.text + counts.image + counts.voice;
    if (total === 0) { container.innerHTML = '<div class="chart-empty">暂无数据</div>'; return; }

    const colors = { text: '#4A90D9', image: '#4ECDC4', voice: '#FF6B6B' };
    const labels = { text: '文字', image: '图片', voice: '语音' };
    const size = 160, center = size / 2, radius = 60, sw = 18, circ = 2 * Math.PI * radius;

    let svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`;
    svg += `<circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="#F0F0F5" stroke-width="${sw}"/>`;
    let off = 0;
    ['text','image','voice'].forEach(type => {
      if (counts[type] === 0) return;
      const ratio = counts[type] / total;
      const dash = ratio * circ;
      svg += `<circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="${colors[type]}" stroke-width="${sw}" stroke-dasharray="${dash} ${circ - dash}" stroke-dashoffset="${-off}" transform="rotate(-90 ${center} ${center})" stroke-linecap="round"/>`;
      off += dash;
    });
    svg += `<text x="${center}" y="${center - 6}" text-anchor="middle" font-size="20" font-weight="700" fill="#1A1A2E">${total}</text>`;
    svg += `<text x="${center}" y="${center + 14}" text-anchor="middle" font-size="11" fill="#8E8E93">总计</text>`;
    svg += '</svg>';

    let legend = '<div style="display:flex;justify-content:center;gap:16px;margin-top:8px;flex-wrap:wrap;">';
    ['text','image','voice'].forEach(type => {
      if (counts[type] === 0) return;
      const pct = Math.round((counts[type] / total) * 100);
      legend += `<div style="display:flex;align-items:center;gap:4px;font-size:12px;color:#8E8E93;"><span style="width:8px;height:8px;border-radius:50%;background:${colors[type]};display:inline-block;"></span>${labels[type]} ${counts[type]} (${pct}%)</div>`;
    });
    legend += '</div>';
    container.innerHTML = svg + legend;
  };

})();
