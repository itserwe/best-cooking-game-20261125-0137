// Dapur Kilat — configuration: canvas, timings, recipes, stations and layout.
// One file, one job: every number the world and the renderer share lives here.
export const VIEW = { width: 1280, height: 720 };
export const STEP = 1 / 60;

export const SHIFT_SECONDS = 180;
export const HEARTS = 3;
export const MAX_ORDERS = 3;
export const ORDER_PATIENCE = 50;
export const ORDER_FIRST_AT = 2;
export const ORDER_EVERY = 14;
export const BURN_GRACE = 8;

export const CHOP_SECONDS = 2.5;
export const COOK_SECONDS = 3.5;
export const CHEF_SPEED = 260;
export const INTERACT_RANGE = 90;
export const PLATE_SLOTS = 3;

export const BEST_KEY = 'dapur-kilat-best';

// Ingredients: id, display name, colour, and what each station does to it.
export const INGREDIENTS = {
  rice: { name: 'Nasi', color: '#f5efe0', chop: null, cook: 'cooked' },
  chicken: { name: 'Ayam', color: '#e8a87c', chop: 'chopped', cook: 'cooked' },
  egg: { name: 'Telur', color: '#f7d774', chop: null, cook: 'cooked' },
  chili: { name: 'Cabai', color: '#d9382b', chop: 'chopped', cook: null },
  veg: { name: 'Sayur', color: '#58b368', chop: 'chopped', cook: null },
};

export const STATE_NAMES = { raw: 'mentah', chopped: 'dipotong', cooked: 'dimasak', burnt: 'gosong' };

// Recipes: the dish, its price, and the processed items the plate must hold.
export const RECIPES = [
  { id: 'nasi-goreng', name: 'Nasi Goreng', price: 30, needs: ['rice:cooked', 'egg:cooked', 'chili:chopped'] },
  { id: 'ayam-geprek', name: 'Ayam Geprek', price: 25, needs: ['chicken:cooked', 'chili:chopped'] },
  { id: 'sop-sayur', name: 'Sop Sayur', price: 20, needs: ['veg:chopped', 'egg:cooked'] },
];

export function recipeById(id) {
  return RECIPES.find((r) => r.id === id);
}

export function itemKey(item) {
  return `${item.kind}:${item.state}`;
}

// Kitchen layout, in canvas pixels. Bins down the left wall, stations mid-floor,
// the plating counter and the trash on the right.
export const LAYOUT = {
  board: { x: 24, y: 76, w: 1232, h: 84 },
  bins: [
    { kind: 'rice', x: 40, y: 190, w: 150, h: 86 },
    { kind: 'chicken', x: 40, y: 292, w: 150, h: 86 },
    { kind: 'egg', x: 40, y: 394, w: 150, h: 86 },
    { kind: 'chili', x: 40, y: 496, w: 150, h: 86 },
    { kind: 'veg', x: 40, y: 598, w: 150, h: 86 },
  ],
  board_station: { id: 'board', label: 'Talenan', x: 300, y: 300, w: 230, h: 130 },
  stove_station: { id: 'stove', label: 'Kompor', x: 590, y: 300, w: 260, h: 130 },
  plate: { x: 940, y: 300, w: 300, h: 130 },
  trash: { x: 1080, y: 500, w: 160, h: 90 },
  floor: { x: 24, y: 172, w: 1232, h: 524 },
};
