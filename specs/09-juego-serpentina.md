# SPEC 09 — Juego Serpentina (Snake) en canvas con leaderboard

> **Status:** Aprobado
> **Depends on:** SPEC 05, SPEC 06, SPEC 07, SPEC 08
> **Date:** 2026-10-16
> **Objective:** Crear Snake como motor TypeScript en `lib/games/serpentina/` con frutas pixel-art de `references/source-assets/snake-assets/`, montarlo en `/juegos/serpentina/jugar` y guardar sus puntuaciones en el leaderboard de Supabase.

---

## Por qué existe esta spec

Serpentina es el primer juego **sin referencia en `references/started-games/`**: el motor se diseña desde cero con las reglas de esta spec. Es también el primero con movimiento **por pasos de rejilla** (tick fijo en vez de física continua) y el primero con **sonido sintetizado** (Web Audio, sin archivos). El registro `lib/games/registry.ts` ya existe (SPEC 07) y el patrón "motor emite eventos, wrapper reproduce sonido" y "wrapper carga el spritesheet" ya los fijó SPEC 08.

---

## Alcance

**Dentro:**

- Motor en `lib/games/serpentina/` (`constants.ts`, `types.ts`, `sprites.ts`, `entities.ts`, `engine.ts`) con el contrato de `.claude/skills/add-game/references/game-contract.md`.
- Wrapper `components/games/serpentina-canvas.tsx`: carga `fruits.png`, crea el motor al terminar la carga y reproduce el sonido.
- Sonido sintetizado con Web Audio en el wrapper (sin archivos de audio), disparado por los eventos `onEat` y `onCrash` del motor.
- Entrada `serpentina` en `lib/games/registry.ts` con HUD `Puntuación`, `Nivel`.
- Migración `supabase/migrations/<timestamp>_juego_serpentina.sql` (vía MCP `apply_migration`): `update public.games set playable = true where id = 'serpentina'`. La fila ya existe (`SERPENTINA`, `ARCADE`, `cover-snake`, `green`, `sort_order` 3) y la portada `.cover-snake` ya está en `app/globals.css`.
- Asset: `public/games/serpentina/fruits.png` (copia de `references/source-assets/snake-assets/fruits.png`, 3790×442, fondo transparente).
- Rejilla de 20×15 celdas de 40 px sobre el canvas 800×600. Serpiente de 3 celdas al arrancar, cabeza en la celda (6, 7) mirando a la derecha.
- Controles: `↑` `↓` `←` `→` y `W` `A` `S` `D`. La serpiente no se mueve hasta la primera dirección válida (`↑`, `↓` o `→`; `←` se ignora porque sería un giro de 180°). Después, los giros de 180° se ignoran y se encolan como máximo 2 giros por tick.
- Mecánica: la serpiente avanza una celda por tick; comer la fruta suma 10 puntos y la alarga una celda; hay una sola fruta a la vez, en una celda libre al azar.
- Progresión: nivel = `1 + floor(frutas / 5)`; el tick dura `max(70, 140 − 10 × (nivel − 1))` ms.
- Fin de partida: choque con pared o con el propio cuerpo (derrota), o tablero lleno sin celdas libres (victoria). Ambos llaman a `onGameOver(score)` una sola vez y abren el modal "FIN DEL JUEGO".
- HUD en React: `Puntuación`, `Nivel`. Callbacks `onScore`, `onLevel`, `onGameOver`; eventos opcionales `onEat`, `onCrash`.
- Estilo visual: tablero ajedrezado verde y serpiente azul redondeada con ojos, dibujados con primitivas del canvas al estilo del Snake de Google; frutas pixel-art de la fila mediana de `fruits.png`.
- Guardado y ranking: sin código nuevo; usan `submitScore`, `getTopScores`, `/salon?juego=serpentina` y `/juegos/serpentina` de SPEC 06.
- Aplicar `/ui-ux-pro-max` al estado de carga del canvas y al HUD de Nivel (según `CLAUDE.md`).

**Se toma del template `references/source-assets/snake-assets/`:**

