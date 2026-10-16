export const W = 800;
export const H = 600;

export const COLS = 20;
export const ROWS = 15;
export const CELL = 40; // px; COLS × CELL = W y ROWS × CELL = H

export const INITIAL_LENGTH = 3;
export const START_CELL = { col: 6, row: 7 }; // cabeza al arrancar, mirando a la derecha

export const BASE_TICK_MS = 140;
export const TICK_STEP_MS = 10; // se resta por cada nivel sobre el 1
export const MIN_TICK_MS = 70;
export const FRUITS_PER_LEVEL = 5;
export const POINTS_PER_FRUIT = 10;
export const MAX_QUEUED_TURNS = 2;

export const SPRITESHEET_URL = "/games/serpentina/fruits.png";

// Estilo del Snake de Google: tablero ajedrezado verde y serpiente azul
export const BOARD_COLOR_A = "#aad751";
export const BOARD_COLOR_B = "#a2d149";
export const SNAKE_COLOR = "#4674e9";
export const EYE_WHITE_COLOR = "#ffffff";
export const EYE_PUPIL_COLOR = "#1b2a4a";
export const HINT_COLOR = "rgba(255, 255, 255, 0.7)";
