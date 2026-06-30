/* Jade Dragon Quest — audio.js
 * Word pronunciation: pre-rendered Mandarin MP3 clips (audio/*.mp3), with the
 *   browser's built-in zh-CN speech synthesis as a fallback. Clips are made
 *   server-side by tools/gen-audio.js — Google TTS can't be called live from
 *   the browser (404 / ORB-blocked), so we bundle the audio instead.
 * UI SFX: Web Audio oscillator.
 * Speech recognition: Web Speech API (zh-CN) with graceful fallback.
 */
window.JDQ = window.JDQ || {};

(function () {
  // Local clip path. Files are named <hanzi>.mp3; encode so e.g. 月 -> %E6%9C%88.
  const clipUrl = (word) => `audio/${encodeURIComponent(word)}.mp3`;

  let currentAudio = null;

  // --- Word pronunciation -------------------------------------------------
  async function playWord(hanzi) {
    if (!hanzi) return;
    // stop anything already playing
    try { if (currentAudio) { currentAudio.pause(); currentAudio = null; } } catch (e) {}
    try { speechSynthesis.cancel(); } catch (e) {}

    try {
      const audio = new Audio(clipUrl(hanzi));
      audio.playbackRate = 0.9;   // slightly slower = easier to learn
      currentAudio = audio;
      // Missing/corrupt clip -> fall back to the device's own zh-CN voice.
      audio.onerror = () => speakFallback(hanzi);
      await audio.play();          // rejects if the file 404s -> caught below
    } catch (e) {
      speakFallback(hanzi);
    }
  }

  function speakFallback(hanzi) {
    try {
      if (!('speechSynthesis' in window)) return;
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(hanzi);
      u.lang = 'zh-CN';
      u.rate = 0.85;
      // Prefer a Chinese voice if installed
      const voices = speechSynthesis.getVoices();
      const zh = voices.find(v => /zh|chinese|中文|普通话/i.test(v.lang + ' ' + v.name));
      if (zh) u.voice = zh;
      speechSynthesis.speak(u);
    } catch (e) {}
  }

  // --- UI sound effects (oscillator) -------------------------------------
  let actx = null;
  function ctx() {
    if (!actx) {
      try { actx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { actx = null; }
    }
    if (actx && actx.state === 'suspended') { try { actx.resume(); } catch (e) {} }
    return actx;
  }

  function tone(freq, dur, type, vol, when) {
    const c = ctx();
    if (!c) return;
    const t0 = c.currentTime + (when || 0);
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol || 0.18, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  function sfx(type) {
    switch (type) {
      case 'correct':                       // bright rising arpeggio
        tone(523, 0.12, 'triangle', 0.2, 0);
        tone(659, 0.12, 'triangle', 0.2, 0.1);
        tone(784, 0.18, 'triangle', 0.2, 0.2);
        break;
      case 'wrong':                         // low buzz
        tone(196, 0.18, 'sawtooth', 0.15, 0);
        tone(147, 0.22, 'sawtooth', 0.15, 0.12);
        break;
      case 'combo':                         // big fanfare
        tone(523, 0.12, 'square', 0.18, 0);
        tone(659, 0.12, 'square', 0.18, 0.1);
        tone(784, 0.12, 'square', 0.18, 0.2);
        tone(1047, 0.3, 'square', 0.2, 0.32);
        break;
      case 'star':
        tone(880, 0.1, 'sine', 0.2, 0);
        tone(1175, 0.22, 'sine', 0.2, 0.1);
        break;
      case 'tap':
        tone(660, 0.06, 'sine', 0.12, 0);
        break;
      case 'hit':                           // dragon takes damage
        tone(110, 0.25, 'sawtooth', 0.22, 0);
        break;
      default:
        tone(440, 0.1, 'sine', 0.12, 0);
    }
  }

  // --- Speech recognition (Level 2 + 5) ----------------------------------
  function recognitionSupported() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  // listen() resolves with { transcript, supported } or rejects on error.
  // onState(state) callback: 'listening' | 'processing' | 'end'
  function listen(onState) {
    return new Promise((resolve, reject) => {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) { reject({ code: 'unsupported' }); return; }
      let rec;
      try { rec = new SR(); } catch (e) { reject({ code: 'unsupported' }); return; }
      // cmn-Hans-CN is more specific BCP-47 tag; more Android devices honour it
      rec.lang = 'cmn-Hans-CN';
      rec.interimResults = false;
      rec.maxAlternatives = 3;
      let done = false;
      let hardTimer;

      const finish = () => clearTimeout(hardTimer);

      rec.onstart = () => onState && onState('listening');
      rec.onresult = (ev) => {
        done = true;
        finish();
        onState && onState('processing');
        const alts = [];
        const res = ev.results[0];
        for (let i = 0; i < res.length; i++) alts.push(res[i].transcript);
        resolve({ transcript: alts[0] || '', alternatives: alts });
      };
      rec.onerror = (ev) => {
        finish();
        if (!done) reject({ code: ev.error || 'error' });
      };
      // onend always fires — if no result yet, treat as no-speech
      rec.onend = () => {
        finish();
        onState && onState('end');
        if (!done) reject({ code: 'no-speech' });
      };

      // 300ms: Android needs time to reset audio subsystem between calls.
      // Without this, consecutive recognitions alternate succeed/fail.
      setTimeout(() => {
        try { rec.start(); } catch (e) { reject({ code: 'start-failed' }); return; }
        // Ask the API to stop capturing after 6s (fires onend normally).
        setTimeout(() => { try { rec.stop(); } catch (e) {} }, 6000);
        // 12s hard reject for devices where onend never fires (e.g. Huawei no-GMS).
        hardTimer = setTimeout(() => { if (!done) reject({ code: 'timeout' }); }, 12000);
      }, 300);
    });
  }

  // Compare spoken Chinese to a target word. Accepts either the recognized
  // hanzi matching the target, OR (loosely) the pinyin syllables matching.
  // Returns true/false. Very lenient — this is for an 8-year-old.
  function matchSpoken(result, targetWord) {
    if (!result) return false;
    const heard = (result.transcript || '').trim();
    if (!heard) return false;
    const cleaned = heard.replace(/[\s，。！？、,.!?]/g, '');
    // 1) direct hanzi match (any alternative contains the target hanzi)
    const alts = (result.alternatives || [heard]).map(a => (a || '').replace(/[\s，。！？、,.!?]/g, ''));
    if (alts.some(a => a.includes(targetWord.hanzi))) return true;
    // 2) the target hanzi chars all present
    if (targetWord.hanzi.split('').every(ch => cleaned.includes(ch))) return true;
    // 3) pinyin (toneless) fuzzy: recognizer sometimes returns pinyin/latin
    const targetPy = toneless(targetWord.pinyin);
    const heardPy = toneless(heard);
    if (heardPy && (heardPy.includes(targetPy) || targetPy.includes(heardPy))) return true;
    return false;
  }

  function toneless(s) {
    if (!s) return '';
    return s.normalize('NFD').replace(/[̀-ͯ]/g, '')
            .toLowerCase().replace(/[^a-z]/g, '');
  }

  JDQ.audio = {
    playWord, speakFallback, sfx, listen, matchSpoken,
    recognitionSupported, toneless,
    // call once on first user gesture to unlock audio context
    unlock() { ctx(); }
  };
})();
