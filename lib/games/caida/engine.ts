import {
  clearLines,
  collide,
  createBoard,
  ghostY,
  merge,
  rotateCW,
} from "./board";
import {
  BASE_DROP_MS,
  BLOCK,
  BOARD_X,
  COLORS,
  COLS,
  DROP_STEP_MS,
  GRID_COLOR,
  H,
  HARD_DROP_POINTS,
  KICKS,
  LINE_SCORES,
  LINES_PER_LEVEL,
  MIN_DROP_MS,
  NEXT_SIZE,
  NEXT_X,
  NEXT_Y,
  PIECE_TYPES,
  PIECES,
  ROWS,
  SOFT_DROP_POINTS,
  W,
} from "./constants";
import type { CaidaCallbacks, CaidaHandle, Piece } from "./types";

const GAME_KEYS = new Set([
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Space",
]);

function isTextTarget(target: EventTarget | null) {
  const tag = (target as HTMLElement | null)?.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

function randomPiece(): Piece {
  const type = Math.floor(Math.random() * PIECE_TYPES) + 1;
  const shape = PIECES[type].map((row) => [...row]);
  return {
    type,
    shape,
    x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2),
    y: 0,
  };
}

function drawBlock(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  x: number,
  y: number,
  colorIndex: number,
  size: number,
  alpha = 1,
) {
  if (!colorIndex) return;
  ctx.globalAlpha = alpha;
  ctx.fillStyle = COLORS[colorIndex] ?? "#fff";
  ctx.fillRect(ox + x * size + 1, oy + y * size + 1, size - 2, size - 2);
  // brillo superior
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.fillRect(ox + x * size + 1, oy + y * size + 1, size - 2, 4);
  ctx.globalAlpha = 1;
}

