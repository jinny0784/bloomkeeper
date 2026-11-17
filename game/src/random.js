// Bloomkeeper — a tiny seeded random number generator.
// The game normally seeds from the clock, but screenshot scenes pass a fixed
// seed so a staged picture is the same every time it is taken.

export function makeRandom(seed) {
  let state = (seed >>> 0) || 1;
  const next = () => {
    // mulberry32: small, fast and good enough for petals and fireflies.
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    range: (min, max) => min + next() * (max - min),
    int: (min, max) => Math.floor(min + next() * (max - min + 1)),
    pick: (list) => list[Math.floor(next() * list.length)],
    chance: (p) => next() < p,
  };
}
