// Bloomkeeper — every pixel: the night garden, the Heart Flower, the
// keeper, the blight creatures, the HUD and all the full-screen moments.
// Nothing here changes the game; it only reads the world and draws it.

import { HEART_FLOWER, PALETTE, PLAYER, VIEW, WAVES } from './config.js';
import { makeRandom } from './random.js';

export class Renderer {
  constructor() {
    // Decoration is fixed once, from its own seed, so the garden never
    // rearranges itself between frames.
    const rng = makeRandom(20261115);
    this.grassTufts = [];
    for (let i = 0; i < 130; i += 1) {
      this.grassTufts.push({ x: rng.range(20, VIEW.width - 20), y: rng.range(80, VIEW.height - 20), s: rng.range(0.6, 1.5), tone: rng.next() });
    }
    this.sideFlowers = [];
    for (let i = 0; i < 26; i += 1) {
      const edge = rng.int(0, 3);
      let x = rng.range(16, VIEW.width - 16);
      let y = rng.range(70, VIEW.height - 16);
      if (edge === 0) y = rng.range(64, 110);
      if (edge === 1) y = rng.range(VIEW.height - 60, VIEW.height - 14);
      if (edge === 2) { x = rng.range(10, 44); }
      if (edge === 3) { x = rng.range(VIEW.width - 44, VIEW.width - 10); }
      this.sideFlowers.push({ x, y, r: rng.range(5, 10), color: rng.pick([PALETTE.petalPink, PALETTE.gold, '#b18cff', '#7fd4ff']) });
    }
    this.fireflies = [];
    for (let i = 0; i < 34; i += 1) {
      this.fireflies.push({ x: rng.range(0, VIEW.width), y: rng.range(70, VIEW.height), phase: rng.range(0, Math.PI * 2), speed: rng.range(0.2, 0.7) });
    }
  }

  draw(ctx, world, ui) {
    ctx.save();
    if (world.shake > 0) {
      ctx.translate((Math.random() - 0.5) * world.shake, (Math.random() - 0.5) * world.shake);
    }
    this.drawGarden(ctx, world.time);
    this.drawDrops(ctx, world);
    this.drawHeartFlower(ctx, world);
    for (const enemy of world.enemies) this.drawEnemy(ctx, enemy, world.time);
    this.drawBullets(ctx, world);
    if (!world.player.dead) this.drawPlayer(ctx, world);
    this.drawParticles(ctx, world);
    ctx.restore();

    this.drawHud(ctx, world, ui);
    if (ui.bannerTimer > 0 && ui.state === 'playing') this.drawWaveBanner(ctx, ui);
    if (ui.state === 'title') this.drawTitle(ctx, world, ui);
    if (ui.state === 'upgrade') this.drawUpgrade(ctx, world, ui);
    if (ui.state === 'gameover') this.drawEndScreen(ctx, world, false);
    if (ui.state === 'win') this.drawEndScreen(ctx, world, true);
    if (ui.state === 'paused') this.drawPaused(ctx);
  }

  drawGarden(ctx, time) {
    const gradient = ctx.createLinearGradient(0, 0, 0, VIEW.height);
    gradient.addColorStop(0, PALETTE.nightTop);
    gradient.addColorStop(1, PALETTE.nightBottom);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);

