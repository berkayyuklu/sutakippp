/* ============================================================
   HydroTrack – app.js
   ============================================================ */

// ─── STATE ───────────────────────────────────────────────────
const DEFAULT_STATE = {
  theme: 'light',
  goal: 2500,
  cups: [
    { id: 'c1', name: 'Küçük', ml: 150, icon: '🥤' },
    { id: 'c2', name: 'Bardak',  ml: 200, icon: '🥛' },
    { id: 'c3', name: 'Büyük',  ml: 350, icon: '🍶' },
    { id: 'c4', name: 'Şişe',   ml: 500, icon: '💧' },
  ],
  log: {},     // { 'YYYY-MM-DD': [ {ml, ts} ] }
  badges: {},  // { badgeId: 'YYYY-MM-DD' }
};

const ALL_BADGES = [
  { id: 'first_sip',   icon: '🌱', label: 'İlk Yudum',   desc: 'İlk su kaydını yaptın!',               check: (s) => getTodayTotal(s) > 0 },
  { id: 'half_way',    icon: '⚡', label: 'Yarı Yol',     desc: 'Günlük hedefin yarısına ulaştın!',       check: (s) => getTodayTotal(s) >= s.goal / 2 },
  { id: 'goal_hit',    icon: '🏆', label: 'Hedef!',       desc: 'Günlük hedefine ulaştın! Harika!',       check: (s) => getTodayTotal(s) >= s.goal },
  { id: 'over_achiever', icon: '🚀', label: 'Süper İnsan', desc: 'Hedefini %150 aştın!',                check: (s) => getTodayTotal(s) >= s.goal * 1.5 },
  { id: 'streak_3',    icon: '🔥', label: '3 Günlük Seri', desc: '3 gün üst üste hedefe ulaştın!',       check: (s) => getStreak(s) >= 3 },
  { id: 'streak_7',    icon: '💎', label: '7 Günlük Seri', desc: 'Bir hafta boyunca hedefine ulaştın!',  check: (s) => getStreak(s) >= 7 },
  { id: 'early_bird',  icon: '🌅', label: 'Sabah Kuşu',   desc: 'Sabah 9\'dan önce su içtin!',           check: (s) => earlyBirdCheck(s) },
  { id: 'hydro_10',    icon: '🌊', label: 'Hidro-10',     desc: '10 ayrı günde hedefine ulaştın!',       check: (s) => getDaysGoalMet(s) >= 10 },
];

let state = {};
let lastEntry = null; // for undo
let chart = null;
let activeTab = 'day';

// ─── STORAGE ─────────────────────────────────────────────────
function loadState() {
  try {
    const raw = localStorage.getItem('hydrotrack_v2');
    state = raw ? JSON.parse(raw) : JSON.parse(JSON.stringify(DEFAULT_STATE));
  } catch {
    state = JSON.parse(JSON.stringify(DEFAULT_STATE));
  }
  // ensure arrays/objects exist
  if (!state.cups) state.cups = DEFAULT_STATE.cups;
  if (!state.log)  state.log  = {};
  if (!state.badges) state.badges = {};
  if (!state.goal) state.goal = 2500;
}

function saveState() {
  localStorage.setItem('hydrotrack_v2', JSON.stringify(state));
}

// ─── DATE HELPERS ─────────────────────────────────────────────
function today() {
  return new Date().toISOString().slice(0, 10);
}

