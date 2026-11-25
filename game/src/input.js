// Keyboard and mouse input: WASD or arrows to walk, E or Space to use what is near,
// click to walk there (clicking a nearby station uses it at once).
export const ACTION_INTERACT = 1;

export function createInput(canvas) {
  const keys = new Set();
  let queuedInteract = false;
  let queuedClick = null;

  function keyOf(event) {
    return event.key.length === 1 ? event.key.toLowerCase() : event.key;
  }

  window.addEventListener('keydown', (event) => {
    const key = keyOf(event);
    if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) event.preventDefault();
    if (key === 'e' || key === ' ') queuedInteract = true;
    keys.add(key);
  });
  window.addEventListener('keyup', (event) => keys.delete(keyOf(event)));
  window.addEventListener('blur', () => keys.clear());

  canvas.addEventListener('pointerdown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (canvas.width / rect.width);
    const y = (event.clientY - rect.top) * (canvas.height / rect.height);
    queuedClick = { x, y };
  });

  function direction() {
    let dx = 0;
    let dy = 0;
    if (keys.has('a') || keys.has('arrowleft')) dx -= 1;
    if (keys.has('d') || keys.has('arrowright')) dx += 1;
    if (keys.has('w') || keys.has('arrowup')) dy -= 1;
    if (keys.has('s') || keys.has('arrowdown')) dy += 1;
    return { dx, dy };
  }

  // One frame's worth of input; each queued action is spent exactly once.
  function take() {
    const out = { ...direction(), interact: queuedInteract, click: queuedClick };
    queuedInteract = false;
    queuedClick = null;
    return out;
  }

  return { take };
}
