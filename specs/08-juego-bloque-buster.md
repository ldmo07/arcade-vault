# SPEC 08 — Juego Bloque Buster (Arkanoid) en canvas con leaderboard

> **Status:** Aprobado
> **Depends on:** SPEC 05, SPEC 06, SPEC 07
> **Date:** 2026-10-16
> **Objective:** Portar `references/started-games/04-arkanoid` a un motor TypeScript en `lib/games/bloque-buster/`, montarlo en `/juegos/bloque-buster/jugar` con control por teclado y ratón, y guardar sus puntuaciones en el leaderboard de Supabase.

---

## Por qué existe esta spec

Asteroides (SPEC 05) y Caída (SPEC 07) son los dos juegos reales y ambos se controlan solo con teclado y dibujan con primitivas. Bloque Buster es el primero que usa **ratón** y **sprites** (una imagen cargada de forma asíncrona), y el primero que puede terminar por **victoria** además de por derrota. El registro `lib/games/registry.ts` ya existe (SPEC 07), así que esta spec solo añade una entrada.

---

## Alcance

**Dentro:**

- Motor en `lib/games/bloque-buster/` (`constants.ts`, `types.ts`, `levels.ts`, `sprites.ts`, `entities.ts`, `engine.ts`) portado de `game.js`, `levels.js` y `assets/spritesheet.js` a TypeScript estricto, con el contrato de `.claude/skills/add-game/references/game-contract.md`.
- Wrapper `components/games/bloque-buster-canvas.tsx`: carga el spritesheet y crea el motor cuando la imagen está lista.
- Entrada `bloque-buster` en `lib/games/registry.ts` con HUD `Puntuación`, `Vidas`, `Nivel`.
- Migración `supabase/migrations/<timestamp>_juego_bloque_buster.sql` (vía MCP `apply_migration`): `update public.games set playable = true where id = 'bloque-buster'`. La fila ya existe (`BLOQUE BUSTER`, `ARCADE`, `cyan`, `cover-bricks`, `sort_order` 1) y la portada `.cover-bricks` ya está en `app/globals.css`.
- Assets: `public/games/bloque-buster/spritesheet-breakout.png`, `ball-bounce.mp3` y `break-sound.mp3` (copias de los de `references/`; los sonidos van en `public/games/bloque-buster/sounds/`).
- Sonido: el motor notifica los eventos `onBounce` (rebote en pared o paleta) y `onBlockBreak` (bloque roto); el wrapper reproduce `ball-bounce.mp3` y `break-sound.mp3` con `Audio`. Sin tecla ni control de mute.
- Controles: `←` `→` mueven la paleta a 400 px/s y el movimiento del ratón sobre el canvas la sitúa centrada bajo el cursor. Gana la última entrada recibida.
- Mecánica del original: paleta de 81×14, bola de 16×16, bloques de 64×24 en una rejilla de 10 columnas con origen (80, 80), 3 vidas, 10 puntos por bloque, 5 niveles con velocidad ×1.00, ×1.10, ×1.21, ×1.33 y ×1.46, y animación de explosión de 4 frames (150 ms) al romper un bloque.
- HUD en React: `Puntuación`, `Vidas`, `Nivel`. Callbacks `onScore`, `onLives`, `onLevel`, `onGameOver`.
- Fin de partida: sin vidas, o al romper el último bloque del nivel 5 (victoria). Ambos casos llaman a `onGameOver(score)` y abren el modal "FIN DEL JUEGO".
- Guardado y ranking: sin código nuevo; usan `submitScore`, `getTopScores`, `/salon?juego=bloque-buster` y `/juegos/bloque-buster` de SPEC 06.
- Aplicar `/ui-ux-pro-max` al HUD de Vidas y al estado de carga del canvas (según `CLAUDE.md`).

**Se descarta del original:**

- HUD dibujado en el canvas (`Score`, `Nivel`, bolas de vidas): lo muestra `GamePlayer`.
- Overlays `GAME OVER`, `¡Completaste el juego!` y de pausa.
- Pausa propia (`P`, `Escape`) y selector "Saltar al nivel" con su `click` del canvas.
- La carga y reproducción de `Audio` dentro del motor: pasan al wrapper (el motor solo emite `onBounce` y `onBlockBreak`).
- Copia del spritesheet a un canvas intermedio con `document.createElement('canvas')`; se dibuja la imagen directamente.

