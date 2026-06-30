/* Level 4 — Fire Shield 🔥  (火 huǒ)  —  Speed Dodge
 * Tap the FIRE words to collect them. Don't tap WATER words — water puts
 * out your fire (lose a heart). Snake throws up a shield every ~25s.
 * Speeds up every 4 collected. Survive 60 seconds.
 */
window.JDQ = window.JDQ || {};
window.JDQ.levels = window.JDQ.levels || {};

(function () {
  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  const pick = (a) => a[Math.floor(Math.random() * a.length)];

  function start(host, api) {
    const DURATION = 60;          // seconds
    let hearts = 3, collected = 0, xpTotal = 0;
    let fallSpeed = 0.10;         // px per ms
    let spawnEvery = 1100;        // ms
    let shielded = false;
    let running = true;
    let t0 = Date.now(), lastSpawn = 0, lastSnake = 0, lastFrame = Date.now();

    host.innerHTML = `
      <div class="stage-head">
        <div class="hearts" id="hearts">❤️❤️❤️</div>
        <div class="narr"><span id="timer">60</span>s · 🔥 collected: <span id="score">0</span></div>
      </div>
      <div id="field" style="flex:1;position:relative;overflow:hidden;border-radius:18px;background:rgba(0,0,0,.12);margin-top:6px;"></div>
      <div class="speak-note">Tap 🔥 fire words · avoid 💧 water words</div>`;
    const field = host.querySelector('#field');
    const heartsEl = host.querySelector('#hearts');
    const timerEl = host.querySelector('#timer');
    const scoreEl = host.querySelector('#score');

    const tiles = []; // {el, word, good, y, x, dead}

    function spawn() {
      const good = Math.random() < 0.6;
      const word = good ? pick(JDQ.VOCAB.fire) : pick(JDQ.VOCAB.water);
      const el = JDQ.ui.el('button', 'fall-tile han', `${word.hanzi}<span style="display:block;font-family:var(--font-en);font-size:12px;opacity:.8">${word.pinyin}</span>`);
      const w = field.clientWidth || 320;
      const x = Math.max(6, Math.random() * (w - 78));
      Object.assign(el.style, {
        position: 'absolute', left: x + 'px', top: '-72px',
        minWidth: '70px', minHeight: '70px', padding: '6px 10px',
        borderRadius: '16px', fontSize: '30px', fontWeight: '700',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        border: '2px solid', color: '#fff',
        background: good ? 'linear-gradient(160deg,#FF8A65,#c62828)' : 'linear-gradient(160deg,#4FC3F7,#0277BD)',
        borderColor: good ? '#FFD54F' : '#B3E5FC',
        boxShadow: '0 6px 16px rgba(0,0,0,.4)', touchAction: 'manipulation',
      });
      const rec = { el, word, good, x, y: -72, dead: false };
      el.addEventListener('pointerdown', (e) => { e.preventDefault(); onTap(rec); });
      field.appendChild(el);
      tiles.push(rec);
    }

    function onTap(rec) {
      if (rec.dead || !running) return;
      if (rec.good) {
        rec.dead = true;
        collected++;
        xpTotal += 5;
        scoreEl.textContent = collected;
        JDQ.audio.sfx('correct');
        api.ui.burst(rec.el, ['🔥', '✨', '💥', '⚡']);
        rec.el.remove();
        if (collected % 4 === 0) { fallSpeed += 0.02; spawnEvery = Math.max(650, spawnEvery - 90); api.ui.toast('Speeding up! 🔥', 'good'); }
      } else {
        // water tapped
        if (shielded) { JDQ.audio.sfx('tap'); rec.dead = true; rec.el.remove(); api.ui.toast('Blocked! 🐍', 'good'); return; }
        rec.dead = true; rec.el.remove();
        hearts--;
        heartsEl.textContent = '❤️'.repeat(hearts) + '🖤'.repeat(3 - hearts);
        JDQ.audio.sfx('hit');
        api.ui.toast('Water put out your fire! 💧', 'bad');
        if (hearts <= 0) return end();
      }
    }

    function loop() {
      if (!running) return;
      if (!document.body.contains(field)) { running = false; return; } // unmounted
      const now = Date.now();
      const dt = now - lastFrame; lastFrame = now;
      const elapsed = (now - t0) / 1000;
      timerEl.textContent = Math.max(0, Math.ceil(DURATION - elapsed));

      if (now - lastSpawn > spawnEvery) { spawn(); lastSpawn = now; }

      // Snake shield every ~25s
      if (now - lastSnake > 25000) {
        lastSnake = now; shielded = true;
        JDQ.sidekick.snakeBlock();
        field.style.outline = '3px solid #7CFFB2';
        setTimeout(() => { shielded = false; field.style.outline = 'none'; }, 5000);
      }

      const h = field.clientHeight || 480;
      for (const rec of tiles) {
        if (rec.dead) continue;
        rec.y += fallSpeed * dt;
        rec.el.style.top = rec.y + 'px';
        if (rec.y > h) { rec.dead = true; rec.el.remove(); }
      }
      // cleanup dead
      for (let i = tiles.length - 1; i >= 0; i--) if (tiles[i].dead) tiles.splice(i, 1);

      if (elapsed >= DURATION) return end(true);
      requestAnimationFrame(loop);
    }

    function end(survived) {
      if (!running) return;
      running = false;
      tiles.forEach(r => r.el.remove());
      let stars;
      if (survived && hearts > 0) stars = collected >= 18 ? 3 : collected >= 10 ? 2 : 1;
      else stars = 1;
      api.complete({ stars, xp: xpTotal, accuracy: Math.min(1, collected / 20) });
    }

    requestAnimationFrame(loop);
  }

  JDQ.levels.fire = { start };
})();
