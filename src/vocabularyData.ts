export const EXTRA_VOCABULARY = [
  ...Array.from({length: 200}).map((_, i) => ({
    pt: `Palavra ${i}`, romaji: `word${i}`, kana: `わーど${i}`, kanji: `語${i}`, power: 20 + i, type: "attack", element: "physics", unlockLevel: Math.floor(i/10)+1, cooldown: 1, currentCooldown: 0
  }))
];
