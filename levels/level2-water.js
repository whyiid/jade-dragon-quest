/* Level 2 — Water Flow 💧  (水 shuǐ)  —  Speak!
 * Say each word out loud. Snake helps after 2 misses.
 * Falls back to Type Mode (keyboard) when speech recognition isn't available.
 */
window.JDQ = window.JDQ || {};
window.JDQ.levels = window.JDQ.levels || {};

(function () {
  const rand = (a) => a[Math.floor(Math.random() * a.length)];
  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  const norm = (s) => (s || '').toLowerCase().replace(/\s+/g, '').replace(/[1-5]/g, '');

  function start(host, api) {
    const words = shuffle(JDQ.VOCAB.water);
    let idx = 0, firstTryCorrect = 0, xpTotal = 0;

    host.innerHTML = `
      <div class="stage-head">
        <div class="narr">🌊 Say each word to make the river flow!</div>
        <div class="progress-pips" id="pips"></div>
      </div>
      <div id="play" class="col-center" style="flex:1;justify-content:center;"></div>`;
    const playArea = host.querySelector('#play');
    renderPips();
    showWord();

    function renderPips() {
      host.querySelector('#pips').innerHTML = words.map((_, i) =>
        `<div class="pip ${i < idx ? 'done' : ''} ${i === idx ? 'current' : ''}"></div>`).join('');
    }

    function showWord() {
      if (idx >= words.length) return finish();
      renderPips();
      const word = words[idx];
      let tries = 0, solved = false;

      playArea.innerHTML = '';
      const card = api.ui.wordCard(word);
      playArea.appendChild(card);

      const supported = JDQ.audio.recognitionSupported();

      // --- speak control ---
      const speakWrap = JDQ.ui.el('div', 'col-center');
      const mic = JDQ.ui.el('button', 'mic-btn', '🎤');
      const note = JDQ.ui.el('div', 'speak-note',
        supported ? '🎤 Speak! Needs internet + mic permission' : 'Speech not available — type it instead!');
      speakWrap.appendChild(mic);
      speakWrap.appendChild(note);

      const typeToggle = JDQ.ui.el('button', 'btn ghost', '⌨️ Type instead');
      typeToggle.style.marginTop = '10px';

      playArea.appendChild(speakWrap);
      playArea.appendChild(typeToggle);

      // auto play the target word so the child hears the model first
      setTimeout(() => JDQ.audio.playWord(word.hanzi), 300);

      mic.addEventListener('click', listenOnce);
      typeToggle.addEventListener('click', showTypeMode);
      if (!supported) showTypeMode();

      async function listenOnce() {
        if (solved || mic.classList.contains('listening')) return;
        mic.classList.add('listening');
        const noteWas = note.textContent;
        try {
          const res = await JDQ.audio.listen((st) => {
            if (st === 'listening') note.textContent = '🗣️ Say it now!';
            else if (st === 'processing') note.textContent = '⏳ …';
          });
          mic.classList.remove('listening');
          note.textContent = noteWas;
          if (JDQ.audio.matchSpoken(res, word)) return pass();
          miss();
        } catch (e) {
          mic.classList.remove('listening');
          note.textContent = noteWas;
          const code = (e && e.code) || 'error';
          if (code === 'unsupported') return showTypeMode();
          // Mic permission blocked on the device — mic will never work; fall back.
          if (code === 'not-allowed' || code === 'service-not-allowed') {
            api.ui.toast('🎤 blocked — type instead', 'bad');
            return showTypeMode();
          }
          // no-speech / aborted / network — don't punish; show code to diagnose.
          JDQ.audio.sfx('tap');
          api.ui.toast(`Didn't hear you (${code}) — try again!`, '');
        }
      }

      function showTypeMode() {
        if (solved || playArea.querySelector('.type-row')) { playArea.querySelector('.type-input') && playArea.querySelector('.type-input').focus(); return; }
        const row = JDQ.ui.el('div', 'type-row');
        const input = JDQ.ui.el('input', 'type-input');
        input.type = 'text';
        input.setAttribute('autocomplete', 'off');
        input.setAttribute('autocapitalize', 'off');
        input.placeholder = 'type pinyin…';
        const go = JDQ.ui.el('button', 'btn', 'Check');
        row.appendChild(input); row.appendChild(go);
        playArea.appendChild(row);
        input.focus();
        const submit = () => {
          if (solved) return;
          const v = norm(input.value);
          if (!v) return;
          if (v === norm(word.pinyin) || input.value.trim() === word.hanzi || v === norm(word.en)) {
            pass();
          } else {
            input.value = ''; miss();
          }
        };
        go.addEventListener('click', submit);
        input.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
      }

      function pass() {
        if (solved) return;
        solved = true;
        JDQ.audio.sfx('correct');
        api.ui.burst(card, ['💧', '✨', '🌊', '💙']);
        let gained = tries === 0 ? 10 : tries === 1 ? 7 : 4;
        xpTotal += gained;
        if (tries === 0) { firstTryCorrect++; }
        api.ui.toast(tries === 0 ? 'Perfect! 🌊' : 'You said it! 💧', 'good');
        lockAndNext();
      }

      function miss() {
        tries++;
        JDQ.audio.sfx('wrong');
        if (tries >= 3) {
          // gentle reveal + continue
          JDQ.sidekick.snakeHelp(word, 4200);
          api.ui.toast(`It's "${word.pinyin}"`, 'bad');
          const cont = JDQ.ui.el('button', 'btn', "Got it! ›");
          cont.addEventListener('click', () => { if (solved) return; solved = true; xpTotal += 2; lockAndNext(); });
          // replace controls
          speakWrap.style.display = 'none';
          typeToggle.style.display = 'none';
          const old = playArea.querySelector('.type-row'); if (old) old.style.display = 'none';
          playArea.appendChild(cont);
        } else if (tries === 2) {
          JDQ.sidekick.snakeHelp(word);
          api.ui.toast('Snake is helping! 🐍', 'bad');
        } else {
          api.ui.toast('Almost! Listen again 🔊', 'bad');
          JDQ.audio.playWord(word.hanzi);
        }
      }

      function lockAndNext() {
        mic.disabled = true; typeToggle.disabled = true;
        const ti = playArea.querySelector('.type-input'); if (ti) ti.disabled = true;
        setTimeout(() => { idx++; showWord(); }, 950);
      }
    }

    function finish() {
      const stars = firstTryCorrect >= 9 ? 3 : firstTryCorrect >= 5 ? 2 : 1;
      api.complete({ stars, xp: xpTotal, accuracy: firstTryCorrect / words.length });
    }
  }

  JDQ.levels.water = { start };
})();
