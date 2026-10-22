import { H, INITIAL_LIVES, POINTS_PER_BLOCK, W } from "./constants";
import {
  type BlockStyle,
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
import { SKINS, type BloqueBusterPalette } from "./skins";
import { tintSpritesheet } from "./sprites";
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
  initialPalette: BloqueBusterPalette = SKINS.clasico,
): BloqueBusterHandle {
  const ctx = canvas.getContext("2d");
  if (!ctx)
    return { setPaused: () => {}, setPalette: () => {}, destroy: () => {} };

  // ── Skin ────────────────────────────────────────────────────────────────────
  // Solo afecta al dibujo; se cambia en caliente con setPalette. Las copias
  // teñidas del spritesheet se generan una vez por tinte y se reutilizan.
  const tinted = new Map<string, CanvasImageSource>();
  const sheetFor = (tint: string | null): CanvasImageSource => {
    if (!tint) return spritesheet;
    let sheet = tinted.get(tint);
    if (!sheet) {
      sheet = tintSpritesheet(spritesheet, tint);
      tinted.set(tint, sheet);
    }
    return sheet;
  };

  let palette = initialPalette;
  let sheets = { blocks: spritesheet, player: spritesheet };
  let blockStyle: BlockStyle = {};

  const applyPalette = (next: BloqueBusterPalette) => {
    palette = next;
    sheets = {
      blocks: sheetFor(next.blockTint),
      player: sheetFor(next.playerTint),
    };
    blockStyle = {
      glowColor: next.glow > 0 ? (c) => next.blockGlow[c] : undefined,
      outline: next.blockOutline,
    };
  };
  applyPalette(initialPalette);

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
  const drawGrid = (color: string, size: number) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = size; x < W; x += size) {
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, H);
    }
    for (let y = size; y < H; y += size) {
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(W, y + 0.5);
    }
    ctx.stroke();
  };

  // Paredes donde rebota la bola (izquierda, arriba y derecha); abajo no hay
  const drawBorder = (color: string, width: number) => {
    const half = width / 2;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineJoin = "miter";
    ctx.lineCap = "butt";
    ctx.shadowColor = color;
    ctx.beginPath();
    ctx.moveTo(half, H);
    ctx.lineTo(half, half);
    ctx.lineTo(W - half, half);
    ctx.lineTo(W - half, H);
    ctx.stroke();
  };

  const draw = () => {
    ctx.imageSmoothingEnabled = palette.smoothing;
    ctx.shadowBlur = 0;
    ctx.fillStyle = palette.background;
    ctx.fillRect(0, 0, W, H);
    if (palette.grid) drawGrid(palette.grid, palette.gridSize);

    ctx.shadowBlur = palette.glow;
    if (palette.border) drawBorder(palette.border, palette.borderWidth);
    drawBlocks(ctx, sheets.blocks, blocks, blockStyle);
    drawExplosions(ctx, sheets.blocks, explosions, blockStyle);
    ctx.shadowColor = palette.paddleGlow;
    drawPaddle(ctx, sheets.player, paddle);
    ctx.shadowColor = palette.ballGlow;
    drawBall(ctx, sheets.player, ball);
    ctx.shadowBlur = 0;
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
    setPalette(next: BloqueBusterPalette) {
      if (destroyed) return;
      applyPalette(next);
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