- `fruits.png` (hoja de 3790×442 con tres filas de frutas; se usa solo la fila mediana, pixel-art, `y = 136`, alto 160).
- Las 22 coordenadas de `sprites.js` (`banana`, `orange`, `grape`, `garlic`, `eggplant`, `strawberry`, `cherry`, `carrot`, `mushroom`, `broccoli`, `watermelon`, `pepper`, `kiwi`, `lemon`, `peach`, `peanut`, `apple`, `tomato`, `berries`, `grapes2`, `pineapple`, `melon`), portadas a la tabla `FRUITS` de `sprites.ts`.

**Se descarta del template:**

- `window.SPRITE_ATLAS` y la clave `sources` (el motor no usa `window`); la ruta de la imagen pasa a `SPRITESHEET_URL`.
- Las filas superior (suave) e inferior (realista) de `fruits.png`: `sprites.js` no tiene sus coordenadas.

**Fuera de alcance (para futuras specs):**

- Sonido por archivos, música, mute global y control de volumen.
- Controles táctiles (swipe) y ratón.
- Canvas HiDPI.
- Movimiento suave entre celdas, obstáculos, frutas especiales, modos de juego y selector de dificultad.
- Auth, anti-trampas y Realtime (siguen fuera, como en SPEC 06).
- Modificar los archivos de `references/`.
- Tests automatizados.

---

## Modelo de datos

Estructuras en memoria; no hay persistencia nueva ni claves de `localStorage`.

```ts
// lib/games/serpentina/types.ts
export interface SerpentinaCallbacks {
  onScore: (score: number) => void;
  onLevel: (level: number) => void;
  onGameOver: (score: number) => void; // una vez por partida (derrota o victoria)
  onEat?: () => void; // una llamada por fruta comida
  onCrash?: () => void; // una llamada al chocar, justo antes de onGameOver
}

export interface SerpentinaHandle {
  setPaused: (paused: boolean) => void;
  destroy: () => void; // cancela rAF y quita listeners; idempotente
}

export type Direction = "up" | "down" | "left" | "right";
export interface Cell {
  col: number;
  row: number;
}
export interface Fruit extends Cell {
  sprite: FruitName;
}

export type FruitName =
  | "banana"
  | "orange"
  | "grape"
  | "garlic"
  | "eggplant"
  | "strawberry"
  | "cherry"
  | "carrot"
  | "mushroom"
  | "broccoli"
  | "watermelon"
  | "pepper"
  | "kiwi"
  | "lemon"
  | "peach"
  | "peanut"
  | "apple"
  | "tomato"
  | "berries"
  | "grapes2"
  | "pineapple"
  | "melon";

export interface SpriteRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

// lib/games/serpentina/engine.ts
export function createSerpentina(
  canvas: HTMLCanvasElement,
  callbacks: SerpentinaCallbacks,
  spritesheet: CanvasImageSource, // fruits.png ya cargada por el wrapper
): SerpentinaHandle;
```

```tsx
// components/games/serpentina-canvas.tsx ("use client")
// Acepta GameCanvasProps de lib/games/registry.ts (paused, onScore, onGameOver, onLevel).
```

Archivos del motor:

- `constants.ts`: `W = 800`, `H = 600`, `COLS = 20`, `ROWS = 15`, `CELL = 40`, `INITIAL_LENGTH = 3`, `START_CELL = { col: 6, row: 7 }`, `BASE_TICK_MS = 140`, `TICK_STEP_MS = 10`, `MIN_TICK_MS = 70`, `FRUITS_PER_LEVEL = 5`, `POINTS_PER_FRUIT = 10`, `MAX_QUEUED_TURNS = 2`, `SPRITESHEET_URL = "/games/serpentina/fruits.png"`, colores del tablero (`#aad751`, `#a2d149`), de la serpiente (`#4674e9`) y de los ojos.
- `sprites.ts`: tabla `FRUITS: Record<FruitName, SpriteRect>` con las 22 coordenadas de `sprites.js` y `drawFruit(ctx, img, name, cell)`; sin carga de imagen.
- `entities.ts`: creación y avance de la serpiente, cola de giros, colocación de la fruta en una celda libre, comprobación de choques y `draw(ctx)` del tablero, serpiente y fruta (el `ctx` entra por parámetro).
- `engine.ts`: estado, bucle, acumulador de tick, input, niveles, callbacks y `setPaused`/`destroy`.

