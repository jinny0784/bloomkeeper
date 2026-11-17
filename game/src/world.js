// Bloomkeeper — the world: waves, spawning, combat, pickups and score.
// The world owns every living list and the rules between them. The main
// loop asks it to update; the renderer only reads what it holds.

import { ENEMIES, HEART_FLOWER, PLAYER, SCORE, VIEW, WAVES } from './config.js';
import { burst, makeBullet, makeEnemy, makePlayer, makeSunDrop, steerEnemy } from './entities.js';

export class World {
  constructor(rng, audio) {
    this.rng = rng;
    this.audio = audio;
    this.heart = { x: VIEW.width / 2, y: VIEW.height / 2 + 30, radius: HEART_FLOWER.radius, hp: HEART_FLOWER.maxHp, maxHp: HEART_FLOWER.maxHp, pulse: 0, hurtFlash: 0 };
    this.reset();
  }

  reset() {
    this.player = makePlayer(VIEW.width / 2, VIEW.height / 2 + 190);
    this.enemies = [];
    this.bullets = [];
    this.drops = [];
    this.particles = [];
    this.wave = 0;
    this.score = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.bestCombo = 0;
    this.kills = 0;
    this.spawnQueue = [];
    this.spawnTimer = 0;
    this.betweenTimer = 0;
    this.phase = 'intro'; // intro -> fighting -> cleared
    this.outcome = null; // 'win' | 'lose'
    this.loseReason = '';
    this.shake = 0;
    this.time = 0;
  }

  get waveTotal() {
    return WAVES.length;
  }

  startNextWave() {
    this.wave += 1;
    const table = WAVES[this.wave - 1];
    this.spawnQueue = [];
    for (let i = 0; i < table.moths; i += 1) this.spawnQueue.push('moth');
    for (let i = 0; i < table.beetles; i += 1) this.spawnQueue.push('beetle');
    for (let i = 0; i < table.spores; i += 1) this.spawnQueue.push('spore');
    for (let i = 0; i < table.husk; i += 1) this.spawnQueue.push('husk');
    // Shuffle so kinds arrive mixed, but the Husk always walks in last.
    const huskAt = this.spawnQueue.indexOf('husk');
    if (huskAt >= 0) this.spawnQueue.splice(huskAt, 1);
    for (let i = this.spawnQueue.length - 1; i > 0; i -= 1) {
      const j = Math.floor(this.rng.next() * (i + 1));
      [this.spawnQueue[i], this.spawnQueue[j]] = [this.spawnQueue[j], this.spawnQueue[i]];
    }
    if (huskAt >= 0) this.spawnQueue.push('husk');
    this.spawnTimer = 0.6;
    this.phase = 'fighting';
    this.audio.waveStart();
  }

  spawnPoint() {
    // Creatures creep in from the garden's edge, never near the keeper.
    for (let tries = 0; tries < 12; tries += 1) {
      const side = this.rng.int(0, 3);
      let x = 0;
      let y = 0;
      if (side === 0) { x = this.rng.range(40, VIEW.width - 40); y = -30; }
      if (side === 1) { x = this.rng.range(40, VIEW.width - 40); y = VIEW.height + 30; }
      if (side === 2) { x = -30; y = this.rng.range(40, VIEW.height - 40); }
      if (side === 3) { x = VIEW.width + 30; y = this.rng.range(40, VIEW.height - 40); }
      if (Math.hypot(x - this.player.x, y - this.player.y) > 240) return { x, y };
    }
    return { x: -30, y: 120 };
  }

  update(dt, input, draft) {
    if (this.outcome) return;
    this.time += dt;
    this.heart.pulse += dt * 2;
    this.heart.hurtFlash = Math.max(0, this.heart.hurtFlash - dt * 5);
    this.shake = Math.max(0, this.shake - dt * 26);

    this.updatePlayer(dt, input, draft);
    this.updateSpawning(dt);
    this.updateEnemies(dt);
    this.updateBullets(dt);
    this.updateDrops(dt, draft);
    this.updateParticles(dt);

    this.comboTimer -= dt;
    if (this.comboTimer <= 0) this.combo = 0;

    if (this.phase === 'fighting' && this.spawnQueue.length === 0 && this.enemies.length === 0) {
      this.phase = 'cleared';
      this.score += SCORE.waveClear;
      this.betweenTimer = 0.4;
      if (this.wave >= WAVES.length) {
        this.outcome = 'win';
        burst(this.particles, this.heart.x, this.heart.y, this.rng, '#ffc94d', 60, 260, 1.1, 6);
        burst(this.particles, this.heart.x, this.heart.y, this.rng, '#ff8fb2', 50, 220, 1.2, 5);
        this.audio.win();
      }
    }
  }

