# SPEC 07 — Juego Caída (Tetris) en canvas con leaderboard

> **Status:** Implementado
> **Depends on:** SPEC 05, SPEC 06
> **Date:** 2026-10-16
> **Objective:** Portar `references/started-games/03-tetris` a un motor TypeScript en `lib/games/caida/`, montarlo en `/juegos/caida/jugar` mediante un registro de juegos por id y guardar sus puntuaciones en el leaderboard de Supabase.

---

## Por qué existe esta spec

Asteroides (SPEC 05) es el único juego real y `GamePlayer` lo detecta con `game.id === "asteroides"` y un HUD fijo con `Vidas`. SPEC 05 dejó anotado que, al llegar un segundo juego real, la rama se generaliza a un registro por id. Caída es ese segundo juego: no tiene vidas, tiene líneas, y su canvas no es 800×600 de origen. Esta spec crea el registro `lib/games/registry.ts` y deja el patrón para Arkanoid y los demás.

---

## Alcance

**Dentro:**

- Registro `lib/games/registry.ts`: `id → { Canvas, hud }`. `GamePlayer` lo consulta en lugar de `game.id === "asteroides"`; sin entrada conserva la arena simulada. Asteroides se migra al registro sin cambiar su comportamiento.
- HUD configurable por juego en `GamePlayer`: Asteroides muestra `Puntuación`, `Vidas`, `Nivel`; Caída muestra `Puntuación`, `Líneas`, `Nivel` (sin `Vidas`).
- Motor en `lib/games/caida/` portado de `game.js` a TypeScript estricto: tablero 10×20, 8 piezas (I, O, T, S, Z, J, L y la `N` tuerca 3×3 del código), rotación horaria con wall kicks, soft drop, hard drop, pieza fantasma, pieza siguiente, limpieza de líneas, niveles y fin de partida.
- Canvas lógico de 800×600 (encaja en `.crt-screen` 4:3): el motor dibuja el tablero de 300×600 centrado y el panel `SIGUIENTE` a la derecha. El lateral izquierdo queda vacío.
- Componente cliente `components/games/caida-canvas.tsx` con el mismo patrón que `asteroids-canvas.tsx`.
- Controles: `←` `→` mover, `↑` o `X` rotar, `↓` soft drop, `Espacio` hard drop. Se hace `preventDefault` de estas teclas mientras el juego está activo.
- Pausa solo desde el botón PAUSA/REANUDAR de `GamePlayer`; se descartan la tecla `P`, el overlay DOM y el botón Reiniciar del original.
- Paleta original de piezas, solo tema oscuro y rejilla con color constante. Se descartan el toggle de tema y la clave `tetris-theme` de `localStorage`.
- Migración `supabase/migrations/<timestamp>_juego_caida.sql` (vía MCP `apply_migration`): `update public.games set playable = true where id = 'caida'`. La fila ya existe con título `CAÍDA`, `PUZZLE`, `magenta`, `cover-tetro` y `sort_order` 2; la portada `.cover-tetro` ya existe en `app/globals.css`.
- Guardado y ranking: sin código nuevo; usan `submitScore`, `getTopScores`, `/salon?juego=caida` y `/juegos/caida` de SPEC 06.
- Aplicar `/ui-ux-pro-max` al HUD configurable y al panel `SIGUIENTE` (según `CLAUDE.md`).

**Fuera de alcance (para futuras specs):**

- Sonido y música.
- Controles táctiles / móvil.
- Canvas HiDPI.
- Tema claro y selector de tema.
- Leyenda de controles dibujada en el canvas.
- Pieza de reserva (hold), rotación SRS y bolsa de 7 piezas.
- Portar Arkanoid u otros juegos.
- Renombrar el juego a Tetris (se mantiene `caida`).
- Auth, anti-trampas y Realtime (siguen fuera, como en SPEC 06).
- Modificar los archivos de `references/`.
- Tests automatizados.

---

## Modelo de datos

Estructuras en memoria; no hay persistencia nueva ni claves de `localStorage`.

