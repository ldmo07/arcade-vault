import type { ComponentType } from "react";
import { AsteroidsCanvas } from "@/components/games/asteroids-canvas";
import { BloqueBusterCanvas } from "@/components/games/bloque-buster-canvas";
import { CaidaCanvas } from "@/components/games/caida-canvas";
import { SerpentinaCanvas } from "@/components/games/serpentina-canvas";
import type { SkinId } from "@/lib/games/skins";

export interface HudStat {
  label: "Puntuación" | "Vidas" | "Líneas" | "Nivel";
  key: "score" | "lives" | "lines" | "level";
}

// Props comunes de todos los canvas; los callbacks de HUD opcionales solo los
// invoca el motor que declara esa métrica en su entrada del registro.
export interface GameCanvasProps {
  paused: boolean;
  // Solo lo usan los juegos con `skins: true`; el resto lo ignora
  skin?: SkinId;
  onScore: (score: number) => void;
  onGameOver: (score: number) => void;
  onLives?: (lives: number) => void;
  onLines?: (lines: number) => void;
  onLevel?: (level: number) => void;
}

export interface GameRegistryEntry {
  Canvas: ComponentType<GameCanvasProps>;
  hud: HudStat[];
  // true cuando el juego tiene las 3 skins: GamePlayer muestra el selector
  skins?: boolean;
}

export const GAME_REGISTRY: Record<string, GameRegistryEntry> = {
  asteroides: {
    Canvas: AsteroidsCanvas,
    hud: [
      { label: "Puntuación", key: "score" },
      { label: "Vidas", key: "lives" },
      { label: "Nivel", key: "level" },
    ],
    skins: true,
  },
  "bloque-buster": {
    Canvas: BloqueBusterCanvas,
    hud: [
      { label: "Puntuación", key: "score" },
      { label: "Vidas", key: "lives" },
      { label: "Nivel", key: "level" },
    ],
    skins: true,
  },
  caida: {
    Canvas: CaidaCanvas,
    hud: [
      { label: "Puntuación", key: "score" },
      { label: "Líneas", key: "lines" },
      { label: "Nivel", key: "level" },
    ],
  },
  serpentina: {
    Canvas: SerpentinaCanvas,
    hud: [
      { label: "Puntuación", key: "score" },
      { label: "Nivel", key: "level" },
    ],
    skins: true,
  },
};
