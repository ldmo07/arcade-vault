import type { SkinId } from "@/lib/games/skins";
import type { BlockColor } from "./types";

// Todo lo que pinta el motor de Bloque Buster además de los sprites. Los
// sprites (bloques, paleta, bola, explosiones) se conservan; la skin cambia
// fondo, rejilla, bordes, glow y, opcionalmente, tiñe el spritesheet.
export interface BloqueBusterPalette {
  background: string;
  grid: string | null; // líneas de la rejilla de fondo; null = sin rejilla
  gridSize: number; // px entre líneas
  border: string | null; // paredes izquierda, superior y derecha
  borderWidth: number;
  glow: number; // shadowBlur en px; 0 = sin glow
  // Color del glow por color de bloque (y de su explosión). Se nombra por la
  // clave del sprite, no por su tono visible: "cyan" pinta la fila verde
  // azulada y "green" la azul del spritesheet.
  blockGlow: Record<BlockColor, string>;
  paddleGlow: string;
  ballGlow: string;
  // Tinte monocromo (modo de fusión "color": conserva la luminosidad del
  // sprite y cambia el tono). null = sprite original.
  blockTint: string | null;
  playerTint: string | null; // paleta y bola
  blockOutline: string | null; // contorno duro de cada bloque
  smoothing: boolean; // imageSmoothingEnabled al escalar los sprites
}

const NO_GLOW: Record<BlockColor, string> = {
  red: "transparent",
  yellow: "transparent",
  cyan: "transparent",
  magenta: "transparent",
  hotpink: "transparent",
  green: "transparent",
  gray: "transparent",
};

export const SKINS: Record<SkinId, BloqueBusterPalette> = {
  // Visual original: sprites sin retocar sobre negro.
  clasico: {
    background: "#000",
    grid: null,
    gridSize: 40,
    border: null,
    borderWidth: 0,
    glow: 0,
    blockGlow: NO_GLOW,
    paddleGlow: "transparent",
    ballGlow: "transparent",
    blockTint: null,
    playerTint: null,
    blockOutline: null,
    smoothing: true,
  },
  // Colores del sitio con glow: paredes y paleta cyan, bola amarilla, cada
  // bloque brilla en su propio tono sobre una rejilla tenue.
  neon: {
    background: "#0a0a0f",
    grid: "rgba(0, 245, 255, 0.07)",
    gridSize: 40,
    border: "#ff006e",
    borderWidth: 3,
    glow: 14,
    blockGlow: {
      red: "#ff006e",
      cyan: "#00ff88",
      green: "#00f5ff",
      magenta: "#c45bff",
      yellow: "#f5ff00",
      hotpink: "#ff8a00",
      gray: "#b8b8d0",
    },
    paddleGlow: "#00f5ff",
    ballGlow: "#f5ff00",
    blockTint: null,
    playerTint: null,
    blockOutline: null,
    smoothing: true,
  },
  // Monitor de fósforo: bloques teñidos de verde (cada fila conserva su
  // luminosidad), paleta y bola en ámbar, píxel duro y sin glow.
  retro: {
    background: "#020a04",
    grid: "rgba(51, 204, 51, 0.10)",
    gridSize: 32,
    border: "#33cc33",
    borderWidth: 4,
    glow: 0,
    blockGlow: NO_GLOW,
    paddleGlow: "transparent",
    ballGlow: "transparent",
    blockTint: "#33ff33",
    playerTint: "#ffb000",
    blockOutline: "#7cff6b",
    smoothing: false,
  },
};