  updatePlayer(dt, input, draft) {
    const player = this.player;
    const axis = input.moveAxis();
    const speed = PLAYER.speed * (1 + draft.speedBonus);

    player.dashCooldownTimer = Math.max(0, player.dashCooldownTimer - dt);
    player.invulnTimer = Math.max(0, player.invulnTimer - dt);
    player.fireTimer = Math.max(0, player.fireTimer - dt);

    // Aim: the keeper always faces the mouse.
    player.aimAngle = Math.atan2(input.mouse.y - player.y, input.mouse.x - player.x);

    const wantsDash = input.justPressed('ShiftLeft', 'ShiftRight') || input.mouse.rightClicked;
    if (wantsDash && player.dashCooldownTimer <= 0 && player.dashTimer <= 0) {
      player.dashTimer = PLAYER.dashTime;
      player.dashCooldownTimer = PLAYER.dashCooldown * (1 - Math.min(0.6, draft.dashBonus));
      const dashAngle = (axis.x !== 0 || axis.y !== 0) ? Math.atan2(axis.y, axis.x) : player.aimAngle;
      player.dashDirX = Math.cos(dashAngle);
      player.dashDirY = Math.sin(dashAngle);
      this.audio.dash();
      burst(this.particles, player.x, player.y, this.rng, '#57c785', 8, 90, 0.35, 3);
    }

    if (player.dashTimer > 0) {
      player.dashTimer -= dt;
      player.vx = player.dashDirX * PLAYER.dashSpeed;
      player.vy = player.dashDirY * PLAYER.dashSpeed;
    } else {
      player.vx = axis.x * speed;
      player.vy = axis.y * speed;
    }
    player.x += player.vx * dt;
    player.y += player.vy * dt;
    player.x = Math.max(player.radius, Math.min(VIEW.width - player.radius, player.x));
    player.y = Math.max(player.radius + 56, Math.min(VIEW.height - player.radius, player.y));
    if (axis.x !== 0 || axis.y !== 0 || player.dashTimer > 0) player.walkCycle += dt * 10;

    // Keep a respectful distance from the Heart Flower itself.
    const heartDist = Math.hypot(player.x - this.heart.x, player.y - this.heart.y);
    const minDist = this.heart.radius + player.radius - 6;
    if (heartDist < minDist && heartDist > 0) {
      player.x = this.heart.x + ((player.x - this.heart.x) / heartDist) * minDist;
      player.y = this.heart.y + ((player.y - this.heart.y) / heartDist) * minDist;
    }

    // Firing: hold the mouse or Space to sow seed-light.
    const firing = input.mouse.down || input.down('Space');
    if (firing && player.fireTimer <= 0) {
      player.fireTimer = PLAYER.fireCooldown * (1 - Math.min(0.65, draft.fireRateBonus));
      const shots = 1 + draft.extraShots;
      for (let i = 0; i < shots; i += 1) {
        const spread = shots === 1 ? 0 : (i - (shots - 1) / 2) * 0.14;
        this.bullets.push(makeBullet(player.x, player.y, player.aimAngle + spread, PLAYER.bulletDamage + draft.damageBonus));
      }
      this.audio.shoot();
    }
  }

  updateSpawning(dt) {
    if (this.phase !== 'fighting' || this.spawnQueue.length === 0) return;
    this.spawnTimer -= dt;
    if (this.spawnTimer > 0) return;
    const table = WAVES[this.wave - 1];
    this.spawnTimer = table.spawnGap;
    const kind = this.spawnQueue.shift();
    const point = this.spawnPoint();
    this.enemies.push(makeEnemy(kind, point.x, point.y, this.rng));
  }

  updateEnemies(dt) {
    for (const enemy of this.enemies) {
      steerEnemy(enemy, this.heart, this.player, dt);

      // The Hollow Husk sheds mites as it lumbers in.
      if (enemy.kind === 'husk') {
        enemy.miteTimer -= dt;
        if (enemy.miteTimer <= 0) {
          enemy.miteTimer = this.rng.range(2.4, 3.6);
          for (let i = 0; i < 2; i += 1) {
            this.enemies.push(makeEnemy('mite', enemy.x + this.rng.range(-30, 30), enemy.y + this.rng.range(-30, 30), this.rng));
          }
        }
      }

      // Reaching the Heart Flower: it bites, then backs off a breath.
      const heartDist = Math.hypot(enemy.x - this.heart.x, enemy.y - this.heart.y);
      if (heartDist < enemy.radius + this.heart.radius - 8 && enemy.touchCooldown <= 0) {
        enemy.touchCooldown = 0.9;
        this.heart.hp -= enemy.damage;
        this.heart.hurtFlash = 1;
        this.shake = Math.min(9, this.shake + 4);
        this.audio.heartHurt();
        burst(this.particles, this.heart.x, this.heart.y - 20, this.rng, '#ff8fb2', 10, 130, 0.5, 4);
        enemy.x -= enemy.vx * 0.24;
        enemy.y -= enemy.vy * 0.24;
        if (this.heart.hp <= 0) {
          this.heart.hp = 0;
          this.outcome = 'lose';
          this.loseReason = 'The Heart Flower was eaten by the blight.';
          this.audio.gameOver();
        }
      }

      // Touching the keeper hurts — unless the keeper is dashing through.
      const playerDist = Math.hypot(enemy.x - this.player.x, enemy.y - this.player.y);
      if (playerDist < enemy.radius + this.player.radius - 4 && this.player.invulnTimer <= 0 && this.player.dashTimer <= 0) {
        this.player.hearts -= enemy.touchDamage;
        this.player.invulnTimer = PLAYER.hurtInvulnTime;
        this.shake = Math.min(10, this.shake + 5);
        this.audio.playerHurt();
        burst(this.particles, this.player.x, this.player.y, this.rng, '#ff5d5d', 14, 170, 0.5, 4);
        if (this.player.hearts <= 0) {
          this.player.dead = true;
          this.outcome = 'lose';
          this.loseReason = 'The keeper fell defending the garden.';
          this.audio.gameOver();
        }
      }
    }
  }

