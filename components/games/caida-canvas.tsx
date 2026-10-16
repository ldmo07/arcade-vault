"use client";

import { useEffect, useRef } from "react";
import { H, W } from "@/lib/games/caida/constants";
import { createCaida } from "@/lib/games/caida/engine";
import type { CaidaCallbacks, CaidaHandle } from "@/lib/games/caida/types";

// onLines y onLevel son opcionales para encajar en GameCanvasProps del registro
interface CaidaCanvasProps extends Omit<CaidaCallbacks, "onLines" | "onLevel"> {
  paused: boolean;
  onLines?: CaidaCallbacks["onLines"];
  onLevel?: CaidaCallbacks["onLevel"];
}

type CaidaCanvasCallbacks = Omit<CaidaCanvasProps, "paused">;

export function CaidaCanvas({
  paused,
  onScore,
  onLines,
  onLevel,
  onGameOver,
}: CaidaCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handleRef = useRef<CaidaHandle | null>(null);
  const callbacksRef = useRef<CaidaCanvasCallbacks>({
    onScore,
    onLines,
    onLevel,
    onGameOver,
  });

  // Los callbacks se leen vía ref para no recrear el motor al cambiar de identidad
  useEffect(() => {
    callbacksRef.current = { onScore, onLines, onLevel, onGameOver };
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handle = createCaida(canvas, {
      onScore: (v) => callbacksRef.current.onScore(v),
      onLines: (v) => callbacksRef.current.onLines?.(v),
      onLevel: (v) => callbacksRef.current.onLevel?.(v),
      onGameOver: (v) => callbacksRef.current.onGameOver(v),
    });
    handleRef.current = handle;
    return () => {
      handle.destroy();
      handleRef.current = null;
    };
  }, []);

  useEffect(() => {
    handleRef.current?.setPaused(paused);
  }, [paused]);

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      className="block h-full w-full"
      role="img"
      aria-label="Juego Caída"
    />
  );
}
