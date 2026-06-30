/* Jade Dragon Quest — vocab-data.js
 * All 60 element words (5 x 12) + 12 zodiac animals.
 * Each entry: { hanzi, pinyin, en, element, emoji }
 * emoji doubles as the "image tile" (asset-free, like its predecessor).
 */
window.JDQ = window.JDQ || {};

(function () {
  const metal = [
    { hanzi: '金',   pinyin: 'jīn',   en: 'gold',   emoji: '💰' },
    { hanzi: '银',   pinyin: 'yín',   en: 'silver', emoji: '🪙' },
    { hanzi: '铁',   pinyin: 'tiě',   en: 'iron',   emoji: '⚙️' },
    { hanzi: '白色', pinyin: 'báisè', en: 'white',  emoji: '⚪' },
    { hanzi: '西',   pinyin: 'xī',    en: 'west',   emoji: '⬅️' },
    { hanzi: '冷',   pinyin: 'lěng',  en: 'cold',   emoji: '🥶' },
    { hanzi: '硬',   pinyin: 'yìng',  en: 'hard',   emoji: '🪨' },
    { hanzi: '刀',   pinyin: 'dāo',   en: 'knife',  emoji: '🔪' },
    { hanzi: '盾',   pinyin: 'dùn',   en: 'shield', emoji: '🛡️' },
    { hanzi: '星',   pinyin: 'xīng',  en: 'star',   emoji: '⭐' },
    { hanzi: '强',   pinyin: 'qiáng', en: 'strong', emoji: '💪' },
    { hanzi: '月',   pinyin: 'yuè',   en: 'moon',   emoji: '🌙' },
  ];

  const water = [
    { hanzi: '水',   pinyin: 'shuǐ',  en: 'water', emoji: '💧' },
    { hanzi: '河',   pinyin: 'hé',    en: 'river', emoji: '🏞️' },
    { hanzi: '海',   pinyin: 'hǎi',   en: 'sea',   emoji: '🌊' },
    { hanzi: '鱼',   pinyin: 'yú',    en: 'fish',  emoji: '🐟' },
    { hanzi: '蓝色', pinyin: 'lánsè', en: 'blue',  emoji: '🔵' },
    { hanzi: '北',   pinyin: 'běi',   en: 'north', emoji: '⬆️' },
    { hanzi: '雨',   pinyin: 'yǔ',    en: 'rain',  emoji: '🌧️' },
    { hanzi: '喝',   pinyin: 'hē',    en: 'drink', emoji: '🥤' },
    { hanzi: '游',   pinyin: 'yóu',   en: 'swim',  emoji: '🏊' },
    { hanzi: '冰',   pinyin: 'bīng',  en: 'ice',   emoji: '🧊' },
    { hanzi: '流',   pinyin: 'liú',   en: 'flow',  emoji: '💦' },
    { hanzi: '清',   pinyin: 'qīng',  en: 'clear', emoji: '🫧' },
  ];

  const wood = [
    { hanzi: '木',   pinyin: 'mù',    en: 'wood',   emoji: '🪵' },
    { hanzi: '树',   pinyin: 'shù',   en: 'tree',   emoji: '🌳' },
    { hanzi: '花',   pinyin: 'huā',   en: 'flower', emoji: '🌸' },
    { hanzi: '草',   pinyin: 'cǎo',   en: 'grass',  emoji: '🍀' },
    { hanzi: '绿色', pinyin: 'lǜsè',  en: 'green',  emoji: '🟢' },
    { hanzi: '东',   pinyin: 'dōng',  en: 'east',   emoji: '➡️' },
    { hanzi: '春',   pinyin: 'chūn',  en: 'spring', emoji: '🌷' },
    { hanzi: '竹',   pinyin: 'zhú',   en: 'bamboo', emoji: '🎋' },
    { hanzi: '叶',   pinyin: 'yè',    en: 'leaf',   emoji: '🍃' },
    { hanzi: '长',   pinyin: 'zhǎng', en: 'grow',   emoji: '🌱' },
    { hanzi: '森林', pinyin: 'sēnlín',en: 'forest', emoji: '🌲' },
    { hanzi: '种',   pinyin: 'zhòng', en: 'plant',  emoji: '🪴' },
  ];

  const fire = [
    { hanzi: '火',   pinyin: 'huǒ',     en: 'fire',     emoji: '🔥' },
    { hanzi: '红色', pinyin: 'hóngsè',  en: 'red',      emoji: '🔴' },
    { hanzi: '南',   pinyin: 'nán',     en: 'south',    emoji: '⬇️' },
    { hanzi: '太阳', pinyin: 'tàiyáng', en: 'sun',      emoji: '☀️' },
    { hanzi: '热',   pinyin: 'rè',      en: 'hot',      emoji: '🥵' },
    { hanzi: '光',   pinyin: 'guāng',   en: 'light',    emoji: '💡' },
    { hanzi: '快',   pinyin: 'kuài',    en: 'fast',     emoji: '⚡' },
    { hanzi: '跑',   pinyin: 'pǎo',     en: 'run',      emoji: '🏃' },
    { hanzi: '勇敢', pinyin: 'yǒnggǎn', en: 'brave',    emoji: '🦸' },
    { hanzi: '保护', pinyin: 'bǎohù',   en: 'protect',  emoji: '🤲' },
    { hanzi: '强大', pinyin: 'qiángdà', en: 'powerful', emoji: '💥' },
    { hanzi: '胜利', pinyin: 'shènglì', en: 'victory',  emoji: '🏆' },
  ];

  const zodiac = [
    { hanzi: '鼠', pinyin: 'shǔ',  en: 'rat',     emoji: '🐭' },
    { hanzi: '牛', pinyin: 'niú',  en: 'ox',      emoji: '🐮' },
    { hanzi: '虎', pinyin: 'hǔ',   en: 'tiger',   emoji: '🐯' },
    { hanzi: '兔', pinyin: 'tù',   en: 'rabbit',  emoji: '🐰' },
    { hanzi: '龙', pinyin: 'lóng', en: 'dragon',  emoji: '🐲' },
    { hanzi: '蛇', pinyin: 'shé',  en: 'snake',   emoji: '🐍' },
    { hanzi: '马', pinyin: 'mǎ',   en: 'horse',   emoji: '🐴' },
    { hanzi: '羊', pinyin: 'yáng', en: 'goat',    emoji: '🐑' },
    { hanzi: '猴', pinyin: 'hóu',  en: 'monkey',  emoji: '🐵' },
    { hanzi: '鸡', pinyin: 'jī',   en: 'rooster', emoji: '🐔' },
    { hanzi: '狗', pinyin: 'gǒu',  en: 'dog',     emoji: '🐶' },
    { hanzi: '猪', pinyin: 'zhū',  en: 'pig',     emoji: '🐷' },
  ];

  // tag element on each word
  metal.forEach(w => (w.element = 'metal'));
  water.forEach(w => (w.element = 'water'));
  wood.forEach(w  => (w.element = 'wood'));
  fire.forEach(w  => (w.element = 'fire'));
  zodiac.forEach(w => (w.element = 'zodiac'));

  const all = [...metal, ...water, ...wood, ...fire];

  JDQ.VOCAB = { metal, water, wood, fire, zodiac, all };

  // Level metadata used by router + world map
  JDQ.LEVELS = [
    { id: 1, key: 'metal',  name: 'Metal Forge',  element: '金', emoji: '⚙️', mechanic: 'Listen & Choose' },
    { id: 2, key: 'water',  name: 'Water Flow',   element: '水', emoji: '💧', mechanic: 'Speak!' },
    { id: 3, key: 'wood',   name: 'Wood Garden',  element: '木', emoji: '🌿', mechanic: 'Drag & Match' },
    { id: 4, key: 'fire',   name: 'Fire Shield',  element: '火', emoji: '🔥', mechanic: 'Speed Dodge' },
    { id: 5, key: 'dragon', name: 'Dragon Boss',  element: '龙', emoji: '🐉', mechanic: 'Triple Combo' },
  ];
})();