**Fuera de alcance (para futuras specs):**

- Mute global, control de volumen y música (los efectos de sonido de esta spec no tienen control).
- Controles táctiles / móvil.
- Canvas HiDPI.
- Powerups, ángulo de rebote según el punto de la paleta, bloques de varios golpes (el original no los tiene).
- Selector de nivel o niveles editables.
- Auth, anti-trampas y Realtime (siguen fuera, como en SPEC 06).
- Modificar los archivos de `references/`.
- Tests automatizados.

---

## Modelo de datos

Estructuras en memoria; no hay persistencia nueva ni claves de `localStorage`.

```ts
// lib/games/bloque-buster/types.ts
export interface BloqueBusterCallbacks {
  onScore: (score: number) => void;
  onLives: (lives: number) => void;
  onLevel: (level: number) => void;
  onGameOver: (score: number) => void; // una vez por partida (derrota o victoria)
  onBounce?: () => void; // una llamada por rebote en pared o paleta
  onBlockBreak?: () => void; // bloque roto
}

export interface BloqueBusterHandle {
  setPaused: (paused: boolean) => void;
  destroy: () => void; // cancela rAF y quita listeners; idempotente
}

export type BlockColor =
  "red" | "yellow" | "cyan" | "magenta" | "hotpink" | "green" | "gray";

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface Block extends Rect {
  color: BlockColor;
  alive: boolean;
}
export interface Explosion extends Rect {
  color: BlockColor;
  elapsed: number;
} // ms
export interface Ball extends Rect {
  vx: number;
  vy: number;
}

export interface LevelDef {
  speed: number;
  blocks: { col: number; row: number; color: BlockColor }[];
}

// lib/games/bloque-buster/engine.ts
export function createBloqueBuster(
  canvas: HTMLCanvasElement,
  callbacks: BloqueBusterCallbacks,
  spritesheet: CanvasImageSource, // imagen ya cargada por el wrapper
): BloqueBusterHandle;
```

```tsx
// components/games/bloque-buster-canvas.tsx ("use client")
// Acepta GameCanvasProps de lib/games/registry.ts (paused, onScore, onGameOver, onLives, onLevel).
```

Archivos del motor:

- `constants.ts`: `W = 800`, `H = 600`, `PADDLE_SPEED = 400`, `PADDLE_W = 81`, `PADDLE_H = 14`, `PADDLE_Y = 560`, `BALL_SIZE = 16`, `BLOCK_COLS = 10`, `BLOCK_W = 64`, `BLOCK_H = 24`, `BLOCKS_ORIGIN_X = 80`, `BLOCKS_ORIGIN_Y = 80`, `BASE_BALL_VX = 200`, `BASE_BALL_VY = -300`, `POINTS_PER_BLOCK = 10`, `INITIAL_LIVES = 3`, `EXPLOSION_DURATION = 150`, `SPRITESHEET_URL = "/games/bloque-buster/spritesheet-breakout.png"`, `BOUNCE_SOUND_URL = "/games/bloque-buster/sounds/ball-bounce.mp3"`, `BREAK_SOUND_URL = "/games/bloque-buster/sounds/break-sound.mp3"`.
- `levels.ts`: `LEVELS: LevelDef[]` con los 5 patrones de `levels.js` (parrilla 10×6, pirámide, ajedrez, filas con huecos, marco + cruz) y sus velocidades.
- `sprites.ts`: tablas `SPRITES` y `EXPLOSION_FRAMES` de `spritesheet.js` (la explosión `gray` reutiliza los frames de `red`, como en el original) y `drawSprite(ctx, img, name, x, y, w, h)` / `drawFrame(...)`; sin carga de imagen.
- `entities.ts`: creación y actualización de paleta, bola, bloques y explosiones; `draw(ctx)` recibe el `ctx` por parámetro.
- `engine.ts`: estado, bucle, input, colisiones, dibujo y callbacks.

Convenciones:

