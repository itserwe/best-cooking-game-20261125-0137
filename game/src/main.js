// Boot and the one loop: input is read every frame, the world advances in fixed 1/60 s
// steps (several in a slow frame, none in a fast one), and the renderer paints what is
// there. The game moves between four screens: title, play, paused and game over.
//
// ?seed=N fixes the order pattern. ?shot=start|play|end (with &seed=N) stages that scene
// instead of running the loop, paints it twice and sets window.__shotReady for a screenshot.
import { BEST_KEY, LAYOUT, STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld, EVENT_DONE, EVENT_ERROR, EVENT_EXPIRED, EVENT_OVER, EVENT_PICKUP, EVENT_PLACE, EVENT_SERVED, EVENT_TRASH } from './world.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped, not replayed. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);
const audio = createAudio();

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

// The box the hint ring draws around: whatever the chef could use right now.
function highlightBox() {
  const near = world.nearest();
  if (!near) return null;
  if (near.type === 'bin') return near.ref;
  if (near.type === 'board') return world.state.board;
  if (near.type === 'stove') return world.state.stove;
  if (near.type === 'plate') return LAYOUT.plate;
  if (near.type === 'trash') return LAYOUT.trash;
  return null;
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    world.state._highlight = null;
    renderer.draw(world.state, scene.screen, scene.best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();

  // Screen readers (and anyone watching the page's text) hear the screen changes and each hit.
  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    world.reset();
    accumulator = 0;
    screen = SCREEN_PLAY;
    announce('Bermain. Sajikan pesanan sebelum pelanggan pergi.');
  }

  function endGame() {
    screen = SCREEN_OVER;
    if (world.state.coins > best) {
      best = world.state.coins;
      saveBest(best);
    }
    announce(`Shift selesai. Koin ${world.state.coins}. Hidangan ${world.state.served}. Rekor ${best}.`);
  }

  function playEvents(events) {
    if (events & EVENT_SERVED) audio.served();
    else if (events & EVENT_DONE) audio.done();
    else if (events & EVENT_PICKUP) audio.pickup();
    else if (events & EVENT_PLACE) audio.place();
    else if (events & EVENT_TRASH) audio.place();
    else if (events & EVENT_ERROR) audio.error();
    if (events & EVENT_EXPIRED) {
      audio.expired();
      announce(`Satu pelanggan pergi. ${world.state.hearts} hati tersisa.`);
    }
  }

  // One frame's input is taken exactly once, then split: actions run now, movement
  // rides along with the fixed world steps below.
  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    const taken = input.take();
    if (taken.interact && (screen === SCREEN_TITLE || screen === SCREEN_OVER)) {
      startGame();
    } else if (screen === SCREEN_PLAY) {
      if (taken.click) {
        // A click on a nearby usable spot uses it at once; otherwise the chef walks there.
        world.state.chef.tx = taken.click.x;
        world.state.chef.ty = taken.click.y;
        if (world.nearest()) playEvents(world.interact());
      } else if (taken.interact) {
        playEvents(world.interact());
      }
    }
    const move = { dx: taken.dx, dy: taken.dy, interact: false, click: null };
    if (screen === SCREEN_TITLE || screen === SCREEN_PLAY) {
      while (accumulator >= STEP && (screen === SCREEN_TITLE || screen === SCREEN_PLAY)) {
        if (screen === SCREEN_TITLE) {
          world.step(STEP, move, true);
        } else {
          const events = world.step(STEP, move, false);
          playEvents(events);
          if (events & EVENT_OVER) endGame();
        }
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }
    if (screen === SCREEN_PLAY) world.state._highlight = highlightBox();
    else world.state._highlight = null;
    renderer.draw(world.state, screen, best);
  }

  // Leaving the tab pauses a running game rather than letting orders expire unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Jeda.');
    }
  });
  window.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    if (key === 'p' && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Jeda.');
    } else if (key === 'p' && screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY;
      announce('Bermain.');
    }
  });

  announce('Dapur Kilat. Tekan Spasi atau klik untuk mulai.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
