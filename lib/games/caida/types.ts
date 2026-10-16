export interface CaidaCallbacks {
  onScore: (score: number) => void;
  onLines: (lines: number) => void;
  onLevel: (level: number) => void;
  onGameOver: (score: number) => void; // se llama una vez por partida
}

export interface CaidaHandle {
  setPaused: (paused: boolean) => void;
  destroy: () => void; // cancela rAF y quita listeners; idempotente
}

export interface Piece {
  type: number; // 1..8, índice en COLORS y PIECES
  shape: number[][];
  x: number;
  y: number;
}
