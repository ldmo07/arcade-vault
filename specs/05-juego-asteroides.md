# SPEC 05 — Juego Asteroides en canvas dentro de la plataforma

> **Status:** Implementado
> **Depends on:** SPEC 01
> **Date:** 2026-10-08
> **Objective:** Portar el juego `references/started-games/02-asteroids` a un motor TypeScript sin dependencias del DOM y montarlo en un canvas dentro del `GamePlayer` de `/juegos/asteroides/jugar`, de modo que el contenedor React controle la pausa y reciba por callbacks puntos, vidas, nivel y fin de partida.

---

## Por qué existe esta spec

Hoy `GamePlayer` simula una partida (puntos aleatorios cada 220 ms y una arena decorativa). Asteroids es el primer juego real y fija el contrato que reutilizarán Tetris y Arkanoid (`references/started-games/03-tetris`, `04-arkanoid`): un motor puro que se monta sobre un `<canvas>`, y un contenedor React que posee el HUD, la pausa y el modal de fin.

---

## Alcance

**Dentro:**

- Motor en `lib/games/asteroids/` portado de `game.js` a TypeScript estricto: `Ship`, `Asteroid`, `Bullet`, `Particle`, `PowerUp` (triple disparo), envolvimiento toroidal de bordes, invencibilidad al reaparecer, división de asteroides, 3 vidas y niveles (`3 + nivel` asteroides).
- El motor no accede a `document`, `window` ni `ResizeObserver` fuera de lo que recibe: lo crea `createAsteroids(canvas, callbacks)` y devuelve un handle con `setPaused`, `destroy`.
- Componente cliente `components/games/asteroids-canvas.tsx` que monta/desmonta el motor y expone el canvas de 800×600 lógicos, escalado por CSS a `.crt-screen` (4:3).
- Integración en `components/game-player.tsx`: si `game.id === "asteroides"` se renderiza `AsteroidsCanvas` en lugar de la arena simulada; el resto de juegos conserva la simulación actual.
- La pausa la controla el botón PAUSA/REANUDAR de `GamePlayer`; el canvas no tiene tecla ni botón de pausa propio. El overlay "EN PAUSA" existente se mantiene.
- Callbacks del canvas hacia React: `onScore`, `onLives`, `onLevel`, `onGameOver`. El HUD (`Puntuación`, `Vidas`, `Nivel`) de `GamePlayer` muestra esos valores en vez de los simulados cuando el juego es `asteroides`.
- Al quedarse sin vidas el motor llama `onGameOver(score)` una sola vez y `GamePlayer` abre el modal existente; "GUARDAR PUNTUACIÓN" usa el `saveScore` mock de `lib/session.tsx`.
- "JUGAR DE NUEVO" reinicia la partida completa (nuevo motor); "FIN" detiene el juego y abre el modal con la puntuación actual.
- Controles del original: `←` `→` rotar, `↑` propulsar, `Espacio` disparar. Se hace `preventDefault` (en `keydown` y `keyup`) de esas teclas y de `↓` mientras el juego está activo, para evitar el scroll de la página y que `Espacio` active el botón enfocado. `↓` no tiene efecto en la nave.
- Aspecto visual original: trazos blancos sobre negro, powerup cian, llama naranja. Sin recolorear.

**Fuera de alcance (para futuras specs):**

- Persistencia real de puntuaciones en Supabase y lectura desde `/salon`.
- Sonido y música.
- Controles táctiles / móvil.
- Canvas HiDPI (`devicePixelRatio`) y redimensionado lógico del mundo.
- OVNIs (mencionados en `lib/data.ts` pero ausentes en el original).
- Pausa automática al cambiar de pestaña o perder foco.
- Portar Tetris, Arkanoid u otros juegos.
- Recolorear con la paleta neón de la plataforma.
- Tests automatizados.
- Modificar los archivos de `references/`.

---

## Modelo de datos

Estructuras nuevas, todas en memoria; no hay persistencia nueva ni claves de `localStorage`.

```ts
// lib/games/asteroids/types.ts
export interface AsteroidsCallbacks {
  onScore: (score: number) => void;
  onLives: (lives: number) => void;
  onLevel: (level: number) => void;
  onGameOver: (score: number) => void; // se llama una vez por partida
}

export interface AsteroidsHandle {
  setPaused: (paused: boolean) => void;
  destroy: () => void; // cancela rAF y quita listeners; idempotente
}

// lib/games/asteroids/engine.ts
export function createAsteroids(
  canvas: HTMLCanvasElement,
  callbacks: AsteroidsCallbacks,
): AsteroidsHandle;
```

```tsx
// components/games/asteroids-canvas.tsx ("use client")
interface AsteroidsCanvasProps extends AsteroidsCallbacks {
  paused: boolean;
}
```

Archivos del motor:

