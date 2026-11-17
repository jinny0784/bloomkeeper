// Bloomkeeper — the living things: the keeper, the blight creatures,
// seed-light bullets, sun drops and petal particles.
// Makers and per-creature movement live here; the world decides when they
// appear, collide and score.

import { ENEMIES, PLAYER } from './config.js';

export function makePlayer(x, y) {
  return {
    kind: 'player',
    x, y,
    vx: 0, vy: 0,
    radius: PLAYER.radius,
    hearts: PLAYER.maxHearts,
    aimAngle: 0,
    fireTimer: 0,
    dashTimer: 0,
    dashCooldownTimer: 0,
    dashDirX: 1, dashDirY: 0,
    invulnTimer: 0,
    walkCycle: 0,
    dead: false,
  };
}

export function makeDraft() {
  // Everything the between-wave upgrades have improved, in one place.
  return {
    fireRateBonus: 0,
    extraShots: 0,
    damageBonus: 0,
    speedBonus: 0,
    dashBonus: 0,
    heartHeal: 0,
    magnetBonus: 0,
    playerHeal: 0,
  };
}

export function makeEnemy(kind, x, y, rng) {
  const base = ENEMIES[kind];
  return {
    kind,
    x, y,
    vx: 0, vy: 0,
    radius: base.radius,
    hp: base.hp,
    maxHp: base.hp,
    speed: base.speed * rng.range(0.9, 1.1),
    damage: base.damage,
    score: base.score,
    touchDamage: base.touchDamage,
    flutterPhase: rng.range(0, Math.PI * 2),
    wobblePhase: rng.range(0, Math.PI * 2),
    hitFlash: 0,
    touchCooldown: 0,
    miteTimer: rng.range(2.2, 3.4),
    dead: false,
  };
}

export function makeBullet(x, y, angle, damage) {
  return {
    kind: 'bullet',
    x, y,
    vx: Math.cos(angle) * 640,
    vy: Math.sin(angle) * 640,
    radius: 6,
    damage,
    life: 1.4,
    dead: false,
  };
}

export function makeSunDrop(x, y, rng) {
  return {
    kind: 'sundrop',
    x, y,
    vx: rng.range(-30, 30),
    vy: rng.range(-30, 30),
    radius: 10,
    bobPhase: rng.range(0, Math.PI * 2),
    life: 9,
    dead: false,
  };
}

export function makeParticle(x, y, rng, color, speed = 120, life = 0.5, size = 4) {
  const angle = rng.range(0, Math.PI * 2);
  const velocity = rng.range(speed * 0.3, speed);
  return {
    kind: 'particle',
    x, y,
    vx: Math.cos(angle) * velocity,
    vy: Math.sin(angle) * velocity,
    radius: size * rng.range(0.6, 1.3),
    color,
    life,
    maxLife: life,
    dead: false,
  };
}

export function burst(particles, x, y, rng, color, count, speed = 150, life = 0.55, size = 4) {
  for (let i = 0; i < count; i += 1) {
    particles.push(makeParticle(x, y, rng, color, speed, life * rng.range(0.6, 1.2), size));
  }
  if (particles.length > 420) particles.splice(0, particles.length - 420);
}

// One creature's movement for one frame: everything marches on the Heart
// Flower at the garden's centre, each in its own way.
export function steerEnemy(enemy, heart, player, dt) {
  const toHeartX = heart.x - enemy.x;
  const toHeartY = heart.y - enemy.y;
  const heartDist = Math.hypot(toHeartX, toHeartY) || 1;

  let targetX = toHeartX / heartDist;
  let targetY = toHeartY / heartDist;

  // Mites are too angry to think: they chase the keeper instead.
  if (enemy.kind === 'mite') {
    const toPlayerX = player.x - enemy.x;
    const toPlayerY = player.y - enemy.y;
    const playerDist = Math.hypot(toPlayerX, toPlayerY) || 1;
    targetX = toPlayerX / playerDist;
    targetY = toPlayerY / playerDist;
  }

  enemy.flutterPhase += dt * 6;
  enemy.wobblePhase += dt * 2.2;

  let speed = enemy.speed;
  if (enemy.kind === 'moth') {
    // Moths flutter side to side as they close in.
    const sideX = -targetY * Math.sin(enemy.flutterPhase) * 0.85;
    const sideY = targetX * Math.sin(enemy.flutterPhase) * 0.85;
    targetX += sideX;
    targetY += sideY;
    speed *= 1 + Math.sin(enemy.flutterPhase * 0.5) * 0.12;
  }
  if (enemy.kind === 'beetle' || enemy.kind === 'spore') {
    targetX += Math.sin(enemy.wobblePhase) * 0.14;
    targetY += Math.cos(enemy.wobblePhase * 0.9) * 0.14;
  }

  const len = Math.hypot(targetX, targetY) || 1;
  enemy.vx = (targetX / len) * speed;
  enemy.vy = (targetY / len) * speed;
  enemy.x += enemy.vx * dt;
  enemy.y += enemy.vy * dt;
  enemy.hitFlash = Math.max(0, enemy.hitFlash - dt * 6);
  enemy.touchCooldown = Math.max(0, enemy.touchCooldown - dt);
}
