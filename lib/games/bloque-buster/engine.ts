import { H, INITIAL_LIVES, POINTS_PER_BLOCK, W } from "./constants";
import {
  ballLost,
  createBall,
  createBlocks,
  createExplosion,
  createPaddle,
  drawBall,
  drawBlocks,
  drawExplosions,
  drawPaddle,
  hitBlock,
  launchBall,
  movePaddle,
  setPaddleX,
  updateBall,
  updateExplosions,
} from "./entities";
import { LEVELS } from "./levels";
import type {
  Block,
  BloqueBusterCallbacks,
  BloqueBusterHandle,
  Explosion,
} from "./types";

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

export function createBloqueBuster(
  canvas: HTMLCanvasElement,
  callbacks: BloqueBusterCallbacks,
  spritesheet: CanvasImageSource,
): BloqueBusterHandle {
  const ctx = canvas.getContext("2d");
  if (!ctx) return { setPaused: () => {}, destroy: () => {} };

  // ── Estado ──────────────────────────────────────────────────────────────────
  const paddle = createPaddle();
  const ball = createBall();
  let blocks: Block[] = [];
  let explosions: Explosion[] = [];
  let score = 0;
  let lives = INITIAL_LIVES;
  let level = 1;
  let gameOver = false;

  let paused = false;
  let destroyed = false;
  let rafId = 0;
  let lastTime: number | null = null;
  const keys = { left: false, right: false };

  // Los callbacks solo se llaman cuando el valor cambia
  let emittedScore = -1;
  let emittedLives = -1;
  let emittedLevel = -1;

  const emit = () => {
    if (score !== emittedScore) {
      emittedScore = score;
      callbacks.onScore(score);
    }
    if (lives !== emittedLives) {
      emittedLives = lives;
      callbacks.onLives(lives);
    }
    if (level !== emittedLevel) {
      emittedLevel = level;
      callbacks.onLevel(level);
    }
  };

  const endGame = () => {
    gameOver = true;
    keys.left = false;
    keys.right = false;
    emit();
    callbacks.onGameOver(score);
  };

  const loadLevel = (n: number) => {
    level = n;
    const def = LEVELS[n - 1];
    blocks = createBlocks(def);
    explosions = [];
    launchBall(ball, paddle, def.speed);
  };

  // ── Update ──────────────────────────────────────────────────────────────────
  const update = (dt: number) => {
    if (gameOver) return;

    movePaddle(paddle, (keys.right ? 1 : 0) - (keys.left ? 1 : 0), dt);
    const bounces = updateBall(ball, paddle, dt);
    for (let i = 0; i < bounces; i++) callbacks.onBounce?.();

    const hit = hitBlock(ball, blocks);
    if (hit) {
      callbacks.onBlockBreak?.();
      explosions.push(createExplosion(hit));
      score += POINTS_PER_BLOCK;
      if (blocks.every((b) => !b.alive)) {
        if (level < LEVELS.length) {
          loadLevel(level + 1);
        } else {
          // Victoria: se tratan igual que la derrota para abrir el modal
          emit();
          endGame();
          return;
        }
      }
    }

    explosions = updateExplosions(explosions, dt);

    if (ballLost(ball)) {
      lives--;
      if (lives <= 0) {
        lives = 0;
        emit();
        endGame();
        return;
      }
      launchBall(ball, paddle, LEVELS[level - 1].speed);
    }

    emit();
  };

  // ── Draw ────────────────────────────────────────────────────────────────────
  const draw = () => {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);
    drawBlocks(ctx, spritesheet, blocks);
    drawExplosions(ctx, spritesheet, explosions);
    drawPaddle(ctx, spritesheet, paddle);
    drawBall(ctx, spritesheet, ball);
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
    if (e.code === "ArrowLeft") keys.left = true;
    else if (e.code === "ArrowRight") keys.right = true;
  };

  const onKeyUp = (e: KeyboardEvent) => {
    // Soltar una tecla siempre la libera, aunque el foco esté en un campo de texto
    if (e.code === "ArrowLeft") keys.left = false;
    else if (e.code === "ArrowRight") keys.right = false;
    if (paused || gameOver || isTextTarget(e.target)) return;
    // Espacio activa el botón enfocado al soltarlo; se cancela mientras se juega
    if (GAME_KEYS.has(e.code)) e.preventDefault();
  };

  const onMouseMove = (e: MouseEvent) => {
    if (paused || gameOver) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0) return;
    const mouseX = (e.clientX - rect.left) * (W / rect.width);
    setPaddleX(paddle, mouseX - paddle.w / 2);
  };

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  canvas.addEventListener("mousemove", onMouseMove);

  loadLevel(1);
  emit();
  rafId = requestAnimationFrame(loop);

  return {
    setPaused(value: boolean) {
      if (destroyed || value === paused) return;
      paused = value;
      lastTime = null;
      if (value) {
        keys.left = false;
        keys.right = false;
      }
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      cancelAnimationFrame(rafId);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      canvas.removeEventListener("mousemove", onMouseMove);
    },
  };
}
