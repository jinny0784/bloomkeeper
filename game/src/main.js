// Bloomkeeper — the game loop and the state machine.
// Title -> playing -> (upgrade -> playing) ... -> win / game over -> restart.
// This file wires the input, world, audio and renderer together and owns
// the moments between waves; everything else lives in its own module.

import { GardenAudio } from './audio.js';
import { UPGRADES, VIEW, WAVES } from './config.js';
import { makeDraft } from './entities.js';
import { Input } from './input.js';
import { makeRandom } from './random.js';
import { Renderer } from './render.js';
import { stageShot } from './shots.js';
import { World } from './world.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW.width;
canvas.height = VIEW.height;

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seed = Number(params.get('seed') ?? '1') || 1;
if (shotName) document.body.classList.add('shot');

const rng = makeRandom(shotName ? seed * 7919 : (Date.now() % 2147483647) || 1);
const audio = new GardenAudio();
const input = new Input(canvas);
const renderer = new Renderer();
const world = new World(rng, audio);

const ui = {
  state: 'title',
  time: 0,
  bannerTimer: 0,
  bannerText: '',
  bannerSub: '',
  choices: [],
  cardRects: [],
  mouse: input.mouse,
  endTimer: 0,
};

let draft = makeDraft();

function showBanner(text, sub) {
  ui.bannerText = text;
  ui.bannerSub = sub;
  ui.bannerTimer = 2.2;
}

function startGame() {
  world.reset();
  draft = makeDraft();
  ui.state = 'playing';
  ui.endTimer = 0;
  world.startNextWave();
  showBanner('Wave 1', 'The moths come first. Hold the garden!');
}

function openUpgrade() {
  const pool = [...UPGRADES];
  ui.choices = [];
  for (let i = 0; i < 3; i += 1) {
    const index = Math.floor(rng.next() * pool.length);
    ui.choices.push(pool.splice(index, 1)[0]);
  }
  ui.state = 'upgrade';
}

function chooseUpgrade(upgrade) {
  upgrade.apply(draft);
  // One-shot blessings land at once, then clear so they never re-apply.
  if (draft.heartHeal > 0) {
    world.heart.hp = Math.min(world.heart.maxHp, world.heart.hp + draft.heartHeal);
    draft.heartHeal = 0;
  }
  if (draft.playerHeal > 0) {
    world.player.hearts = Math.min(3, world.player.hearts + draft.playerHeal);
    draft.playerHeal = 0;
  }
  audio.upgrade();
  ui.state = 'playing';
  world.startNextWave();
  if (world.wave >= WAVES.length) {
    showBanner(`Wave ${world.wave}`, 'The Hollow Husk comes for the Heart Flower!');
  } else {
    showBanner(`Wave ${world.wave}`, 'The blight grows bolder…');
  }
}

function handleUpgradePick() {
  if (input.mouse.clicked) {
    ui.cardRects.forEach((rect, index) => {
      if (input.mouse.x >= rect.x && input.mouse.x <= rect.x + rect.width
        && input.mouse.y >= rect.y && input.mouse.y <= rect.y + rect.height) {
        chooseUpgrade(ui.choices[index]);
      }
    });
  }
  for (let i = 0; i < 3; i += 1) {
    if (input.justPressed(`Digit${i + 1}`)) chooseUpgrade(ui.choices[i]);
  }
}

if (shotName) {
  const staged = stageShot(world, shotName);
  ui.state = staged.state;
  if (staged.choices) ui.choices = staged.choices;
}

let lastTime = performance.now();

function frame(now) {
  let dt = Math.min(0.033, (now - lastTime) / 1000);
  lastTime = now;
  if (shotName) dt = 0.016; // staged scenes tick evenly, for steady pictures
  ui.time += dt;
  ui.bannerTimer = Math.max(0, ui.bannerTimer - dt);

  if (input.justPressed('KeyM')) audio.setMuted(!audio.muted);
  if (input.mouse.clicked || input.pressed.size > 0) audio.unlock();

  if (ui.state === 'title') {
    world.heart.pulse += dt * 2;
    if (input.mouse.clicked || input.justPressed('Enter', 'Space')) startGame();
  } else if (ui.state === 'playing') {
    if (input.justPressed('KeyP', 'Escape')) {
      ui.state = 'paused';
    } else {
      audio.update(dt);
      const wasPhase = world.phase;
      world.update(dt, input, draft);
      if (world.outcome) {
        ui.endTimer += dt;
        if (ui.endTimer > 1.1) ui.state = world.outcome === 'win' ? 'win' : 'gameover';
      } else if (wasPhase === 'fighting' && world.phase === 'cleared') {
        // The wave is held: a breath, then the blessing choice.
        ui.endTimer = -0.9;
      } else if (world.phase === 'cleared' && ui.endTimer < 0) {
        ui.endTimer += dt;
        if (ui.endTimer >= 0) openUpgrade();
      }
    }
  } else if (ui.state === 'paused') {
    if (input.justPressed('KeyP', 'Escape')) ui.state = 'playing';
  } else if (ui.state === 'upgrade') {
    world.heart.pulse += dt * 2;
    handleUpgradePick();
  } else if (ui.state === 'win' || ui.state === 'gameover') {
    world.updateParticles(dt);
    world.heart.pulse += dt * 2;
    if (input.justPressed('KeyR') || input.mouse.clicked) startGame();
  }

  renderer.draw(ctx, world, ui);
  input.endFrame();
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