export function createCaida(
  canvas: HTMLCanvasElement,
  callbacks: CaidaCallbacks,
): CaidaHandle {
  const ctx = canvas.getContext("2d");
  if (!ctx) return { setPaused: () => {}, destroy: () => {} };

  // ── Estado ──────────────────────────────────────────────────────────────────
  const board = createBoard();
  let current: Piece = randomPiece();
  let next: Piece = randomPiece();
  let score = 0;
  let lines = 0;
  let level = 1;
  let dropInterval = BASE_DROP_MS;
  let dropAccum = 0; // ms
  let gameOver = false;

  let paused = false;
  let destroyed = false;
  let rafId = 0;
  let lastTime: number | null = null;

  // Los callbacks solo se llaman cuando el valor cambia
  let emittedScore = -1;
  let emittedLines = -1;
  let emittedLevel = -1;

  const emit = () => {
    if (score !== emittedScore) {
      emittedScore = score;
      callbacks.onScore(score);
    }
    if (lines !== emittedLines) {
      emittedLines = lines;
      callbacks.onLines(lines);
    }
    if (level !== emittedLevel) {
      emittedLevel = level;
      callbacks.onLevel(level);
    }
  };

  const endGame = () => {
    gameOver = true;
    emit();
    callbacks.onGameOver(score);
  };

  const spawn = () => {
    current = next;
    next = randomPiece();
    if (collide(board, current.shape, current.x, current.y)) endGame();
  };

  const lockPiece = () => {
    merge(board, current);
    const cleared = clearLines(board);
    if (cleared) {
      lines += cleared;
      score += (LINE_SCORES[cleared] ?? 0) * level;
      level = Math.floor(lines / LINES_PER_LEVEL) + 1;
      dropInterval = Math.max(
        MIN_DROP_MS,
        BASE_DROP_MS - (level - 1) * DROP_STEP_MS,
      );
    }
    spawn();
  };

  const tryRotate = () => {
    const rotated = rotateCW(current.shape);
    for (const kick of KICKS) {
      if (!collide(board, rotated, current.x + kick, current.y)) {
        current.shape = rotated;
        current.x += kick;
        return;
      }
    }
  };

  const softDrop = () => {
    if (!collide(board, current.shape, current.x, current.y + 1)) {
      current.y++;
      score += SOFT_DROP_POINTS;
    } else {
      lockPiece();
    }
  };

  const hardDrop = () => {
    const gy = ghostY(board, current);
    score += (gy - current.y) * HARD_DROP_POINTS;
    current.y = gy;
    lockPiece();
  };

  // ── Update ──────────────────────────────────────────────────────────────────
  const update = (dt: number) => {
    if (gameOver) return;
    dropAccum += dt * 1000;
    if (dropAccum >= dropInterval) {
      dropAccum = 0;
      if (!collide(board, current.shape, current.x, current.y + 1)) {
        current.y++;
      } else {
        lockPiece();
      }
    }
    emit();
  };

  // ── Draw ────────────────────────────────────────────────────────────────────
  const drawShape = (
    shape: number[][],
    ox: number,
    oy: number,
    px: number,
    py: number,
    size: number,
    alpha = 1,
  ) => {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        drawBlock(ctx, ox, oy, px + c, py + r, shape[r][c], size, alpha);
      }
    }
  };

  const draw = () => {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);

    // rejilla
    ctx.strokeStyle = GRID_COLOR;
    ctx.lineWidth = 0.5;
    for (let c = 1; c < COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(BOARD_X + c * BLOCK, 0);
      ctx.lineTo(BOARD_X + c * BLOCK, ROWS * BLOCK);
      ctx.stroke();
    }
    for (let r = 1; r < ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(BOARD_X, r * BLOCK);
      ctx.lineTo(BOARD_X + COLS * BLOCK, r * BLOCK);
      ctx.stroke();
    }

    // tablero, fantasma y pieza actual
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        drawBlock(ctx, BOARD_X, 0, c, r, board[r][c], BLOCK);
      }
    }
    drawShape(
      current.shape,
      BOARD_X,
      0,
      current.x,
      ghostY(board, current),
      BLOCK,
      0.2,
    );
    drawShape(current.shape, BOARD_X, 0, current.x, current.y, BLOCK);

    // panel SIGUIENTE
    ctx.font = "14px monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#aaa";
    ctx.fillText("SIGUIENTE", NEXT_X, NEXT_Y - 12);
    ctx.strokeStyle = GRID_COLOR;
    ctx.lineWidth = 1;
    ctx.strokeRect(NEXT_X, NEXT_Y, 4 * NEXT_SIZE, 4 * NEXT_SIZE);
    const offX = Math.floor((4 - next.shape[0].length) / 2);
    const offY = Math.floor((4 - next.shape.length) / 2);
    drawShape(next.shape, NEXT_X, NEXT_Y, offX, offY, NEXT_SIZE);
  };

  // ── Loop ────────────────────────────────────────────────────────────────────
  const loop = (ts: number) => {
    if (destroyed) return;
    if (paused) {
      lastTime = null;
    } else {
      const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
      lastTime = ts;
      update(dt);
    }
    draw();
    rafId = requestAnimationFrame(loop);
  };

  // ── Listeners ───────────────────────────────────────────────────────────────
  const onKeyDown = (e: KeyboardEvent) => {
    if (paused || gameOver || isTextTarget(e.target)) return;
    if (GAME_KEYS.has(e.code)) e.preventDefault();
    switch (e.code) {
      case "ArrowLeft":
        if (!collide(board, current.shape, current.x - 1, current.y)) {
          current.x--;
        }
        break;
      case "ArrowRight":
        if (!collide(board, current.shape, current.x + 1, current.y)) {
          current.x++;
        }
        break;
      case "ArrowDown":
        softDrop();
        break;
      case "ArrowUp":
      case "KeyX":
        tryRotate();
        break;
      case "Space":
        hardDrop();
        break;
      default:
        return;
    }
    emit();
  };

  const onKeyUp = (e: KeyboardEvent) => {
    if (paused || gameOver || isTextTarget(e.target)) return;
    // Espacio activa el botón enfocado al soltarlo; se cancela mientras se juega
    if (GAME_KEYS.has(e.code)) e.preventDefault();
  };

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);

  spawn();
  emit();
  rafId = requestAnimationFrame(loop);

  return {
    setPaused(value: boolean) {
      if (destroyed || value === paused) return;
      paused = value;
      lastTime = null;
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      cancelAnimationFrame(rafId);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    },
  };
}
