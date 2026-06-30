/* Jade Dragon Quest — sidekick.js
 * Rabbit (兔) = hint helper.  Snake (蛇) = protection helper.
 * Provides small reusable UI bubbles the levels can summon.
 */
window.JDQ = window.JDQ || {};

(function () {
  // Floating speech bubble near a character. Auto-dismisses.
  function bubble(opts) {
    const { who, emoji, title, lines, ms } = opts;
    const el = document.createElement('div');
    el.className = 'sidekick-bubble ' + (who || 'rabbit');
    el.innerHTML = `
      <div class="sk-avatar bounce-idle">${emoji}</div>
      <div class="sk-body">
        ${title ? `<div class="sk-title">${title}</div>` : ''}
        ${(lines || []).map(l => `<div class="sk-line">${l}</div>`).join('')}
      </div>`;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    const life = ms || 3200;
    const t = setTimeout(() => dismiss(el), life);
    el.addEventListener('pointerdown', () => { clearTimeout(t); dismiss(el); });
    return el;
  }

  function dismiss(el) {
    if (!el || !el.parentNode) return;
    el.classList.remove('show');
    setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 280);
  }

  // Rabbit reveals pinyin + english of the current word.
  function rabbitHint(word, ms) {
    JDQ.audio.sfx('tap');
    return bubble({
      who: 'rabbit',
      emoji: '🐰',
      title: 'Rabbit',
      lines: [
        `<span class="sk-pinyin">${word.pinyin}</span>`,
        `<span class="sk-en">"${word.en}"</span>`,
      ],
      ms: ms || 3600,
    });
  }

  // Rabbit celebrates a streak.
  function rabbitCheer() {
    return bubble({ who: 'rabbit', emoji: '🐰', lines: ['Yay! Keep going!'], ms: 1800 });
  }

  // Snake shows the correct pinyin (used in Level 2 after 2 fails).
  function snakeHelp(word, ms) {
    JDQ.audio.sfx('tap');
    return bubble({
      who: 'snake',
      emoji: '🐍',
      title: 'Snake',
      lines: [
        `Say it like this:`,
        `<span class="sk-pinyin">${word.pinyin}</span>`,
        `<span class="sk-en">"${word.en}"</span>`,
      ],
      ms: ms || 4200,
    });
  }

  // Snake announces a block (Level 4).
  function snakeBlock() {
    return bubble({ who: 'snake', emoji: '🐍', lines: ["I've got your back!"], ms: 1600 });
  }

  JDQ.sidekick = { bubble, dismiss, rabbitHint, rabbitCheer, snakeHelp, snakeBlock };
})();