- Coordenadas con origen arriba a la izquierda; velocidades en px/s; `dt` limitado a 0.05 s (el original no lo limita).
- Velocidad de la bola en el nivel `n`: `vx = 200 × LEVELS[n-1].speed`, `vy = -300 × LEVELS[n-1].speed`.
- Al cargar un nivel y al perder una vida la bola se coloca sobre la paleta y sale de inmediato (sin fase de saque), como en el original. Los bloques no se restauran al perder una vida.
- Una colisión de bola con bloque por fotograma (AABB): el bloque se marca `alive = false`, se invierte `vy`, suma 10 puntos y se encola una explosión.
- Rebote en la paleta solo con `vy > 0`; fija `vy = -|vy|` sin variar `vx`.
- Se pierde una vida cuando `ball.y > H`; con 0 vidas el motor llama a `onGameOver(score)`.
- Tope de puntuación: 208 bloques en total (60 + 40 + 30 + 39 + 39) × 10 = **2080 puntos**, muy por debajo del `CHECK` de 10.000.000 de `scores`.
- Los callbacks se llaman solo cuando el valor cambia, y una vez al arrancar (0 puntos, 3 vidas, nivel 1).
- El canvas solo dibuja fondo negro, bloques, explosiones, paleta y bola; no dibuja puntuación, vidas, nivel, pausa ni game over.
- Mientras `paused` es `true` el motor no actualiza, no procesa teclas ni ratón, sigue dibujando el último fotograma y descarta el `dt` acumulado al reanudar. `setPaused(true)` limpia las teclas pulsadas.
- El ratón se escucha en el propio `canvas` (`mousemove`); la posición se convierte con `rect = canvas.getBoundingClientRect()` y el factor `W / rect.width`, y la paleta se limita a `x ∈ [0, W − PADDLE_W]`.
- El motor ignora eventos de teclado cuyo `target` sea `input`, `textarea` o `select`; hace `preventDefault` (en `keydown` y `keyup`) de `←`, `→`, `↑`, `↓` y `Espacio` mientras el juego está activo y sin pausa.
- Tras `onGameOver` el motor no acepta input; el reinicio lo hace React montando un wrapper nuevo (`key` distinto).
- Contrato extendido: `createBloqueBuster` recibe un tercer parámetro (el spritesheet ya cargado) para que el motor no use `Image` ni `document`.
- Sonido: el motor no usa `Audio`; llama a `onBounce` por cada rebote en pared o paleta y a `onBlockBreak` al romper un bloque, y nunca en pausa ni tras `onGameOver`. El wrapper reproduce el sonido con un clon (`cloneNode()`) del `Audio` precargado, como el original, y ignora el rechazo de `play()` (política de autoplay del navegador).

Fila en `games` (ya sembrada, solo cambia `playable`):

| id              | title         | cat    | cover          | color | playable | sort_order |
| --------------- | ------------- | ------ | -------------- | ----- | -------- | ---------- |
| `bloque-buster` | BLOQUE BUSTER | ARCADE | `cover-bricks` | cyan  | true     | 1          |

---

## Plan de implementación

Antes de empezar: leer `node_modules/next/dist/docs/01-app` (Client Components, carpeta `public`) y aplicar `/ui-ux-pro-max` según `CLAUDE.md`. `lib/games/registry.ts` ya existe: no hay paso de creación del registro.

