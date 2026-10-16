"use client";

import { useEffect, useRef } from "react";
import {
  BOUNCE_SOUND_URL,
  BREAK_SOUND_URL,
  H,
  SPRITESHEET_URL,
  W,
} from "@/lib/games/bloque-buster/constants";
import { createBloqueBuster } from "@/lib/games/bloque-buster/engine";
import type {
  BloqueBusterCallbacks,
  BloqueBusterHandle,
} from "@/lib/games/bloque-buster/types";

// onLives y onLevel son opcionales para encajar en GameCanvasProps del registro
interface BloqueBusterCanvasProps extends Omit<
  BloqueBusterCallbacks,
  "onLives" | "onLevel"
> {
  paused: boolean;
  onLives?: BloqueBusterCallbacks["onLives"];
  onLevel?: BloqueBusterCallbacks["onLevel"];
}

type BloqueBusterCanvasCallbacks = Omit<BloqueBusterCanvasProps, "paused">;

export function BloqueBusterCanvas({
  paused,
  onScore,
  onLives,
  onLevel,
  onGameOver,
}: BloqueBusterCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handleRef = useRef<BloqueBusterHandle | null>(null);
  const pausedRef = useRef(paused);
  const callbacksRef = useRef<BloqueBusterCanvasCallbacks>({
    onScore,
    onLives,
    onLevel,
    onGameOver,
  });

  // Los callbacks se leen vía ref para no recrear el motor al cambiar de identidad
  useEffect(() => {
    callbacksRef.current = { onScore, onLives, onLevel, onGameOver };
  });

  // El motor se crea cuando el spritesheet termina de cargar; hasta entonces
  // el canvas queda negro y no se emite ningún callback
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    let handle: BloqueBusterHandle | null = null;

    // Sonidos precargados; cada reproducción usa un clon para permitir solapes
    const bounceSound = new Audio(BOUNCE_SOUND_URL);
    const breakSound = new Audio(BREAK_SOUND_URL);
    const play = (base: HTMLAudioElement) => {
      if (cancelled) return;
      (base.cloneNode() as HTMLAudioElement).play().catch(() => {});
    };

    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      handle = createBloqueBuster(
        canvas,
        {
          onScore: (v) => callbacksRef.current.onScore(v),
          onLives: (v) => callbacksRef.current.onLives?.(v),
          onLevel: (v) => callbacksRef.current.onLevel?.(v),
          onGameOver: (v) => callbacksRef.current.onGameOver(v),
          onBounce: () => play(bounceSound),
          onBlockBreak: () => play(breakSound),
        },
        img,
      );
      handleRef.current = handle;
      handle.setPaused(pausedRef.current);
    };
    img.src = SPRITESHEET_URL;

    return () => {
      cancelled = true;
      img.onload = null;
      handle?.destroy();
      handleRef.current = null;
    };
  }, []);

  useEffect(() => {
    pausedRef.current = paused;
    handleRef.current?.setPaused(paused);
  }, [paused]);

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      className="block h-full w-full bg-black"
      role="img"
      aria-label="Juego Bloque Buster"
    />
  );
}