Convenciones:

- Coordenadas de celda con origen arriba a la izquierda; `col ∈ [0, 19]`, `row ∈ [0, 14]`; píxeles = celda × `CELL`.
- Bucle `requestAnimationFrame` con `dt` limitado a 0.05 s. La lógica avanza cuando el acumulador supera la duración del tick; como el tick mínimo (70 ms) es mayor que el `dt` máximo (50 ms), hay como mucho un paso por fotograma.
- El nivel se calcula con las frutas comidas: `level = 1 + floor(eaten / FRUITS_PER_LEVEL)`; `onLevel` se llama solo cuando cambia. Nivel 8 alcanza el tick mínimo de 70 ms.
- Al comer, la cola no se retira en ese tick (la serpiente crece una celda). La nueva fruta se elige al azar entre las celdas libres, con un sprite al azar de `FRUITS`.
- Colisión: tras calcular la nueva cabeza, se comprueba pared (`col`/`row` fuera de rango) y cuerpo. La celda que ocupa la cola en ese tick cuenta como libre salvo que la serpiente coma (la cola no se retira).
- Giros: cada pulsación válida se encola respecto a la última dirección encolada (no a la actual), de modo que dos giros rápidos dentro de un tick no producen un 180°.
- Dibujo de la fruta: se escala con `scale = min(CELL / w, CELL / h)` sobre el recorte `FRUITS[name]`, centrada en la celda, con `ctx.imageSmoothingEnabled = false`.
- Mientras la serpiente espera la primera dirección, el canvas dibuja un chevron blanco semitransparente en la celda delante de la cabeza (elemento del mundo, no texto) y el acumulador no avanza.
- Tope de puntuación: 300 celdas − 3 iniciales = 297 frutas × 10 = **2970 puntos**, muy por debajo del `CHECK` de 10.000.000 de `scores`.
- Los callbacks se llaman solo cuando el valor cambia, y una vez al arrancar (0 puntos, nivel 1).
- El canvas solo dibuja tablero, serpiente, fruta y el chevron de arranque; no dibuja puntuación, nivel, pausa ni game over.
- Mientras `paused` es `true` el motor no actualiza ni procesa teclas, sigue dibujando el último fotograma y descarta el acumulador y `dt` al reanudar. `setPaused(true)` vacía la cola de giros.
- El motor ignora eventos de teclado cuyo `target` sea `input`, `textarea` o `select`; hace `preventDefault` (en `keydown` y `keyup`) de `↑` `↓` `←` `→`, `Espacio` y `W` `A` `S` `D` mientras el juego está activo y sin pausa. Las teclas se leen con `e.code` (`ArrowUp`, `KeyW`, …).
- Tras `onGameOver` el motor no acepta input; el reinicio lo hace React montando un wrapper nuevo (`key` distinto).
- Contrato extendido (igual que SPEC 08): `createSerpentina` recibe el spritesheet como tercer parámetro para que el motor no use `Image` ni `document`.
- Sonido: el motor no usa `Audio` ni `AudioContext`; llama a `onEat` al comer y a `onCrash` al chocar (justo antes de `onGameOver`), y nunca en pausa. En la victoria por tablero lleno se llama a `onEat` por la última fruta y no a `onCrash`.
- Sonido del wrapper: un `AudioContext` creado de forma perezosa en el primer evento (la primera pulsación de flecha ya es un gesto del usuario); `onEat` = onda `square` de 660 Hz a 880 Hz en 90 ms; `onCrash` = onda `sawtooth` de 220 Hz a 80 Hz en 300 ms; ganancia 0,08 con rampa a 0. Los errores de `AudioContext` se ignoran y el contexto se cierra en el cleanup.

Fila en `games` (ya sembrada, solo cambia `playable`):

| id           | title      | cat    | cover         | color | playable | sort_order |
| ------------ | ---------- | ------ | ------------- | ----- | -------- | ---------- |
| `serpentina` | SERPENTINA | ARCADE | `cover-snake` | green | true     | 3          |