1. Copiar `references/started-games/04-arkanoid/assets/spritesheet-breakout.png` a `public/games/bloque-buster/spritesheet-breakout.png` (sin tocar `references/`). Verificación: `http://localhost:3000/games/bloque-buster/spritesheet-breakout.png` devuelve la imagen.
2. Crear `lib/games/bloque-buster/constants.ts` y `types.ts`. Verificación: `npm run lint`.
3. Crear `lib/games/bloque-buster/levels.ts` portando los 5 niveles de `levels.js`. Verificación: `npm run lint`.
4. Crear `lib/games/bloque-buster/sprites.ts` con las tablas de sprites y `drawSprite` / `drawFrame` recibiendo la imagen por parámetro. Verificación: `npm run lint`.
5. Crear `lib/games/bloque-buster/entities.ts` (paleta, bola, bloques, explosiones y sus `update`/`draw`). Verificación: `npm run lint`.
6. Crear `lib/games/bloque-buster/engine.ts` con `createBloqueBuster`: carga de nivel, bucle `requestAnimationFrame`, input de teclado y ratón con `preventDefault`, colisiones, vidas, victoria, `setPaused`, `destroy` y los cuatro callbacks. Verificación: `npm run lint`.
7. Crear `components/games/bloque-buster-canvas.tsx`: canvas 800×600 (`block h-full w-full`, `role="img"`, `aria-label="Juego Bloque Buster"`), carga de `SPRITESHEET_URL` con `new Image()` en un efecto `[]` con bandera de cancelación, creación del motor al terminar la carga, destrucción en el cleanup, callbacks por ref y efecto `[paused]`. Mientras carga, el canvas queda negro y los callbacks no se emiten. Verificación: `npm run lint`.
8. Aplicar con MCP `apply_migration` la migración `playable = true` para `bloque-buster` y guardarla en `supabase/migrations/<timestamp>_juego_bloque_buster.sql`. Verificación: MCP `execute_sql` (`select id, playable from games where id = 'bloque-buster'`) y `get_advisors` sin alertas nuevas.
9. Añadir la entrada `bloque-buster` a `GAME_REGISTRY` en `lib/games/registry.ts` (HUD: puntuación, vidas, nivel). Verificación: `npm run dev`, jugar `/juegos/bloque-buster/jugar`, guardar la puntuación y comprobar la fila en `scores` (MCP `execute_sql`) y en `/salon?juego=bloque-buster`.
10. Actualizar `CLAUDE.md` (juegos jugables: añadir `bloque-buster` con HUD Puntuación, Vidas, Nivel; motor con spritesheet en `public/games/bloque-buster/`). Correr `npm run lint` y `npm run build`.
11. (Añadido tras la implementación inicial) Copiar `ball-bounce.mp3` y `break-sound.mp3` de `references/started-games/04-arkanoid/assets/sounds/` a `public/games/bloque-buster/sounds/`. Añadir `onBounce` y `onBlockBreak` opcionales a `BloqueBusterCallbacks`, las constantes `BOUNCE_SOUND_URL` y `BREAK_SOUND_URL`, hacer que `updateBall` devuelva el número de rebotes y emitir los dos eventos desde `engine.ts`. Verificación: `npm run lint`.
12. En `components/games/bloque-buster-canvas.tsx` precargar los dos `Audio`, reproducirlos con `cloneNode()` desde `onBounce` y `onBlockBreak` (ignorando el rechazo de `play()`) y liberarlos en el cleanup. Actualizar `CLAUDE.md` (el wrapper reproduce los sonidos). Verificación: `npm run dev`, al jugar suenan el rebote y la rotura, y `npm run lint` y `npm run build` terminan sin errores.

---

## Criterios de aceptación

