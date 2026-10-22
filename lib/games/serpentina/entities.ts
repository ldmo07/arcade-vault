import {
  CELL,
  COLS,
  H,
  INITIAL_LENGTH,
  MAX_QUEUED_TURNS,
  ROWS,
  START_CELL,
  W,
} from "./constants";
import type { SerpentinaPalette } from "./skins";
import { FRUIT_NAMES, drawFruit } from "./sprites";
import type { Cell, Direction, Fruit } from "./types";

export interface Snake {
  cells: Cell[]; // cells[0] es la cabeza
  dir: Direction; // dirección del último tick
  turnQueue: Direction[]; // giros pendientes, como mucho MAX_QUEUED_TURNS
}

const VECTORS: Record<Direction, Cell> = {
  up: { col: 0, row: -1 },
  down: { col: 0, row: 1 },
  left: { col: -1, row: 0 },
  right: { col: 1, row: 0 },
};

const OPPOSITE: Record<Direction, Direction> = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};

const ANGLES: Record<Direction, number> = {
  right: 0,
  down: Math.PI / 2,
  left: Math.PI,
  up: -Math.PI / 2,
};

export function createSnake(): Snake {
  const cells: Cell[] = [];
  for (let i = 0; i < INITIAL_LENGTH; i++) {
    cells.push({ col: START_CELL.col - i, row: START_CELL.row });
  }
  return { cells, dir: "right", turnQueue: [] };
}

// Encola un giro respecto a la última dirección encolada (no a la actual), de modo
// que dos pulsaciones dentro de un tick no producen un giro de 180°.
export function queueTurn(snake: Snake, dir: Direction): void {
  if (snake.turnQueue.length >= MAX_QUEUED_TURNS) return;
  const last = snake.turnQueue[snake.turnQueue.length - 1] ?? snake.dir;
  if (dir === last || dir === OPPOSITE[last]) return;
  snake.turnQueue.push(dir);
}

// Consume un giro pendiente y devuelve la celda a la que irá la cabeza.
export function nextHead(snake: Snake): Cell {
  const turn = snake.turnQueue.shift();
  if (turn) snake.dir = turn;
  const v = VECTORS[snake.dir];
  const head = snake.cells[0];
  return { col: head.col + v.col, row: head.row + v.row };
}

// Pared o cuerpo. Si no come, la cola se retira en este tick y su celda cuenta como libre.
export function collides(snake: Snake, head: Cell, grows: boolean): boolean {
  if (head.col < 0 || head.col >= COLS || head.row < 0 || head.row >= ROWS) {
    return true;
  }
  const end = grows ? snake.cells.length : snake.cells.length - 1;
  for (let i = 0; i < end; i++) {
    const c = snake.cells[i];
    if (c.col === head.col && c.row === head.row) return true;
  }
  return false;
}

export function advance(snake: Snake, head: Cell, grows: boolean): void {
  snake.cells.unshift(head);
  if (!grows) snake.cells.pop();
}

// Fruta en una celda libre al azar; null si el tablero está lleno (victoria).
export function spawnFruit(snake: Snake): Fruit | null {
  const occupied = new Set(snake.cells.map((c) => c.row * COLS + c.col));
  const free: Cell[] = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (!occupied.has(row * COLS + col)) free.push({ col, row });
    }
  }
  if (free.length === 0) return null;
  const cell = free[Math.floor(Math.random() * free.length)];
  const sprite = FRUIT_NAMES[Math.floor(Math.random() * FRUIT_NAMES.length)];
  return { ...cell, sprite };
}

function drawBoard(ctx: CanvasRenderingContext2D, p: SerpentinaPalette): void {
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      ctx.fillStyle = (row + col) % 2 === 0 ? p.boardA : p.boardB;
      ctx.fillRect(col * CELL, row * CELL, CELL, CELL);
    }
  }
}