```ts
// lib/games/caida/types.ts
export interface CaidaCallbacks {
  onScore: (score: number) => void;
  onLines: (lines: number) => void;
  onLevel: (level: number) => void;
  onGameOver: (score: number) => void; // una vez por partida
}

export interface CaidaHandle {
  setPaused: (paused: boolean) => void;
  destroy: () => void; // cancela rAF y quita listeners; idempotente
}

export interface Piece {
  type: number; // 1..8, índice en COLORS y PIECES
  shape: number[][];
  x: number;
  y: number;
}

// lib/games/caida/engine.ts
export function createCaida(
  canvas: HTMLCanvasElement,
  callbacks: CaidaCallbacks,
): CaidaHandle;
```

```ts
// lib/games/registry.ts
export interface HudStat {
  label: "Puntuación" | "Vidas" | "Líneas" | "Nivel";
  key: "score" | "lives" | "lines" | "level";
}
export interface GameRegistryEntry {
  Canvas: React.ComponentType<GameCanvasProps>;
  hud: HudStat[];
}
export const GAME_REGISTRY: Record<string, GameRegistryEntry>;
```

`GameCanvasProps` agrupa `paused` y los callbacks del juego (`onScore`, `onGameOver` y los opcionales `onLives`, `onLines`, `onLevel`) para que `GamePlayer` los pase a cualquier `Canvas` sin ramas por id.

Archivos del motor:

- `lib/games/caida/constants.ts`: `W = 800`, `H = 600`, `COLS = 10`, `ROWS = 20`, `BLOCK = 30`, `BOARD_X = 250`, `COLORS`, `PIECES`, `LINE_SCORES`, `GRID_COLOR`.
- `lib/games/caida/board.ts`: funciones puras sobre el tablero (`createBoard`, `collide`, `rotateCW`, `merge`, `clearLines`, `ghostY`), sin canvas ni DOM.
- `lib/games/caida/engine.ts`: estado, bucle, input, dibujo y callbacks.
- `lib/games/caida/types.ts`.

Fila de `games` (ya sembrada, solo cambia `playable`):

| id      | title | cat    | cover         | color   | playable | sort_order |
| ------- | ----- | ------ | ------------- | ------- | -------- | ---------- |
| `caida` | CAÍDA | PUZZLE | `cover-tetro` | magenta | true     | 2          |

Convenciones:

- Coordenadas con origen arriba a la izquierda; el tablero ocupa `x ∈ [250, 550)`, `y ∈ [0, 600)`.
- Puntos: `LINE_SCORES = [0, 100, 300, 500, 800]` por 0–4 líneas, multiplicados por el nivel; soft drop suma 1 por fila bajada y hard drop 2 por celda recorrida.
- Nivel: `floor(lines / 10) + 1`. Intervalo de caída: `max(100, 1000 − (nivel − 1) × 90)` ms.
- Wall kicks de rotación: desplazamientos `[0, -1, 1, -2, 2]` en x.
- Fin de partida: la pieza nueva colisiona al aparecer; `onGameOver(score)` se llama una vez.
- Los callbacks se llaman solo cuando el valor cambia, y una vez al arrancar (0 puntos, 0 líneas, nivel 1).
- El tiempo de caída se acumula con `dt` limitado a 0.05 s por fotograma; se descarta al reanudar.
- El canvas solo dibuja la rejilla, el tablero, la pieza fantasma (alpha 0.2), la pieza actual y `SIGUIENTE`; no dibuja puntuación, líneas, nivel, pausa ni game over.
- El motor ignora eventos de teclado cuyo `target` sea `input`, `textarea` o `select`.
- Tras `onGameOver` el motor no acepta input; el reinicio lo hace React montando un motor nuevo (`key` distinto).

---

## Plan de implementación

Antes de empezar: leer `node_modules/next/dist/docs/01-app` (Client Components) y aplicar `/ui-ux-pro-max` según `CLAUDE.md`.

