import {
  BALL_SIZE,
  BASE_BALL_VX,
  BASE_BALL_VY,
  BLOCK_H,
  BLOCK_W,
  BLOCKS_ORIGIN_X,
  BLOCKS_ORIGIN_Y,
  EXPLOSION_DURATION,
  H,
  PADDLE_H,
  PADDLE_SPEED,
  PADDLE_W,
  PADDLE_Y,
  W,
} from "./constants";
import {
  drawFrame,
  drawSprite,
  explosionFrame,
  EXPLOSION_FRAME_COUNT,
} from "./sprites";
import type { Ball, Block, Explosion, LevelDef, Rect } from "./types";

export function createPaddle(): Rect {
  return { x: (W - PADDLE_W) / 2, y: PADDLE_Y, w: PADDLE_W, h: PADDLE_H };
}

export function createBall(): Ball {
  return { x: 0, y: 0, w: BALL_SIZE, h: BALL_SIZE, vx: 0, vy: 0 };
}

// Coloca la bola sobre la paleta y la lanza de inmediato a la velocidad del nivel
export function launchBall(ball: Ball, paddle: Rect, speed: number): void {
  ball.x = paddle.x + (paddle.w - ball.w) / 2;
  ball.y = paddle.y - ball.h;
  ball.vx = BASE_BALL_VX * speed;
  ball.vy = BASE_BALL_VY * speed;
}

export function createBlocks(level: LevelDef): Block[] {
  return level.blocks.map((b) => ({
    x: BLOCKS_ORIGIN_X + b.col * BLOCK_W,
    y: BLOCKS_ORIGIN_Y + b.row * BLOCK_H,
    w: BLOCK_W,
    h: BLOCK_H,
    color: b.color,
    alive: true,
  }));
}

export function setPaddleX(paddle: Rect, x: number): void {
  paddle.x = Math.max(0, Math.min(W - paddle.w, x));
}

// dir: -1 izquierda, 0 quieta, 1 derecha
export function movePaddle(paddle: Rect, dir: number, dt: number): void {
  if (dir !== 0) setPaddleX(paddle, paddle.x + dir * PADDLE_SPEED * dt);
}

function overlaps(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
  );
}

// Avanza la bola y resuelve rebotes en paredes (izq., der., arriba) y paleta.
// Devuelve cuántos rebotes ocurrieron en el fotograma.
export function updateBall(ball: Ball, paddle: Rect, dt: number): number {
  let bounces = 0;
  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;

  if (ball.x <= 0) {
    ball.x = 0;
    ball.vx = Math.abs(ball.vx);
    bounces++;
  }
  if (ball.x + ball.w >= W) {
    ball.x = W - ball.w;
    ball.vx = -Math.abs(ball.vx);
    bounces++;
  }
  if (ball.y <= 0) {
    ball.y = 0;
    ball.vy = Math.abs(ball.vy);
    bounces++;
  }

  if (
    ball.vy > 0 &&
    ball.x + ball.w > paddle.x &&
    ball.x < paddle.x + paddle.w &&
    ball.y + ball.h >= paddle.y &&
    ball.y + ball.h <= paddle.y + paddle.h + 8
  ) {
    ball.y = paddle.y - ball.h;
    ball.vy = -Math.abs(ball.vy);
    bounces++;
  }
  return bounces;
}

export function ballLost(ball: Ball): boolean {
  return ball.y > H;
}

// Rompe como máximo un bloque por fotograma: lo marca muerto, invierte vy y lo devuelve
export function hitBlock(ball: Ball, blocks: Block[]): Block | null {
  for (const block of blocks) {
    if (!block.alive) continue;
    if (overlaps(ball, block)) {
      block.alive = false;
      ball.vy = -ball.vy;
      return block;
    }
  }
  return null;
}

export function createExplosion(block: Block): Explosion {
  return {
    x: block.x,
    y: block.y,
    w: block.w,
    h: block.h,
    color: block.color,
    elapsed: 0,
  };
}

export function updateExplosions(
  explosions: Explosion[],
  dt: number,
): Explosion[] {
  for (const exp of explosions) exp.elapsed += dt * 1000;
  return explosions.filter((exp) => exp.elapsed < EXPLOSION_DURATION);
}

export function drawBlocks(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  blocks: Block[],
): void {
  for (const b of blocks) {
    if (b.alive) drawSprite(ctx, img, `block_${b.color}`, b.x, b.y, b.w, b.h);
  }
}

export function drawExplosions(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  explosions: Explosion[],
): void {
  for (const exp of explosions) {
    const index = Math.min(
      Math.floor((exp.elapsed / EXPLOSION_DURATION) * EXPLOSION_FRAME_COUNT),
      EXPLOSION_FRAME_COUNT - 1,
    );
    drawFrame(
      ctx,
      img,
      explosionFrame(exp.color, index),
      exp.x,
      exp.y,
      exp.w,
      exp.h,
    );
  }
}

export function drawPaddle(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  paddle: Rect,
): void {
  drawSprite(ctx, img, "paddle", paddle.x, paddle.y, paddle.w, paddle.h);
}

export function drawBall(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  ball: Ball,
): void {
  drawSprite(ctx, img, "ball", ball.x, ball.y, ball.w, ball.h);
}