// Marco tras la fruta en las skins oscuras: garantiza contraste aunque el
// sprite sea oscuro. El clásico no lo lleva (fruitFrame null).
function drawFruitFrame(
  ctx: CanvasRenderingContext2D,
  fruit: Fruit,
  p: SerpentinaPalette,
): void {
  if (!p.fruitFrame) return;
  const x = fruit.col * CELL + CELL / 2;
  const y = fruit.row * CELL + CELL / 2;
  ctx.save();
  ctx.strokeStyle = p.fruitFrame;
  ctx.lineWidth = 3;
  ctx.lineJoin = p.lineJoin;
  if (p.glow > 0) {
    ctx.shadowColor = p.fruitFrame;
    ctx.shadowBlur = p.glow;
  }
  ctx.beginPath();
  if (p.fruitFrameShape === "round") ctx.arc(x, y, CELL * 0.46, 0, Math.PI * 2);
  else ctx.rect(x - CELL * 0.45, y - CELL * 0.45, CELL * 0.9, CELL * 0.9);
  ctx.stroke();
  ctx.restore();
}

function drawSnake(
  ctx: CanvasRenderingContext2D,
  snake: Snake,
  p: SerpentinaPalette,
): void {
  ctx.save();
  ctx.strokeStyle = p.snake;
  ctx.lineWidth = CELL * 0.8;
  ctx.lineCap = p.lineCap;
  ctx.lineJoin = p.lineJoin;
  if (p.glow > 0) {
    ctx.shadowColor = p.snake;
    ctx.shadowBlur = p.glow;
  }
  ctx.beginPath();
  snake.cells.forEach((c, i) => {
    const x = c.col * CELL + CELL / 2;
    const y = c.row * CELL + CELL / 2;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Ojos: dos círculos (o cuadrados en retro) a los lados de la cabeza,
  // orientados según la dirección
  const head = snake.cells[0];
  const hx = head.col * CELL + CELL / 2;
  const hy = head.row * CELL + CELL / 2;
  ctx.translate(hx, hy);
  ctx.rotate(ANGLES[snake.dir]);
  for (const side of [-1, 1]) {
    const y = side * CELL * 0.2;
    if (p.eyeShape === "square") {
      ctx.fillStyle = p.eyeWhite;
      ctx.fillRect(CELL * -0.04, y - CELL * 0.14, CELL * 0.28, CELL * 0.28);
      ctx.fillStyle = p.eyePupil;
      ctx.fillRect(CELL * 0.08, y - CELL * 0.07, CELL * 0.14, CELL * 0.14);
      continue;
    }
    ctx.fillStyle = p.eyeWhite;
    ctx.beginPath();
    ctx.arc(CELL * 0.1, y, CELL * 0.14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = p.eyePupil;
    ctx.beginPath();
    ctx.arc(CELL * 0.14, y, CELL * 0.07, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// Chevron en la celda delante de la cabeza mientras se espera la primera dirección
function drawHint(
  ctx: CanvasRenderingContext2D,
  snake: Snake,
  p: SerpentinaPalette,
): void {
  const v = VECTORS[snake.dir];
  const head = snake.cells[0];
  const x = (head.col + v.col) * CELL + CELL / 2;
  const y = (head.row + v.row) * CELL + CELL / 2;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ANGLES[snake.dir]);
  ctx.strokeStyle = p.hint;
  ctx.lineWidth = 4;
  ctx.lineCap = p.lineCap === "square" ? "butt" : "round";
  ctx.lineJoin = p.lineJoin;
  if (p.glow > 0) {
    ctx.shadowColor = p.hint;
    ctx.shadowBlur = p.glow;
  }
  ctx.beginPath();
  ctx.moveTo(-6, -10);
  ctx.lineTo(6, 0);
  ctx.lineTo(-6, 10);
  ctx.stroke();
  ctx.restore();
}

export function draw(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  snake: Snake,
  fruit: Fruit | null,
  waiting: boolean,
  palette: SerpentinaPalette,
): void {
  ctx.clearRect(0, 0, W, H);
  drawBoard(ctx, palette);
  if (fruit) {
    drawFruitFrame(ctx, fruit, palette);
    drawFruit(ctx, img, fruit.sprite, fruit);
  }
  drawSnake(ctx, snake, palette);
  if (waiting) drawHint(ctx, snake, palette);
}