- [ ] `npm run lint` y `npm run build` terminan sin errores.
- [ ] `/juegos/bloque-buster/jugar` muestra el canvas con 60 bloques en el nivel 1, la paleta centrada, la bola en movimiento y sin errores en la consola.
- [ ] El HUD muestra `Puntuación`, `Vidas` y `Nivel` alimentados por los callbacks, con valores iniciales 0, 3 y 1.
- [ ] `←` y `→` mueven la paleta a 400 px/s sin salirse de `[0, 719]`; el ratón sobre el canvas la centra bajo el cursor (también con el canvas escalado por CSS) y también queda limitada.
- [ ] Pulsar `←`, `→`, `↑`, `↓` o `Espacio` no hace scroll ni activa el botón enfocado.
- [ ] Romper un bloque suma exactamente 10 puntos, muestra la explosión de 4 frames durante 150 ms y la bola invierte `vy`.
- [ ] La bola rebota en las paredes izquierda, derecha y superior, y en la paleta solo cuando baja.
- [ ] Dejar caer la bola resta una vida, el HUD lo refleja, la bola reaparece sobre la paleta y los bloques rotos siguen rotos.
- [ ] Al romper el último bloque de un nivel el nivel sube en 1, el HUD lo muestra, se carga el patrón siguiente y la velocidad inicial de la bola es `×speed` del nivel (1.00, 1.10, 1.21, 1.33, 1.46).
- [ ] Los 5 patrones tienen 60, 40, 30, 39 y 39 bloques respectivamente.
- [ ] Al llegar a 0 vidas se abre el modal "FIN DEL JUEGO" con la puntuación del HUD y `onGameOver` se invoca una sola vez.
- [ ] Al romper el último bloque del nivel 5 se abre el mismo modal con la puntuación final (≤ 2080) y `onGameOver` se invoca una sola vez.
- [ ] Pulsar PAUSA congela la bola, las explosiones y la paleta, aparece "EN PAUSA", y ni teclas ni ratón mueven la paleta; REANUDAR continúa sin salto de movimiento.
- [ ] El canvas no dibuja puntuación, vidas, nivel, "PAUSA", "GAME OVER" ni selector de nivel; `P` y `Escape` no pausan.
- [ ] Con el modal abierto, escribir espacios, flechas o mover el ratón sobre el canvas no mueve la paleta.
- [ ] "GUARDAR PUNTUACIÓN" con nombre `abc` inserta en `scores` una fila con `game_id = 'bloque-buster'`, `name = 'ABC'`, la puntuación del HUD y `user_id` nulo (MCP `execute_sql`), y el botón muestra `PUNTUACIÓN GUARDADA_`.
- [ ] La puntuación guardada aparece en `/salon?juego=bloque-buster` y en `/juegos/bloque-buster` sin reiniciar el servidor, y no aparece en los demás juegos.
- [ ] `best` y `plays` de Bloque Buster se actualizan en el catálogo y en el detalle.
- [ ] "JUGAR DE NUEVO" arranca con 0 puntos, 3 vidas y nivel 1, sin duplicar listeners ni bucles (la velocidad de la bola no cambia tras reiniciar).
- [ ] FIN abre el modal con la puntuación actual y la paleta deja de responder a teclado y ratón.
- [ ] Al salir con SALIR o navegar a otra ruta se cancelan el `requestAnimationFrame` y los listeners de teclado y ratón.
- [ ] Cada rebote de la bola en una pared o en la paleta reproduce `ball-bounce.mp3` y cada bloque roto reproduce `break-sound.mp3`; no suena nada en pausa ni tras el fin de partida.
- [ ] `/games/bloque-buster/sounds/ball-bounce.mp3` y `/games/bloque-buster/sounds/break-sound.mp3` devuelven el audio (HTTP 200).
- [ ] Si un sonido no se puede reproducir (autoplay bloqueado o archivo ausente), el juego sigue funcionando sin excepciones no controladas.
- [ ] Si el spritesheet falla al cargar, el canvas queda negro y no se emite ningún callback ni se crea el motor, sin excepciones no controladas.
- [ ] `/juegos/asteroides/jugar` y `/juegos/caida/jugar` se juegan igual que antes, y `/juegos/serpentina/jugar` sigue con la arena simulada.
- [ ] En `public.games`, `bloque-buster` tiene `playable = true` y el resto de columnas no cambian; `get_advisors` (seguridad) no reporta alertas nuevas.
- [ ] `lib/games/bloque-buster/` no importa React y no referencia `document`, `window`, `Image` ni `Audio` (el sonido se reproduce en el wrapper); solo usa `addEventListener`, `requestAnimationFrame` y `performance`.
- [ ] El código no usa `localStorage` ni claves nuevas.
- [ ] Ningún componente cliente importa `lib/supabase/server.ts` ni `lib/games-repo.ts`.

---

## Decisiones

