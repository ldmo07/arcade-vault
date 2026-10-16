# Contrato motor ↔ React

Extraído de `lib/games/asteroids/*` y `components/games/asteroids-canvas.tsx` (SPEC 05). Toda spec de juego debe exigirlo.

## Motor puro en `lib/games/<slug>/`

- Archivos: `constants.ts`, `types.ts`, `entities.ts`, `engine.ts`.
- Punto de entrada: `create<Game>(canvas: HTMLCanvasElement, callbacks: <Game>Callbacks): GameHandle`.
- Sin React. No usa `document`/`window` salvo `addEventListener`, `requestAnimationFrame` y `performance`. El `ctx` se pasa por parámetro a `draw(ctx)`.
- Si no hay `ctx` 2D, devuelve un handle vacío.

```ts
export interface GameHandle {
  setPaused: (paused: boolean) => void;
  destroy: () => void; // cancela rAF y quita listeners; idempotente
}
// Callbacks mínimos; añade las métricas de HUD que el juego declare.
export interface GameCallbacks {
  onScore: (score: number) => void;
  onGameOver: (score: number) => void; // una sola vez por partida
  // onLives?, onLevel?, onLines?, ...
}
```

## Reglas del motor

- Los callbacks se emiten solo cuando el valor cambia, y una vez al arrancar con los valores iniciales.
- `dt` limitado a 0.05 s; coordenadas con origen arriba a la izquierda.
- `setPaused(true)`: no actualiza ni procesa input, sigue dibujando el último fotograma, limpia las teclas pulsadas; al reanudar descarta el `dt` acumulado.
- Input por teclado en `window`; `preventDefault` (keydown y keyup) de las teclas del juego y de las flechas para evitar scroll y activar el botón enfocado; se ignoran eventos con `target` `input`, `textarea` o `select`.
- Tras `onGameOver` no hay input; el reinicio lo hace React montando un motor nuevo.
- **El canvas solo dibuja el mundo.** No dibuja HUD, overlay de game over, overlay de pausa ni reinicio por tecla: los pone `GamePlayer`.
- Pausa solo desde React (`setPaused`); sin tecla propia.

## Wrapper `components/games/<slug>-canvas.tsx` (`"use client"`)

- Props: callbacks del juego + `paused: boolean`.
- Callbacks guardados en una ref actualizada en cada render; el motor se crea en un efecto con `[]` y se destruye en el cleanup (compatible con StrictMode); otro efecto `[paused]` llama a `setPaused`.
- `<canvas width={W} height={H} className="block h-full w-full" role="img" aria-label="Juego <Título>" />` dentro de `.crt-screen` (4:3).
- Reinicio: `GamePlayer` usa un `runId` como `key` del wrapper.

## Registro por id: `lib/games/registry.ts`

Sustituye la rama `game.id === "asteroides"` de `components/game-player.tsx`. Una entrada por juego jugable: `id → { Canvas, hud }`, donde `hud` declara qué métricas muestra (vidas, nivel…) y cómo se alimentan de los callbacks. `GamePlayer` busca `registry[game.id]`; sin entrada conserva la arena simulada de los juegos no portados.

- **Si `lib/games/registry.ts` no existe**: la spec incluye un paso previo que crea el registro, migra Asteroides a él (sin cambiar su comportamiento) y lo verifica jugando `/juegos/asteroides/jugar` y `/juegos/caida/jugar` antes de añadir el juego nuevo.
- **Si existe**: solo se añade una entrada.
- Los derivados por defecto (p. ej. nivel `1 + floor(score / 2500)` de los juegos simulados) solo aplican a juegos sin entrada.
