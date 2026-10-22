import type { SkinId } from "@/lib/games/skins";

// Todos los colores que pinta el motor de Serpentina. Las frutas son sprites
// (fruits.png) y no se tiñen: en las skins oscuras llevan un marco propio para
// destacar sobre el tablero aunque la fruta sea oscura (berenjena, uvas).
export interface SerpentinaPalette {
  boardA: string; // casillas del ajedrezado
  boardB: string;
  snake: string; // cuerpo
  eyeWhite: string;
  eyePupil: string;
  eyeShape: "round" | "square";
  hint: string; // chevron de la primera dirección
  fruitFrame: string | null; // marco tras la fruta; null = sin marco
  fruitFrameShape: "round" | "square";
  lineCap: CanvasLineCap;
  lineJoin: CanvasLineJoin;
  glow: number; // shadowBlur en px; 0 = sin glow
}

export const SKINS: Record<SkinId, SerpentinaPalette> = {
  // Visual original: Snake de Google, tablero verde y serpiente azul.
  clasico: {
    boardA: "#aad751",
    boardB: "#a2d149",
    snake: "#4674e9",
    eyeWhite: "#ffffff",
    eyePupil: "#1b2a4a",
    eyeShape: "round",
    hint: "rgba(255, 255, 255, 0.7)",
    fruitFrame: null,
    fruitFrameShape: "round",
    lineCap: "round",
    lineJoin: "round",
    glow: 0,
  },
  // Colores del sitio con glow: serpiente cyan, fruta con aro magenta,
  // chevron amarillo sobre --bg.
  neon: {
    boardA: "#0a0a0f",
    boardB: "#11111a",
    snake: "#00f5ff",
    eyeWhite: "#0a0a0f",
    eyePupil: "#f5ff00",
    eyeShape: "round",
    hint: "#f5ff00",
    fruitFrame: "#ff006e",
    fruitFrameShape: "round",
    lineCap: "round",
    lineJoin: "round",
    glow: 14,
  },
  // Monitor de fósforo verde: serpiente en bloques sin glow, ámbar para lo
  // especial (marco de la fruta y chevron).
  retro: {
    boardA: "#020a04",
    boardB: "#06140a",
    snake: "#33cc33",
    eyeWhite: "#e0ffd8",
    eyePupil: "#020a04",
    eyeShape: "square",
    hint: "#ffb000",
    fruitFrame: "#ffb000",
    fruitFrameShape: "square",
    lineCap: "square",
    lineJoin: "miter",
    glow: 0,
  },
};
