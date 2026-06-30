/* Level 1 — Metal Forge ⚙️  (金 jīn)  —  Listen & Choose
 * Forge a Metal shield: each correct answer adds a shield segment.
 */
window.JDQ = window.JDQ || {};
window.JDQ.levels = window.JDQ.levels || {};

(function () {
  const GOOD = ['Amazing!', 'You got it!', 'Excellent!', 'Perfect!'];
  const BAD = ['Oops! Try again!', 'Almost there!', 'One more time!'];
  const rand = (a) => a[Math.floor(Math.random() * a.length)];
  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  function start(host, api) {
    const words = shuffle(JDQ.VOCAB.metal);
    const pool = JDQ.VOCAB.metal;          // distractor pool
    let idx = 0;
    let firstTryCorrect = 0;
    let xpTotal = 0;
    let streak = 0;
    let hintTokens = 3;
    const shield = new Array(words.length).fill(false);

    host.innerHTML = `
      <div class="stage-head">
        <div class="narr">🔥 Forge the Metal shield — listen, then tap the picture!</div>
        <div class="shield-track" id="shield"></div>
        <div class="progress-pips" id="pips"></div>
      </div>
      <div id="play" class="col-center" style="flex:1;justify-content:center;"></div>`;

    const playArea = host.querySelector('#play');
    renderShield();
    renderPips();
    showWord();

    function renderShield() {
      const c = host.querySelector('#shield');
      c.innerHTML = shield.map(on => `<div class="shield-seg ${on ? 'on' : ''}"></div>`).join('');
    }
    function renderPips() {
      const c = host.querySelector('#pips');
      c.innerHTML = words.map((_, i) =>
        `<div class="pip ${i < idx ? 'done' : ''} ${i === idx ? 'current' : ''}"></div>`).join('');
    }

    function showWord() {
      if (idx >= words.length) return finish();
      renderPips();
      const word = words[idx];
      let wrongCount = 0, hintUsed = false, solved = false;

      // build 4 tiles: 1 correct + 3 distractors
      const distractors = shuffle(pool.filter(w => w.hanzi !== word.hanzi)).slice(0, 3);
      const tiles = shuffle([word, ...distractors]);

      playArea.innerHTML = '';
      // prompt: show hanzi + pinyin (teach the character) + replay; english hidden until solved
      const prompt = api.ui.wordCard({ hanzi: word.hanzi, pinyin: word.pinyin, en: '???' }, { small: true });
      prompt.querySelector('.en').textContent = 'Which picture?';
      playArea.appendChild(prompt);

      // hint bar (Rabbit)
      const hintBar = JDQ.ui.el('div', 'hint-bar');
      const hintBtn = JDQ.ui.el('button', 'hint-btn', `🐰 Hint <span class="tokens">${hintTokens}</span>`);
      hintBtn.disabled = hintTokens <= 0;
      hintBtn.addEventListener('click', () => {
        if (hintTokens <= 0) return;
        hintTokens--; hintUsed = true;
        hintBtn.querySelector('.tokens').textContent = hintTokens;
        if (hintTokens <= 0) hintBtn.disabled = true;
        JDQ.sidekick.rabbitHint(word);
      });
      hintBar.appendChild(hintBtn);
      playArea.appendChild(hintBar);

      const grid = JDQ.ui.el('div', 'tile-grid');
      tiles.forEach(t => {
        const tile = JDQ.ui.el('button', 'tile', t.emoji);
        tile.addEventListener('click', () => {
          if (solved) return;
          if (t.hanzi === word.hanzi) {
            solved = true;
            tile.classList.add('correct');
            JDQ.audio.sfx('correct');
            JDQ.audio.playWord(word.hanzi);
            api.ui.burst(tile, ['✨', '⭐', '🥇', '💫']);
            // reveal english
            prompt.querySelector('.en').textContent = `"${word.en}"`;
            // scoring
            let gained = hintUsed ? 3 : (wrongCount === 0 ? 10 : 5);
            xpTotal += gained;
            if (wrongCount === 0 && !hintUsed) firstTryCorrect++;
            streak = (wrongCount === 0 && !hintUsed) ? streak + 1 : 0;
            shield[idx] = true; renderShield();
            if (streak === 3) api.ui.toast('3 in a row! On fire! 🔥', 'good');
            else api.ui.toast(rand(GOOD), 'good');
            // lock tiles
            grid.querySelectorAll('.tile').forEach(x => x.classList.add('disabled'));
            setTimeout(() => { idx++; showWord(); }, 900);
          } else {
            wrongCount++;
            streak = 0;
            tile.classList.add('wrong');
            tile.classList.add('disabled');
            JDQ.audio.sfx('wrong');
            api.ui.toast(rand(BAD), 'bad');
            JDQ.sidekick.rabbitHint(word);
            setTimeout(() => tile.classList.remove('wrong'), 420);
          }
        });
        grid.appendChild(tile);
      });
      playArea.appendChild(grid);

      // auto-play the word
      setTimeout(() => JDQ.audio.playWord(word.hanzi), 250);
    }

    function finish() {
      const n = words.length;
      const stars = firstTryCorrect >= 11 ? 3 : firstTryCorrect >= 8 ? 2 : 1;
      api.complete({ stars, xp: xpTotal, accuracy: firstTryCorrect / n });
    }
  }

  JDQ.levels.metal = { start };
})();
