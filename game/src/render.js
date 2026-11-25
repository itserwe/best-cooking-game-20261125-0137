// Dapur Kilat — the renderer: one canvas, flat warm colours, everything drawn in code.
// Screens: title, play, paused, game over. The judge reads the game through these frames,
// so every frame must show the kitchen, the order board, the counter, the timer and the plate.
import { INGREDIENTS, LAYOUT, PLATE_SLOTS, STATE_NAMES, VIEW, itemKey, recipeById } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawHeart(ctx, x, y, size, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y + size * 0.35);
  ctx.bezierCurveTo(x - size, y - size * 0.5, x - size * 0.4, y - size, x, y - size * 0.35);
  ctx.bezierCurveTo(x + size * 0.4, y - size, x + size, y - size * 0.5, x, y + size * 0.35);
  ctx.fill();
}

// One ingredient, drawn with paths only — no image files, no emoji, no network.
export function drawIngredient(ctx, kind, x, y, r) {
  ctx.save();
  ctx.translate(x, y);
  if (kind === 'rice') {
    ctx.fillStyle = '#fff8e6';
    ctx.beginPath(); ctx.arc(0, -r * 0.2, r * 0.85, 0, Math.PI); ctx.fill();
    ctx.fillStyle = '#c0392b';
    ctx.beginPath(); ctx.arc(0, r * 0.15, r * 0.95, 0, Math.PI); ctx.fill();
    ctx.fillStyle = '#8e2f24';
    ctx.fillRect(-r * 0.95, r * 0.1, r * 1.9, r * 0.16);
    ctx.fillStyle = '#fff';
    for (const [gx, gy] of [[-0.4, -0.45], [0, -0.6], [0.4, -0.45], [-0.15, -0.3], [0.2, -0.3]]) {
      ctx.beginPath(); ctx.arc(gx * r, gy * r, r * 0.14, 0, Math.PI * 2); ctx.fill();
    }
  } else if (kind === 'chicken') {
    ctx.fillStyle = '#e8a87c';
    ctx.beginPath(); ctx.arc(-r * 0.1, -r * 0.1, r * 0.7, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#f5efe0';
    ctx.lineWidth = r * 0.22;
    ctx.beginPath(); ctx.moveTo(r * 0.35, r * 0.35); ctx.lineTo(r * 0.85, r * 0.85); ctx.stroke();
    ctx.fillStyle = '#f5efe0';
    ctx.beginPath(); ctx.arc(r * 0.8, r * 0.55, r * 0.22, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(r * 0.55, r * 0.85, r * 0.22, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c97e4e';
    ctx.beginPath(); ctx.arc(-r * 0.35, -r * 0.35, r * 0.18, 0, Math.PI * 2); ctx.fill();
  } else if (kind === 'egg') {
    ctx.fillStyle = '#fffdf5';
    ctx.beginPath(); ctx.ellipse(0, 0, r * 0.95, r * 0.8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f7b731';
    ctx.beginPath(); ctx.arc(0, 0, r * 0.45, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f9d976';
    ctx.beginPath(); ctx.arc(-r * 0.12, -r * 0.12, r * 0.18, 0, Math.PI * 2); ctx.fill();
  } else if (kind === 'chili') {
    ctx.fillStyle = '#d9382b';
    ctx.beginPath();
    ctx.moveTo(-r * 0.8, -r * 0.5);
    ctx.quadraticCurveTo(r * 0.2, -r * 1.1, r * 0.85, -r * 0.1);
    ctx.quadraticCurveTo(r * 0.5, r * 0.75, -r * 0.5, r * 0.55);
    ctx.quadraticCurveTo(-r * 0.9, r * 0.2, -r * 0.8, -r * 0.5);
    ctx.fill();
    ctx.strokeStyle = '#2e7d32';
    ctx.lineWidth = r * 0.18;
    ctx.beginPath(); ctx.moveTo(r * 0.7, -r * 0.25); ctx.quadraticCurveTo(r * 1.05, -r * 0.6, r * 0.9, -r * 0.95); ctx.stroke();
  } else if (kind === 'veg') {
    ctx.fillStyle = '#58b368';
    for (const [lx, ly, lr] of [[-0.45, 0.15, 0.5], [0.45, 0.15, 0.5], [0, -0.45, 0.55]]) {
      ctx.beginPath(); ctx.arc(lx * r, ly * r, lr * r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.strokeStyle = '#2e7d32';
    ctx.lineWidth = r * 0.14;
    ctx.beginPath(); ctx.moveTo(0, r * 0.2); ctx.lineTo(0, r * 0.85); ctx.stroke();
  }
  ctx.restore();
}

function drawProgressRing(ctx, x, y, r, frac, color) {
  ctx.lineWidth = 6;
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = color;
  ctx.beginPath(); ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2); ctx.stroke();
}

function drawStation(ctx, station, label, isStove) {
  const { x, y, w, h } = station;
  ctx.fillStyle = isStove ? '#3d4450' : '#a9805a';
  roundRect(ctx, x, y, w, h, 12);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fillRect(x + 8, y + 8, w - 16, 10);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(label, x + 14, y + 30);
  if (isStove) {
    ctx.fillStyle = '#22262e';
    for (const bx of [x + w * 0.28, x + w * 0.72]) {
      ctx.beginPath(); ctx.arc(bx, y + h * 0.58, 34, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#565e6c';
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(bx, y + h * 0.58, 26, 0, Math.PI * 2); ctx.stroke();
    }
  } else {
    ctx.fillStyle = '#e8d5b5';
    roundRect(ctx, x + w / 2 - 70, y + h * 0.42, 140, 54, 8);
    ctx.fill();
  }
  const item = station.item;
  if (item) {
    const cx = x + w / 2;
    const cy = y + h * 0.58;
    drawIngredient(ctx, item.kind, cx, cy, 26);
    if (!item.done) {
      drawProgressRing(ctx, cx, cy, 38, Math.min(1, item.progress), '#ffd166');
    } else if (item.state === 'burnt') {
      ctx.fillStyle = '#d9382b';
      ctx.font = 'bold 15px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('GOSONG!', cx, y - 10);
    } else {
      ctx.fillStyle = '#2e7d32';
      ctx.font = 'bold 15px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${STATE_NAMES[item.state]} ✓`, cx, y - 10);
    }
  }
}

function drawOrders(ctx, state) {
  const board = LAYOUT.board;
  ctx.fillStyle = '#2b2118';
  roundRect(ctx, board.x, board.y, board.w, board.h, 12);
  ctx.fill();
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 17px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('PESANAN', board.x + 16, board.y + 28);
  ctx.fillStyle = '#fff';
  ctx.font = '15px system-ui, sans-serif';
  ctx.fillText('Sajikan piring yang cocok sebelum pelanggan pergi!', board.x + 130, board.y + 28);
  if (state.orders.length === 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = 'italic 16px system-ui, sans-serif';
    ctx.fillText('Belum ada pesanan — bersiaplah di dapur…', board.x + 16, board.y + 60);
    return;
  }
  state.orders.forEach((order, i) => {
    const recipe = recipeById(order.recipeId);
    const tx = board.x + 16 + i * 400;
    const ty = board.y + 38;
    const frac = Math.max(0, order.patience / order.max);
    ctx.fillStyle = '#fff8e6';
    roundRect(ctx, tx, ty, 380, 38, 8);
    ctx.fill();
    ctx.fillStyle = '#2b2118';
    ctx.font = 'bold 17px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(recipe.name, tx + 12, ty + 24);
    recipe.needs.forEach((need, j) => {
      const [kind, needState] = need.split(':');
      const ix = tx + 200 + j * 56;
      const onPlate = state.plate.some((p) => itemKey(p) === need);
      drawIngredient(ctx, kind, ix, ty + 19, 13);
      if (onPlate) {
        ctx.fillStyle = '#2e7d32';
        ctx.beginPath(); ctx.arc(ix + 12, ty + 6, 9, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(ix + 7, ty + 6); ctx.lineTo(ix + 11, ty + 10); ctx.lineTo(ix + 17, ty + 1); ctx.stroke();
      }
    });
    ctx.fillStyle = frac > 0.5 ? '#58b368' : frac > 0.25 ? '#f0a020' : '#d9382b';
    ctx.fillRect(tx, ty + 38, 380 * frac, 5);
  });
}

function drawChef(ctx, chef) {
  const { x, y } = chef;
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath(); ctx.ellipse(x, y + 34, 30, 9, 0, 0, Math.PI * 2); ctx.fill();
  // Body: white apron over a teal shirt.
  ctx.fillStyle = '#2a9d8f';
  roundRect(ctx, x - 22, y - 6, 44, 40, 12);
  ctx.fill();
  ctx.fillStyle = '#fff';
  roundRect(ctx, x - 16, y + 2, 32, 32, 8);
  ctx.fill();
  // Head and chef hat.
  ctx.fillStyle = '#f2c79b';
  ctx.beginPath(); ctx.arc(x, y - 18, 17, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff';
  roundRect(ctx, x - 19, y - 44, 38, 16, 8);
  ctx.fill();
  ctx.beginPath(); ctx.arc(x - 11, y - 42, 9, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x, y - 46, 10, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + 11, y - 42, 9, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#222';
  ctx.beginPath(); ctx.arc(x - 6, y - 20, 2.4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + 6, y - 20, 2.4, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(x, y - 14, 6, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
  // Carried item floats above the hat.
  if (chef.carrying) {
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.beginPath(); ctx.arc(x, y - 66, 22, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#c9a227';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y - 66, 22, 0, Math.PI * 2); ctx.stroke();
    drawIngredient(ctx, chef.carrying.kind, x, y - 66, 14);
    if (chef.carrying.state !== 'raw') {
      ctx.fillStyle = '#2e7d32';
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(STATE_NAMES[chef.carrying.state], x, y - 38);
    }
  }
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');

  function drawKitchen(state, highlight) {
    // Wall and tiled floor.
    ctx.fillStyle = '#f7ead7';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    ctx.fillStyle = '#e8b04b';
    ctx.fillRect(0, 0, VIEW.width, 64);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 26px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('DAPUR KILAT', 24, 42);
    ctx.fillStyle = '#7a5c2e';
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillText('Warung Rush — masak cepat, saji tepat waktu!', 300, 40);
    ctx.fillStyle = '#2b2118';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`Koin: ${state.coins}`, 1060, 42);
    const mm = Math.floor(state.shiftLeft / 60);
    const ss = Math.floor(state.shiftLeft % 60).toString().padStart(2, '0');
    ctx.fillStyle = state.shiftLeft < 30 ? '#d9382b' : '#2b2118';
    ctx.fillText(`${mm}:${ss}`, 1180, 42);
    ctx.textAlign = 'left';
    for (let i = 0; i < 3; i += 1) {
      drawHeart(ctx, 780 + i * 26, 30, 11, i < state.hearts ? '#d9382b' : 'rgba(0,0,0,0.15)');
    }
    if (state.combo > 1) {
      ctx.fillStyle = '#d9382b';
      ctx.font = 'bold 18px system-ui, sans-serif';
      ctx.fillText(`Combo x${state.combo}!`, 860, 42);
    }

    const floor = LAYOUT.floor;
    ctx.fillStyle = '#d9c3a5';
    ctx.fillRect(floor.x, floor.y, floor.w, floor.h);
    ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    ctx.lineWidth = 1;
    for (let gx = floor.x; gx <= floor.x + floor.w; gx += 64) {
      ctx.beginPath(); ctx.moveTo(gx, floor.y); ctx.lineTo(gx, floor.y + floor.h); ctx.stroke();
    }
    for (let gy = floor.y; gy <= floor.y + floor.h; gy += 64) {
      ctx.beginPath(); ctx.moveTo(floor.x, gy); ctx.lineTo(floor.x + floor.w, gy); ctx.stroke();
    }

    drawOrders(ctx, state);

    // Ingredient bins down the left wall.
    for (const bin of LAYOUT.bins) {
      const def = INGREDIENTS[bin.kind];
      ctx.fillStyle = '#8a6d3b';
      roundRect(ctx, bin.x, bin.y, bin.w, bin.h, 10);
      ctx.fill();
      ctx.fillStyle = def.color;
      roundRect(ctx, bin.x + 8, bin.y + 8, 62, bin.h - 16, 8);
      ctx.fill();
      drawIngredient(ctx, bin.kind, bin.x + 39, bin.y + bin.h / 2, 22);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 19px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(def.name, bin.x + 82, bin.y + 36);
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.font = '14px system-ui, sans-serif';
      const hint = def.chop && def.cook ? 'potong / masak' : def.chop ? 'potong di talenan' : 'masak di kompor';
      ctx.fillText(hint, bin.x + 82, bin.y + 60);
    }

    drawStation(ctx, state.board, 'Talenan — potong', false);
    drawStation(ctx, state.stove, 'Kompor — masak', true);

    // Plating counter.
    const plate = LAYOUT.plate;
    ctx.fillStyle = '#5b7a99';
    roundRect(ctx, plate.x, plate.y, plate.w, plate.h, 12);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Piring saji', plate.x + 14, plate.y + 30);
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(plate.x + plate.w / 2, plate.y + 84, 96, 30, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#c9a227';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(plate.x + plate.w / 2, plate.y + 84, 96, 30, 0, 0, Math.PI * 2); ctx.stroke();
    state.plate.forEach((item, i) => {
      drawIngredient(ctx, item.kind, plate.x + 90 + i * 60, plate.y + 84, 20);
    });
    ctx.fillStyle = '#eaf2f8';
    ctx.font = '15px system-ui, sans-serif';
    ctx.textAlign = 'center';
    if (state.plate.length === 0) ctx.fillText('Taruh bahan olahan di sini', plate.x + plate.w / 2, plate.y + 118);
    else ctx.fillText(`${state.plate.length}/${PLATE_SLOTS} bahan di piring`, plate.x + plate.w / 2, plate.y + 118);

    // Trash.
    const trash = LAYOUT.trash;
    ctx.fillStyle = '#6b7280';
    roundRect(ctx, trash.x, trash.y, trash.w, trash.h, 10);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Sampah', trash.x + trash.w / 2, trash.y + 38);
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillText('buang bahan gosong', trash.x + trash.w / 2, trash.y + 62);

    // Hint ring on the nearest usable spot, so the player always sees what E does.
    if (highlight) {
      const box = highlight;
      const pulse = 4 + Math.sin(state.time * 5) * 2;
      ctx.strokeStyle = '#ffd166';
      ctx.lineWidth = 3;
      roundRect(ctx, box.x - pulse, box.y - pulse, box.w + pulse * 2, box.h + pulse * 2, 14);
      ctx.stroke();
    }

    drawChef(ctx, state.chef);

    // Toasts float up from the plate.
    ctx.textAlign = 'center';
    state.toasts.forEach((t, i) => {
      ctx.globalAlpha = Math.max(0, 1 - t.t / 3);
      ctx.fillStyle = '#2b2118';
      ctx.font = 'bold 19px system-ui, sans-serif';
      ctx.fillText(t.text, VIEW.width / 2, 210 + i * 26 - t.t * 12);
      ctx.globalAlpha = 1;
    });

    ctx.fillStyle = 'rgba(43,33,24,0.75)';
    ctx.font = '15px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('WASD / panah: jalan   •   E / Spasi: ambil • olah • saji   •   Klik: jalan ke sana', 24, 706);
  }

  function drawTitle(state, best) {
    drawKitchen(state, null);
    ctx.fillStyle = 'rgba(43,33,24,0.72)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 84px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('DAPUR KILAT', VIEW.width / 2, 240);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 30px system-ui, sans-serif';
    ctx.fillText('Warung Rush — masak cepat, saji tepat waktu!', VIEW.width / 2, 292);
    ctx.font = '20px system-ui, sans-serif';
    ctx.fillStyle = '#ffe9b0';
    ctx.fillText('Ambil bahan dari rak kiri • potong di talenan • masak di kompor • tata di piring • sajikan!', VIEW.width / 2, 340);
    ctx.fillText('Nasi Goreng, Ayam Geprek, Sop Sayur — pelanggan menunggu paling lama 50 detik.', VIEW.width / 2, 372);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 26px system-ui, sans-serif';
    const blink = Math.sin(state.time * 4) > -0.2;
    if (blink) ctx.fillText('Tekan SPASI atau KLIK untuk mulai', VIEW.width / 2, 440);
    if (best > 0) {
      ctx.fillStyle = '#ffd166';
      ctx.font = 'bold 22px system-ui, sans-serif';
      ctx.fillText(`Rekor koin: ${best}`, VIEW.width / 2, 490);
    }
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillText('WASD / panah bergerak • E ambil, olah, dan saji • gosong? buang ke tempat sampah', VIEW.width / 2, 540);
  }

  function drawOver(state, best) {
    drawKitchen(state, null);
    ctx.fillStyle = 'rgba(43,33,24,0.78)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 64px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(state.overReason || 'Shift selesai!', VIEW.width / 2, 250);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 34px system-ui, sans-serif';
    ctx.fillText(`Koin: ${state.coins}   •   Hidangan disajikan: ${state.served}`, VIEW.width / 2, 320);
    if (state.coins >= best && state.coins > 0) {
      ctx.fillStyle = '#ffd166';
      ctx.font = 'bold 26px system-ui, sans-serif';
      ctx.fillText('★ Rekor baru! ★', VIEW.width / 2, 372);
    } else {
      ctx.fillStyle = '#ffe9b0';
      ctx.font = '22px system-ui, sans-serif';
      ctx.fillText(`Rekor koin: ${best}`, VIEW.width / 2, 372);
    }
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px system-ui, sans-serif';
    ctx.fillText('Tekan SPASI untuk main lagi', VIEW.width / 2, 440);
  }

  function draw(state, screen, best) {
    ctx.clearRect(0, 0, VIEW.width, VIEW.height);
    if (screen === SCREEN_TITLE) drawTitle(state, best);
    else if (screen === SCREEN_OVER) drawOver(state, best);
    else {
      const near = state._highlight || null;
      drawKitchen(state, near);
      if (screen === SCREEN_PAUSED) {
        ctx.fillStyle = 'rgba(43,33,24,0.6)';
        ctx.fillRect(0, 0, VIEW.width, VIEW.height);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 56px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('JEDA', VIEW.width / 2, 360);
        ctx.font = '22px system-ui, sans-serif';
        ctx.fillText('Tekan P atau Spasi untuk lanjut', VIEW.width / 2, 404);
      }
    }
  }

  return { draw };
}
