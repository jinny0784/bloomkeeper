// Bloomkeeper — staged scenes for the screenshots in shots.json.
// A URL like ?shot=play&seed=1 arranges a real mid-game moment with the
// game's own creatures and rules, so the pictures in screenshots/ are
// honest renders of the game itself, identical every time they are taken.

import { UPGRADES, VIEW } from './config.js';
import { burst, makeBullet, makeEnemy, makeSunDrop } from './entities.js';

function place(world, kind, x, y) {
  const enemy = makeEnemy(kind, x, y, world.rng);
  world.enemies.push(enemy);
  return enemy;
}

export function stageShot(world, name) {
  if (name === 'play') {
    world.wave = 3;
    world.phase = 'fighting';
    world.score = 1840;
    world.kills = 41;
    world.combo = 9;
    world.comboTimer = 2.2;
    world.bestCombo = 14;
    world.heart.hp = 72;
    world.player.x = 430;
    world.player.y = 540;
    world.player.hearts = 2;
    world.player.aimAngle = -0.5;
    place(world, 'moth', 905, 295);
    place(world, 'moth', 1015, 425);
    place(world, 'moth', 845, 175);
    place(world, 'beetle', 1085, 605);
    place(world, 'beetle', 295, 235);
    place(world, 'spore', 960, 530);
    place(world, 'mite', 705, 305);
    for (let i = 0; i < 5; i += 1) {
      world.bullets.push(makeBullet(470 + i * 52, 515 - i * 26, -0.5, 1));
    }
    world.drops.push(makeSunDrop(560, 380, world.rng));
    world.drops.push(makeSunDrop(760, 620, world.rng));
    world.spawnQueue = ['moth', 'beetle', 'moth'];
    burst(world.particles, 905, 295, world.rng, '#8d7bff', 8, 130, 0.7, 4);
    return { state: 'playing' };
  }

  if (name === 'upgrade') {
    world.wave = 2;
    world.phase = 'cleared';
    world.score = 1320;
    world.kills = 26;
    world.heart.hp = 64;
    world.player.x = VIEW.width / 2 - 130;
    world.player.y = VIEW.height / 2 + 200;
    const choices = ['rapid', 'twin', 'heartsap'].map((id) => UPGRADES.find((upgrade) => upgrade.id === id));
    return { state: 'upgrade', choices };
  }

  if (name === 'win') {
    world.wave = 8;
    world.phase = 'cleared';
    world.outcome = 'win';
    world.score = 12480;
    world.kills = 214;
    world.bestCombo = 23;
    world.heart.hp = 38;
    burst(world.particles, world.heart.x, world.heart.y, world.rng, '#ffc94d', 40, 240, 1.2, 5);
    burst(world.particles, world.heart.x, world.heart.y, world.rng, '#ff8fb2', 30, 200, 1.3, 5);
    return { state: 'win' };
  }

  if (name === 'gameover') {
    world.wave = 5;
    world.phase = 'fighting';
    world.outcome = 'lose';
    world.loseReason = 'The Heart Flower was eaten by the blight.';
    world.score = 6930;
    world.kills = 118;
    world.bestCombo = 17;
    world.heart.hp = 0;
    place(world, 'beetle', 700, 380);
    place(world, 'moth', 560, 300);
    return { state: 'gameover' };
  }

  // 'title' and anything unknown: a fresh garden behind the title panel.
  world.heart.hp = 100;
  return { state: 'title' };
}
