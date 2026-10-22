import type { SkinId } from "@/lib/games/skins";

// Todos los colores que pinta el motor de Asteroides. Las entidades se
// distinguen por forma (triángulo, polígono, rombo con "3x", punto), no solo
// por color.
export interface AsteroidsPalette {
  background: string;
  ship: string;
  thrust: string; // llama del propulsor
  bullet: string;
  asteroid: string;
  powerUp: string; // rombo del power-up
  powerUpText: string; // "3x" dentro del rombo
  hudText: string; // contador "3x  N.Ns" arriba a la izquierda
  particleRgb: string; // "r, g, b": el alfa lo pone la partícula al apagarse
  lineWidth: number;
  lineJoin: CanvasLineJoin;
  lineCap: CanvasLineCap;
  glow: number; // shadowBlur en px; 0 = sin glow
}

export const SKINS: Record<SkinId, AsteroidsPalette> = {
  // Visual original: vectores blancos sobre negro, power-up cyan.
  clasico: {
    background: "#000",
    ship: "#fff",
    thrust: "rgba(255, 130, 0, 0.85)",
    bullet: "#fff",
    asteroid: "#fff",
    powerUp: "#0ff",
    powerUpText: "#0ff",
    hudText: "#0ff",
    particleRgb: "255,255,255",
    lineWidth: 1.5,
    lineJoin: "round",
    lineCap: "butt",
    glow: 0,
  },
  // Colores del sitio con glow: nave cyan, rocas magenta, disparos amarillos,
  // power-up verde.
  neon: {
    background: "#0a0a0f",
    ship: "#00f5ff",
    thrust: "#f5ff00",
    bullet: "#f5ff00",
    asteroid: "#ff006e",
    powerUp: "#00ff88",
    powerUpText: "#00ff88",
    hudText: "#00ff88",
    particleRgb: "255,0,110",
    lineWidth: 2,
    lineJoin: "round",
    lineCap: "round",
    glow: 12,
  },
  // Monitor de fósforo verde: verdes en dos intensidades y ámbar para lo
  // especial (power-up, propulsor). Sin glow, esquinas duras.
  retro: {
    background: "#020a04",
    ship: "#7cff6b",
    thrust: "#ffb000",
    bullet: "#e0ffd8",
    asteroid: "#33cc33",
    powerUp: "#ffb000",
    powerUpText: "#ffb000",
    hudText: "#ffb000",
    particleRgb: "124,255,107",
    lineWidth: 2,
    lineJoin: "miter",
    lineCap: "butt",
    glow: 0,
  },
};