- **Sí:** reutilizar la fila `bloque-buster` y poner `playable = true`. Mantiene URLs, portada y título; no hay que migrar rutas.
- **No:** crear una fila `arkanoid`. Dejaría `bloque-buster` duplicado como juego simulado.
- **Sí:** solo añadir una entrada al registro de SPEC 07. El tipo `GameCanvasProps` ya incluye `onLives` y `onLevel`.
- **Sí:** copiar el spritesheet a `public/games/bloque-buster/`. Fidelidad al original y alcance de assets decidido por el usuario.
- **Sí:** el wrapper carga la imagen y se la pasa al motor como tercer parámetro. Así el motor sigue sin `Image`/`document` y el contrato del resto de reglas se mantiene; es la única extensión de firma respecto a `game-contract.md`.
- **No:** el offscreen canvas del original. No aporta nada al dibujar con `drawImage` directo.
- **Sí:** ratón dentro del alcance (`mousemove` sobre el canvas, con conversión de escala). Es el control principal del original.
- **Sí:** sonido dentro del alcance, añadido tras la implementación inicial a petición del usuario: los dos efectos del original (`ball-bounce.mp3`, `break-sound.mp3`).
- **Sí:** el motor emite eventos (`onBounce`, `onBlockBreak`) y el wrapper reproduce el audio. Mantiene el motor sin `Audio` y sirve de plantilla para otros juegos.
- **No:** mute global ni control de volumen. Quedan para una spec propia que sirva a todos los juegos.
- **Sí:** reproducir con `cloneNode()` como el original, para permitir sonidos solapados, e ignorar el rechazo de `play()`.
- **Sí:** la victoria del nivel 5 llama a `onGameOver(score)` y reutiliza el modal de guardado. Evita un overlay y un callback propios.
- **No:** reiniciar en bucle tras el nivel 5.
- **Sí:** conservar la física del original (rebote de paleta sin ángulo, bola sin fase de saque, un bloque por fotograma). No se cambia el gameplay.
- **Sí:** limitar `dt` a 0.05 s aunque el original no lo hace. Evita tunelado de la bola y saltos tras pausar.
- **No:** HUD, overlays, pausa propia (`P`/`Escape`) ni selector de nivel dentro del canvas. Los sustituye `GamePlayer`.
- **Sí:** estética del original (sprites y fondo negro), sin recolorear con la paleta neón. Mismo criterio que SPEC 05 y 07.

---

## Riesgos

| Riesgo                                                                       | Mitigación                                                                                                               |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| React StrictMode monta dos veces el efecto y la imagen carga tras el cleanup | Bandera `cancelled` en el efecto: si el cleanup corre antes de `onload`, no se crea el motor; `destroy()` idempotente.   |
| El spritesheet no carga (ruta o red)                                         | `onerror` deja el canvas negro, no emite callbacks y no lanza; criterio de aceptación explícito.                         |
| El ratón se desalinea cuando `.crt-screen` escala el canvas                  | Conversión con `getBoundingClientRect()` y `W / rect.width`, como en el original.                                        |
| La paleta salta al reanudar si el ratón se movió durante la pausa            | Los `mousemove` se ignoran en pausa; la paleta se recoloca con el primer movimiento posterior.                           |
| `dt` enorme tras reanudar o volver a la pestaña hace atravesar bloques       | Descartar el acumulado al reanudar y limitar `dt` a 0.05 s.                                                              |
| Teclas pegadas tras pausar o al abrir el modal                               | `setPaused(true)` limpia las teclas; el motor ignora `input`/`textarea`/`select` y deja de aceptar input tras game over. |
| La victoria dispara `onGameOver` dos veces (último bloque + pérdida de bola) | Estado `gameState` interno: tras `win` o `gameover` el bucle deja de actualizar y el callback se emite una sola vez.     |
| La bola puede quedar en un bucle horizontal sin bajar                        | Se conserva el original (`vy` nunca es 0); no se cambia la física en esta spec.                                          |
| Puntuación fuera del `CHECK` de `scores`                                     | Máximo 2080 puntos; `submitScore` ya valida el rango.                                                                    |
| El navegador bloquea el audio hasta que hay una interacción del usuario      | Se captura el rechazo de `play()`; el juego empieza tras pulsar en la página y la primera interacción lo desbloquea.     |
| Clones de `Audio` acumulados por rebotes frecuentes                          | Los clones se liberan solos al terminar; el motor emite un evento por rebote, no uno por fotograma.                      |

---

## Lo que **no** está en esta spec

- Mute global, volumen y música.
- Controles táctiles.
- Canvas HiDPI.
- Powerups, rebote angular y bloques de varios golpes.
- Selector de nivel y niveles editables.
- Auth, anti-trampas y Realtime.
- Tests automatizados.

Cada uno de estos, si se aborda, va en su propia spec.