function dateRange(n) {
  const days = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

function getDayTotal(state, date) {
  return (state.log[date] || []).reduce((a, e) => a + e.ml, 0);
}

function getTodayTotal(s) {
  return getDayTotal(s, today());
}

// ─── BADGE HELPERS ────────────────────────────────────────────
function getStreak(s) {
  let streak = 0;
  let d = new Date();
  while (true) {
    const key = d.toISOString().slice(0, 10);
    if (getDayTotal(s, key) >= s.goal) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else break;
  }
  return streak;
}

function getDaysGoalMet(s) {
  return Object.keys(s.log).filter(k => getDayTotal(s, k) >= s.goal).length;
}

function earlyBirdCheck(s) {
  const todayLog = s.log[today()] || [];
  return todayLog.some(e => {
    const h = new Date(e.ts).getHours();
    return h < 9;
  });
}

// ─── RENDER ───────────────────────────────────────────────────
function render() {
  renderGlass();
  renderCups();
  renderBadges();
  renderStats();
  applyTheme();
}

function renderGlass() {
  const total = getTodayTotal(state);
  const pct   = Math.min((total / state.goal) * 100, 100);

  document.getElementById('glassLiquid').style.height = pct + '%';
  document.getElementById('glassPercent').textContent = Math.round(pct) + '%';
  document.getElementById('intakeAmount').innerHTML = `${total} <span>ml</span>`;
  document.getElementById('labelGoal').textContent = state.goal + ' ml';

  const remaining = Math.max(state.goal - total, 0);
  let sub = '';
  if (total === 0) sub = 'Henüz su içmediniz. Hadi başlayalım! 🌊';
  else if (total < state.goal * 0.5) sub = `Hedefe ${remaining} ml kaldı. Devam! 💪`;
  else if (total < state.goal) sub = `Neredeyse! ${remaining} ml daha için 🎯`;
  else sub = 'Günlük hedefinize ulaştınız! Muhteşemsiniz! 🎉';

  document.getElementById('intakeSub').textContent = sub;
}

function renderCups() {
  const grid = document.getElementById('cupGrid');
  grid.innerHTML = '';
  state.cups.forEach(cup => {
    const card = document.createElement('div');
    card.className = 'cup-card';
    card.innerHTML = `
      <span class="cup-icon">${cup.icon}</span>
      <span class="cup-ml">${cup.ml} ml</span>
      <span class="cup-name">${cup.name}</span>
      <button class="cup-delete" data-id="${cup.id}" title="Sil">✕</button>
    `;
    card.addEventListener('click', (e) => {
      if (e.target.classList.contains('cup-delete')) return;
      addWater(cup.ml);
    });
    card.querySelector('.cup-delete').addEventListener('click', (e) => {
      e.stopPropagation();
      removeCup(cup.id);
    });
    grid.appendChild(card);
  });
}

function renderBadges() {
  const grid = document.getElementById('badgeGrid');
  grid.innerHTML = '';
  ALL_BADGES.forEach(b => {
    const earned = !!state.badges[b.id];
    const item = document.createElement('div');
    item.className = 'badge-item' + (earned ? ' earned' : '');
    item.innerHTML = `
      <div class="badge-icon">${b.icon}</div>
      <div class="badge-label">${b.label}</div>
    `;
    item.title = b.desc + (earned ? ` (${state.badges[b.id]})` : ' – Henüz kazanılmadı');
    grid.appendChild(item);
  });
}

function renderStats() {
  const tab = activeTab;
  let labels = [], data = [];

  if (tab === 'day') {
    // hourly today
    const hours = Array.from({length: 24}, (_, i) => i);
    const todayLog = state.log[today()] || [];
    labels = hours.map(h => h + ':00');
    data   = hours.map(h => {
      return todayLog.filter(e => new Date(e.ts).getHours() === h).reduce((a,e) => a+e.ml, 0);
    });
  } else if (tab === 'week') {
    const days = dateRange(7);
    labels = days.map(d => {
      const dt = new Date(d);
      return ['Paz','Pzt','Sal','Çar','Per','Cum','Cmt'][dt.getDay()];
    });
    data = days.map(d => getDayTotal(state, d));
  } else {
    const days = dateRange(30);
    labels = days.map((d, i) => i % 5 === 0 ? new Date(d).getDate() + '/' + (new Date(d).getMonth()+1) : '');
    data   = days.map(d => getDayTotal(state, d));
  }

  // Draw chart
  const ctx = document.getElementById('statsChart').getContext('2d');
  if (chart) chart.destroy();

  const isDark = state.theme === 'dark';
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const textColor = isDark ? '#93c5fd' : '#64748b';

  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: data.map(v => v >= state.goal ? 'rgba(6,182,212,0.85)' : 'rgba(14,165,233,0.6)'),
        borderRadius: 6,
        borderSkipped: false,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${ctx.raw} ml`
          }
        }
      },
      scales: {
        x: {
          grid: { color: gridColor },
          ticks: { color: textColor, font: { family: 'DM Sans', size: 10 } }
        },
        y: {
          grid: { color: gridColor },
          ticks: { color: textColor, font: { family: 'DM Sans', size: 10 }, callback: v => v + 'ml' },
          beginAtZero: true,
        }
      }
    }
  });

  // Summary cards
  const days = tab === 'day' ? [today()] : tab === 'week' ? dateRange(7) : dateRange(30);
  const totals = days.map(d => getDayTotal(state, d)).filter(v => v > 0);
  const avg = totals.length ? Math.round(totals.reduce((a,b) => a+b, 0) / totals.length) : 0;
  const max = totals.length ? Math.max(...totals) : 0;
  const daysHit = days.filter(d => getDayTotal(state, d) >= state.goal).length;

  const sum = document.getElementById('statsSummary');
  sum.innerHTML = `
    <div class="stat-card"><div class="stat-val">${avg}</div><div class="stat-lbl">Ort. ml</div></div>
    <div class="stat-card"><div class="stat-val">${max}</div><div class="stat-lbl">En Fazla</div></div>
    <div class="stat-card"><div class="stat-val">${daysHit}</div><div class="stat-lbl">Hedef Günü</div></div>
  `;
}

function applyTheme() {
  document.body.className = state.theme;
  document.getElementById('themeBtn').textContent = state.theme === 'dark' ? '☀️' : '🌙';
  document.querySelector('meta[name="theme-color"]').content = state.theme === 'dark' ? '#0f2035' : '#0ea5e9';
}

// ─── ACTIONS ──────────────────────────────────────────────────
function addWater(ml) {
  const key = today();
  if (!state.log[key]) state.log[key] = [];
  const entry = { ml, ts: Date.now() };
  state.log[key].push(entry);
  lastEntry = { key, entry };
  saveState();
  checkBadges();
  render();
  showToast(`+${ml} ml eklendi 💧`);

  // Ripple animation on glass
  const liquid = document.getElementById('glassLiquid');
  liquid.classList.remove('ripple');
  void liquid.offsetWidth;
  liquid.classList.add('ripple');
  setTimeout(() => liquid.classList.remove('ripple'), 600);
}

function undoLast() {
  if (!lastEntry) { showToast('Geri alınacak işlem yok.'); return; }
  const { key, entry } = lastEntry;
  const idx = (state.log[key] || []).indexOf(entry);
  if (idx !== -1) state.log[key].splice(idx, 1);
  lastEntry = null;
  saveState();
  render();
  showToast('Son işlem geri alındı ↩');
}

function removeCup(id) {
  state.cups = state.cups.filter(c => c.id !== id);
  saveState();
  renderCups();
}

function checkBadges() {
  ALL_BADGES.forEach(b => {
    if (!state.badges[b.id] && b.check(state)) {
      state.badges[b.id] = today();
      saveState();
      showBadgePopup(b);
    }
  });
}

function resetStats() {
  if (!confirm('Tüm su kayıtlarını ve rozetleri sıfırlamak istediğinize emin misiniz?')) return;
  state.log = {};
  state.badges = {};
  lastEntry = null;
  saveState();
  render();
  showToast('İstatistikler sıfırlandı 🗑️');
}

// ─── TOAST ────────────────────────────────────────────────────
let toastTimer;
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2500);
}

// ─── BADGE POPUP ──────────────────────────────────────────────
let badgeTimer;
function showBadgePopup(badge) {
  document.getElementById('badgePopupIcon').textContent  = badge.icon;
  document.getElementById('badgePopupTitle').textContent = '🎉 ' + badge.label;
  document.getElementById('badgePopupDesc').textContent  = badge.desc;
  const el = document.getElementById('badgePopup');
  el.classList.add('show');
  clearTimeout(badgeTimer);
  badgeTimer = setTimeout(() => el.classList.remove('show'), 3500);
}

// ─── MODAL HELPERS ────────────────────────────────────────────
function openModal(id) {
  document.getElementById(id).classList.add('open');
}
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

// ─── EXPORT / IMPORT ─────────────────────────────────────────
function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `hydrotrack-backup-${today()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Veriler dışa aktarıldı ✅');
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const imported = JSON.parse(e.target.result);
      if (!imported.log || !imported.goal) throw new Error('Geçersiz dosya');
      state = { ...DEFAULT_STATE, ...imported };
      saveState();
      render();
      showToast('Veriler içe aktarıldı ✅');
    } catch {
      showToast('Geçersiz yedek dosyası ❌');
    }
  };
  reader.readAsText(file);
}

