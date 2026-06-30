/* Level 5 — Dragon Boss 🐉  (龙 lóng)  —  Triple Combo
 * Charge the power chain in order: Metal → Water → Wood (金→水→木),
 * then unleash the chant 金水木 to strike the dragon. 3 combos to win.
 * The dragon can't beat you — it's the finale — and turns friendly at the end.
 */
window.JDQ = window.JDQ || {};
window.JDQ.levels = window.JDQ.levels || {};

(function () {
  const CHAIN = [
    { key: 'metal', orb: '⚙️', han: '金' },
    { key: 'water', orb: '💧', han: '水' },
    { key: 'wood',  orb: '🌿', han: '木' },
  ];
  const CHANT = { hanzi: '金水木', pinyin: 'jīn shuǐ mù', en: 'metal water wood' };
  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  function start(host, api) {
    const TOTAL_COMBOS = 3;
    let dragonHP = TOTAL_COMBOS;
    let comboIdx = 0, elemPos = 0;
    let cleanPicks = 0, totalPicks = 0, xpTotal = 0;
    const used = {};                 // avoid repeating review words
    const charged = [false, false, false];

    host.innerHTML = `
      <div class="stage-head">
        <div id="dragon-area" class="col-center">
          <div id="dragon" style="font-size:78px;line-height:1;filter:drop-shadow(0 6px 14px rgba(0,0,0,.5))">🐲</div>
          <div id="dhp" class="hearts"></div>
        </div>
        <div class="narr">Charge the power chain — Metal ▸ Water ▸ Wood!</div>
        <div id="orbs" class="progress-pips" style="gap:14px;font-size:34px;"></div>
      </div>
      <div id="play" class="col-center" style="flex:1;justify-content:center;"></div>`;
    const playArea = host.querySelector('#play');
    renderHP(); renderOrbs();
    nextElement();

    function renderHP() {
      host.querySelector('#dhp').textContent = '🟣'.repeat(dragonHP) + '⚫'.repeat(TOTAL_COMBOS - dragonHP);
    }
    function renderOrbs() {
      host.querySelector('#orbs').innerHTML = CHAIN.map((c, i) =>
        `<span style="opacity:${charged[i] ? 1 : 0.28};filter:${charged[i] ? 'drop-shadow(0 0 10px var(--gold))' : 'grayscale(1)'}">${c.orb}</span>`
        + (i < 2 ? '<span style="font-size:18px;opacity:.5">▸</span>' : '')).join('');
    }

    function reviewWord(key) {
      const pool = JDQ.VOCAB[key].filter(w => !used[w.hanzi]);
      const list = pool.length ? pool : JDQ.VOCAB[key];
      const w = list[Math.floor(Math.random() * list.length)];
      used[w.hanzi] = true;
      return w;
    }

    function nextElement() {
      if (elemPos >= CHAIN.length) return showUnleash();
      const c = CHAIN[elemPos];
      const word = reviewWord(c.key);
      let solved = false, missed = false;

      playArea.innerHTML = '';
      playArea.appendChild(JDQ.ui.el('div', 'narr', `Charge the ${c.han} ${c.orb} orb:`));
      const prompt = api.ui.wordCard({ hanzi: word.hanzi, pinyin: word.pinyin, en: '???' }, { small: true });
      prompt.querySelector('.en').textContent = 'Which picture?';
      playArea.appendChild(prompt);

      const distract = shuffle(JDQ.VOCAB[c.key].filter(w => w.hanzi !== word.hanzi)).slice(0, 2);
      const tiles = shuffle([word, ...distract]);
      const grid = JDQ.ui.el('div', 'tile-grid');
      grid.style.gridTemplateColumns = 'repeat(3,1fr)';
      tiles.forEach(t => {
        const tile = JDQ.ui.el('button', 'tile', t.emoji);
        tile.addEventListener('click', () => {
          if (solved) return;
          if (t.hanzi === word.hanzi) {
            solved = true; totalPicks++;
            if (!missed) cleanPicks++;
            xpTotal += missed ? 4 : 8;
            tile.classList.add('correct');
            JDQ.audio.sfx('correct'); JDQ.audio.playWord(word.hanzi);
            api.ui.burst(tile, [CHAIN[elemPos].orb, '✨', '⭐']);
            charged[elemPos] = true; renderOrbs();
            grid.querySelectorAll('.tile').forEach(x => x.classList.add('disabled'));
            elemPos++;
            setTimeout(nextElement, 850);
          } else {
            missed = true;
            tile.classList.add('wrong', 'disabled');
            JDQ.audio.sfx('wrong');
            JDQ.sidekick.rabbitHint(word);
            setTimeout(() => tile.classList.remove('wrong'), 420);
          }
        });
        grid.appendChild(tile);
      });
      playArea.appendChild(grid);
      setTimeout(() => JDQ.audio.playWord(word.hanzi), 250);
    }

    function showUnleash() {
      playArea.innerHTML = '';
      playArea.appendChild(JDQ.ui.el('div', 'narr', '⚡ All charged! Unleash the chant!'));
      const chant = api.ui.wordCard(CHANT);
      playArea.appendChild(chant);

      const btn = JDQ.ui.el('button', 'btn big', '⚡ Unleash 金水木!');
      playArea.appendChild(btn);

      const note = JDQ.ui.el('div', 'speak-note',
        JDQ.audio.recognitionSupported() ? '🎤 Bonus: tap Unleash, or say it for +10 XP!' : '');
      playArea.appendChild(note);

      let done = false;
      const fire = (bonus) => {
        if (done) return; done = true;
        if (bonus) { xpTotal += 10; api.ui.toast('Chant power! +10 ⚡', 'good'); }
        strike();
      };
      btn.addEventListener('click', () => fire(false));

      if (JDQ.audio.recognitionSupported()) {
        const mic = JDQ.ui.el('button', 'mic-btn', '🎤');
        mic.style.marginTop = '8px';
        playArea.appendChild(mic);
        mic.addEventListener('click', async () => {
          if (done) return;
          mic.classList.add('listening');
          try {
            const res = await JDQ.audio.listen(() => {});
            mic.classList.remove('listening');
            fire(JDQ.audio.matchSpoken(res, CHANT));
          } catch (_) { mic.classList.remove('listening'); }
        });
      }
      setTimeout(() => JDQ.audio.playWord(CHANT.hanzi), 300);
    }

    function strike() {
      JDQ.audio.sfx('combo');
      const d = host.querySelector('#dragon');
      d.classList.add('shake');
      api.ui.burst(d, ['💥', '⚡', '✨', '🔥']);
      dragonHP--; renderHP();
      charged[0] = charged[1] = charged[2] = false;
      setTimeout(() => d.classList.remove('shake'), 420);
      comboIdx++; elemPos = 0;
      if (dragonHP <= 0) return setTimeout(victory, 700);
      api.ui.toast(`Combo ${comboIdx}! Dragon hit! 🐉`, 'good');
      renderOrbs();
      setTimeout(nextElement, 900);
    }

    function victory() {
      const d = host.querySelector('#dragon');
      d.textContent = '🐉';
      d.style.transition = 'transform .5s ease';
      d.style.transform = 'scale(1.25)';
      JDQ.audio.sfx('star');
      api.ui.burst(d, ['🎉', '🐉', '⭐', '✨', '🏆']);
      host.querySelector('.narr').textContent = 'The dragon is your friend now! 🐉💛';
      playArea.innerHTML = '';
      const msg = api.ui.wordCard({ hanzi: '龙', pinyin: 'lóng', en: 'dragon' });
      playArea.appendChild(msg);
      setTimeout(() => {
        const stars = cleanPicks >= 8 ? 3 : cleanPicks >= 5 ? 2 : 1;
        api.complete({ stars, xp: xpTotal, accuracy: totalPicks ? cleanPicks / totalPicks : 1 });
      }, 1400);
    }
  }

  JDQ.levels.dragon = { start };
})();