    // Meadow patches, like clearings in moonlight.
    ctx.fillStyle = PALETTE.meadow;
    for (const patch of [{ x: 250, y: 250, r: 190 }, { x: 1030, y: 560, r: 210 }, { x: 640, y: 660, r: 240 }, { x: 1060, y: 170, r: 150 }, { x: 180, y: 620, r: 150 }]) {
      ctx.beginPath();
      ctx.ellipse(patch.x, patch.y, patch.r, patch.r * 0.62, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = PALETTE.meadowDark;
    ctx.beginPath();
    ctx.ellipse(VIEW.width / 2, VIEW.height / 2 + 30, 300, 190, 0, 0, Math.PI * 2);
    ctx.fill();

    // Soil bed the Heart Flower grows from.
    ctx.fillStyle = PALETTE.soil;
    ctx.beginPath();
    ctx.ellipse(VIEW.width / 2, VIEW.height / 2 + 44, 92, 40, 0, 0, Math.PI * 2);
    ctx.fill();

    // Grass tufts.
    for (const tuft of this.grassTufts) {
      ctx.strokeStyle = tuft.tone > 0.5 ? PALETTE.leaf : PALETTE.leafDark;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(tuft.x, tuft.y);
      ctx.quadraticCurveTo(tuft.x - 3 * tuft.s, tuft.y - 8 * tuft.s, tuft.x - 5 * tuft.s, tuft.y - 11 * tuft.s);
      ctx.moveTo(tuft.x + 3, tuft.y);
      ctx.quadraticCurveTo(tuft.x + 3 * tuft.s, tuft.y - 9 * tuft.s, tuft.x + 6 * tuft.s, tuft.y - 12 * tuft.s);
      ctx.stroke();
    }

    // Small flowers around the edges of the garden.
    for (const flower of this.sideFlowers) {
      this.drawMiniFlower(ctx, flower.x, flower.y, flower.r, flower.color);
    }

    // Fireflies drifting on the night air.
    for (const fly of this.fireflies) {
      const x = fly.x + Math.sin(time * fly.speed + fly.phase) * 26;
      const y = fly.y + Math.cos(time * fly.speed * 0.8 + fly.phase) * 18;
      const glow = 0.35 + 0.3 * Math.sin(time * 2 + fly.phase * 3);
      ctx.fillStyle = `rgba(255, 220, 130, ${glow.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(x, y, 2.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawMiniFlower(ctx, x, y, r, color) {
    ctx.fillStyle = color;
    for (let i = 0; i < 5; i += 1) {
      const angle = (i / 5) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(x + Math.cos(angle) * r * 0.8, y + Math.sin(angle) * r * 0.8, r * 0.62, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = PALETTE.cream;
    ctx.beginPath();
    ctx.arc(x, y, r * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }

  drawHeartFlower(ctx, world) {
    const heart = world.heart;
    const health = heart.hp / heart.maxHp;
    const breathe = 1 + Math.sin(heart.pulse) * 0.045;
    const radius = heart.radius * breathe;

    // Golden glow while healthy, fading as the blight eats it.
    const glow = ctx.createRadialGradient(heart.x, heart.y, 6, heart.x, heart.y, radius * 2.6);
    glow.addColorStop(0, `rgba(255, 201, 77, ${(0.4 * health + 0.05).toFixed(3)})`);
    glow.addColorStop(1, 'rgba(255, 201, 77, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(heart.x, heart.y, radius * 2.6, 0, Math.PI * 2);
    ctx.fill();

    // Stem.
    ctx.strokeStyle = PALETTE.leafDark;
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(heart.x, heart.y + radius * 0.7);
    ctx.quadraticCurveTo(heart.x + 8, heart.y + 44, heart.x, heart.y + 58);
    ctx.stroke();
    // Leaves on the stem.
    ctx.fillStyle = PALETTE.leaf;
    ctx.beginPath();
    ctx.ellipse(heart.x - 18, heart.y + 46, 15, 7, -0.6, 0, Math.PI * 2);
    ctx.ellipse(heart.x + 18, heart.y + 50, 15, 7, 0.6, 0, Math.PI * 2);
    ctx.fill();

    // Petals: two rings turning slowly against each other.
    const petalColor = heart.hurtFlash > 0.3 ? '#ffffff' : PALETTE.petalPink;
    for (const ring of [{ count: 8, dist: 0.62, size: 0.52, spin: heart.pulse * 0.12 }, { count: 6, dist: 0.3, size: 0.4, spin: -heart.pulse * 0.18 }]) {
      ctx.fillStyle = ring === undefined ? petalColor : petalColor;
      for (let i = 0; i < ring.count; i += 1) {
        const angle = ring.spin + (i / ring.count) * Math.PI * 2;
        const px = heart.x + Math.cos(angle) * radius * ring.dist;
        const py = heart.y + Math.sin(angle) * radius * ring.dist;
        ctx.beginPath();
        ctx.ellipse(px, py, radius * ring.size, radius * ring.size * 0.62, angle, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // Heart centre.
    ctx.fillStyle = heart.hurtFlash > 0.3 ? '#ffffff' : PALETTE.gold;
    ctx.beginPath();
    ctx.arc(heart.x, heart.y, radius * 0.34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.rustDark;
    ctx.beginPath();
    ctx.arc(heart.x, heart.y, radius * 0.16, 0, Math.PI * 2);
    ctx.fill();

    // Health arc around the flower.
    ctx.lineWidth = 6;
    ctx.strokeStyle = 'rgba(253, 243, 216, 0.25)';
    ctx.beginPath();
    ctx.arc(heart.x, heart.y, radius + 13, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = health > 0.35 ? PALETTE.gold : PALETTE.heartRed;
    ctx.beginPath();
    ctx.arc(heart.x, heart.y, radius + 13, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * health);
    ctx.stroke();
  }

  drawPlayer(ctx, world) {
    const player = world.player;
    const blink = player.invulnTimer > 0 && Math.floor(world.time * 14) % 2 === 0;
    ctx.save();
    ctx.globalAlpha = blink ? 0.35 : 1;

    // Dash trail.
    if (player.dashTimer > 0) {
      ctx.fillStyle = 'rgba(87, 199, 133, 0.35)';
      ctx.beginPath();
      ctx.arc(player.x - player.dashDirX * 22, player.y - player.dashDirY * 22, player.radius * 0.8, 0, Math.PI * 2);
      ctx.arc(player.x - player.dashDirX * 40, player.y - player.dashDirY * 40, player.radius * 0.55, 0, Math.PI * 2);
      ctx.fill();
    }

    // Soft shadow.
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(player.x, player.y + player.radius + 5, player.radius * 0.9, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body: a round cream gardener bot.
    ctx.fillStyle = PALETTE.cream;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.leafDark;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Leaf propeller, spinning faster as the keeper moves.
    const spin = world.time * (6 + Math.hypot(player.vx, player.vy) * 0.05);
    ctx.fillStyle = PALETTE.leaf;
    for (let i = 0; i < 3; i += 1) {
      const angle = spin + (i / 3) * Math.PI * 2;
      ctx.beginPath();
      ctx.ellipse(player.x + Math.cos(angle) * 9, player.y - player.radius - 4 + Math.sin(angle) * 3, 10, 4.5, angle, 0, Math.PI * 2);
      ctx.fill();
    }

    // One big eye, looking where the keeper aims.
    const lookX = Math.cos(player.aimAngle) * 4;
    const lookY = Math.sin(player.aimAngle) * 4;
    ctx.fillStyle = PALETTE.white;
    ctx.beginPath();
    ctx.arc(player.x + lookX * 0.6, player.y + lookY * 0.6, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.ink;
    ctx.beginPath();
    ctx.arc(player.x + lookX, player.y + lookY, 4.6, 0, Math.PI * 2);
    ctx.fill();

    // Seed pouch in the aim direction.
    ctx.fillStyle = PALETTE.gold;
    ctx.beginPath();
    ctx.arc(player.x + Math.cos(player.aimAngle) * (player.radius + 2), player.y + Math.sin(player.aimAngle) * (player.radius + 2), 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawEnemy(ctx, enemy, time) {
    ctx.save();
    const flash = enemy.hitFlash > 0.4;
    if (enemy.kind === 'moth' || enemy.kind === 'mite') this.drawMoth(ctx, enemy, time, flash);
    if (enemy.kind === 'beetle') this.drawBeetle(ctx, enemy, flash);
    if (enemy.kind === 'spore') this.drawSpore(ctx, enemy, time, flash);
    if (enemy.kind === 'husk') this.drawHusk(ctx, enemy, time, flash);
    ctx.restore();

    // A slim health bar over anything tougher than a moth.
    if (enemy.maxHp > 2 && enemy.hp < enemy.maxHp) {
      const width = enemy.radius * 2;
      ctx.fillStyle = 'rgba(10, 20, 16, 0.65)';
      ctx.fillRect(enemy.x - width / 2, enemy.y - enemy.radius - 13, width, 5);
      ctx.fillStyle = PALETTE.heartRed;
      ctx.fillRect(enemy.x - width / 2, enemy.y - enemy.radius - 13, width * (enemy.hp / enemy.maxHp), 5);
    }
  }

  drawMoth(ctx, enemy, time, flash) {
    const flap = Math.sin(time * 18 + enemy.flutterPhase * 3) * 0.55;
    ctx.fillStyle = flash ? '#ffffff' : PALETTE.blight;
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(enemy.x, enemy.y);
      ctx.rotate(side * (0.5 + flap * 0.4));
      ctx.beginPath();
      ctx.ellipse(side * enemy.radius * 0.85, 0, enemy.radius * 0.85, enemy.radius * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = flash ? '#ffffff' : PALETTE.blightDark;
    ctx.beginPath();
    ctx.ellipse(enemy.x, enemy.y, enemy.radius * 0.5, enemy.radius * 0.72, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffd3e0';
    ctx.beginPath();
    ctx.arc(enemy.x - 4, enemy.y - 3, 2.4, 0, Math.PI * 2);
    ctx.arc(enemy.x + 4, enemy.y - 3, 2.4, 0, Math.PI * 2);
    ctx.fill();
  }

  drawBeetle(ctx, enemy, flash) {
    ctx.strokeStyle = flash ? '#ffffff' : PALETTE.rustDark;
    ctx.lineWidth = 3;
    for (let i = 0; i < 3; i += 1) {
      const off = (i - 1) * 10;
      ctx.beginPath();
      ctx.moveTo(enemy.x - enemy.radius - 5, enemy.y + off);
      ctx.lineTo(enemy.x - enemy.radius + 4, enemy.y + off);
      ctx.moveTo(enemy.x + enemy.radius + 5, enemy.y + off);
      ctx.lineTo(enemy.x + enemy.radius - 4, enemy.y + off);
      ctx.stroke();
    }
    ctx.fillStyle = flash ? '#ffffff' : PALETTE.rust;
    ctx.beginPath();
    ctx.ellipse(enemy.x, enemy.y, enemy.radius, enemy.radius * 0.86, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.rustDark;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(enemy.x, enemy.y - enemy.radius * 0.8);
    ctx.lineTo(enemy.x, enemy.y + enemy.radius * 0.8);
    ctx.stroke();
    ctx.fillStyle = PALETTE.rustDark;
    ctx.beginPath();
    ctx.arc(enemy.x - 6, enemy.y - 4, 3, 0, Math.PI * 2);
    ctx.arc(enemy.x + 6, enemy.y + 5, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  drawSpore(ctx, enemy, time, flash) {
    const puff = 1 + Math.sin(time * 3 + enemy.wobblePhase) * 0.05;
    ctx.fillStyle = flash ? '#ffffff' : PALETTE.spore;
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, enemy.radius * puff, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = flash ? '#ffffff' : '#e3a6ff';
    for (const spot of [{ x: -10, y: -8, r: 6 }, { x: 9, y: -2, r: 5 }, { x: -2, y: 10, r: 5.5 }, { x: 12, y: 12, r: 3.6 }]) {
      ctx.beginPath();
      ctx.arc(enemy.x + spot.x, enemy.y + spot.y, spot.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = PALETTE.ink;
    ctx.beginPath();
    ctx.arc(enemy.x - 5, enemy.y - 2, 2.6, 0, Math.PI * 2);
    ctx.arc(enemy.x + 5, enemy.y - 2, 2.6, 0, Math.PI * 2);
    ctx.fill();
  }

  drawHusk(ctx, enemy, time, flash) {
    const breathe = 1 + Math.sin(time * 1.6) * 0.03;
    // Spiky silhouette.
    ctx.fillStyle = flash ? '#ffffff' : PALETTE.husk;
    ctx.beginPath();
    const spikes = 11;
    for (let i = 0; i < spikes * 2; i += 1) {
      const angle = (i / (spikes * 2)) * Math.PI * 2;
      const r = enemy.radius * breathe * (i % 2 === 0 ? 1.12 : 0.9);
      const px = enemy.x + Math.cos(angle) * r;
      const py = enemy.y + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = flash ? '#ffffff' : '#a92c44';
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, enemy.radius * 0.62, 0, Math.PI * 2);
    ctx.fill();
    // One furious eye.
    ctx.fillStyle = '#ffe9a8';
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y - 6, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.ink;
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y - 6, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(enemy.x - 16, enemy.y + 16);
    ctx.lineTo(enemy.x + 16, enemy.y + 16);
    ctx.stroke();
  }

  drawBullets(ctx, world) {
    for (const bullet of world.bullets) {
      ctx.fillStyle = 'rgba(255, 220, 130, 0.35)';
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, bullet.radius * 2.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.gold;
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.cream;
      ctx.beginPath();
      ctx.arc(bullet.x - 1.5, bullet.y - 1.5, bullet.radius * 0.45, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawDrops(ctx, world) {
    for (const drop of world.drops) {
      const bob = Math.sin(drop.bobPhase) * 3;
      const fade = drop.life < 2 ? (Math.floor(world.time * 6) % 2 === 0 ? 0.35 : 1) : 1;
      ctx.save();
      ctx.globalAlpha = fade;
      ctx.strokeStyle = PALETTE.gold;
      ctx.lineWidth = 2.4;
      for (let i = 0; i < 6; i += 1) {
        const angle = (i / 6) * Math.PI * 2 + drop.bobPhase * 0.3;
        ctx.beginPath();
        ctx.moveTo(drop.x + Math.cos(angle) * 13, drop.y + bob + Math.sin(angle) * 13);
        ctx.lineTo(drop.x + Math.cos(angle) * 17, drop.y + bob + Math.sin(angle) * 17);
        ctx.stroke();
      }
      ctx.fillStyle = PALETTE.gold;
      ctx.beginPath();
      ctx.arc(drop.x, drop.y + bob, drop.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.cream;
      ctx.beginPath();
      ctx.arc(drop.x - 3, drop.y + bob - 3, 3.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  drawParticles(ctx, world) {
    for (const particle of world.particles) {
      ctx.globalAlpha = Math.max(0, particle.life / particle.maxLife);
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  drawHud(ctx, world, ui) {
    // Top bar.
    ctx.fillStyle = 'rgba(8, 26, 22, 0.82)';
    ctx.fillRect(0, 0, VIEW.width, 54);
    ctx.fillStyle = PALETTE.gold;
    ctx.fillRect(0, 54, VIEW.width, 3);

    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = '700 24px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillStyle = PALETTE.cream;
    ctx.fillText(`Score ${world.score}`, 20, 28);

    if (world.combo >= 3) {
      ctx.font = '700 20px "Trebuchet MS", Verdana, sans-serif';
      ctx.fillStyle = PALETTE.gold;
      ctx.fillText(`Combo x${(1 + Math.floor(world.combo / 8) * 0.5).toFixed(1)}  (${world.combo})`, 250, 28);
    }

    ctx.textAlign = 'center';
    ctx.font = '700 24px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillStyle = PALETTE.cream;
    const waveLabel = world.wave === 0 ? 'Get Ready' : `Wave ${world.wave} of ${WAVES.length}`;
    ctx.fillText(waveLabel, VIEW.width / 2, 28);

    // The keeper's hearts.
    ctx.textAlign = 'right';
    for (let i = 0; i < PLAYER.maxHearts; i += 1) {
      const x = VIEW.width - 34 - i * 34;
      this.drawHeartShape(ctx, x, 27, 11, i < world.player.hearts ? PALETTE.heartRed : 'rgba(253,243,216,0.22)');
    }

    // Heart Flower health, under the bar.
    ctx.textAlign = 'left';
    ctx.font = '600 15px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillStyle = PALETTE.petalSoft;
    ctx.fillText('HEART FLOWER', 20, 74);
    ctx.fillStyle = 'rgba(253, 243, 216, 0.2)';
    ctx.fillRect(152, 66, 168, 13);
    ctx.fillStyle = world.heart.hp > 35 ? PALETTE.leaf : PALETTE.heartRed;
    ctx.fillRect(152, 66, 168 * Math.max(0, world.heart.hp / world.heart.maxHp), 13);

    // Dash readiness.
    const dashReady = world.player.dashCooldownTimer <= 0;
    ctx.font = '600 15px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillStyle = dashReady ? PALETTE.gold : 'rgba(253,243,216,0.45)';
    ctx.textAlign = 'right';
    ctx.fillText(dashReady ? 'DASH READY (Shift)' : 'dash…', VIEW.width - 20, 74);

    if (ui.state === 'playing' && world.phase === 'fighting') {
      const left = world.spawnQueue.length + world.enemies.length;
      ctx.textAlign = 'center';
      ctx.font = '600 15px "Trebuchet MS", Verdana, sans-serif';
      ctx.fillStyle = 'rgba(253, 243, 216, 0.75)';
      ctx.fillText(`Blight left: ${left}`, VIEW.width / 2, 74);
    }
    ctx.textAlign = 'left';
  }

  drawHeartShape(ctx, x, y, size, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y + size * 0.9);
    ctx.bezierCurveTo(x - size * 1.25, y - size * 0.15, x - size * 0.55, y - size * 1.05, x, y - size * 0.3);
    ctx.bezierCurveTo(x + size * 0.55, y - size * 1.05, x + size * 1.25, y - size * 0.15, x, y + size * 0.9);
    ctx.fill();
  }

  drawWaveBanner(ctx, ui) {
    const alpha = Math.min(1, ui.bannerTimer / 0.5, (2.2 - ui.bannerTimer) / 0.5);
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.textAlign = 'center';
    ctx.font = '800 54px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillStyle = PALETTE.cream;
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 14;
    ctx.fillText(ui.bannerText, VIEW.width / 2, 150);
    ctx.font = '600 22px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillStyle = PALETTE.gold;
    ctx.fillText(ui.bannerSub, VIEW.width / 2, 192);
    ctx.restore();
    ctx.textAlign = 'left';
  }

  panel(ctx, x, y, width, height, fill = 'rgba(8, 26, 22, 0.88)') {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 22);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 201, 77, 0.55)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  drawTitle(ctx, world, ui) {
    ctx.fillStyle = 'rgba(6, 20, 17, 0.45)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    this.panel(ctx, VIEW.width / 2 - 430, 120, 860, 520);
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.gold;
    ctx.font = '800 84px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillText('BLOOMKEEPER', VIEW.width / 2, 232);
    ctx.fillStyle = PALETTE.petalSoft;
    ctx.font = '600 25px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillText('Defend the last garden on a dying star', VIEW.width / 2, 282);

    ctx.fillStyle = PALETTE.cream;
    ctx.font = '400 21px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillText('The blight is coming for the Heart Flower — the last flower anywhere.', VIEW.width / 2, 344);
    ctx.fillText('Sow seed-light, dash through the swarm, and hold all 8 waves.', VIEW.width / 2, 376);
    ctx.fillText('After each wave, choose one blessing to grow stronger.', VIEW.width / 2, 408);

    ctx.fillStyle = PALETTE.leaf;
    ctx.font = '600 20px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillText('WASD / Arrows — move      Mouse — aim      Hold click / Space — shoot', VIEW.width / 2, 466);
    ctx.fillText('Shift / Right-click — dash      P — pause      M — mute', VIEW.width / 2, 498);

    const pulse = 0.75 + Math.sin(ui.time * 4) * 0.25;
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.fillStyle = PALETTE.gold;
    ctx.font = '800 30px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillText('Click or press Enter to start', VIEW.width / 2, 576);
    ctx.restore();
    ctx.textAlign = 'left';
    void world;
  }

  drawUpgrade(ctx, world, ui) {
    ctx.fillStyle = 'rgba(6, 20, 17, 0.62)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.cream;
    ctx.font = '800 46px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillText(`Wave ${world.wave} held!`, VIEW.width / 2, 168);
    ctx.fillStyle = PALETTE.gold;
    ctx.font = '600 24px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillText('Choose one blessing for the garden', VIEW.width / 2, 212);

    const cardWidth = 330;
    const cardHeight = 250;
    const gap = 28;
    const startX = VIEW.width / 2 - (cardWidth * 3 + gap * 2) / 2;
    const y = 268;
    ui.cardRects = [];
    ui.choices.forEach((upgrade, index) => {
      const x = startX + index * (cardWidth + gap);
      ui.cardRects.push({ x, y, width: cardWidth, height: cardHeight });
      const hovered = ui.mouse.x >= x && ui.mouse.x <= x + cardWidth && ui.mouse.y >= y && ui.mouse.y <= y + cardHeight;
      this.panel(ctx, x, y, cardWidth, cardHeight, hovered ? 'rgba(23, 74, 58, 0.97)' : 'rgba(8, 26, 22, 0.94)');
      ctx.fillStyle = PALETTE.gold;
      ctx.font = '800 26px "Trebuchet MS", Verdana, sans-serif';
      const words = upgrade.name.split(' ');
      words.forEach((word, line) => {
        // Long names wrap onto two lines inside the card.
        if (words.length > 1) ctx.fillText(word, x + cardWidth / 2, y + 62 + line * 32);
      });
      if (words.length === 1) ctx.fillText(upgrade.name, x + cardWidth / 2, y + 78);
      ctx.fillStyle = PALETTE.cream;
      ctx.font = '400 19px "Trebuchet MS", Verdana, sans-serif';
      const blurbWords = upgrade.blurb.split(' ');
      let line = '';
      let lineY = y + 148;
      for (const word of blurbWords) {
        if ((line + ' ' + word).trim().length > 26 && line) {
          ctx.fillText(line.trim(), x + cardWidth / 2, lineY);
          lineY += 26;
          line = word;
        } else {
          line += ' ' + word;
        }
      }
      if (line.trim()) ctx.fillText(line.trim(), x + cardWidth / 2, lineY);
      ctx.fillStyle = PALETTE.leaf;
      ctx.font = '700 19px "Trebuchet MS", Verdana, sans-serif';
      ctx.fillText(`Press ${index + 1} or click`, x + cardWidth / 2, y + cardHeight - 26);
    });
    ctx.textAlign = 'left';
  }

  drawEndScreen(ctx, world, won) {
    ctx.fillStyle = won ? 'rgba(10, 34, 20, 0.68)' : 'rgba(24, 8, 12, 0.68)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    this.panel(ctx, VIEW.width / 2 - 400, 170, 800, 430);
    ctx.textAlign = 'center';
    ctx.fillStyle = won ? PALETTE.gold : PALETTE.heartRed;
    ctx.font = '800 58px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillText(won ? 'THE GARDEN BLOOMS!' : 'THE GARDEN FALLS', VIEW.width / 2, 268);
    ctx.fillStyle = PALETTE.cream;
    ctx.font = '400 22px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillText(won ? 'You held every wave. The Heart Flower opens to the stars.' : world.loseReason, VIEW.width / 2, 322);
    ctx.font = '700 30px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillStyle = PALETTE.gold;
    ctx.fillText(`Final score  ${world.score}`, VIEW.width / 2, 388);
    ctx.font = '400 21px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillStyle = PALETTE.cream;
    ctx.fillText(`Waves held: ${won ? WAVES.length : Math.max(0, world.wave - (world.phase === 'fighting' ? 1 : 0))} of ${WAVES.length}    Blight cleared: ${world.kills}    Best combo: ${world.bestCombo}`, VIEW.width / 2, 432);
    ctx.fillStyle = PALETTE.leaf;
    ctx.font = '800 27px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillText('Press R or click to play again', VIEW.width / 2, 522);
    ctx.textAlign = 'left';
  }

  drawPaused(ctx) {
    ctx.fillStyle = 'rgba(6, 20, 17, 0.6)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.cream;
    ctx.font = '800 52px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillText('PAUSED', VIEW.width / 2, 380);
    ctx.font = '600 22px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillStyle = PALETTE.gold;
    ctx.fillText('Press P to keep gardening', VIEW.width / 2, 428);
    ctx.textAlign = 'left';
  }
}