---

## Plan de implementación

Antes de empezar: leer `node_modules/next/dist/docs/01-app` (Client Components, carpeta `public`) y aplicar `/ui-ux-pro-max` según `CLAUDE.md`. `lib/games/registry.ts` ya existe: no hay paso de creación del registro.

1. Copiar `references/source-assets/snake-assets/fruits.png` a `public/games/serpentina/fruits.png` (sin tocar `references/`). Verificación: `http://localhost:3000/games/serpentina/fruits.png` devuelve la imagen.
2. Crear `lib/games/serpentina/constants.ts` y `types.ts`. Verificación: `npm run lint`.
3. Crear `lib/games/serpentina/sprites.ts` con la tabla `FRUITS` (22 entradas portadas de `sprites.js`) y `drawFruit`. Verificación: `npm run lint`.
4. Crear `lib/games/serpentina/entities.ts` (serpiente, cola de giros, fruta, colisiones, dibujo). Verificación: `npm run lint`.
5. Crear `lib/games/serpentina/engine.ts` con `createSerpentina`: espera de la primera dirección, bucle con acumulador de tick, input con `preventDefault`, niveles, fin por choque o tablero lleno, `setPaused`, `destroy` y los callbacks. Verificación: `npm run lint`.
6. Crear `components/games/serpentina-canvas.tsx`: canvas 800×600 (`block h-full w-full`, `role="img"`, `aria-label="Juego Serpentina"`), carga de `SPRITESHEET_URL` con `new Image()` en un efecto `[]` con bandera de cancelación, creación del motor al terminar la carga, destrucción en el cleanup, callbacks por ref, efecto `[paused]` y sonido con Web Audio desde `onEat` y `onCrash`. Mientras carga, el canvas queda con el fondo del tablero y los callbacks no se emiten. Verificación: `npm run lint`.
7. Aplicar con MCP `apply_migration` la migración `playable = true` para `serpentina` y guardarla en `supabase/migrations/<timestamp>_juego_serpentina.sql`. Verificación: MCP `execute_sql` (`select id, playable from games where id = 'serpentina'`) y `get_advisors` sin alertas nuevas.
8. Añadir la entrada `serpentina` a `GAME_REGISTRY` en `lib/games/registry.ts` (HUD: puntuación, nivel). Verificación: `npm run dev`, jugar `/juegos/serpentina/jugar`, guardar la puntuación y comprobar la fila en `scores` (MCP `execute_sql`) y en `/salon?juego=serpentina`.
9. Actualizar `CLAUDE.md` (juegos jugables: añadir `serpentina` con HUD Puntuación, Nivel; motor por pasos de rejilla, frutas en `public/games/serpentina/` y sonido sintetizado en el wrapper). Correr `npm run lint` y `npm run build`.

---

## Criterios de aceptación

