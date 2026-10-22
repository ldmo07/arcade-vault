import type { BlockColor } from "./types";

export interface Frame {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

export type SpriteName = "paddle" | "ball" | `block_${BlockColor}`;

const SPRITES: Record<"paddle" | "ball", Frame> = {
  paddle: { sx: 32, sy: 112, sw: 162, sh: 14 },
  ball: { sx: 32, sy: 32, sw: 16, sh: 16 },
};

const BLOCK_SPRITES: Record<BlockColor, Frame> = {
  gray: { sx: 32, sy: 288, sw: 32, sh: 16 },
  red: { sx: 32, sy: 176, sw: 32, sh: 16 },
  yellow: { sx: 32, sy: 240, sw: 32, sh: 16 },
  cyan: { sx: 32, sy: 192, sw: 32, sh: 16 },
  magenta: { sx: 32, sy: 224, sw: 32, sh: 16 },
  hotpink: { sx: 32, sy: 256, sw: 32, sh: 16 },
  green: { sx: 32, sy: 208, sw: 32, sh: 16 },
};

// Fila (sy) de los 4 frames de explosión de cada color; la gris reutiliza la roja
const EXPLOSION_ROW_Y: Record<BlockColor, number> = {
  red: 176,
  cyan: 192,
  green: 208,
  magenta: 224,
  yellow: 240,
  hotpink: 256,
  gray: 176,
};

export const EXPLOSION_FRAME_COUNT = 4;

export function explosionFrame(color: BlockColor, index: number): Frame {
  return {
    sx: 256 + index * 32,
    sy: EXPLOSION_ROW_Y[color],
    sw: 32,
    sh: 16,
  };
}

// Copia del spritesheet teñida de un solo tono: el modo "color" conserva la
// luminosidad de cada píxel y "destination-in" recupera la transparencia.
export function tintSpritesheet(
  img: CanvasImageSource,
  tint: string,
): CanvasImageSource {
  const source = img as HTMLImageElement;
  const w = source.naturalWidth || (img as HTMLCanvasElement).width;
  const h = source.naturalHeight || (img as HTMLCanvasElement).height;
  const off = document.createElement("canvas");
  off.width = w;
  off.height = h;
  const octx = off.getContext("2d");
  if (!octx || !w || !h) return img;
  octx.drawImage(img, 0, 0);
  octx.globalCompositeOperation = "color";
  octx.fillStyle = tint;
  octx.fillRect(0, 0, w, h);
  octx.globalCompositeOperation = "destination-in";
  octx.drawImage(img, 0, 0);
  return off;
}

export function drawFrame(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  frame: Frame,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  ctx.drawImage(img, frame.sx, frame.sy, frame.sw, frame.sh, x, y, w, h);
}

export function drawSprite(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  name: SpriteName,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  const frame = name.startsWith("block_")
    ? BLOCK_SPRITES[name.slice(6) as BlockColor]
    : SPRITES[name as "paddle" | "ball"];
  drawFrame(ctx, img, frame, x, y, w, h);
}