- `lib/games/asteroids/constants.ts`: `W = 800`, `H = 600`, `RADII`, `SPEEDS`, `POINTS`, constantes de powerup.
- `lib/games/asteroids/entities.ts`: clases de entidades con `update(dt)` y `draw(ctx)` (el `ctx` se pasa por parámetro, no es global).
- `lib/games/asteroids/engine.ts`: estado, bucle, input, colisiones.
- `lib/games/asteroids/types.ts`.

Convenciones:

- Coordenadas con origen arriba a la izquierda; velocidades en px/s; `dt` limitado a 0.05 s como en el original.
- Puntos por asteroide: grande 20, mediano 50, pequeño 100 (`POINTS[size]` con tamaños 3, 2, 1).
- Los callbacks solo se llaman cuando el valor cambia (y una vez al arrancar con los valores iniciales: 0 puntos, 3 vidas, nivel 1).
- El canvas solo dibuja el mundo, partículas y el temporizador `3x`; no dibuja SCORE, NIVEL, vidas ni el overlay GAME OVER (los muestra React).
- Mientras `paused` es `true` el motor no actualiza ni procesa input, sigue dibujando el último fotograma y descarta `dt` acumulado al reanudar. Las teclas pulsadas se limpian al pausar.
- El motor ignora eventos de teclado cuyo `target` sea `input`, `textarea` o `select`.
- Tras `onGameOver` el motor deja de aceptar input; el reinicio lo hace React montando un motor nuevo (`key` distinto).

---

## Plan de implementación

Antes de empezar: leer `node_modules/next/dist/docs/01-app` (Client Components) y aplicar `/ui-ux-pro-max` según `CLAUDE.md`.

1. Crear `lib/games/asteroids/constants.ts` y `types.ts` con los valores y contratos del modelo de datos. Verificación: `npm run lint`.
2. Crear `lib/games/asteroids/entities.ts` portando `Bullet`, `Asteroid`, `PowerUp`, `Ship` y `Particle` a TypeScript, recibiendo `ctx` en `draw` y el estado de teclas en `Ship.update`. Verificación: `npm run lint`.
3. Crear `lib/games/asteroids/engine.ts` con `createAsteroids`: estado, `spawnAsteroids`, `nextLevel`, colisiones, bucle `requestAnimationFrame`, input con `preventDefault`, `setPaused`, `destroy` y los cuatro callbacks. Verificación: `npm run lint`.
4. Crear `components/games/asteroids-canvas.tsx`: canvas 800×600 con `width: 100%; height: 100%` dentro de `.crt-screen`, `useEffect` que crea el motor y lo destruye en el cleanup, y un efecto que propaga `paused` a `setPaused`. Los callbacks se leen vía ref para no recrear el motor al cambiar. Verificación: `npm run lint`.
5. Integrar en `components/game-player.tsx`: para `game.id === "asteroides"` renderizar `AsteroidsCanvas` (con `paused={paused || over}`) en lugar de `.game-arena`, desactivar el `setInterval` de puntos simulados, alimentar `score`, `lives` y `level` desde los callbacks, abrir el modal en `onGameOver`, y reiniciar con un `runId` usado como `key` del canvas en `restart`. Los demás juegos conservan el comportamiento actual. Verificación: `npm run dev`, `/juegos/asteroides/jugar` se juega y `/juegos/caida/jugar` sigue con la simulación.
   Además, renombrar "rocas" a "asteroides" en el código existente: `id`, `title` (`ASTEROIDES`) y `cover` en `lib/data.ts`, las clases `.cover-rocas` en `app/globals.css` y `game: "Rocas"` en `lib/home-data.ts`. La spec 01 no se modifica.
6. Correr `npm run lint` y `npm run build`.

---

## Criterios de aceptación

