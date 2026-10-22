"use client";

import { useEffect, useRef } from "react";
import { H, W } from "@/lib/games/asteroids/constants";
import { createAsteroids } from "@/lib/games/asteroids/engine";
import { SKINS } from "@/lib/games/asteroids/skins";
import type {
  AsteroidsCallbacks,
  AsteroidsHandle,
} from "@/lib/games/asteroids/types";
import { DEFAULT_SKIN, type SkinId } from "@/lib/games/skins";

// onLives y onLevel son opcionales para encajar en GameCanvasProps del registro
interface AsteroidsCanvasProps extends Omit<
  AsteroidsCallbacks,
  "onLives" | "onLevel"
> {
  paused: boolean;
  skin?: SkinId;
  onLives?: AsteroidsCallbacks["onLives"];
  onLevel?: AsteroidsCallbacks["onLevel"];
}

type AsteroidsCanvasCallbacks = Omit<AsteroidsCanvasProps, "paused" | "skin">;

export function AsteroidsCanvas({
  paused,
  skin = DEFAULT_SKIN,
  onScore,
  onLives,
  onLevel,
  onGameOver,
}: AsteroidsCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handleRef = useRef<AsteroidsHandle | null>(null);
  // Skin con la que nace el motor; los cambios posteriores van por setPalette
  const initialSkinRef = useRef(skin);
  const callbacksRef = useRef<AsteroidsCanvasCallbacks>({
    onScore,
    onLives,
    onLevel,
    onGameOver,
  });

  // Los callbacks se leen vía ref para no recrear el motor al cambiar de identidad
  useEffect(() => {
    callbacksRef.current = { onScore, onLives, onLevel, onGameOver };
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handle = createAsteroids(
      canvas,
      {
        onScore: (v) => callbacksRef.current.onScore(v),
        onLives: (v) => callbacksRef.current.onLives?.(v),
        onLevel: (v) => callbacksRef.current.onLevel?.(v),
        onGameOver: (v) => callbacksRef.current.onGameOver(v),
      },
      SKINS[initialSkinRef.current],
    );
    handleRef.current = handle;
    return () => {
      handle.destroy();
      handleRef.current = null;
    };
  }, []);

  useEffect(() => {
    handleRef.current?.setPaused(paused);
  }, [paused]);

  // Cambio de skin en caliente, sin reiniciar la partida
  useEffect(() => {
    handleRef.current?.setPalette(SKINS[skin]);
  }, [skin]);

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      className="block h-full w-full"
      role="img"
      aria-label="Juego Asteroides"
    />
  );
}
