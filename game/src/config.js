// Bloomkeeper — tuning, palette and wave table.
// Every number that shapes how the game feels lives in this one file, so the
// rest of the code can stay about behaviour instead of magic constants.

export const VIEW = { width: 1280, height: 800 };

export const PALETTE = {
  nightTop: '#0a2a26',
  nightBottom: '#14453a',
  meadow: '#1d5c46',
  meadowDark: '#17493a',
  soil: '#2a1f16',
  cream: '#fdf3d8',
  gold: '#ffc94d',
  petalPink: '#ff8fb2',
  petalSoft: '#ffd3e0',
  leaf: '#57c785',
  leafDark: '#2e8b62',
  heartRed: '#ff5d5d',
  blight: '#8d7bff',
  blightDark: '#5a48c2',
  rust: '#e07b39',
  rustDark: '#9c4f1e',
  spore: '#c65df0',
  husk: '#d84f6a',
  ink: '#10231e',
  white: '#ffffff',
};

export const PLAYER = {
  radius: 20,
  speed: 265,
  maxHearts: 3,
  fireCooldown: 0.24,
  bulletSpeed: 640,
  bulletDamage: 1,
  bulletRadius: 6,
  dashTime: 0.16,
  dashSpeed: 880,
  dashCooldown: 1.6,
  hurtInvulnTime: 1.2,
  magnetRadius: 74,
};

export const HEART_FLOWER = {
  radius: 46,
  maxHp: 100,
};

// One row per wave: how many of each blight creature march on the garden.
// The last wave is the Hollow Husk boss and its mite brood.
export const WAVES = [
  { moths: 6, beetles: 0, spores: 0, husk: 0, spawnGap: 1.15 },
  { moths: 9, beetles: 2, spores: 0, husk: 0, spawnGap: 1.0 },
  { moths: 11, beetles: 4, spores: 1, husk: 0, spawnGap: 0.92 },
  { moths: 13, beetles: 5, spores: 2, husk: 0, spawnGap: 0.84 },
  { moths: 15, beetles: 7, spores: 3, husk: 0, spawnGap: 0.78 },
  { moths: 17, beetles: 8, spores: 4, husk: 0, spawnGap: 0.72 },
  { moths: 19, beetles: 10, spores: 5, husk: 0, spawnGap: 0.66 },
  { moths: 10, beetles: 4, spores: 2, husk: 1, spawnGap: 0.8 },
];

export const ENEMIES = {
  moth: { radius: 16, hp: 2, speed: 74, damage: 6, score: 40, touchDamage: 1 },
  beetle: { radius: 22, hp: 6, speed: 44, damage: 10, score: 90, touchDamage: 1 },
  spore: { radius: 26, hp: 9, speed: 34, damage: 14, score: 140, touchDamage: 1 },
  mite: { radius: 11, hp: 1, speed: 108, damage: 3, score: 20, touchDamage: 1 },
  husk: { radius: 58, hp: 120, speed: 21, damage: 30, score: 2000, touchDamage: 1 },
};

export const UPGRADES = [
  {
    id: 'rapid',
    name: 'Rapid Seeds',
    blurb: 'Shoot 18% faster. The garden hums.',
    apply: (draft) => { draft.fireRateBonus += 0.18; },
  },
  {
    id: 'twin',
    name: 'Twin Sprout',
    blurb: '+1 seed in every shot, spread wide.',
    apply: (draft) => { draft.extraShots += 1; },
  },
  {
    id: 'heavy',
    name: 'Heavy Seeds',
    blurb: '+1 damage in every seed.',
    apply: (draft) => { draft.damageBonus += 1; },
  },
  {
    id: 'swift',
    name: 'Swift Petals',
    blurb: 'Move 12% faster on the breeze.',
    apply: (draft) => { draft.speedBonus += 0.12; },
  },
  {
    id: 'dashbloom',
    name: 'Dash Bloom',
    blurb: 'Dash recharges 25% sooner.',
    apply: (draft) => { draft.dashBonus += 0.25; },
  },
  {
    id: 'heartsap',
    name: 'Heart Sap',
    blurb: 'The Heart Flower heals 30 and grows tougher.',
    apply: (draft) => { draft.heartHeal += 30; },
  },
  {
    id: 'magnet',
    name: 'Sun Magnet',
    blurb: 'Sun Drops drift to you from twice as far.',
    apply: (draft) => { draft.magnetBonus += 70; },
  },
  {
    id: 'secondwind',
    name: 'Second Wind',
    blurb: 'Win back one of your own hearts.',
    apply: (draft) => { draft.playerHeal += 1; },
  },
];

export const SCORE = {
  sunDrop: 25,
  waveClear: 250,
  comboWindow: 2.6,
  comboStep: 8,
};
