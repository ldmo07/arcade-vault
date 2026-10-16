"use client";

import { useEffect, useRef } from "react";
import {
  BOARD_COLOR_A,
  H,
  SPRITESHEET_URL,
  W,
} from "@/lib/games/serpentina/constants";
import { createSerpentina } from "@/lib/games/serpentina/engine";
import type {
  SerpentinaCallbacks,
  SerpentinaHandle,
} from "@/lib/games/serpentina/types";

// onLevel es opcional para encajar en GameCanvasProps del registro
interface SerpentinaCanvasProps extends Omit<SerpentinaCallbacks, "onLevel"> {
  paused: boolean;
  onLevel?: SerpentinaCallbacks["onLevel"];
}

type SerpentinaCanvasCallbacks = Omit<SerpentinaCanvasProps, "paused">;

const BEEP_GAIN = 0.08;

// Bip sintetizado: la frecuencia baja o sube de `from` a `to` mientras la ganancia cae a 0
function playBeep(
  audio: AudioContext,
  type: OscillatorType,
  from: number,
  to: number,
  seconds: number,
) {
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  const now = audio.currentTime;
  osc.type = type;
  osc.frequency.setValueAtTime(from, now);
  osc.frequency.linearRampToValueAtTime(to, now + seconds);
  gain.gain.setValueAtTime(BEEP_GAIN, now);
  gain.gain.linearRampToValueAtTime(0, now + seconds);
  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start(now);
  osc.stop(now + seconds);
}

export function SerpentinaCanvas({
  paused,
  onScore,
  onLevel,
  onGameOver,
}: SerpentinaCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handleRef = useRef<SerpentinaHandle | null>(null);
  const pausedRef = useRef(paused);
  const callbacksRef = useRef<SerpentinaCanvasCallbacks>({
    onScore,
    onLevel,
    onGameOver,
  });

  // Los callbacks se leen vía ref para no recrear el motor al cambiar de identidad
  useEffect(() => {
    callbacksRef.current = { onScore, onLevel, onGameOver };
  });

  // El motor se crea cuando el spritesheet termina de cargar; hasta entonces
  // el canvas muestra el fondo del tablero y no se emite ningún callback
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    let handle: SerpentinaHandle | null = null;

    // AudioContext perezoso: el primer evento llega tras la primera flecha (gesto del usuario)
    let audio: AudioContext | null = null;
    const beep = (
      type: OscillatorType,
      from: number,
      to: number,
      seconds: number,
    ) => {
      if (cancelled) return;
      try {
        audio ??= new AudioContext();
        if (audio.state === "suspended") audio.resume().catch(() => {});
        playBeep(audio, type, from, to, seconds);
      } catch {
        // Sin Web Audio el juego sigue sin sonido
      }
    };

    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      handle = createSerpentina(
        canvas,
        {
          onScore: (v) => callbacksRef.current.onScore(v),
          onLevel: (v) => callbacksRef.current.onLevel?.(v),
          onGameOver: (v) => callbacksRef.current.onGameOver(v),
          onEat: () => beep("square", 660, 880, 0.09),
          onCrash: () => beep("sawtooth", 220, 80, 0.3),
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
      audio?.close().catch(() => {});
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
      className="block h-full w-full"
      style={{ backgroundColor: BOARD_COLOR_A }}
      role="img"
      aria-label="Juego Serpentina"
    />
  );
}
