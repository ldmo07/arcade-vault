import {
  BASE_TICK_MS,
  FRUITS_PER_LEVEL,
  MIN_TICK_MS,
  POINTS_PER_FRUIT,
  TICK_STEP_MS,
} from "./constants";
import {
  advance,
  collides,
  createSnake,
  draw,
  nextHead,
  queueTurn,
  spawnFruit,
} from "./entities";
import type {
  Direction,
  Fruit,
  SerpentinaCallbacks,
  SerpentinaHandle,
} from "./types";

const KEY_DIRECTIONS: Record<string, Direction> = {
  ArrowUp: "up",
  KeyW: "up",
  ArrowDown: "down",
  KeyS: "down",
  ArrowLeft: "left",
  KeyA: "left",
  ArrowRight: "right",
  KeyD: "right",
};

function isGameKey(code: string) {
  return code === "Space" || code in KEY_DIRECTIONS;
}

function isTextTarget(target: EventTarget | null) {
  const tag = (target as HTMLElement | null)?.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

export function createSerpentina(
  canvas: HTMLCanvasElement,
  callbacks: SerpentinaCallbacks,
  spritesheet: CanvasImageSource,
): SerpentinaHandle {
  const ctx = canvas.getContext("2d");
  if (!ctx) return { setPaused: () => {}, destroy: () => {} };

  // ── Estado ──────────────────────────────────────────────────────────────────
  const snake = createSnake();
  let fruit: Fruit | null = spawnFruit(snake);
  let score = 0;
  let eaten = 0;
  let level = 1;
  let waiting = true; // espera la primera dirección válida
  let gameOver = false;
  let accumulator = 0; // ms desde el último tick

  let paused = false;
  let destroyed = false;
  let rafId = 0;
  let lastTime: number | null = null;

  // Los callbacks solo se llaman cuando el valor cambia
  let emittedScore = -1;
  let emittedLevel = -1;

  const emit = () => {
    if (score !== emittedScore) {
      emittedScore = score;
      callbacks.onScore(score);
    }
    if (level !== emittedLevel) {
      emittedLevel = level;
      callbacks.onLevel(level);
    }
  };

  const endGame = () => {
    gameOver = true;
    snake.turnQueue.length = 0;
    emit();
    callbacks.onGameOver(score);
  };

  const tickMs = () =>
    Math.max(MIN_TICK_MS, BASE_TICK_MS - TICK_STEP_MS * (level - 1));

  // ── Update ──────────────────────────────────────────────────────────────────
  const step = () => {
    const head = nextHead(snake);
    const ate =
      fruit !== null && head.col === fruit.col && head.row === fruit.row;

    if (collides(snake, head, ate)) {
      callbacks.onCrash?.();
      endGame();
      return;
    }

    advance(snake, head, ate);
    if (!ate) return;

    eaten++;
    score += POINTS_PER_FRUIT;
    level = 1 + Math.floor(eaten / FRUITS_PER_LEVEL);
    callbacks.onEat?.();
    fruit = spawnFruit(snake);
    // Victoria: tablero lleno; se trata igual que la derrota para abrir el modal
    if (!fruit) endGame();
    else emit();
  };

  const update = (dt: number) => {
    if (gameOver || waiting) return;
    accumulator += dt * 1000;
    const tick = tickMs();
    // dt ≤ 50 ms < MIN_TICK_MS: como mucho un paso por fotograma
    if (accumulator < tick) return;
    accumulator -= tick;
    step();
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
    draw(ctx, spritesheet, snake, fruit, waiting);
    rafId = requestAnimationFrame(loop);
  };

  // ── Listeners ───────────────────────────────────────────────────────────────
  const onKeyDown = (e: KeyboardEvent) => {
    if (paused || gameOver || isTextTarget(e.target)) return;
    if (isGameKey(e.code)) e.preventDefault();
    const dir = KEY_DIRECTIONS[e.code];
    if (!dir) return;
    if (waiting) {
      // Arranca con ↑, ↓ o →; ← sería un giro de 180° y se ignora
      if (dir === "left") return;
      waiting = false;
    }
    queueTurn(snake, dir);
  };

  const onKeyUp = (e: KeyboardEvent) => {
    if (paused || gameOver || isTextTarget(e.target)) return;
    // Espacio activa el botón enfocado al soltarlo; se cancela mientras se juega
    if (isGameKey(e.code)) e.preventDefault();
  };

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);

  emit();
  rafId = requestAnimationFrame(loop);

  return {
    setPaused(value: boolean) {
      if (destroyed || value === paused) return;
      paused = value;
      lastTime = null;
      accumulator = 0;
      if (value) snake.turnQueue.length = 0;
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