  updateBullets(dt) {
    for (const bullet of this.bullets) {
      bullet.x += bullet.vx * dt;
      bullet.y += bullet.vy * dt;
      bullet.life -= dt;
      if (bullet.life <= 0 || bullet.x < -20 || bullet.x > VIEW.width + 20 || bullet.y < -20 || bullet.y > VIEW.height + 20) {
        bullet.dead = true;
        continue;
      }
      for (const enemy of this.enemies) {
        if (enemy.dead) continue;
        if (Math.hypot(bullet.x - enemy.x, bullet.y - enemy.y) < bullet.radius + enemy.radius) {
          bullet.dead = true;
          enemy.hp -= bullet.damage;
          enemy.hitFlash = 1;
          this.audio.hit();
          burst(this.particles, bullet.x, bullet.y, this.rng, '#fdf3d8', 4, 110, 0.3, 3);
          if (enemy.hp <= 0) this.killEnemy(enemy);
          break;
        }
      }
    }
    this.bullets = this.bullets.filter((bullet) => !bullet.dead);
    this.enemies = this.enemies.filter((enemy) => !enemy.dead);
  }

  killEnemy(enemy) {
    enemy.dead = true;
    this.kills += 1;
    this.combo += 1;
    this.comboTimer = SCORE.comboWindow;
    this.bestCombo = Math.max(this.bestCombo, this.combo);
    const multiplier = 1 + Math.floor(this.combo / SCORE.comboStep) * 0.5;
    this.score += Math.round(enemy.score * multiplier);
    this.audio.enemyDown();
    const colors = { moth: '#8d7bff', beetle: '#e07b39', spore: '#c65df0', mite: '#8d7bff', husk: '#d84f6a' };
    burst(this.particles, enemy.x, enemy.y, this.rng, colors[enemy.kind], enemy.kind === 'husk' ? 46 : 13, 180, 0.6, 4);
    if (enemy.kind === 'spore') {
      for (let i = 0; i < 2; i += 1) {
        this.enemies.push(makeEnemy('mite', enemy.x + this.rng.range(-16, 16), enemy.y + this.rng.range(-16, 16), this.rng));
      }
    }
    if (enemy.kind === 'husk' || this.rng.chance(0.22)) {
      this.drops.push(makeSunDrop(enemy.x, enemy.y, this.rng));
    }
  }

  updateDrops(dt, draft) {
    const magnet = PLAYER.magnetRadius + draft.magnetBonus;
    for (const drop of this.drops) {
      drop.life -= dt;
      drop.bobPhase += dt * 4;
      if (drop.life <= 0) { drop.dead = true; continue; }
      const dist = Math.hypot(this.player.x - drop.x, this.player.y - drop.y);
      if (dist < magnet) {
        const pull = 340 * (1 - dist / magnet) + 60;
        drop.vx += ((this.player.x - drop.x) / (dist || 1)) * pull * dt * 3;
        drop.vy += ((this.player.y - drop.y) / (dist || 1)) * pull * dt * 3;
      }
      drop.vx *= 0.92;
      drop.vy *= 0.92;
      drop.x += drop.vx * dt;
      drop.y += drop.vy * dt;
      if (dist < this.player.radius + drop.radius + 4) {
        drop.dead = true;
        this.score += SCORE.sunDrop;
        this.heart.hp = Math.min(this.heart.maxHp, this.heart.hp + 3);
        this.audio.pickup();
        burst(this.particles, drop.x, drop.y, this.rng, '#ffc94d', 8, 120, 0.45, 3);
      }
    }
    this.drops = this.drops.filter((drop) => !drop.dead);
  }

  updateParticles(dt) {
    for (const particle of this.particles) {
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vx *= 0.94;
      particle.vy *= 0.94;
      particle.life -= dt;
      if (particle.life <= 0) particle.dead = true;
    }
    this.particles = this.particles.filter((particle) => !particle.dead);
  }
}
