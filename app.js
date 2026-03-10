'use strict';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_GUESSES = [
  { id: 1001, name: 'Grandma Carol', date: '2026-05-14', gender: 'girl', boyName: 'Liam',      girlName: 'Charlotte', weightLbs: 7, weightOz: 8,  time: 'morning'      },
  { id: 1002, name: 'Grandpa Bob',   date: '2026-05-18', gender: 'boy',  boyName: 'James',     girlName: 'Ava',       weightLbs: 9, weightOz: 0,  time: 'evening'      },
  { id: 1003, name: 'Uncle Pete',    date: '2026-05-20', gender: 'boy',  boyName: 'Noah',      girlName: 'Sophie',    weightLbs: 8, weightOz: 6,  time: 'night'        },
  { id: 1004, name: 'Aunt Lisa',     date: '2026-05-12', gender: 'girl', boyName: 'Ethan',     girlName: 'Olivia',    weightLbs: 7, weightOz: 0,  time: 'afternoon'    },
  { id: 1005, name: 'Sarah M.',      date: '2026-05-10', gender: 'girl', boyName: 'Liam',      girlName: 'Sophia',    weightLbs: 7, weightOz: 4,  time: 'morning'      },
  { id: 1006, name: 'Jake T.',       date: '2026-05-16', gender: 'boy',  boyName: 'Oliver',    girlName: 'Emma',      weightLbs: 8, weightOz: 2,  time: 'afternoon'    },
  { id: 1007, name: 'Megan K.',      date: '2026-05-08', gender: 'surprise', boyName: 'Aiden', girlName: 'Mia',      weightLbs: 7, weightOz: 12, time: 'earlymorning' },
  { id: 1008, name: 'Tyler R.',      date: '2026-05-14', gender: 'boy',  boyName: 'William',   girlName: 'Luna',      weightLbs: 8, weightOz: 0,  time: 'afternoon'    },
  { id: 1009, name: 'Brittany W.',   date: '2026-05-22', gender: 'girl', boyName: 'Henry',     girlName: 'Amelia',    weightLbs: 7, weightOz: 6,  time: 'morning'      },
  { id: 1010, name: 'Cousin Dan',    date: '2026-05-05', gender: 'boy',  boyName: 'Lucas',     girlName: 'Isabella',  weightLbs: 8, weightOz: 10, time: 'midnight'     },
  { id: 1011, name: 'Nana Ruth',     date: '2026-05-14', gender: 'girl', boyName: 'Mason',     girlName: 'Ella',      weightLbs: 6, weightOz: 14, time: 'morning'      },
  { id: 1012, name: 'Brandon C.',    date: '2026-04-30', gender: 'surprise', boyName: '',       girlName: '',          weightLbs: 8, weightOz: 4,  time: 'night'        },
  { id: 1013, name: 'Kelly F.',      date: '2026-05-11', gender: 'girl', boyName: 'Benjamin',  girlName: 'Harper',    weightLbs: 7, weightOz: 2,  time: 'afternoon'    },
  { id: 1014, name: 'Marcus L.',     date: '2026-05-17', gender: 'boy',  boyName: 'Alexander', girlName: 'Evelyn',    weightLbs: 8, weightOz: 8,  time: 'evening'      },
  { id: 1015, name: 'Diane P.',      date: '2026-05-25', gender: 'girl', boyName: 'Sebastian', girlName: 'Abigail',   weightLbs: 7, weightOz: 10, time: 'morning'      },
  { id: 1016, name: 'Chris W.',      date: '2026-05-07', gender: 'boy',  boyName: 'Jack',      girlName: 'Grace',     weightLbs: 8, weightOz: 14, time: 'morning'      },
  { id: 1017, name: 'Amanda R.',     date: '2026-05-19', gender: 'girl', boyName: 'Daniel',    girlName: 'Lily',      weightLbs: 6, weightOz: 8,  time: 'afternoon'    },
  { id: 1018, name: 'Kevin H.',      date: '2026-05-13', gender: 'surprise', boyName: 'Owen',  girlName: 'Chloe',     weightLbs: 7, weightOz: 6,  time: 'evening'      },
];

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const DEFAULT_DUE_DATE = '2026-05-14';

let state = {
  dueDate: DEFAULT_DUE_DATE,
  guesses: [],
  revealed: false,
  actualDate: null,
  actualWeightLbs: null,
  actualWeightOz: null,
  actualGender: null,
  actualName: null,
};

