/* Jade Dragon Quest — app.js
 * Router + game engine + shared UI helpers + break timer + boot.
 */
window.JDQ = window.JDQ || {};

(function () {
  const app = document.getElementById('app');

  // ---------- small DOM helper ----------
  function el(tag, cls, html) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  // ---------- shared UI ----------
  const ui = {
    el,

    setTheme(theme) { app.setAttribute('data-theme', theme); },

    // Replace whole screen with a fresh .screen node; return it.
    screen(theme) {
      this.setTheme(theme || 'worldmap');
      app.innerHTML = '';
      const s = el('div', 'screen');
      app.appendChild(s);
      return s;
    },

    header(title, onBack) {
      const hud = el('div', 'hud');
      const back = el('button', 'btn-back', '‹');
      back.setAttribute('aria-label', 'Back');
      back.addEventListener('click', () => { JDQ.audio.sfx('tap'); (onBack || JDQ.router.toMap)(); });
      hud.appendChild(back);
      if (title) {
        const t = el('div', 'wc-name', title);
        t.style.fontSize = '18px';
        hud.appendChild(t);
      }
      hud.appendChild(el('div', 'spacer'));
      const xp = el('div', 'xp-pill', `<span class="star">★</span> <span id="xp-val">${JDQ.progress.getXP()}</span> XP`);
      hud.appendChild(xp);
      return hud;
    },

    refreshXP() {
      const v = document.getElementById('xp-val');
      if (v) v.textContent = JDQ.progress.getXP();
    },

    toast(text, kind) {
      const t = el('div', 'toast ' + (kind || ''), text);
      app.appendChild(t);
      setTimeout(() => t.remove(), 950);
    },

    // particle burst at element center
    burst(target, emojis) {
      const r = (target.getBoundingClientRect && target.getBoundingClientRect()) || { left: innerWidth/2, top: innerHeight/2, width:0, height:0 };
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const set = emojis || ['✨', '⭐', '💫', '🌟'];
      for (let i = 0; i < 8; i++) {
        const p = el('div', 'particle', set[i % set.length]);
        p.style.left = cx + 'px'; p.style.top = cy + 'px';
        const ang = (Math.PI * 2 * i) / 8;
        p.style.setProperty('--dx', Math.cos(ang) * 90 + 'px');
        p.style.setProperty('--dy', Math.sin(ang) * 90 + 'px');
        app.appendChild(p);
        setTimeout(() => p.remove(), 720);
      }
    },

    // dog with evolution badges for a given stage 0..5
    dog(stage, extraClass) {
      const d = el('div', 'dog ' + (extraClass || ''));
      d.appendChild(el('div', null, '🐶'));
      if (stage >= 1) d.appendChild(el('div', 'badge b-paws', '⚙️'));
      if (stage >= 2) d.appendChild(el('div', 'badge b-tail', '💧'));
      if (stage >= 3) d.appendChild(el('div', 'badge b-crown', '🍃'));
      if (stage >= 4) d.appendChild(el('div', 'badge b-shield', '🛡️'));
      if (stage >= 5) d.appendChild(el('div', 'badge b-dragon', '🐲'));
      return d;
    },

    // standard word display (hanzi / pinyin / english) + replay button
    wordCard(word, opts) {
      opts = opts || {};
      const c = el('div', 'word-card' + (opts.small ? ' small' : ''));
      c.innerHTML = `
        <div class="hanzi han">${word.hanzi}</div>
        <div class="pinyin">${word.pinyin}</div>
        <div class="en">"${word.en}"</div>`;
      if (opts.replay !== false) {
        const r = el('button', 'replay-btn', '🔊');
        r.addEventListener('click', () => JDQ.audio.playWord(word.hanzi));
        c.appendChild(r);
      }
      return c;
    },

    // Result / star screen shared by all levels.
    result(host, data) {
      const { stars, xp, accuracy, levelName, levelId, onReplay } = data;
      JDQ.audio.sfx('star');
      host.innerHTML = '';
      const wrap = el('div', 'result');
      const stage = JDQ.progress.dogStage();
      wrap.appendChild(this.dog(stage, 'bounce-idle'));
      wrap.appendChild(el('h2', null, levelName + ' cleared!'));
      const starHtml = [1, 2, 3].map(i =>
        `<span class="${i <= stars ? 'on' : 'off'}">★</span>`).join('');
      wrap.appendChild(el('div', 'stars-big', starHtml));
      if (accuracy != null) wrap.appendChild(el('div', 'stat', `Accuracy: ${Math.round(accuracy * 100)}%`));
      wrap.appendChild(el('div', 'stat', `+${xp} XP earned`));

      const row = el('div', 'btn-row');
      const replay = el('button', 'btn ghost', '↻ Play again');
      replay.addEventListener('click', () => { JDQ.audio.sfx('tap'); onReplay(); });
      row.appendChild(replay);

      const nextId = levelId + 1;
      if (nextId <= 5 && JDQ.progress.isLevelUnlocked(nextId)) {
        const next = el('button', 'btn', 'Next level ›');
        next.addEventListener('click', () => { JDQ.audio.sfx('tap'); JDQ.router.toLevel(nextId); });
        row.appendChild(next);
      } else {
        const map = el('button', 'btn', 'World map ›');
        map.addEventListener('click', () => { JDQ.audio.sfx('tap'); JDQ.router.toMap(); });
        row.appendChild(map);
      }
      wrap.appendChild(row);
      host.appendChild(wrap);
    },
  };

  // ---------- world map ----------
  function renderMap() {
    breakTimer.tick(); // keep timer alive on navigation
    const s = ui.screen('worldmap');

    const hud = el('div', 'hud');
    hud.appendChild(el('div', 'spacer'));
    hud.appendChild(el('div', 'xp-pill', `<span class="star">★</span> <span id="xp-val">${JDQ.progress.getXP()}</span> XP`));
    s.appendChild(hud);

    const title = el('div', 'wm-title', `
      <div class="sub">Five Elements Quest</div>
      <h1>Jade Dragon Quest 🐉</h1>`);
    s.appendChild(title);

    const hero = el('div', 'wm-hero');
    hero.appendChild(ui.dog(JDQ.progress.dogStage(), 'bounce-idle'));
    s.appendChild(hero);

    const scroll = el('div', 'wm-scroll');
    const grid = el('div', 'world-grid');
    JDQ.LEVELS.forEach(lv => {
      const unlocked = JDQ.progress.isLevelUnlocked(lv.id);
      const saved = JDQ.progress.getLevel(lv.id);
      const stars = saved ? saved.stars : 0;
      const card = el('div', `world-card ${lv.key} ${unlocked ? '' : 'locked'}`);
      const starStr = unlocked && saved
        ? '★'.repeat(stars) + '☆'.repeat(3 - stars)
        : (unlocked ? '' : '');
      card.innerHTML = `
        <div class="wc-emoji">${lv.emoji}</div>
        <div class="wc-name">Level ${lv.id}</div>
        <div class="wc-name">${lv.name}</div>
        <div class="wc-han han">${lv.element} · ${lv.mechanic}</div>
        <div class="wc-stars">${starStr}</div>`;
      if (unlocked) {
        card.addEventListener('click', () => { JDQ.audio.sfx('tap'); JDQ.router.toLevel(lv.id); });
      }
      grid.appendChild(card);
    });
    scroll.appendChild(grid);

    const zwrap = el('div', 'wm-zodiac');
    const zbtn = el('button', 'btn-zodiac', '🐾 Zodiac Collection');
    zbtn.addEventListener('click', () => { JDQ.audio.sfx('tap'); JDQ.router.toZodiac(); });
    zwrap.appendChild(zbtn);
    scroll.appendChild(zwrap);

    const reset = el('button', 'btn-reset', 'Reset all progress');
    reset.addEventListener('click', () => {
      if (confirm('Reset all stars and XP? This cannot be undone.')) {
        JDQ.progress.reset(); renderMap();
      }
    });
    scroll.appendChild(reset);

    s.appendChild(scroll);
  }

  // ---------- level host ----------
  function renderLevel(id) {
    breakTimer.tick();
    const lv = JDQ.LEVELS.find(l => l.id === id);
    if (!lv) return renderMap();
    if (!JDQ.progress.isLevelUnlocked(id)) return renderMap();

    const s = ui.screen(lv.key === 'dragon' ? 'dragon' : lv.key);
    s.appendChild(ui.header(`Level ${id} · ${lv.name}`, JDQ.router.toMap));
    const host = el('div', 'stage');
    s.appendChild(host);

    const api = {
      levelId: id,
      meta: lv,
      ui,
      complete(result) { onLevelComplete(id, lv, host, result); },
    };

    const mod = JDQ.levels[lv.key];
    if (mod && typeof mod.start === 'function') {
      mod.start(host, api);
    } else {
      host.appendChild(el('div', 'result', `<h2>Coming soon</h2>`));
    }
  }

  function onLevelComplete(id, lv, host, result) {
    // result: { stars, xp, accuracy }
    const prev = JDQ.progress.getLevel(id);
    const prevStars = prev ? prev.stars : 0;
    const newStarGain = Math.max(0, (result.stars || 0) - prevStars); // only count improvement today
    JDQ.progress.recordLevel(id, {
      stars: result.stars,
      xp: result.xp,
      accuracy: result.accuracy,
      starsEarned: result.stars,           // count session stars for the break screen
    });
    ui.refreshXP();
    ui.result(host, {
      stars: result.stars,
      xp: result.xp,
      accuracy: result.accuracy,
      levelName: lv.name,
      levelId: id,
      onReplay: () => renderLevel(id),
    });
  }

  // ---------- router ----------
  JDQ.router = {
    toMap() { renderMap(); },
    toLevel(id) { renderLevel(id); },
    toZodiac() {
      breakTimer.tick();
      const s = ui.screen('zodiac');
      s.appendChild(ui.header('Zodiac Collection', JDQ.router.toMap));
      const host = el('div', 'stage');
      s.appendChild(host);
      JDQ.zodiac.start(host, { ui });
    },
  };

  // ---------- break timer (15 min) ----------
  const breakTimer = (function () {
    const LIMIT = 15 * 60 * 1000;   // 15 minutes
    const SNOOZE = 5 * 60 * 1000;   // 5 more minutes
    let elapsed = 0;
    let last = Date.now();
    let threshold = LIMIT;
    let snoozeUsed = false;
    let showing = false;
    let paused = false;

    function tick() {
      const now = Date.now();
      if (!paused && !document.hidden) {
        const dt = now - last;
        if (dt > 0 && dt < 5000) elapsed += dt; // ignore long gaps (tab away)
      }
      last = now;
      if (!showing && elapsed >= threshold) showBreak();
    }
    setInterval(tick, 1000);
    document.addEventListener('visibilitychange', () => { last = Date.now(); });

    function showBreak() {
      showing = true; paused = true;
      const ov = el('div', 'overlay');
      const stars = JDQ.progress.getStarsToday();
      ov.innerHTML = `
        <div class="dog-yawn">🐶</div>
        <h2>Time for a break!</h2>
        <p>You've been learning for 15 minutes.<br>Great work today, Matthew! 🌟</p>
        <p class="stat">⭐ ${stars} stars earned today</p>`;
      const row = el('div', 'btn-row');
      const take = el('button', 'btn big', 'Take a Break');
      take.addEventListener('click', () => {
        elapsed = 0; threshold = LIMIT; snoozeUsed = false;
        showing = false; paused = false; ov.remove();
      });
      row.appendChild(take);
      if (!snoozeUsed) {
        const more = el('button', 'btn ghost', '5 More Minutes');
        more.addEventListener('click', () => {
          snoozeUsed = true; threshold = elapsed + SNOOZE;
          showing = false; paused = false; ov.remove();
        });
        row.appendChild(more);
      }
      ov.appendChild(row);
      app.appendChild(ov);
    }

    return { tick };
  })();
  JDQ.breakTimer = breakTimer;

  // ---------- boot ----------
  function boot() {
    // unlock audio context + warm voices on first gesture
    const unlock = () => { JDQ.audio.unlock(); try { speechSynthesis.getVoices(); } catch (e) {} document.removeEventListener('pointerdown', unlock); };
    document.addEventListener('pointerdown', unlock);

    // service worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(() => {});
      });
    }

    renderMap();
  }

  JDQ.ui = ui;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
