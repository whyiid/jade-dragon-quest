/* Jade Dragon Quest — progress.js
 * All persistence in localStorage under `jadedragon.v1`.
 */
window.JDQ = window.JDQ || {};

(function () {
  const KEY = 'jadedragon.v1';

  const DEFAULT = {
    xp: 0,
    levels: {},          // { "1": { stars, xp, accuracy, cleared:true } }
    starsToday: 0,
    sessionDate: '',     // yyyy-mm-dd of today's stars
    settings: {},
  };

  function todayStr() {
    const d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }

  let state = load();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return clone(DEFAULT);
      const parsed = JSON.parse(raw);
      return Object.assign(clone(DEFAULT), parsed);
    } catch (e) {
      return clone(DEFAULT);
    }
  }

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }

  function reset() {
    state = clone(DEFAULT);
    save();
  }

  // --- XP ---
  function getXP() { return state.xp; }
  function addXP(n) {
    state.xp += n;
    save();
    return state.xp;
  }

  // --- Stars today (for break screen) ---
  function rollDay() {
    const t = todayStr();
    if (state.sessionDate !== t) {
      state.sessionDate = t;
      state.starsToday = 0;
    }
  }
  function addStarsToday(n) {
    rollDay();
    state.starsToday += n;
    save();
  }
  function getStarsToday() {
    rollDay();
    return state.starsToday;
  }

  // --- Levels ---
  function getLevel(id) {
    return state.levels[String(id)] || null;
  }

  // Record a finished level. Keeps the best stars/xp ever earned.
  function recordLevel(id, result) {
    const k = String(id);
    const prev = state.levels[k] || { stars: 0, xp: 0, cleared: false };
    const stars = Math.max(prev.stars, result.stars || 0);
    state.levels[k] = {
      stars,
      xp: Math.max(prev.xp, result.xp || 0),
      accuracy: result.accuracy != null ? result.accuracy : prev.accuracy,
      cleared: true,
    };
    if (result.starsEarned) addStarsToday(result.starsEarned);
    save();
    return state.levels[k];
  }

  // Level N unlocked when level N-1 is cleared. Level 1 always open.
  function isLevelUnlocked(id) {
    if (id <= 1) return true;
    const prev = state.levels[String(id - 1)];
    return !!(prev && prev.cleared);
  }

  // --- Dog evolution stage (0..5) = highest consecutive cleared level ---
  function dogStage() {
    let stage = 0;
    for (let i = 1; i <= 5; i++) {
      const lv = state.levels[String(i)];
      if (lv && lv.cleared) stage = i; else break;
    }
    return stage;
  }

  // --- Zodiac unlocks ---
  // Returns Set of english names unlocked.
  function unlockedZodiac() {
    const set = new Set(['dog']);                     // always
    if (getLevel(2)) set.add('snake');                // after Level 2
    if (getLevel(3)) set.add('rabbit');               // after Level 3
    if (getLevel(5)) set.add('dragon');               // after Level 5
    // XP milestones for the remaining 8 (rat, ox, tiger, horse, goat, monkey, rooster, pig)
    const milestones = [
      ['rat', 50], ['ox', 100], ['tiger', 150], ['horse', 200],
      ['goat', 300], ['monkey', 400], ['rooster', 500], ['pig', 600],
    ];
    milestones.forEach(([name, xp]) => { if (state.xp >= xp) set.add(name); });
    return set;
  }

  // --- Stars from accuracy helper (shared by levels) ---
  function starsFromAccuracy(acc) {
    if (acc >= 0.9) return 3;
    if (acc >= 0.7) return 2;
    return 1;
  }

  JDQ.progress = {
    load, save, reset,
    getXP, addXP,
    addStarsToday, getStarsToday,
    getLevel, recordLevel, isLevelUnlocked,
    dogStage, unlockedZodiac, starsFromAccuracy,
    get state() { return state; },
  };
})();