function loadState() {
  try {
    const saved = localStorage.getItem('babypool-state');
    if (saved) {
      state = Object.assign({}, state, JSON.parse(saved));
    } else {
      // First load: pre-populate with mock data
      state.guesses = MOCK_GUESSES.map(g => ({ ...g }));
    }
  } catch (_) {
    state.guesses = MOCK_GUESSES.map(g => ({ ...g }));
  }
}

function saveState() {
  localStorage.setItem('babypool-state', JSON.stringify(state));
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseDate(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatDate(str) {
  return parseDate(str).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const GENDER_LABEL = { boy: '💙 Boy', girl: '💗 Girl', surprise: '🎀 Surprise' };
const TIME_LABEL = {
  midnight: '🌙 Midnight', earlymorning: '🌄 Early Morning',
  morning: '☀️ Morning', afternoon: '🌤 Afternoon',
  evening: '🌆 Evening', night: '🌃 Night',
};
const MONTH_NAMES = ['January','February','March','April','May','June',
                     'July','August','September','October','November','December'];

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

function calcDateScore(guessDate, actualDate) {
  const daysOff = Math.abs(Math.round((parseDate(actualDate) - parseDate(guessDate)) / 86400000));
  return { daysOff, score: Math.round(1000 / (daysOff + 1)) };
}

function calcBonus(guess, actualWeightTotalOz, actualGender) {
  let bonus = 0;
  const parts = [];
  if (actualGender && guess.gender !== 'surprise' && guess.gender === actualGender) {
    bonus += 50; parts.push('+50 gender');
  }
  if (actualWeightTotalOz != null && guess.weightLbs != null) {
    const guessOz = (guess.weightLbs || 0) * 16 + (guess.weightOz || 0);
    const diff = Math.abs(guessOz - actualWeightTotalOz);
    if (diff <= 16) {
      const wb = Math.round(40 * Math.max(0, 1 - diff / 16));
      bonus += wb; parts.push(`+${wb} weight`);
    }
  }
  return { bonus, parts };
}

// ---------------------------------------------------------------------------
// Countdown
// ---------------------------------------------------------------------------

function updateCountdown() {
  const el = document.getElementById('countdown');
  if (!el) return;
  if (state.revealed && state.actualDate) {
    el.textContent = `🎉 Baby${state.actualName ? ' ' + esc(state.actualName) : ''} has arrived!`;
    el.className = 'countdown arrived';
    return;
  }
  const diff = parseDate(state.dueDate) - new Date();
  if (diff <= 0) { el.textContent = 'Any day now! 🤞'; el.className = 'countdown soon'; return; }
  const days = Math.floor(diff / 86400000);
  const hrs  = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  el.textContent = `${days}d ${hrs}h ${mins}m until due date`;
  el.className = 'countdown';
}

// ---------------------------------------------------------------------------
// Stats — Gender donut
// ---------------------------------------------------------------------------

function renderGenderChart(guesses) {
  const c = { boy: 0, girl: 0 };
  guesses.forEach(g => { if (c[g.gender] !== undefined) c[g.gender]++; });
  const total = c.boy + c.girl;
  if (total === 0) return '<p class="no-data">No data yet</p>';

  const segs = [
    { key: 'boy',  count: c.boy,  color: '#60a5fa', label: '💙 Boy' },
    { key: 'girl', count: c.girl, color: '#f472b6', label: '💗 Girl' },
  ];

  const r = 36, cx = 50, cy = 50;
  const circ = 2 * Math.PI * r;
  let cumDeg = -90;

  const arcs = segs.map(s => {
    if (s.count === 0) return '';
    const frac = s.count / total;
    const arc = `<circle r="${r}" cx="${cx}" cy="${cy}" fill="none"
      stroke="${s.color}" stroke-width="16"
      stroke-dasharray="${(frac * circ).toFixed(2)} ${circ.toFixed(2)}"
      transform="rotate(${cumDeg.toFixed(2)}, ${cx}, ${cy})" />`;
    cumDeg += frac * 360;
    return arc;
  }).join('');

  const legend = segs.filter(s => s.count > 0).map(s => `
    <div class="legend-row">
      <span class="legend-dot" style="background:${s.color}"></span>
      <span class="legend-label">${s.label}</span>
      <strong>${s.count}</strong>
      <span class="legend-pct">${Math.round(s.count / total * 100)}%</span>
    </div>`).join('');

  return `
    <div class="gender-chart">
      <svg viewBox="0 0 100 100" class="donut-svg">
        <circle r="${r}" cx="${cx}" cy="${cy}" fill="none" stroke="#f3f4f6" stroke-width="16"/>
        ${arcs}
        <text x="${cx}" y="${cy - 4}" text-anchor="middle" class="donut-num">${total}</text>
        <text x="${cx}" y="${cy + 10}" text-anchor="middle" class="donut-sub">guesses</text>
      </svg>
      <div class="gender-legend">${legend}</div>
    </div>`;
}

// ---------------------------------------------------------------------------
// Stats — Weight histogram
// ---------------------------------------------------------------------------

function renderWeightChart(guesses) {
  const withW = guesses.filter(g => g.weightLbs != null);
  if (withW.length === 0) return '<p class="no-data">No weight guesses yet</p>';

  // Bucket by pound (5–10+)
  const buckets = [5, 6, 7, 8, 9, 10];
  const counts = Object.fromEntries(buckets.map(b => [b, 0]));
  withW.forEach(g => {
    const lb = Math.min(Math.round(g.weightLbs), 10);
    const key = lb < 5 ? 5 : lb;
    counts[key]++;
  });

  const max = Math.max(...Object.values(counts), 1);

  // Average
  const totalOz = withW.reduce((s, g) => s + (g.weightLbs || 0) * 16 + (g.weightOz || 0), 0);
  const avgOz = Math.round(totalOz / withW.length);
  const avgLbs = Math.floor(avgOz / 16);
  const avgRem = avgOz % 16;

  const bars = buckets.map(lb => {
    const count = counts[lb];
    const pct = Math.round((count / max) * 100);
    const label = lb === 10 ? '10+' : String(lb);
    return `
      <div class="wbar-row ${count === 0 ? 'wbar-empty' : ''}">
        <span class="wbar-label">${label} lbs</span>
        <div class="wbar-track"><div class="wbar-fill" style="width:${pct}%"></div></div>
        <span class="wbar-count">${count || '–'}</span>
      </div>`;
  }).join('');

  return `
    <div class="weight-chart">
      ${bars}
      <div class="weight-avg">avg <strong>${avgLbs} lbs ${avgRem} oz</strong></div>
    </div>`;
}

// ---------------------------------------------------------------------------
// Stats — Calendar heatmap
// ---------------------------------------------------------------------------

function renderCalendarHeatmap(guesses) {
  const due = parseDate(state.dueDate);
  const dueYear = due.getFullYear();
  const dueMonth = due.getMonth(); // 0-indexed

  // Build date → count map
  const counts = {};
  guesses.forEach(g => { counts[g.date] = (counts[g.date] || 0) + 1; });
  const maxCount = Math.max(...Object.values(counts), 1);

  // Show: month before due, due month
  const months = [
    { year: dueMonth === 0 ? dueYear - 1 : dueYear, month: dueMonth === 0 ? 11 : dueMonth - 1 },
    { year: dueYear, month: dueMonth },
  ];

  return `<div class="cal-months-wrap">${months.map(m => renderMonth(m.year, m.month, counts, maxCount)).join('')}</div>`;
}

function renderMonth(year, month, counts, maxCount) {
  const firstDow = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const dayHeaders = ['Su','Mo','Tu','We','Th','Fr','Sa']
    .map(d => `<div class="cal-day-hdr">${d}</div>`).join('');

  // Empty leading cells
  const empties = Array(firstDow).fill('<div class="cal-cell cal-empty"></div>').join('');

  const cells = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const count = counts[dateStr] || 0;
    const isDue = dateStr === state.dueDate;

    let bg, fg;
    if (count === 0) {
      bg = isDue ? '#fef3c7' : '#f9fafb';
      fg = isDue ? '#92400e' : '#d1d5db';
    } else {
      // Interpolate from light to dark purple
      const intensity = Math.min(count / maxCount, 1);
      if (intensity < 0.4)      { bg = '#ddd6fe'; fg = '#4c1d95'; }
      else if (intensity < 0.75) { bg = '#a78bfa'; fg = '#fff'; }
      else                       { bg = '#7c3aed'; fg = '#fff'; }
    }

    const tip = `${count} guess${count !== 1 ? 'es' : ''}${isDue ? ' · due date' : ''}`;
    cells.push(`
      <div class="cal-cell${isDue ? ' cal-due' : ''}" style="background:${bg};color:${fg}" title="${tip}">
        ${d}
      </div>`);
  }

  return `
    <div class="cal-month">
      <div class="cal-month-name">${MONTH_NAMES[month]} ${year}</div>
      <div class="cal-grid">
        ${dayHeaders}
        ${empties}
        ${cells.join('')}
      </div>
    </div>`;
}

// ---------------------------------------------------------------------------
// Stats — main render
// ---------------------------------------------------------------------------

function renderStats() {
  const el = document.getElementById('stats-content');
  const countEl = document.getElementById('stats-count');
  countEl.textContent = state.guesses.length;

  if (state.guesses.length === 0) {
    el.innerHTML = '<p class="no-data">Submit some guesses to see stats!</p>';
    return;
  }

  el.innerHTML = `
    <div class="stats-grid">
      <div class="stat-panel">
        <div class="stat-panel-title">Gender</div>
        ${renderGenderChart(state.guesses)}
      </div>
      <div class="stat-panel">
        <div class="stat-panel-title">Weight</div>
        ${renderWeightChart(state.guesses)}
      </div>
      <div class="stat-panel stat-panel-full">
        <div class="stat-panel-title">Date Heatmap</div>
        ${renderCalendarHeatmap(state.guesses)}
      </div>
    </div>`;
}

// ---------------------------------------------------------------------------
// Guesses list
// ---------------------------------------------------------------------------

function renderGuesses() {
  const list = document.getElementById('guesses-list');
  document.getElementById('guess-count').textContent = state.guesses.length;

  if (state.guesses.length === 0) {
    list.innerHTML = '<p class="empty-state">No guesses yet — be the first! 🐣</p>';
    return;
  }

  const actualOz = state.actualWeightLbs != null
    ? state.actualWeightLbs * 16 + (state.actualWeightOz || 0) : null;

  let scored = state.guesses.map(g => {
    if (!state.revealed || !state.actualDate) return { ...g };
    const { daysOff, score } = calcDateScore(g.date, state.actualDate);
    const { bonus, parts } = calcBonus(g, actualOz, state.actualGender);
    return { ...g, daysOff, score, bonus, bonusParts: parts, total: score + bonus };
  });

  if (state.revealed) scored.sort((a, b) => (b.total ?? 0) - (a.total ?? 0));

  const medals = ['🥇', '🥈', '🥉'];

  list.innerHTML = scored.map((g, i) => {
    const isTop = state.revealed && i < 3;
    const medal = medals[i] ?? '';
    return `
      <div class="guess-card${i === 0 && state.revealed ? ' winner' : ''}">
        ${isTop && state.revealed ? `<div class="rank-badge">${medal}</div>` : ''}
        <div class="guess-main">
          <span class="guess-name">${esc(g.name)}</span>
          <span class="guess-date">${formatDate(g.date)}</span>
          ${g.gender ? `<span class="guess-gender">${GENDER_LABEL[g.gender] ?? ''}</span>` : ''}
          ${g.weightLbs != null ? `<span class="guess-weight">⚖️ ${g.weightLbs} lbs${g.weightOz ? ' ' + g.weightOz + ' oz' : ''}</span>` : ''}
        </div>
        <div class="guess-tags">
          ${g.boyName  ? `<span class="tag">💙 ${esc(g.boyName)}</span>` : ''}
          ${g.girlName ? `<span class="tag">💗 ${esc(g.girlName)}</span>` : ''}
          ${g.time     ? `<span class="tag">${TIME_LABEL[g.time] ?? g.time}</span>` : ''}
        </div>
        ${state.revealed ? `
          <div class="guess-score">
            <span class="days-off">${g.daysOff === 0 ? '🎯 Exact!' : `${g.daysOff}d off`}</span>
            <div class="score-row">
              <span class="score-base">${g.score} pts</span>
              ${g.bonus > 0 ? `<span class="score-bonus">+${g.bonus}</span>` : ''}
              <span class="score-total">= ${g.total}</span>
            </div>
          </div>` : ''}
      </div>`;
  }).join('');
}

// ---------------------------------------------------------------------------
// Header / reveal banner
// ---------------------------------------------------------------------------

function renderDueDate() {
  document.getElementById('due-date-display').textContent = formatDate(state.dueDate);
  const inp = document.getElementById('admin-due-date');
  if (inp) inp.value = state.dueDate;
}

function renderRevealBanner() {
  const b = document.getElementById('reveal-banner');
  if (state.revealed && state.actualDate) {
    let t = `🎉 Arrived ${formatDate(state.actualDate)}`;
    if (state.actualName) t += ` — ${esc(state.actualName)}`;
    if (state.actualGender) t += ` ${state.actualGender === 'boy' ? '💙' : '💗'}`;
    if (state.actualWeightLbs != null) {
      t += ` · ${state.actualWeightLbs} lbs`;
      if (state.actualWeightOz) t += ` ${state.actualWeightOz} oz`;
    }
    b.textContent = t;
    b.classList.remove('hidden');
  } else {
    b.classList.add('hidden');
  }
}

function render() {
  renderDueDate();
  renderStats();
  renderGuesses();
  renderRevealBanner();
  updateCountdown();
}

// ---------------------------------------------------------------------------
// Admin drawer
// ---------------------------------------------------------------------------

function openAdmin() {
  document.getElementById('admin-panel').classList.add('open');
  document.getElementById('admin-overlay').classList.add('visible');
  document.body.classList.add('drawer-open');
}

function closeAdmin() {
  document.getElementById('admin-panel').classList.remove('open');
  document.getElementById('admin-overlay').classList.remove('visible');
  document.body.classList.remove('drawer-open');
}

document.getElementById('admin-toggle').addEventListener('click', openAdmin);
document.getElementById('admin-close').addEventListener('click', closeAdmin);
document.getElementById('admin-overlay').addEventListener('click', closeAdmin);

document.getElementById('save-due-date').addEventListener('click', () => {
  const v = document.getElementById('admin-due-date').value;
  if (!v) return;
  state.dueDate = v;
  saveState();
  render();
});

document.getElementById('load-mock').addEventListener('click', () => {
  if (!confirm('Replace all guesses with sample data?')) return;
  state.guesses = MOCK_GUESSES.map(g => ({ ...g }));
  state.revealed = false; state.actualDate = null;
  state.actualWeightLbs = null; state.actualWeightOz = null;
  state.actualGender = null; state.actualName = null;
  saveState(); render(); closeAdmin();
});

document.getElementById('reveal-winner').addEventListener('click', () => {
  const date = document.getElementById('actual-date').value;
  if (!date) { alert('Please enter the actual birth date.'); return; }
  if (!confirm(`Reveal results with birth date ${formatDate(date)}?`)) return;
  state.actualDate = date;
  state.revealed = true;
  const lbs = document.getElementById('actual-weight-lbs').value;
  const oz  = document.getElementById('actual-weight-oz').value;
  state.actualWeightLbs = lbs !== '' ? parseInt(lbs, 10) : null;
  state.actualWeightOz  = oz  !== '' ? parseInt(oz, 10)  : null;
  state.actualGender = document.getElementById('actual-gender').value || null;
  state.actualName   = document.getElementById('actual-name').value.trim() || null;
  saveState(); render(); closeAdmin();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

document.getElementById('undo-reveal').addEventListener('click', () => {
  if (!confirm('Undo reveal and hide scores?')) return;
  state.revealed = false; state.actualDate = null;
  state.actualWeightLbs = null; state.actualWeightOz = null;
  state.actualGender = null; state.actualName = null;
  saveState(); render();
});

document.getElementById('clear-all').addEventListener('click', () => {
  if (!confirm('Delete all guesses? This cannot be undone.')) return;
  state.guesses = [];
  state.revealed = false; state.actualDate = null;
  state.actualWeightLbs = null; state.actualWeightOz = null;
  state.actualGender = null; state.actualName = null;
  saveState(); render(); closeAdmin();
});

// ---------------------------------------------------------------------------
// Guess form
// ---------------------------------------------------------------------------

document.getElementById('guess-form').addEventListener('submit', e => {
  e.preventDefault();
  const name = document.getElementById('guesser-name').value.trim();
  const date = document.getElementById('date-guess').value;
  if (!name || !date) return;

  const lbsVal = document.getElementById('weight-lbs').value;
  const ozVal  = document.getElementById('weight-oz').value;

  state.guesses.push({
    id: Date.now(),
    name, date,
    gender:    document.querySelector('input[name="gender"]:checked')?.value || null,
    boyName:   document.getElementById('boy-name').value.trim(),
    girlName:  document.getElementById('girl-name').value.trim(),
    weightLbs: lbsVal !== '' ? parseInt(lbsVal, 10) : null,
    weightOz:  ozVal  !== '' ? parseInt(ozVal, 10)  : null,
    time:      document.getElementById('time-guess').value,
  });

  saveState();
  render();
  e.target.reset();
  document.querySelector('.extras-details').removeAttribute('open');
  document.querySelector('.stats-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

loadState();
render();
setInterval(updateCountdown, 30000);