- [ ] `npm run lint` y `npm run build` terminan sin errores.
- [ ] `/juegos/serpentina/jugar` muestra el tablero ajedrezado de 20×15 celdas, la serpiente de 3 celdas con la cabeza en (6, 7), una fruta pixel-art y sin errores en la consola.
- [ ] El HUD muestra `Puntuación` y `Nivel` alimentados por los callbacks, con valores iniciales 0 y 1, y no muestra `Vidas`.
- [ ] La serpiente no se mueve hasta pulsar `↑`, `↓` o `→` (o `W`, `S`, `D`); `←`/`A` antes de arrancar se ignora.
- [ ] `↑↓←→` y `WASD` giran la serpiente; un giro de 180° se ignora, también al pulsar dos giros dentro de un mismo tick.
- [ ] Pulsar `↑`, `↓`, `←`, `→` o `Espacio` no hace scroll ni activa el botón enfocado.
- [ ] Comer una fruta suma exactamente 10 puntos, alarga la serpiente una celda y coloca otra fruta en una celda libre.
- [ ] Las frutas se dibujan con el recorte de la fila mediana de `fruits.png`, proporcionadas (sin estirar) y sin suavizado.
- [ ] El nivel sube en 1 cada 5 frutas; el HUD lo refleja; el tick es 140, 130, 120 … ms y no baja de 70 ms.
- [ ] Chocar con cualquier pared o con el propio cuerpo abre el modal "FIN DEL JUEGO" con la puntuación del HUD y `onGameOver` se invoca una sola vez.
- [ ] Al llenar las 300 celdas se abre el mismo modal con la puntuación final (≤ 2970) y `onGameOver` se invoca una sola vez.
- [ ] Pulsar PAUSA congela la serpiente y aparece "EN PAUSA"; las teclas no tienen efecto; REANUDAR continúa sin salto ni tick doble.
- [ ] El canvas no dibuja puntuación, nivel, "PAUSA" ni "GAME OVER".
- [ ] Con el modal abierto, escribir en el campo de iniciales (incluidas `W` `A` `S` `D` y las flechas) no mueve la serpiente.
- [ ] Comer una fruta reproduce el bip de `onEat`; chocar reproduce el de `onCrash`; no suena nada en pausa ni tras el fin de partida.
- [ ] Si `AudioContext` no existe o falla, el juego sigue funcionando sin excepciones no controladas.
- [ ] "GUARDAR PUNTUACIÓN" con nombre `abc` inserta en `scores` una fila con `game_id = 'serpentina'`, `name = 'ABC'`, la puntuación del HUD y `user_id` nulo (MCP `execute_sql`), y el botón muestra `PUNTUACIÓN GUARDADA_`.
- [ ] La puntuación guardada aparece en `/salon?juego=serpentina` y en `/juegos/serpentina` sin reiniciar el servidor, y no aparece en los demás juegos.
- [ ] `best` y `plays` de Serpentina se actualizan en el catálogo y en el detalle.
- [ ] "JUGAR DE NUEVO" arranca con 0 puntos, nivel 1 y la serpiente esperando la primera dirección, sin duplicar listeners ni bucles (el tick no se acelera tras reiniciar).
- [ ] FIN abre el modal con la puntuación actual y la serpiente deja de responder al teclado.
- [ ] Al salir con SALIR o navegar a otra ruta se cancelan el `requestAnimationFrame` y los listeners de teclado.
- [ ] Si `fruits.png` falla al cargar, no se crea el motor ni se emite ningún callback, sin excepciones no controladas.
- [ ] `/juegos/asteroides/jugar`, `/juegos/caida/jugar` y `/juegos/bloque-buster/jugar` se juegan igual que antes, y `/juegos/gloton/jugar` sigue con la arena simulada.
- [ ] En `public.games`, `serpentina` tiene `playable = true` y el resto de columnas no cambian; `get_advisors` (seguridad) no reporta alertas nuevas.
- [ ] `lib/games/serpentina/` no importa React y no referencia `document`, `window`, `Image`, `Audio` ni `AudioContext`; solo usa `addEventListener`, `requestAnimationFrame` y `performance`.
- [ ] El código no usa `localStorage` ni claves nuevas.
- [ ] Ningún componente cliente importa `lib/supabase/server.ts` ni `lib/games-repo.ts`.

---

## Decisiones

