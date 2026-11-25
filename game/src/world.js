// Dapur Kilat — the world: orders, stations, the plate, the chef and the score.
// Pure logic, no DOM: the renderer draws `state`, main.js feeds it input, and
// shots.js steers it with the same step() every real player uses.
import {
  BURN_GRACE, CHOP_SECONDS, COOK_SECONDS, CHEF_SPEED, HEARTS, INGREDIENTS,
  INTERACT_RANGE, LAYOUT, MAX_ORDERS, ORDER_EVERY, ORDER_FIRST_AT,
  ORDER_PATIENCE, PLATE_SLOTS, RECIPES, SHIFT_SECONDS, itemKey, recipeById,
} from './config.js';

export const EVENT_NONE = 0;
export const EVENT_PICKUP = 1;
export const EVENT_PLACE = 2;
export const EVENT_DONE = 4;
export const EVENT_SERVED = 8;
export const EVENT_EXPIRED = 16;
export const EVENT_ERROR = 32;
export const EVENT_OVER = 64;
export const EVENT_TRASH = 128;

function makeItem(kind, state) {
  return { kind, state, progress: 0, done: false, burn: 0 };
}

function stationAt(x, y, w, h) {
  return { x, y, w, h, item: null };
}

export function createWorld(random) {
  const state = {
    time: 0,
    shiftLeft: SHIFT_SECONDS,
    coins: 0,
    served: 0,
    hearts: HEARTS,
    combo: 0,
    comboLeft: 0,
    chef: { x: 640, y: 560, tx: null, ty: null, carrying: null, moving: false },
    orders: [],
    board: stationAt(LAYOUT.board_station.x, LAYOUT.board_station.y, LAYOUT.board_station.w, LAYOUT.board_station.h),
    stove: stationAt(LAYOUT.stove_station.x, LAYOUT.stove_station.y, LAYOUT.stove_station.w, LAYOUT.stove_station.h),
    plate: [],
    toasts: [],
    nextOrderAt: ORDER_FIRST_AT,
    orderSeq: 0,
    over: false,
    overReason: '',
  };

  function toast(text) {
    state.toasts.push({ text, t: 0 });
    if (state.toasts.length > 4) state.toasts.shift();
  }

  function reset() {
    state.time = 0;
    state.shiftLeft = SHIFT_SECONDS;
    state.coins = 0;
    state.served = 0;
    state.hearts = HEARTS;
    state.combo = 0;
    state.comboLeft = 0;
    state.chef = { x: 640, y: 560, tx: null, ty: null, carrying: null, moving: false };
    state.orders = [];
    state.board.item = null;
    state.stove.item = null;
    state.plate = [];
    state.toasts = [];
    state.nextOrderAt = ORDER_FIRST_AT;
    state.orderSeq = 0;
    state.over = false;
    state.overReason = '';
  }

  function spawnOrder() {
    const recipe = random.pick(RECIPES);
    state.orderSeq += 1;
    state.orders.push({ id: state.orderSeq, recipeId: recipe.id, patience: ORDER_PATIENCE, max: ORDER_PATIENCE });
  }

  function centreOf(box) {
    return { x: box.x + box.w / 2, y: box.y + box.h / 2 };
  }

  function dist(ax, ay, bx, by) {
    return Math.hypot(ax - bx, ay - by);
  }

  // The nearest thing the chef can use, or null when nothing is in reach.
  function nearest() {
    const chef = state.chef;
    let best = null;
    let bestD = INTERACT_RANGE;
    const consider = (type, ref, x, y) => {
      const d = dist(chef.x, chef.y, x, y);
      if (d < bestD) { bestD = d; best = { type, ref }; }
    };
    for (const bin of LAYOUT.bins) consider('bin', bin, bin.x + bin.w / 2, bin.y + bin.h / 2);
    consider('board', state.board, state.board.x + state.board.w / 2, state.board.y + state.board.h / 2);
    consider('stove', state.stove, state.stove.x + state.stove.w / 2, state.stove.y + state.stove.h / 2);
    consider('plate', null, LAYOUT.plate.x + LAYOUT.plate.w / 2, LAYOUT.plate.y + LAYOUT.plate.h / 2);
    consider('trash', null, LAYOUT.trash.x + LAYOUT.trash.w / 2, LAYOUT.trash.y + LAYOUT.trash.h / 2);
    return best;
  }

  function stationDuration(station, item) {
    if (station === state.board) return CHOP_SECONDS;
    return COOK_SECONDS;
  }

  function stationResult(station, item) {
    const def = INGREDIENTS[item.kind];
    return station === state.board ? def.chop : def.cook;
  }

  function useStation(station) {
    const chef = state.chef;
    if (station.item === null) {
      if (!chef.carrying || chef.carrying.state !== 'raw') return EVENT_ERROR;
      const result = stationResult(station, chef.carrying);
      if (!result) return EVENT_ERROR;
      station.item = makeItem(chef.carrying.kind, 'raw');
      station.item.target = result;
      chef.carrying = null;
      return EVENT_PLACE;
    }
    if (station.item.done && !chef.carrying) {
      chef.carrying = { kind: station.item.kind, state: station.item.state, progress: 0, done: false, burn: 0 };
      station.item = null;
      return EVENT_PICKUP;
    }
    return EVENT_ERROR;
  }

  function plateKeys() {
    return state.plate.map(itemKey).sort();
  }

  function matchingOrder() {
    const keys = plateKeys();
    for (const order of state.orders) {
      const recipe = recipeById(order.recipeId);
      const need = [...recipe.needs].sort();
      if (need.length === keys.length && need.every((k, i) => k === keys[i])) return order;
    }
    return null;
  }

  function serve() {
    const order = matchingOrder();
    if (!order) return EVENT_ERROR;
    const recipe = recipeById(order.recipeId);
    const tip = Math.round(10 * (order.patience / order.max));
    state.combo = state.comboLeft > 0 ? state.combo + 1 : 1;
    state.comboLeft = 20;
    const bonus = (state.combo - 1) * 5;
    const earned = recipe.price + tip + bonus;
    state.coins += earned;
    state.served += 1;
    state.orders = state.orders.filter((o) => o.id !== order.id);
    state.plate = [];
    toast(`+${earned} koin — ${recipe.name} disajikan!`);
    return EVENT_SERVED;
  }

  function usePlate() {
    const chef = state.chef;
    if (chef.carrying) {
      const item = chef.carrying;
      if (item.state === 'burnt' || item.state === 'raw') return EVENT_ERROR;
      if (state.plate.length >= PLATE_SLOTS) return EVENT_ERROR;
      if (state.plate.some((p) => itemKey(p) === itemKey(item))) return EVENT_ERROR;
      state.plate.push({ kind: item.kind, state: item.state, progress: 0, done: false, burn: 0 });
      chef.carrying = null;
      return EVENT_PLACE;
    }
    if (state.plate.length > 0 && matchingOrder()) return serve();
    if (state.plate.length > 0) {
      chef.carrying = state.plate.pop();
      return EVENT_PICKUP;
    }
    return EVENT_ERROR;
  }

  function interact() {
    const target = nearest();
    if (!target) return EVENT_ERROR;
    const chef = state.chef;
    if (target.type === 'bin') {
      if (chef.carrying) return EVENT_ERROR;
      chef.carrying = makeItem(target.ref.kind, 'raw');
      return EVENT_PICKUP;
    }
    if (target.type === 'board') return useStation(state.board);
    if (target.type === 'stove') return useStation(state.stove);
    if (target.type === 'plate') return usePlate();
    if (target.type === 'trash') {
      if (!chef.carrying) return EVENT_ERROR;
      chef.carrying = null;
      toast('Dibuang ke tempat sampah.');
      return EVENT_TRASH;
    }
    return EVENT_ERROR;
  }

  function advanceStation(station, dt) {
    const item = station.item;
    if (!item || item.done) {
      if (item && item.done) {
        item.burn += dt;
        if (item.burn > BURN_GRACE && item.state !== 'burnt') {
          item.state = 'burnt';
          toast(`${INGREDIENTS[item.kind].name} gosong!`);
        }
      }
      return EVENT_NONE;
    }
    item.progress += dt / stationDuration(station, item);
    if (item.progress >= 1) {
      item.progress = 1;
      item.done = true;
      item.state = item.target;
      item.burn = 0;
      return EVENT_DONE;
    }
    return EVENT_NONE;
  }

  function step(dt, input, attract) {
    let events = EVENT_NONE;
    if (state.over) return events;
    state.time += dt;

    // The chef walks toward a click target, or with the keys.
    const chef = state.chef;
    let mx = input.dx || 0;
    let my = input.dy || 0;
    if (mx === 0 && my === 0 && chef.tx !== null) {
      const dx = chef.tx - chef.x;
      const dy = chef.ty - chef.y;
      const d = Math.hypot(dx, dy);
      if (d < 6) { chef.tx = null; chef.ty = null; }
      else { mx = dx / d; my = dy / d; }
    }
    if (mx !== 0 || my !== 0) {
      const len = Math.hypot(mx, my) || 1;
      chef.x += (mx / len) * CHEF_SPEED * dt;
      chef.y += (my / len) * CHEF_SPEED * dt;
      chef.moving = true;
    } else chef.moving = false;
    const floor = LAYOUT.floor;
    chef.x = Math.min(floor.x + floor.w - 20, Math.max(floor.x + 20, chef.x));
    chef.y = Math.min(floor.y + floor.h - 20, Math.max(floor.y + 20, chef.y));

    if (input.click) { chef.tx = input.click.x; chef.ty = input.click.y; }
    if (input.interact) events |= interact();

    events |= advanceStation(state.board, dt);
    events |= advanceStation(state.stove, dt);

    // Orders: spawn on schedule, patience ticks down, expiry costs a heart.
    if (!attract) {
      if (state.orders.length < MAX_ORDERS && state.time >= state.nextOrderAt) {
        spawnOrder();
        state.nextOrderAt = state.time + ORDER_EVERY;
      }
      for (const order of [...state.orders]) {
        order.patience -= dt;
        if (order.patience <= 0) {
          state.orders = state.orders.filter((o) => o.id !== order.id);
          state.hearts -= 1;
          events |= EVENT_EXPIRED;
          toast(`Pesanan ${recipeById(order.recipeId).name} hangus — pelanggan pergi!`);
          if (state.hearts <= 0) {
            state.over = true;
            state.overReason = 'Semua pelanggan pergi — warung tutup!';
            events |= EVENT_OVER;
          }
        }
      }
      if (state.comboLeft > 0) state.comboLeft -= dt;
      state.shiftLeft -= dt;
      if (state.shiftLeft <= 0) {
        state.shiftLeft = 0;
        state.over = true;
        state.overReason = 'Shift selesai!';
        events |= EVENT_OVER;
      }
    }

    for (const t of state.toasts) t.t += dt;
    state.toasts = state.toasts.filter((t) => t.t < 3);
    return events;
  }

  return { state, reset, step, nearest, interact, matchingOrder, centreOf, spawnOrder };
}