// ─── EVENT LISTENERS ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  render();

  // Theme toggle
  document.getElementById('themeBtn').addEventListener('click', () => {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    saveState();
    applyTheme();
    renderStats(); // redraw chart with new theme
  });

  // Settings
  document.getElementById('settingsBtn').addEventListener('click', () => {
    document.getElementById('goalInput').value = state.goal;
    openModal('settingsModal');
  });

  document.getElementById('saveGoalBtn').addEventListener('click', () => {
    const val = parseInt(document.getElementById('goalInput').value);
    if (val >= 500 && val <= 10000) {
      state.goal = val;
      saveState();
      closeModal('settingsModal');
      render();
      showToast(`Hedef güncellendi: ${val} ml 🎯`);
    } else {
      showToast('Geçerli bir değer girin (500–10000 ml)');
    }
  });

  // Add cup
  document.getElementById('addCupBtn').addEventListener('click', () => {
    document.getElementById('cupNameInput').value = '';
    document.getElementById('cupMlInput').value = '';
    openModal('addCupModal');
  });

  document.getElementById('saveCupBtn').addEventListener('click', () => {
    const name = document.getElementById('cupNameInput').value.trim() || 'Bardak';
    const ml   = parseInt(document.getElementById('cupMlInput').value);
    if (!ml || ml < 50 || ml > 2000) { showToast('50–2000 ml arası bir değer girin'); return; }
    const icons = ['🥤','🍵','🧋','🍺','🫗','🧃','🫖'];
    state.cups.push({ id: 'c' + Date.now(), name, ml, icon: icons[Math.floor(Math.random() * icons.length)] });
    saveState();
    closeModal('addCupModal');
    renderCups();
    showToast(`${name} (${ml} ml) eklendi!`);
  });

  // Undo
  document.getElementById('undoBtn').addEventListener('click', undoLast);

  // Reset
  document.getElementById('resetBtn').addEventListener('click', resetStats);

  // Tabs
  document.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeTab = btn.dataset.tab;
      renderStats();
    });
  });

  // Close modals
  document.querySelectorAll('.close-btn').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.modal));
  });

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal(overlay.id);
    });
  });

  // Export
  document.getElementById('exportBtn').addEventListener('click', exportData);

  // Import
  document.getElementById('importFile').addEventListener('change', (e) => {
    if (e.target.files[0]) importData(e.target.files[0]);
    e.target.value = '';
  });

  // Badge popup click to dismiss
  document.getElementById('badgePopup').addEventListener('click', () => {
    document.getElementById('badgePopup').classList.remove('show');
  });
});

// ─── SERVICE WORKER REGISTRATION ─────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