- **Sí:** reutilizar la fila `serpentina` y poner `playable = true`. Mantiene URLs, portada `cover-snake` y título; no hay que migrar rutas.
- **No:** crear una fila `snake`. Dejaría `serpentina` duplicada como juego simulado.
- **Sí:** solo añadir una entrada al registro de SPEC 07; el HUD declara solo `score` y `level`.
- **Sí:** rejilla 20×15 de 40 px. Encaja exacto en 800×600 (4:3, `.crt-screen`) y deja las frutas con tamaño legible.
- **No:** rejilla de 25 px ni movimiento suave en píxeles. Más superficie de bugs sin aportar al objetivo.
- **Sí:** movimiento por ticks con acumulador y `dt` limitado a 0.05 s. Como el tick mínimo es 70 ms, nunca hay más de un paso por fotograma.
- **Sí:** morir al chocar con pared o cuerpo, sin vidas, como el Snake de Google.
- **No:** atravesar paredes ni 3 vidas. Cambiarían el gameplay y el HUD.
- **Sí:** esperar la primera dirección antes de moverse, con un chevron en el canvas como indicación. Sin fase de saque la serpiente chocaría sin dar tiempo a reaccionar, y el canvas no puede mostrar texto.
- **Sí:** 10 puntos fijos por fruta y nivel cada 5 frutas con tick decreciente. Sencillo y con tope de 2970.
- **No:** puntos × nivel. Complica el tope sin aportar al objetivo.
- **Sí:** la victoria por tablero lleno llama a `onGameOver(score)` y reutiliza el modal de guardado, como SPEC 08.
- **Sí:** fila mediana (pixel-art) de `fruits.png`; es la única con coordenadas en `sprites.js`.
- **Sí:** escalar la fruta con `min(CELL / w, CELL / h)` (cabe en la celda sin deformarse; el kiwi, de 170×160, queda algo más pequeño) con `imageSmoothingEnabled = false`.
- **No:** estirar a 40×40. Deformaría frutas anchas.
- **Sí:** tablero y serpiente con primitivas del canvas al estilo Google Snake (verde y azul), no con la paleta neón: `fruits.png` solo trae frutas. Mismo criterio de fidelidad que SPEC 05, 07 y 08.
- **Sí:** el wrapper carga la imagen y se la pasa al motor como tercer parámetro (extensión de firma ya aceptada en SPEC 08).
- **Sí:** sonido sintetizado con Web Audio en el wrapper; el motor emite `onEat` y `onCrash`. No hay archivos de audio en `references/` y evita licencias.
- **No:** `.mp3` ni sonido de subir de nivel. Cada uno va con su asset en otra spec.
- **No:** mute, volumen, música, táctil ni ratón. Cada uno va en su propia spec.
- **Sí:** teclas leídas con `e.code` para que `WASD` funcione con cualquier distribución de teclado.

---

## Riesgos

| Riesgo                                                                       | Mitigación                                                                                                               |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| React StrictMode monta dos veces el efecto y la imagen carga tras el cleanup | Bandera `cancelled` en el efecto: si el cleanup corre antes de `onload`, no se crea el motor; `destroy()` idempotente.   |
| `fruits.png` (3790×442) no carga o tarda                                     | `onerror` no crea el motor ni emite callbacks; el canvas muestra el tablero vacío; criterio de aceptación explícito.     |
| Giro de 180° por dos pulsaciones dentro de un tick                           | La cola de giros valida cada giro contra la última dirección encolada, con máximo 2 giros pendientes.                    |
| La cola de la serpiente se trata mal en el choque (falso positivo)           | La celda de la cola cuenta como libre salvo que se coma en ese tick; criterio de colisión explícito en las convenciones. |
| Tablero casi lleno: buscar celda libre al azar es lento o no termina         | Se elige al azar entre la lista de celdas libres (no por reintento); si la lista está vacía, victoria.                   |
| Teclas pegadas o giros encolados tras pausar o abrir el modal                | `setPaused(true)` vacía la cola; el motor ignora `input`/`textarea`/`select` y deja de aceptar input tras game over.     |
| `onGameOver` se dispara dos veces (choque + tablero lleno)                   | Estado `gameState` interno: tras `gameover` o `win` el bucle deja de actualizar y el callback se emite una sola vez.     |
| `AudioContext` bloqueado hasta un gesto del usuario                          | Se crea de forma perezosa en el primer evento (tras la primera flecha); los errores se capturan y el juego sigue.        |
| La fruta se ve deformada o borrosa                                           | Escala proporcional con `min(CELL / w, CELL / h)` y `imageSmoothingEnabled = false`.                                     |
| Puntuación fuera del `CHECK` de `scores`                                     | Máximo 2970 puntos; `submitScore` ya valida el rango.                                                                    |

---

## Lo que **no** está en esta spec

- Sonido por archivos, música, mute global y control de volumen.
- Controles táctiles y ratón.
- Canvas HiDPI.
- Movimiento suave, obstáculos, frutas especiales, modos de juego y dificultad seleccionable.
- Auth, anti-trampas y Realtime.
- Tests automatizados.

Cada uno de estos, si se aborda, va en su propia spec.
