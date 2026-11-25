// The screenshot scenes behind ?shot=start|play|end. Each one plays the real rules
// forward from a fresh world, steered by a scripted cook: walk to a spot, use it, wait
// for the station, and carry on — so every frame is what a short game really looks like
// and the same seed always gives the same frame.
import { LAYOUT, STEP } from './config.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

const START_SECONDS = 6;
const PLAY_SECONDS = 30;
const END_SECONDS = 180;

// One scripted move: walk to (x, y), press E once there, then wait `wait` seconds.
function move(x, y, wait = 0) {
  return { x, y, wait };
}

function binCentre(kind) {
  const bin = LAYOUT.bins.find((b) => b.kind === kind);
  return { x: bin.x + bin.w / 2, y: bin.y + bin.h / 2 };
}

function stationCentre(which) {
  const s = which === 'board' ? LAYOUT.board_station : LAYOUT.stove_station;
  return { x: s.x + s.w / 2, y: s.y + s.h / 2 };
}

function plateCentre() {
  return { x: LAYOUT.plate.x + LAYOUT.plate.w / 2, y: LAYOUT.plate.y + LAYOUT.plate.h / 2 };
}

// The cook's whole shift, as a script: build a Nasi Goreng (rice + egg cooked, chili
// chopped), serve it, then start an Ayam Geprek. The play scene stops mid-assembly;
// the end scene runs the script through and serves.
function buildScript() {
  return [
    move(binCentre('rice').x, binCentre('rice').y),
    move(stationCentre('stove').x, stationCentre('stove').y, 4.5),
    move(stationCentre('stove').x, stationCentre('stove').y),
    move(plateCentre().x, plateCentre().y),
    move(binCentre('egg').x, binCentre('egg').y),
    move(stationCentre('stove').x, stationCentre('stove').y, 4.5),
    move(stationCentre('stove').x, stationCentre('stove').y),
    move(plateCentre().x, plateCentre().y),
    move(binCentre('chili').x, binCentre('chili').y),
    move(stationCentre('board').x, stationCentre('board').y, 3.5),
    move(stationCentre('board').x, stationCentre('board').y),
    move(plateCentre().x, plateCentre().y),
    move(plateCentre().x, plateCentre().y),
    move(binCentre('chicken').x, binCentre('chicken').y),
    move(stationCentre('stove').x, stationCentre('stove').y, 4.5),
    move(stationCentre('stove').x, stationCentre('stove').y),
    move(plateCentre().x, plateCentre().y),
    move(binCentre('chili').x, binCentre('chili').y),
    move(stationCentre('board').x, stationCentre('board').y, 3.5),
    move(stationCentre('board').x, stationCentre('board').y),
    move(plateCentre().x, plateCentre().y),
    move(plateCentre().x, plateCentre().y),
  ];
}

// Run the script for `seconds` of game time, one fixed step at a time.
function runScript(world, seconds) {
  const script = buildScript();
  let index = 0;
  let waited = 0;
  let pressed = false;
  for (let t = 0; t < seconds; t += STEP) {
    let input = { dx: 0, dy: 0, interact: false, click: null };
    const step = script[index];
    if (step) {
      const chef = world.state.chef;
      const dx = step.x - chef.x;
      const dy = step.y - chef.y;
      const d = Math.hypot(dx, dy);
      if (d > 24) {
        input = { dx: dx / d, dy: dy / d, interact: false, click: null };
        pressed = false;
      } else if (!pressed) {
        input = { dx: 0, dy: 0, interact: true, click: null };
        pressed = true;
        waited = 0;
      } else if (waited < step.wait) {
        waited += STEP;
      } else {
        index += 1;
        pressed = false;
        waited = 0;
      }
    }
    world.step(STEP, input, false);
    if (world.state.over) break;
  }
}

/**
 * Set `world` to the named scene (start, play or end; any other name is start) and return
 * the screen to draw over it and the best score to show.
 *
 * The scenes stage the exact orders the scripted cook makes, with long patience and no
 * further spawns, so the frame is deterministic: the play scene always catches the Nasi
 * Goreng mid-assembly, the end scene always shows two dishes served.
 */
export function stageShot(name, world) {
  world.reset();
  world.state.nextOrderAt = 1000;
  if (name !== 'play' && name !== 'end') {
    world.state.orders = [{ id: 1, recipeId: 'nasi-goreng', patience: 120, max: 120 }];
    for (let i = 0; i < START_SECONDS / STEP; i += 1) world.step(STEP, { dx: 0, dy: 0, interact: false, click: null }, true);
    return { screen: SCREEN_TITLE, best: 0 };
  }
  world.state.orders = [
    { id: 1, recipeId: 'nasi-goreng', patience: 120, max: 120 },
    { id: 2, recipeId: 'ayam-geprek', patience: 120, max: 120 },
  ];
  if (name === 'play') {
    runScript(world, PLAY_SECONDS);
    return { screen: SCREEN_PLAY, best: world.state.coins };
  }
  runScript(world, END_SECONDS);
  return { screen: world.state.over ? SCREEN_OVER : SCREEN_PLAY, best: world.state.coins };
}
