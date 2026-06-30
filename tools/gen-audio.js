#!/usr/bin/env node
/* Jade Dragon Quest — audio clip generator
 * Pre-renders every vocab word + a few phrases to audio/<word>.mp3 using
 * Google Translate TTS (Mainland 普通话). This must run server-side — the
 * browser can't call translate_tts directly (404 / ORB-blocked), which is
 * exactly why we bundle the clips instead of fetching them live.
 *
 * Usage:  node tools/gen-audio.js          (skips files that already exist)
 *         FORCE=1 node tools/gen-audio.js  (re-generate everything)
 */
const fs = require('fs');
const path = require('path');
const https = require('https');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const AUDIO_DIR = path.join(ROOT, 'audio');
const FORCE = !!process.env.FORCE;

// --- Load the word list straight from vocab-data.js (single source of truth).
// In the browser `window` IS the global object, so vocab-data.js uses bare
// `JDQ` and `window.JDQ` interchangeably. Recreate that by making `window`
// point at the sandbox's own global.
const sandbox = {};
sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'vocab-data.js'), 'utf8'), sandbox);
const V = sandbox.JDQ.VOCAB;

const words = new Set();
['metal', 'water', 'wood', 'fire', 'zodiac'].forEach((k) =>
  V[k].forEach((w) => words.add(w.hanzi))
);
// Extra strings the levels speak that aren't plain vocab entries.
['我', '爱', '绿色', '我爱绿色', '金水木', '龙', '金', '水', '木', '火'].forEach((x) =>
  words.add(x)
);

const LIST = [...words];

function ttsUrl(word) {
  return (
    'https://translate.google.com/translate_tts?ie=UTF-8&q=' +
    encodeURIComponent(word) +
    '&tl=zh-CN&client=tw-ob'
  );
}

function fetchMp3(word) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      ttsUrl(word),
      { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' } },
      (res) => {
        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error('HTTP ' + res.statusCode));
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
      }
    );
    req.on('error', reject);
    req.setTimeout(15000, () => req.destroy(new Error('timeout')));
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async function main() {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
  const manifest = [];
  let made = 0,
    skipped = 0,
    failed = 0;

  for (const word of LIST) {
    const file = path.join(AUDIO_DIR, word + '.mp3');
    const relEncoded = 'audio/' + encodeURIComponent(word) + '.mp3';
    manifest.push(relEncoded);

    if (!FORCE && fs.existsSync(file) && fs.statSync(file).size > 500) {
      skipped++;
      continue;
    }
    try {
      const buf = await fetchMp3(word);
      if (buf.length < 500) throw new Error('tiny (' + buf.length + 'b)');
      fs.writeFileSync(file, buf);
      made++;
      console.log('  ✓ ' + word + '  (' + buf.length + 'b)');
      await sleep(250); // be gentle on Google
    } catch (e) {
      failed++;
      console.log('  ✗ ' + word + '  — ' + e.message);
    }
  }

  fs.writeFileSync(
    path.join(AUDIO_DIR, 'clips.json'),
    JSON.stringify(manifest, null, 0)
  );
  console.log(
    `\nDone. ${made} made, ${skipped} skipped, ${failed} failed. ` +
      `${manifest.length} clips in manifest.`
  );
  if (failed) process.exitCode = 1;
})();