1. Crear `lib/games/registry.ts` con los tipos `HudStat`, `GameRegistryEntry`, `GameCanvasProps` y la entrada `asteroides` (HUD: puntuación, vidas, nivel). Adaptar `components/games/asteroids-canvas.tsx` solo si hace falta para aceptar `GameCanvasProps`. Verificación: `npm run lint`.
2. Cambiar `components/game-player.tsx`: sustituir `isAsteroids` por `GAME_REGISTRY[game.id]`, pintar los `HudStat` de la entrada (estado `lines` nuevo) y conservar la arena simulada y el HUD aleatorio sin entrada. Verificación: `npm run dev`, `/juegos/asteroides/jugar` se comporta igual que antes y `/juegos/serpentina/jugar` sigue simulado.
3. Crear `lib/games/caida/constants.ts` y `types.ts`. Verificación: `npm run lint`.
4. Crear `lib/games/caida/board.ts` portando `createBoard`, `collide`, `rotateCW`, `merge`, `clearLines` y `ghostY`. Verificación: `npm run lint`.
5. Crear `lib/games/caida/engine.ts` con `createCaida`: pieza actual y siguiente, bucle `requestAnimationFrame`, input con `preventDefault`, soft y hard drop, wall kicks, `setPaused`, `destroy`, dibujo del tablero y de `SIGUIENTE`, y los cuatro callbacks. Verificación: `npm run lint`.
6. Crear `components/games/caida-canvas.tsx`: canvas 800×600, callbacks por ref, motor creado en un efecto `[]` y `paused` en un efecto aparte. Verificación: `npm run lint`.
7. Aplicar con MCP `apply_migration` la migración que pone `playable = true` en `caida` y guardarla en `supabase/migrations/`. Verificación: MCP `execute_sql` (`select id, playable from games where id = 'caida'`) y `get_advisors` sin alertas nuevas.
8. Añadir la entrada `caida` al registro (HUD: puntuación, líneas, nivel). Verificación: `npm run dev`, jugar `/juegos/caida/jugar`, guardar la puntuación y comprobar la fila en `scores` (MCP `execute_sql`) y en `/salon?juego=caida`.
9. Actualizar `CLAUDE.md` (registro `lib/games/registry.ts` y motor `lib/games/caida/`). Correr `npm run lint` y `npm run build`.

---

## Criterios de aceptación

- [ ] `npm run lint` y `npm run build` terminan sin errores.
- [ ] `/juegos/caida/jugar` muestra el canvas con el tablero de 10×20 centrado, el panel `SIGUIENTE` a la derecha y sin errores en la consola.
- [ ] El HUD de Caída muestra `Puntuación`, `Líneas` y `Nivel`, y no muestra `Vidas`; el de Asteroides conserva `Vidas`.
- [ ] `←` y `→` mueven la pieza, `↑` y `X` la rotan, `↓` la baja una fila y `Espacio` la deja caer; pulsarlas no hace scroll ni activa el botón enfocado.
- [ ] Aparecen las 8 piezas, incluida la tuerca `N` 3×3 de color gris.
- [ ] Rotar pegado a una pared aplica los wall kicks `[0, -1, 1, -2, 2]` y, si ninguno cabe, la pieza no gira.
- [ ] La pieza fantasma se dibuja con alpha 0.2 en la posición donde aterrizará la pieza actual.
- [ ] `SIGUIENTE` muestra exactamente la pieza que entra cuando la actual se fija.
- [ ] Limpiar 1, 2, 3 y 4 líneas suma 100, 300, 500 y 800 por el nivel actual.
- [ ] El soft drop suma 1 punto por fila y el hard drop 2 puntos por celda recorrida.
- [ ] El nivel sube cada 10 líneas y el intervalo de caída baja a `max(100, 1000 − (nivel − 1) × 90)` ms.
- [ ] Pulsar PAUSA congela la caída y la pieza, aparece "EN PAUSA" y las teclas no tienen efecto; REANUDAR continúa sin salto de movimiento.
- [ ] Al colisionar una pieza nueva al aparecer se abre el modal "FIN DEL JUEGO" con la puntuación del HUD y `onGameOver` se invoca una sola vez.
- [ ] Con el modal abierto, escribir espacios, flechas o `X` en el campo de iniciales no mueve ni rota la pieza.
- [ ] "GUARDAR PUNTUACIÓN" con nombre `abc` inserta en `scores` una fila con `game_id = 'caida'`, `name = 'ABC'`, la puntuación del HUD y `user_id` nulo (MCP `execute_sql`), y el botón muestra `PUNTUACIÓN GUARDADA_`.
- [ ] La puntuación guardada aparece en `/salon?juego=caida` y en `/juegos/caida` sin reiniciar el servidor, y no aparece en los demás juegos.
- [ ] `best` y `plays` de Caída se actualizan en el catálogo y en el detalle.
- [ ] "JUGAR DE NUEVO" arranca con 0 puntos, 0 líneas y nivel 1 sin duplicar listeners ni bucles (la velocidad de caída no cambia tras reiniciar).
- [ ] FIN abre el modal con la puntuación actual y la pieza deja de responder al teclado.
- [ ] Al salir con SALIR o navegar a otra ruta se cancelan el `requestAnimationFrame` y los listeners de teclado.
- [ ] `/juegos/asteroides/jugar` se juega igual que antes del registro, y `/juegos/serpentina/jugar` sigue con la arena simulada.
- [ ] En `public.games`, `caida` tiene `playable = true` y el resto de columnas no cambian; `get_advisors` (seguridad) no reporta alertas nuevas.
- [ ] `lib/games/caida/` no referencia `document` ni `window` fuera de `addEventListener`/`requestAnimationFrame`/`performance` y no importa React.
- [ ] El código no escribe en `localStorage` bajo `tetris-theme` ni en ninguna clave nueva.
- [ ] Ningún componente cliente importa `lib/supabase/server.ts` ni `lib/games-repo.ts`.

