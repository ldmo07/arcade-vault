export const W = 800;
export const H = 600;

export const PADDLE_SPEED = 400; // px/s
export const PADDLE_W = 81;
export const PADDLE_H = 14;
export const PADDLE_Y = 560;

export const BALL_SIZE = 16;
export const BASE_BALL_VX = 200; // px/s, se multiplica por la velocidad del nivel
export const BASE_BALL_VY = -300;

export const BLOCK_COLS = 10;
export const BLOCK_W = 64;
export const BLOCK_H = 24;
// Rejilla de 640 px centrada en el canvas lógico de 800×600
export const BLOCKS_ORIGIN_X = (W - BLOCK_COLS * BLOCK_W) / 2;
export const BLOCKS_ORIGIN_Y = 80;

export const POINTS_PER_BLOCK = 10;
export const INITIAL_LIVES = 3;
export const EXPLOSION_DURATION = 150; // ms, 4 frames

export const SPRITESHEET_URL = "/games/bloque-buster/spritesheet-breakout.png";
export const BOUNCE_SOUND_URL = "/games/bloque-buster/sounds/ball-bounce.mp3";
export const BREAK_SOUND_URL = "/games/bloque-buster/sounds/break-sound.mp3";
