/* Level 3 — Wood Garden 🌿  (木 mù)  —  Drag & Match
 * Drag each hanzi card onto its matching picture. Pointer Events only
 * (setPointerCapture + elementFromPoint) so it works on Android touch.
 * Ends with a sentence-building bonus: 我 + 爱 + 绿色  (+15 XP).
 */
window.JDQ = window.JDQ || {};
window.JDQ.levels = window.JDQ.levels || {};

(function () {
  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  const chunk = (arr, n) => { const out = []; for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n)); return out; };

  function start(host, api) {
    const rounds = chunk(shuffle(JDQ.VOCAB.wood), 4); // 3 rounds of 4
    let r = 0, firstTryMatches = 0, xpTotal = 0;

    host.innerHTML = `
      <div class="stage-head">
        <div class="narr">🌿 Drag each word to its picture!</div>
        <div class="progress-pips" id="pips"></div>
      </div>
      <div id="play" style="flex:1;display:flex;flex-direction:column;justify-content:center;"></div>`;
    const playArea = host.querySelector('#play');
    renderPips();
    renderRound();

    function renderPips() {
      host.querySelector('#pips').innerHTML = rounds.map((_, i) =>
        `<div class="pip ${i < r ? 'done' : ''} ${i === r ? 'current' : ''}"></div>`).join('');
    }

    function renderRound() {
      if (r >= rounds.length) return sentenceBonus();
      renderPips();
      const words = rounds[r];
      let matched = 0, hintTokens = 3;
      const wrongOf = {};
      const hintedOf = {};

      const cards = shuffle(words);
      const tiles = shuffle(words);

      playArea.innerHTML = '';
      const area = JDQ.ui.el('div', 'drag-area');
      const colL = JDQ.ui.el('div', 'drag-col');
      colL.appendChild(JDQ.ui.el('div', 'col-label', 'Words'));
      const colR = JDQ.ui.el('div', 'drag-col');
      colR.appendChild(JDQ.ui.el('div', 'col-label', 'Pictures'));

      cards.forEach(w => {
        const card = JDQ.ui.el('div', 'drag-card han');
        card.innerHTML = `${w.hanzi}<span class="dc-py">${w.pinyin}</span>`;
        card.dataset.hanzi = w.hanzi;
        makeDraggable(card, w);
        colL.appendChild(card);
      });
      tiles.forEach(w => {
        const tile = JDQ.ui.el('div', 'drop-tile', w.emoji);
        tile.dataset.hanzi = w.hanzi;
        colR.appendChild(tile);
      });
      area.appendChild(colL); area.appendChild(colR);
      playArea.appendChild(area);

      // Rabbit hint
      const hintBar = JDQ.ui.el('div', 'hint-bar');
      const hintBtn = JDQ.ui.el('button', 'hint-btn', `🐰 Hint <span class="tokens">${hintTokens}</span>`);
      hintBar.appendChild(hintBtn);
      playArea.appendChild(hintBar);
      hintBtn.addEventListener('click', () => {
        if (hintTokens <= 0) return;
        const open = cards.find(w => !document.querySelector(`.drag-card[data-hanzi="${cssEsc(w.hanzi)}"]`).classList.contains('placed'));
        if (!open) return;
        hintTokens--; hintedOf[open.hanzi] = true;
        hintBtn.querySelector('.tokens').textContent = hintTokens;
        if (hintTokens <= 0) hintBtn.disabled = true;
        JDQ.sidekick.rabbitHint(open);
        const c = document.querySelector(`.drag-card[data-hanzi="${cssEsc(open.hanzi)}"]`);
        if (c) { c.classList.add('dragging'); setTimeout(() => c.classList.remove('dragging'), 600); }
      });

      // ---- Pointer Events drag ----
      let active = null;
      function makeDraggable(card, word) {
        card.addEventListener('pointerdown', (e) => {
          if (card.classList.contains('placed') || active) return;
          e.preventDefault();
          JDQ.audio.sfx('tap');
          const rect = card.getBoundingClientRect();
          const ghost = card.cloneNode(true);
          ghost.classList.add('dragging');
          Object.assign(ghost.style, {
            position: 'fixed', margin: '0', width: rect.width + 'px', height: rect.height + 'px',
            left: rect.left + 'px', top: rect.top + 'px', pointerEvents: 'none', zIndex: 90,
          });
          document.body.appendChild(ghost);
          card.style.opacity = '0.3';
          active = { card, ghost, word, pid: e.pointerId, dx: e.clientX - rect.left, dy: e.clientY - rect.top };
          try { card.setPointerCapture(e.pointerId); } catch (_) {}
        });
        card.addEventListener('pointermove', (e) => {
          if (!active || active.pid !== e.pointerId) return;
          e.preventDefault();
          active.ghost.style.left = (e.clientX - active.dx) + 'px';
          active.ghost.style.top = (e.clientY - active.dy) + 'px';
          const t = tileUnder(e.clientX, e.clientY);
          colR.querySelectorAll('.drop-tile').forEach(d =>
            d.classList.toggle('over', d === t && !d.classList.contains('filled')));
        });
        const end = (e) => {
          if (!active || active.pid !== e.pointerId) return;
          e.preventDefault();
          drop(e.clientX, e.clientY);
        };
        card.addEventListener('pointerup', end);
        card.addEventListener('pointercancel', () => { if (active) snapBack(); });
      }

      function tileUnder(x, y) {
        const el = document.elementFromPoint(x, y);
        return el ? el.closest('.drop-tile') : null;
      }

      function drop(x, y) {
        const { card, ghost, word, pid } = active;
        try { card.releasePointerCapture(pid); } catch (_) {}
        colR.querySelectorAll('.drop-tile').forEach(d => d.classList.remove('over'));
        const tile = tileUnder(x, y);
        if (tile && !tile.classList.contains('filled') && tile.dataset.hanzi === word.hanzi) {
          ghost.remove();
          card.classList.add('placed'); card.style.opacity = '';
          tile.classList.add('filled');
          tile.innerHTML = `${word.emoji}<span style="position:absolute;font-size:16px;transform:translate(18px,-16px)">✅</span>`;
          tile.style.position = 'relative';
          JDQ.audio.sfx('correct');
          JDQ.audio.playWord(word.hanzi);
          api.ui.burst(tile, ['🌿', '✨', '🍃', '🌸']);
          const clean = !wrongOf[word.hanzi] && !hintedOf[word.hanzi];
          xpTotal += clean ? 10 : 5;
          if (clean) firstTryMatches++;
          active = null;
          matched++;
          if (matched === 4) { api.ui.toast('Garden grown! 🌳', 'good'); setTimeout(() => { r++; renderRound(); }, 950); }
        } else {
          if (tile && !tile.classList.contains('filled')) {
            tile.classList.add('bounce'); setTimeout(() => tile.classList.remove('bounce'), 420);
            wrongOf[word.hanzi] = true;
            JDQ.audio.sfx('wrong');
            JDQ.sidekick.rabbitHint(word, 2600);
          }
          snapBack();
        }
      }

      function snapBack() {
        if (!active) return;
        const { card, ghost } = active;
        active = null;
        const cr = card.getBoundingClientRect();
        ghost.style.transition = 'left .2s ease, top .2s ease';
        ghost.style.left = cr.left + 'px'; ghost.style.top = cr.top + 'px';
        setTimeout(() => { ghost.remove(); card.style.opacity = ''; }, 210);
      }
    }

    // ---- Sentence bonus: 我 爱 绿色 ----
    function sentenceBonus() {
      renderPips();
      const target = [
        { hanzi: '我', pinyin: 'wǒ', en: 'I' },
        { hanzi: '爱', pinyin: 'ài', en: 'love' },
        { hanzi: '绿色', pinyin: 'lǜsè', en: 'green' },
      ];
      const distract = [{ hanzi: '火', pinyin: 'huǒ' }, { hanzi: '水', pinyin: 'shuǐ' }];
      const bank = shuffle([...target, ...distract]);
      let pos = 0;

      playArea.innerHTML = '';
      const wrap = JDQ.ui.el('div', 'sentence-build');
      wrap.appendChild(JDQ.ui.el('div', 'narr', '🌟 Bonus! Build the sentence — tap in order:'));
      wrap.appendChild(JDQ.ui.el('div', 'stat', '"I love green"'));
      const slots = JDQ.ui.el('div', 'sentence-slots');
      target.forEach(() => slots.appendChild(JDQ.ui.el('div', 'slot han', '')));
      wrap.appendChild(slots);
      const bankEl = JDQ.ui.el('div', 'word-bank');
      bank.forEach(w => {
        const b = JDQ.ui.el('button', 'bank-word han', w.hanzi);
        b.addEventListener('click', () => {
          if (pos >= target.length) return;
          if (w.hanzi === target[pos].hanzi) {
            b.classList.add('used');
            const slot = slots.children[pos];
            slot.textContent = w.hanzi; slot.classList.add('filled');
            JDQ.audio.sfx('tap'); JDQ.audio.playWord(w.hanzi);
            pos++;
            if (pos === target.length) winBonus();
          } else {
            b.classList.add('shake'); JDQ.audio.sfx('wrong');
            setTimeout(() => b.classList.remove('shake'), 420);
          }
        });
        bankEl.appendChild(b);
      });
      wrap.appendChild(bankEl);
      const skip = JDQ.ui.el('button', 'btn ghost', 'Skip bonus ›');
      skip.style.marginTop = '14px';
      skip.addEventListener('click', finish);
      wrap.appendChild(skip);
      playArea.appendChild(wrap);

      function winBonus() {
        xpTotal += 15;
        JDQ.audio.sfx('combo');
        api.ui.burst(slots, ['🌸', '✨', '💚', '🌟']);
        api.ui.toast('+15 XP bonus! 🌟', 'good');
        setTimeout(() => { JDQ.audio.playWord('我爱绿色'); }, 300);
        setTimeout(finish, 1200);
      }
    }

    function finish() {
      const stars = firstTryMatches >= 11 ? 3 : firstTryMatches >= 8 ? 2 : 1;
      api.complete({ stars, xp: xpTotal, accuracy: firstTryMatches / 12 });
    }
  }

  function cssEsc(s) { return (window.CSS && CSS.escape) ? CSS.escape(s) : s; }

  JDQ.levels.wood = { start };
})();
