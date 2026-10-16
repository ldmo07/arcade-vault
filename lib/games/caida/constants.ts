export const W = 800;
export const H = 600;

export const COLS = 10;
export const ROWS = 20;
export const BLOCK = 30;
// Tablero de 300×600 centrado en el canvas lógico de 800×600
export const BOARD_X = (W - COLS * BLOCK) / 2;

// Índice 0 = celda vacía; 1..8 = tipo de pieza (I, O, T, S, Z, J, L, N)
export const COLORS: (string | null)[] = [
  null,
  "#4dd0e1", // I - cyan
  "#ffd54f", // O - yellow
  "#ba68c8", // T - purple
  "#81c784", // S - green
  "#e57373", // Z - red
  "#90caf9", // J - pale blue
  "#ffb74d", // L - orange
  "#9e9e9e", // N - tuerca (gris metálico)
];

export const PIECES: number[][][] = [
  [],
  [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ], // I
  [
    [2, 2],
    [2, 2],
  ], // O
  [
    [0, 3, 0],
    [3, 3, 3],
    [0, 0, 0],
  ], // T
  [
    [0, 4, 4],
    [4, 4, 0],
    [0, 0, 0],
  ], // S
  [
    [5, 5, 0],
    [0, 5, 5],
    [0, 0, 0],
  ], // Z
  [
    [6, 0, 0],
    [6, 6, 6],
    [0, 0, 0],
  ], // J
  [
    [0, 0, 7],
    [7, 7, 7],
    [0, 0, 0],
  ], // L
  [
    [8, 8, 8],
    [8, 0, 8],
    [8, 8, 8],
  ], // N (tuerca)
];

export const PIECE_TYPES = PIECES.length - 1;

// Puntos por 0..4 líneas; se multiplican por el nivel
export const LINE_SCORES = [0, 100, 300, 500, 800];
export const SOFT_DROP_POINTS = 1; // por fila
export const HARD_DROP_POINTS = 2; // por celda recorrida

export const LINES_PER_LEVEL = 10;
export const BASE_DROP_MS = 1000;
export const MIN_DROP_MS = 100;
export const DROP_STEP_MS = 90; // se resta por nivel por encima del 1

// Desplazamientos en x que se prueban al rotar pegado a una pared
export const KICKS = [0, -1, 1, -2, 2];

export const GRID_COLOR = "#22222e";
