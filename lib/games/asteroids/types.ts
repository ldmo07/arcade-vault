import type { AsteroidsPalette } from "./skins";

export interface AsteroidsCallbacks {
  onScore: (score: number) => void;
  onLives: (lives: number) => void;
  onLevel: (level: number) => void;
  onGameOver: (score: number) => void; // se llama una vez por partida
}

export interface AsteroidsHandle {
  setPaused: (paused: boolean) => void;
  setPalette: (palette: AsteroidsPalette) => void; // cambia de skin en caliente
  destroy: () => void; // cancela rAF y quita listeners; idempotente
}
