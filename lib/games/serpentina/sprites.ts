import { CELL } from "./constants";
import type { Cell, FruitName, SpriteRect } from "./types";

// Fila mediana (pixel-art) de fruits.png, 3790×442. Portado de
// references/source-assets/snake-assets/sprites.js.
export const FRUITS: Record<FruitName, SpriteRect> = {
  banana: { x: 34, y: 136, w: 110, h: 160 },
  orange: { x: 186, y: 136, w: 150, h: 160 },
  grape: { x: 378, y: 136, w: 110, h: 160 },
  garlic: { x: 540, y: 136, w: 130, h: 160 },
  eggplant: { x: 712, y: 136, w: 130, h: 160 },
  strawberry: { x: 894, y: 136, w: 110, h: 160 },
  cherry: { x: 1066, y: 136, w: 110, h: 160 },
  carrot: { x: 1228, y: 136, w: 130, h: 160 },
  mushroom: { x: 1400, y: 136, w: 130, h: 160 },
  broccoli: { x: 1582, y: 136, w: 110, h: 160 },
  watermelon: { x: 1734, y: 136, w: 150, h: 160 },
  pepper: { x: 1906, y: 136, w: 150, h: 160 },
  kiwi: { x: 2068, y: 136, w: 170, h: 160 },
  lemon: { x: 2250, y: 136, w: 140, h: 160 },
  peach: { x: 2432, y: 136, w: 130, h: 160 },
  peanut: { x: 2604, y: 136, w: 130, h: 160 },
  apple: { x: 2786, y: 136, w: 110, h: 160 },
  tomato: { x: 2948, y: 136, w: 130, h: 160 },
  berries: { x: 3110, y: 136, w: 150, h: 160 },
  grapes2: { x: 3302, y: 136, w: 110, h: 160 },
  pineapple: { x: 3454, y: 136, w: 150, h: 160 },
  melon: { x: 3637, y: 136, w: 130, h: 160 },
};

export const FRUIT_NAMES = Object.keys(FRUITS) as FruitName[];

// Dibuja la fruta dentro de la celda: escala proporcional que cabe en CELL,
// centrada y sin suavizado para conservar el pixel-art.
export function drawFruit(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  name: FruitName,
  cell: Cell,
): void {
  const s = FRUITS[name];
  const scale = Math.min(CELL / s.w, CELL / s.h);
  const dw = s.w * scale;
  const dh = s.h * scale;
  const dx = cell.col * CELL + (CELL - dw) / 2;
  const dy = cell.row * CELL + (CELL - dh) / 2;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, s.x, s.y, s.w, s.h, dx, dy, dw, dh);
  ctx.restore();
}
