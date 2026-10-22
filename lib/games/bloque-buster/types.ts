import type { BloqueBusterPalette } from "./skins";

export interface BloqueBusterCallbacks {
  onScore: (score: number) => void;
  onLives: (lives: number) => void;
  onLevel: (level: number) => void;
  onGameOver: (score: number) => void; // una vez por partida (derrota o victoria)
  onBounce?: () => void; // una llamada por rebote en pared o paleta
  onBlockBreak?: () => void; // bloque roto
}

export interface BloqueBusterHandle {
  setPaused: (paused: boolean) => void;
  setPalette: (palette: BloqueBusterPalette) => void; // cambio de skin en caliente
  destroy: () => void; // cancela rAF y quita listeners; idempotente
}

export type BlockColor =
  "red" | "yellow" | "cyan" | "magenta" | "hotpink" | "green" | "gray";

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Block extends Rect {
  color: BlockColor;
  alive: boolean;
}

export interface Explosion extends Rect {
  color: BlockColor;
  elapsed: number; // ms
}

export interface Ball extends Rect {
  vx: number;
  vy: number;
}

export interface LevelDef {
  speed: number;
  blocks: { col: number; row: number; color: BlockColor }[];
}