- [x] `npm run lint` y `npm run build` terminan sin errores.
- [x] `/juegos/asteroides/jugar` muestra el canvas con la nave en el centro, 4 asteroides grandes y sin errores en la consola.
- [x] `←` y `→` rotan la nave, `↑` la propulsa y `Espacio` dispara; pulsarlas, y también `↓`, no hace scroll en la página ni activa el botón enfocado.
- [x] Nave, asteroides, balas y partículas atraviesan un borde y reaparecen por el opuesto.
- [x] Destruir un asteroide grande suma exactamente 20, uno mediano 50 y uno pequeño 100, y el HUD de React muestra el total.
- [x] Un asteroide grande se divide en 2 medianos y uno mediano en 2 pequeños; uno pequeño desaparece sin dividirse.
- [x] Chocar con un asteroide sin invencibilidad resta una vida, el HUD de React lo refleja y la nave reaparece en el centro tras 2 s parpadeando durante 3 s de invencibilidad.
- [x] Al limpiar todos los asteroides el nivel sube en 1, el HUD muestra el nuevo nivel y aparecen `3 + nivel` asteroides.
- [x] Recoger el powerup `3x` activa disparo triple durante 5 s y el canvas muestra el contador `3x N.Ns`.
- [x] Pulsar PAUSA congela asteroides, balas y nave, aparece "EN PAUSA", y las teclas pulsadas durante la pausa no tienen efecto.
- [x] Pulsar REANUDAR continúa desde el mismo estado, sin salto de movimiento ni disparo pendiente.
- [x] Al llegar a 0 vidas se abre el modal "FIN DEL JUEGO" con la puntuación del HUD y `onGameOver` se invoca una sola vez.
- [x] Con el modal abierto, escribir espacios o flechas en el campo de iniciales no mueve ni dispara la nave.
- [x] "GUARDAR PUNTUACIÓN" guarda con `saveScore({ game: "asteroides", score, name })` y muestra "PUNTUACIÓN GUARDADA_".
- [x] "JUGAR DE NUEVO" arranca una partida con 0 puntos, 3 vidas, nivel 1 y sin duplicar listeners ni bucles (la velocidad del juego no cambia tras reiniciar).
- [x] Pulsar FIN abre el modal con la puntuación actual y la nave deja de responder al teclado.
- [x] Al salir con SALIR o navegar a otra ruta se cancelan el `requestAnimationFrame` y los listeners de teclado (el teclado de otras páginas funciona con normalidad).
- [x] `/juegos/caida/jugar` y los demás juegos siguen mostrando la arena simulada y el HUD aleatorio de antes.
- [x] `lib/games/asteroids/` no referencia `document` ni `window` fuera de `addEventListener`/`requestAnimationFrame`/`performance` y no importa React.

---

## Decisiones

- **Sí:** motor TypeScript puro + wrapper React. Separa lógica de UI y sirve de plantilla para Tetris y Arkanoid.
- **No:** un único archivo cliente con todo mezclado, ni `iframe` del `index.html` original. El iframe no da comunicación limpia de puntos y queda fuera del diseño.
- **Sí:** el contenedor React es dueño de HUD, pausa y modal de fin; el canvas notifica por callbacks. Decisión del usuario.
- **No:** HUD, overlay GAME OVER ni reinicio con `Espacio` dentro del canvas. Duplicaría lo que ya hace `GamePlayer`.
- **Sí:** pausa controlada solo desde React (`setPaused`), sin tecla `P` ni `Esc`. Decisión del usuario.
- **Sí:** `onGameOver` se dispara en el instante en que se pierde la última vida y abre el modal de inmediato. Es lo más simple y evita un temporizador extra.
- **Sí:** reinicio montando un motor nuevo con `key`. Evita limpiar estado a mano y asegura que no se acumulen listeners.
- **Sí:** mantener vectores blanco/cian originales. Decisión del usuario; no se toca el gameplay.
- **No:** recolorear con la paleta neón.
- **Sí:** guardar con el `saveScore` mock. Supabase y `/salon` real van en otra spec.
- **Sí:** el mismo `GamePlayer` sirve a todos los juegos, con una rama por `game.id === "asteroides"`. Mínimo cambio hasta que haya un segundo juego real; entonces se generaliza a un registro por id.
- **Sí:** ignorar teclas cuando el foco está en un campo de texto. El modal tiene un `input` de iniciales.
- **No:** HiDPI. Escalado por CSS es suficiente para el estilo vectorial.
- **Nota:** el nivel del HUD deja de derivarse de `score / 2500` para `asteroides` y pasa a ser el nivel real del motor.

---

## Riesgos

| Riesgo                                                                              | Mitigación                                                                                               |
| ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| React StrictMode monta dos veces el efecto en desarrollo y duplica bucles/listeners | `destroy()` idempotente en el cleanup; verificación con `npm run dev` de que la velocidad no se duplica. |
| Callbacks cambian de identidad en cada render y reinician el motor                  | El wrapper los guarda en una ref; el efecto del motor depende solo del `key`/montaje.                    |
| `dt` enorme tras reanudar o volver a la pestaña                                     | Al reanudar se reinicia `lastTime`; `dt` sigue limitado a 0.05 s.                                        |
| Teclas pegadas tras pausar (keyup ocurre durante la pausa)                          | `setPaused(true)` limpia `keys` y `justPressed`.                                                         |
| Las flechas y `Espacio` hacen scroll o activan el botón enfocado                    | `preventDefault` mientras el juego está activo y sin pausa; el modal abierto lo desactiva.               |
| Escalado CSS deforma el canvas                                                      | Contenedor `.crt-screen` ya es `aspect-ratio: 4 / 3`; el canvas es 800×600 (también 4:3).                |
| Las capas `::before`/`::after` del CRT capturan eventos                             | Ya tienen `pointer-events: none`; el juego solo usa teclado.                                             |

---

## Lo que **no** está en esta spec

- Persistencia de puntuaciones en Supabase y ranking real.
- Sonido.
- Controles táctiles.
- Canvas HiDPI.
- OVNIs.
- Pausa automática por pérdida de foco.
- Otros juegos (Tetris, Arkanoid).
- Cambios visuales al estilo del juego.
- Tests automatizados.

Cada uno de estos, si se aborda, va en su propia spec.