---

## Decisiones

- **Sí:** reutilizar la fila `caida` y poner `playable = true`. Mantiene URLs, portada y título; no hay que migrar rutas.
- **No:** crear una fila `tetris` ni renombrar el juego. Dejaría `caida` duplicado como juego simulado.
- **Sí:** registro por id en `lib/games/registry.ts`. SPEC 05 dejó anotado generalizar al llegar el segundo juego real; evita una rama `if` por juego.
- **Sí:** HUD configurable por entrada del registro. Caída no tiene vidas y mostrarlas fijas en 3 sería engañoso.
- **Sí:** canvas lógico 800×600 con el tablero centrado y `SIGUIENTE` dibujado dentro. Encaja en `.crt-screen` 4:3 y reutiliza el mismo wrapper que Asteroides, sin callback `onNext` ni canvas auxiliar.
- **No:** canvas de 300×600 con bandas y vista previa en el HUD de React.
- **Sí:** las 8 piezas del `game.js` (con la tuerca `N`), aunque el README del original diga 7. Es el comportamiento real del código de referencia.
- **Sí:** paleta original de piezas, sin recolorear con la paleta neón (mismo criterio que Asteroides).
- **Sí:** solo tema oscuro con color de rejilla constante, porque el motor no puede leer `--grid-line` del DOM.
- **No:** tema claro, tecla `P`, overlay DOM ni botón Reiniciar: la pausa y el reinicio son de `GamePlayer`.
- **Sí:** mantener el comportamiento original de puntuación (soft drop +1, hard drop +2 por celda) y de caída.
- **No:** sonido, táctil, HiDPI, hold, SRS ni bolsa de 7 piezas; cada uno iría en su propia spec.

---

## Riesgos

| Riesgo                                                                  | Mitigación                                                                                                                      |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| El registro rompe Asteroides al tocar `GamePlayer`                      | Pasos 1–2 aislados y verificados jugando Asteroides y un juego simulado antes de añadir Caída.                                  |
| React StrictMode duplica bucles/listeners en desarrollo                 | `destroy()` idempotente en el cleanup; verificar con `npm run dev` que la velocidad de caída no se duplica.                     |
| `dt` enorme tras reanudar o volver a la pestaña adelanta la caída       | Descartar el acumulado al reanudar y limitar `dt` a 0.05 s.                                                                     |
| Teclas pegadas tras pausar o al abrir el modal                          | `setPaused(true)` limpia el estado de teclas; el motor ignora `input`/`textarea`/`select` y deja de aceptar input en game over. |
| `Espacio` y las flechas hacen scroll o activan el botón enfocado        | `preventDefault` en `keydown` y `keyup` mientras el juego está activo y sin pausa.                                              |
| El autorepeat del teclado desborda el soft drop o el movimiento lateral | Se conserva el comportamiento del original (un movimiento por evento `keydown`).                                                |
| La puntuación supera el `CHECK` de 10.000.000 de `scores`               | Inalcanzable con esta puntuación; `submitScore` ya valida el rango y devuelve `invalid` si se excede.                           |

---

## Lo que **no** está en esta spec

- Sonido y música.
- Controles táctiles.
- Canvas HiDPI.
- Tema claro y selector de tema.
- Hold, SRS y bolsa de 7 piezas.
- Renombrar el juego a Tetris.
- Portar Arkanoid u otros juegos.
- Auth, anti-trampas y Realtime.
- Tests automatizados.

Cada uno de estos, si se aborda, va en su propia spec.
