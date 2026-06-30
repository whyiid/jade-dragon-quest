/* Bonus — Zodiac Collection 🐾
 * 12 animal cards. Tap an unlocked card to hear it. Cards unlock as Matthew
 * clears levels and earns XP. The Dog is always his (marked "YOU").
 * Contract: JDQ.zodiac.start(host, { ui })
 */
window.JDQ = window.JDQ || {};

(function () {
  // How each animal unlocks (shown when a locked card is tapped).
  const HOW = {
    dog: 'Always yours! 🐶',
    snake: 'Clear Level 2 · Water',
    rabbit: 'Clear Level 3 · Wood',
    dragon: 'Clear Level 5 · Dragon Boss',
    rat: 'Reach 50 XP',
    ox: 'Reach 100 XP',
    tiger: 'Reach 150 XP',
    horse: 'Reach 200 XP',
    goat: 'Reach 300 XP',
    monkey: 'Reach 400 XP',
    rooster: 'Reach 500 XP',
    pig: 'Reach 600 XP',
  };

  function start(host, ctx) {
    const ui = (ctx && ctx.ui) || JDQ.ui;
    const unlocked = JDQ.progress.unlockedZodiac();
    const animals = JDQ.VOCAB.zodiac;
    const count = animals.filter(a => unlocked.has(a.en)).length;

    host.innerHTML = `
      <div class="stage-head">
        <div class="narr">🐾 Collect all 12 zodiac animals!</div>
        <div class="stat" style="font-weight:800">${count} / 12 unlocked · ${JDQ.progress.getXP()} XP</div>
      </div>`;
    const scroll = ui.el('div', 'wm-scroll');
    const grid = ui.el('div', 'zodiac-grid');

    animals.forEach(a => {
      const isOpen = unlocked.has(a.en);
      const isYou = a.en === 'dog';
      const isBoss = a.en === 'dragon';
      const card = ui.el('div', 'zcard'
        + (isOpen ? '' : ' locked')
        + (isBoss ? ' special' : '')
        + (isYou ? ' you' : ''));
      card.style.position = 'relative';
      card.innerHTML = `
        <div class="z-emoji">${isOpen ? a.emoji : '❔'}</div>
        <div class="z-han han">${isOpen ? a.hanzi : '?'}</div>
        <div class="z-py">${isOpen ? a.pinyin : ''}</div>
        <div class="z-en">${isOpen ? a.en : ''}</div>
        ${isYou ? '<div class="z-tag">YOU</div>' : ''}`;
      card.addEventListener('click', () => {
        if (isOpen) {
          JDQ.audio.sfx('tap');
          JDQ.audio.playWord(a.hanzi);
          ui.burst(card, ['✨', '⭐', a.emoji]);
        } else {
          JDQ.audio.sfx('wrong');
          ui.toast('🔒 ' + (HOW[a.en] || 'Keep playing!'), '');
        }
      });
      grid.appendChild(card);
    });

    scroll.appendChild(grid);
    host.appendChild(scroll);
  }

  JDQ.zodiac = { start };
})();
