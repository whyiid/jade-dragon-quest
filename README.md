# 🐉 Jade Dragon Quest

A Mandarin learning adventure for Matthew — a hero Dog journeys through the Five
Elements, learning real Chinese words along the way and befriending a dragon at
the end. No app store, no login, no internet required after the first play.

**48 element words + 12 zodiac animals · 5 levels + a bonus Zodiac Collection.**

---

## How to play (on this Mac)

Open `index.html` in a browser, or use a tiny local server (better — service
worker and audio both behave normally over `http://`):

```bash
cd "Personal/JadeDragonQuest"
python3 -m http.server 8123
```

Then open **http://localhost:8123** in Chrome.

## How to play on Matthew's Android tablet

The game is a PWA — it installs to the home screen and runs full-screen offline.

1. Put this folder on any web host the tablet can reach (or run the local server
   above and open the Mac's IP, e.g. `http://192.168.1.20:8123`, on the tablet).
2. Open it in **Chrome** on the tablet.
3. Tap the **⋮** menu → **Add to Home screen** → **Install**.
4. Launch **Jade Dragon Quest** from the home screen like a normal app.
5. Every word's voice is bundled as an MP3 clip, so the game works fully offline
   right after installing.

> 🎤 Levels 2 (Water) and 5 (Dragon) have a "Speak!" mode that needs internet +
> microphone permission. If speech isn't available, they fall back to a typing
> game automatically, so the game is always fully playable.

---

## The five levels

| # | Level | Element | What you do |
|---|-------|---------|-------------|
| 1 | ⚙️ Metal Forge | 金 | **Listen & Choose** — hear a word, tap the right picture |
| 2 | 💧 Water Flow | 水 | **Speak!** — say the word out loud (or type it) |
| 3 | 🌿 Wood Garden | 木 | **Drag & Match** — drag each word to its picture |
| 4 | 🔥 Fire Shield | 火 | **Speed Dodge** — grab fire words, dodge water |
| 5 | 🐉 Dragon Boss | — | **Triple Combo** — chain Metal → Water → Wood to win |
| ★ | 🐾 Zodiac Collection | — | Unlock all 12 zodiac animals as you play |

Each cleared level earns ⭐ stars + XP. Stars and progress save automatically to
the browser (`localStorage` key `jadedragon.v1`). Clearing levels and earning XP
unlocks the zodiac animals — the **Dog** is always yours.

---

## What's under the hood

- **No framework, no build step.** Plain HTML + CSS + vanilla JavaScript (ES6).
- **Audio:** every word is a pre-rendered Mandarin MP3 clip in `audio/`
  (0.9× playback), with the browser's built-in `zh-CN` speech as a fallback.
  Regenerate the clips with `node tools/gen-audio.js`.
- **Drag uses Pointer Events** (`setPointerCapture` + `elementFromPoint`) so it
  works on Android touchscreens, not just a mouse.
- **Offline:** `sw.js` precaches the whole app shell **and** all word clips on
  install, so the game is fully playable with no internet.

### Files

```
index.html            entry point — loads everything in order
style.css             all visuals + per-level themes
vocab-data.js         the 48 element words + 12 zodiac words
audio.js              TTS, sound effects, speech recognition
progress.js           stars, XP, unlocks (localStorage)
sidekick.js           Rabbit (hints) & Snake (help) helpers
app.js                router + game engine + world map
levels/               one file per level (metal, water, wood, fire, dragon)
bonus-zodiac.js       the Zodiac Collection screen
audio/                pre-rendered word clips (*.mp3) + clips.json manifest
tools/gen-audio.js    regenerates the clips from Google TTS (run with Node)
manifest.json + sw.js + icons/   PWA packaging
```

## Resetting progress

To start fresh, open the browser console and run:

```js
localStorage.removeItem('jadedragon.v1'); location.reload();
```
