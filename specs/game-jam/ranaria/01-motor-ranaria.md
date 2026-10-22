# Game jam — Ranaria (Frogger), spec 01: motor y wrapper

> **Status:** Borrador
> **Depends on:** SPEC 05, SPEC 06, SPEC 07, SPEC 09
> **Date:** 2026-10-22
> **Objective:** Crear Frogger como motor TypeScript en `lib/games/ranaria/` con su wrapper `components/games/ranaria-canvas.tsx` y temporizador dibujado en el canvas; la integración con la plataforma va en `02-plataforma-ranaria.md`.

---

## Por qué existe esta spec

Ranaria es el segundo juego **sin referencia en `references/started-games/`** (el primero fue Serpentina, SPEC 09): el motor se diseña desde cero con las reglas de esta spec. Es el primero con **muchas entidades móviles en carriles** (coches, camiones y troncos que se mueven de forma determinista) y con una entidad, la rana, que **viaja sobre otra** (el tronco). También es el primero que tiene **temporizador por intento**: como `Tiempo` no es una métrica del HUD del contrato, se dibuja como una barra dentro del canvas, igual que el chevron de arranque de Serpentina es un elemento del mundo. El registro `lib/games/registry.ts` ya existe (SPEC 07) y el patrón "motor emite eventos, wrapper sintetiza el sonido con Web Audio" lo fijó SPEC 09.

---

## Alcance

**Dentro:**

- Motor en `lib/games/ranaria/` (`constants.ts`, `types.ts`, `lanes.ts`, `entities.ts`, `engine.ts`) con el contrato de `.claude/skills/add-game/references/game-contract.md`.
- Wrapper `components/games/ranaria-canvas.tsx`: monta el motor y sintetiza el sonido con Web Audio a partir de los eventos del motor.
- Mundo de 800×600 con rejilla de celdas de 40 px: 20 columnas y 14 filas de juego (y 0–559) más una franja inferior de 40 px (y 560–599) para la barra de tiempo.
  - Fila 0: meta con 5 nenúfares.
  - Filas 1–5: río (5 carriles de troncos).
  - Fila 6: mediana segura.
  - Filas 7–11: carretera (5 carriles de coches y camiones).
  - Filas 12–13: zona de salida segura; la rana empieza en la fila 13.
- Controles: `↑` `↓` `←` `→` y `W` `A` `S` `D`. Un salto de una celda por pulsación (se ignoran las repeticiones del teclado).
- Mecánica: la rana salta una celda por pulsación. En la carretera muere si un vehículo la toca; en el río muere si no está sobre un tronco y se desplaza con el tronco; el tiempo por intento es de 30 s. Llegar a un nenúfar libre suma puntos y reinicia la rana; llenar los 5 nenúfares sube de nivel.
- Progresión: 3 vidas, 10 niveles; los vehículos y troncos aceleran un 10 % de la velocidad base por nivel.
- Fin de partida: se pierden las 3 vidas (derrota) o se llenan los 5 nenúfares del nivel 10 (victoria). Ambos llaman a `onGameOver(score)` una sola vez y abren el modal "FIN DEL JUEGO".
- HUD en React: `Puntuación`, `Vidas`, `Nivel`. Callbacks `onScore`, `onLives`, `onLevel`, `onGameOver`; eventos opcionales `onHop`, `onPad`, `onDeath`, `onLevelUp`.
- Estilo visual: primitivas del canvas con paleta neón de la plataforma, sin assets. Barra de tiempo en la franja inferior.
- Sonido sintetizado con Web Audio en el wrapper, disparado por los eventos del motor.
- Aplicar `/ui-ux-pro-max` al dibujo del mundo y al HUD de Vidas (según `CLAUDE.md`).

**Se toma de `lib/games/serpentina/` y SPEC 09:**

- Patrón del wrapper (callbacks por ref, efecto `[]`, efecto `[paused]`) y sonido con `AudioContext` perezoso.
- Teclas leídas con `e.code`.

**Se descarta del Frogger original:**

- Tortugas que se hunden, cocodrilos, moscas, serpientes y rana hembra de bonus.
- Segunda pantalla y modos de dos jugadores.
- Mostrar el tiempo, las vidas o el nivel como texto en el canvas (los pone `GamePlayer`).

**Fuera de alcance (para futuras specs):**

- Sonido por archivos, música, mute global y control de volumen.
- Controles táctiles (swipe) y ratón.
- Canvas HiDPI.
- Tortugas, cocodrilos, moscas y otros bonus.
- Modo de dos jugadores, selector de nivel y dificultad seleccionable.
- Auth, anti-trampas y Realtime (siguen fuera, como en SPEC 06).
- Modificar los archivos de `references/`.
- Tests automatizados.

---

## Modelo de datos

Estructuras en memoria; no hay persistencia nueva ni claves de `localStorage`.

```ts
// lib/games/ranaria/types.ts
export type DeathCause = "car" | "water" | "time";

export interface RanariaCallbacks {
  onScore: (score: number) => void;
  onLives: (lives: number) => void;
  onLevel: (level: number) => void;
  onGameOver: (score: number) => void; // una vez por partida (derrota o victoria)
  onHop?: () => void; // una llamada por salto aceptado
  onPad?: () => void; // rana en un nenúfar libre
  onDeath?: (cause: DeathCause) => void; // una llamada por vida perdida
  onLevelUp?: () => void; // los 5 nenúfares llenos, antes del siguiente nivel
}

export interface RanariaHandle {
  setPaused: (paused: boolean) => void;
  destroy: () => void; // cancela rAF y quita listeners; idempotente
}

export type LaneKind = "car" | "truck" | "log";
export interface Lane {
  row: number; // 1..5 río, 7..11 carretera
  kind: LaneKind;
  dir: 1 | -1; // 1 = hacia la derecha
  speed: number; // px/s en el nivel 1
  lenCells: number; // longitud de cada objeto en celdas
  count: number; // objetos por carril (equiespaciados en LOOP_W)
}
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
export type Phase = "playing" | "dying" | "levelclear" | "over" | "won";

export interface Frog {
  x: number; // px, esquina izquierda; continuo (el tronco la arrastra)
  row: number; // 0..13
  furthestRow: number; // fila más avanzada del intento actual
  facing: "up" | "down" | "left" | "right";
}

// lib/games/ranaria/engine.ts
export function createRanaria(
  canvas: HTMLCanvasElement,
  callbacks: RanariaCallbacks,
): RanariaHandle;
```

```tsx
// components/games/ranaria-canvas.tsx ("use client")
// Acepta GameCanvasProps de lib/games/registry.ts (paused, onScore, onGameOver, onLives, onLevel).
```

Archivos del motor:

- `constants.ts`: `W = 800`, `H = 600`, `CELL = 40`, `COLS = 20`, `PLAY_ROWS = 14`, `TIMER_Y = 560`, `START_ROW = 13`, `START_X = 380`, `GOAL_ROW = 0`, `MEDIAN_ROW = 6`, `PAD_COLS = [2, 6, 10, 14, 18]`, `PAD_TOLERANCE = 30`, `FROG_HIT_INSET = 6`, `VEHICLE_HIT_INSET = 2`, `LOOP_W = 960`, `LOOP_X0 = -160`, `INITIAL_LIVES = 3`, `MAX_LEVEL = 10`, `SPEED_STEP = 0.1`, `TIME_LIMIT = 30` (s), `DEATH_MS = 700`, `LEVELCLEAR_MS = 800`, `POINTS_STEP = 10`, `POINTS_PAD = 50`, `POINTS_PER_SECOND = 10`, `POINTS_LEVEL = 1000`, y los colores neón.
- `lanes.ts`: la tabla `LANES: Lane[]` y las funciones puras `objectRects(lane, phase, level)` (rectángulos de los objetos del carril) y `laneSpeed(lane, level)`.
- `entities.ts`: la rana (creación, salto, arrastre), colisiones, el estado de los nenúfares y `draw(ctx, state)` del mundo, los carriles, los nenúfares, la rana y la barra de tiempo; el `ctx` entra por parámetro.
- `engine.ts`: estado, bucle, input, fases, niveles, callbacks y `setPaused`/`destroy`.

Carriles (nivel 1; `speed` en px/s, `dir` 1 = derecha):

| Fila | Tipo    | `dir` | `lenCells` | `count` | `speed` |
| ---- | ------- | ----- | ---------- | ------- | ------- |
| 1    | `log`   | −1    | 3          | 3       | 50      |
| 2    | `log`   | 1     | 2          | 4       | 70      |
| 3    | `log`   | −1    | 4          | 2       | 40      |
| 4    | `log`   | 1     | 3          | 3       | 60      |
| 5    | `log`   | −1    | 2          | 4       | 80      |
| 7    | `car`   | 1     | 1          | 4       | 60      |
| 8    | `car`   | −1    | 1          | 3       | 90      |
| 9    | `truck` | 1     | 2          | 3       | 70      |
| 10   | `car`   | −1    | 1          | 4       | 100     |
| 11   | `truck` | 1     | 3          | 2       | 50      |

Convenciones:

- Coordenadas con origen arriba a la izquierda; píxeles de fila = `row × CELL`; la barra de tiempo ocupa `y ∈ [560, 600)`.
- Movimiento determinista, sin azar: cada carril es un bucle de `LOOP_W = 960` px con `count` objetos equiespaciados. La `x` izquierda de cada objeto es `((fase + i × LOOP_W / count) mod LOOP_W) + LOOP_X0` con `LOOP_X0 = -160`, de modo que los objetos entran por un lado y salen por el otro sin saltos visibles. La fase avanza `dir × speed × (1 + SPEED_STEP × (nivel − 1)) × dt` por fotograma. Las fases iniciales son 0 en todos los carriles y se reinician al cambiar de nivel.
- Bucle `requestAnimationFrame` con `dt` limitado a 0.05 s. A la velocidad máxima (100 × 1,9 = 190 px/s) un fotograma mueve como mucho 9,5 px, menos que cualquier hitbox, así que no hay tunelado.
- La rana salta una celda por pulsación (`CELL = 40` px): arriba y abajo cambian `row`; izquierda y derecha cambian `x`. El salto hacia abajo desde la fila 13 y hacia arriba desde la 0 se ignora. Un salto lateral que dejaría `x < 0` o `x > W − CELL` se ignora. `facing` se actualiza con cada salto aceptado. Se ignoran las repeticiones del teclado (`e.repeat`) y todo input fuera de la fase `playing`.
- Hitbox de la rana: rectángulo de la celda recortado `FROG_HIT_INSET = 6` px por cada lado. Hitbox de un vehículo: su rectángulo recortado `VEHICLE_HIT_INSET = 2` px por cada lado. En una fila de carretera la rana muere si ambos rectángulos se solapan (AABB).
- Río: la rana, en una fila 1–5, sobrevive si su centro (`x + CELL / 2`) está dentro del rectángulo (sin recorte) de algún tronco de ese carril; si no, muere por `water`. Mientras está sobre un tronco su `x` avanza lo mismo que el tronco (`dir × speed × multiplicador × dt`). Si su centro sale de `[0, W]` muere por `water`.
- Meta (fila 0): al saltar a la fila 0 se evalúa de inmediato. Hay éxito si `|centro − centroDelNenúfar| ≤ PAD_TOLERANCE` (30 px) para un nenúfar de `PAD_COLS` que esté libre; el centro de un nenúfar es `col × CELL + CELL / 2`. Si cae entre nenúfares o en uno ocupado muere por `water`.
- Puntuación: +10 por cada fila nueva alcanzada en el intento actual (compara con `furthestRow`; las filas 12 a 1, máximo 12 saltos útiles); +50 al llegar a un nenúfar libre más `floor(segundosRestantes) × 10`; +1000 al llenar los 5 nenúfares.
- Tiempo: `TIME_LIMIT = 30` s por intento; arranca al aparecer la rana y se reinicia al reaparecer. Con 0 s la rana muere por `time`. La barra mide `W × restante / TIME_LIMIT` de ancho; verde por encima del 50 %, amarilla entre el 25 % y el 50 % y roja por debajo del 25 %. La barra deja de avanzar fuera de la fase `playing`.
- Muerte: se pierde una vida, se emite `onLives` y `onDeath(causa)`, y la fase pasa a `dying` durante `DEATH_MS = 700` ms (la rana se dibuja aplastada o con una onda de agua; los carriles siguen moviéndose). Después, con vidas restantes, la rana reaparece en `START_X`, fila 13, con `furthestRow = 13` y el tiempo completo; sin vidas la fase pasa a `over` y se llama a `onGameOver(score)`.
- Nivel completo: al llenar los 5 nenúfares se suma el bono, se emite `onLevelUp` y la fase pasa a `levelclear` durante `LEVELCLEAR_MS = 800` ms. Después los nenúfares se vacían, el nivel sube en 1 (`onLevel`), la rana reaparece y las velocidades suben un 10 % de la base. Si el nivel completado es 10, no hay `levelclear`: la fase pasa a `won` y se llama a `onGameOver(score)`.
- Tope de puntuación: por nivel 5 × (12 × 10 + 50 + 300) + 1000 = 3350 puntos (el 300 es el bono de tiempo teórico máximo, inalcanzable en la práctica); × 10 niveles = **33.500 puntos**, muy por debajo del `CHECK` de 10.000.000 de `scores`.
- Los callbacks se llaman solo cuando el valor cambia, y una vez al arrancar (0 puntos, 3 vidas, nivel 1). `onHop`, `onPad`, `onDeath` y `onLevelUp` no se llaman en pausa ni tras `onGameOver`.
- El canvas solo dibuja el mundo: fondo por zonas, carriles, objetos, nenúfares (con la rana pequeña en los ocupados), la rana y la barra de tiempo; no dibuja puntuación, vidas, nivel, pausa ni game over.
- Mientras `paused` es `true` el motor no actualiza ni procesa teclas, sigue dibujando el último fotograma y descarta el `dt` acumulado al reanudar. El tiempo del intento y los temporizadores de `dying`/`levelclear` no avanzan en pausa.
- El motor ignora eventos de teclado cuyo `target` sea `input`, `textarea` o `select`; hace `preventDefault` (en `keydown` y `keyup`) de `↑` `↓` `←` `→`, `Espacio` y `W` `A` `S` `D` mientras el juego está activo y sin pausa. Las teclas se leen con `e.code` (`ArrowUp`, `KeyW`, …).
- Tras `onGameOver` el motor no acepta input; el reinicio lo hace React montando un wrapper nuevo (`key` distinto).
- Sonido del wrapper: un `AudioContext` creado de forma perezosa en el primer evento (el primer salto ya es un gesto del usuario); `onHop` = onda `square` de 440 Hz a 660 Hz en 50 ms; `onPad` = onda `square` de 660 Hz a 990 Hz en 120 ms; `onDeath("car")` = `sawtooth` de 220 Hz a 60 Hz en 300 ms; `onDeath("water")` = `triangle` de 300 Hz a 100 Hz en 250 ms; `onDeath("time")` = `sawtooth` de 150 Hz a 70 Hz en 400 ms; `onLevelUp` = tres notas `square` de 523, 784 y 1047 Hz de 100 ms cada una. Ganancia 0,06 con rampa a 0. Los errores de `AudioContext` se ignoran y el contexto se cierra en el cleanup.

---

## Plan de implementación

Antes de empezar: leer `node_modules/next/dist/docs/01-app` (Client Components) y aplicar `/ui-ux-pro-max` según `CLAUDE.md`. `lib/games/registry.ts` ya existe: no hay paso de creación del registro.

1. Crear `lib/games/ranaria/constants.ts` y `types.ts`. Verificación: `npm run lint`.
2. Crear `lib/games/ranaria/lanes.ts` con la tabla `LANES`, `laneSpeed` y `objectRects`. Verificación: `npm run lint`.
3. Crear `lib/games/ranaria/entities.ts` (rana, salto, arrastre, colisiones de carretera y río, meta y nenúfares, dibujo del mundo y de la barra de tiempo). Verificación: `npm run lint`.
4. Crear `lib/games/ranaria/engine.ts` con `createRanaria`: bucle con `dt` limitado, input con `preventDefault`, fases `playing`/`dying`/`levelclear`/`over`/`won`, temporizador, vidas, niveles, `setPaused`, `destroy` y los callbacks. Verificación: `npm run lint`.
5. Crear `components/games/ranaria-canvas.tsx`: canvas 800×600 (`block h-full w-full`, `role="img"`, `aria-label="Juego Ranaria"`), motor creado en un efecto `[]` con callbacks por ref, efecto `[paused]` y sonido con Web Audio desde los eventos. Verificación: `npm run lint`.

La verificación en el navegador (jugar, guardar y ver el ranking) necesita la entrada del registro y la migración de `02-plataforma-ranaria.md`.

---

## Criterios de aceptación

- [ ] `↑↓←→` y `WASD` mueven la rana una celda por pulsación; mantener una tecla pulsada no encadena saltos.
- [ ] Pulsar `↑`, `↓`, `←`, `→` o `Espacio` no hace scroll ni activa el botón enfocado.
- [ ] La rana no sale del mundo: el salto lateral que la sacaría de `[0, 760]`, el salto hacia abajo desde la fila 13 y el salto hacia arriba desde la fila 0 se ignoran.
- [ ] Los 10 carriles se mueven con la dirección, longitud, número de objetos y velocidad de la tabla, sin saltos visibles en el reciclado.
- [ ] Tocar un coche o un camión en la carretera resta una vida, emite `onDeath("car")` y la rana reaparece tras 700 ms con el tiempo completo.
- [ ] En el río, un salto a una celda sin tronco resta una vida (`onDeath("water")`); sobre un tronco la rana viaja con él a su misma velocidad.
- [ ] Si un tronco saca el centro de la rana de `[0, 800]`, la rana muere por `water`.
- [ ] Saltar a la fila 0 con el centro a ≤ 30 px del centro de un nenúfar libre suma 50 más `floor(segundosRestantes) × 10`, emite `onPad` y reaparece la rana; el nenúfar queda ocupado.
- [ ] Saltar a la fila 0 fuera de un nenúfar o en uno ocupado resta una vida (`onDeath("water")`).
- [ ] Cada fila nueva alcanzada en un intento suma exactamente 10 puntos (como mucho 12 por intento) y volver a una fila ya alcanzada no suma.
- [ ] La barra de tiempo se reduce durante 30 s, cambia a amarillo por debajo del 50 % y a rojo por debajo del 25 %; con 0 s la rana muere por `time`.
- [ ] Llenar los 5 nenúfares suma 1000, vacía los nenúfares, sube el nivel en 1, refleja el nivel en el HUD y acelera los carriles un 10 % de la velocidad base por nivel.
- [ ] Perder la tercera vida abre el modal "FIN DEL JUEGO" con la puntuación del HUD y `onGameOver` se invoca una sola vez.
- [ ] Llenar los 5 nenúfares del nivel 10 abre el mismo modal con la puntuación final (≤ 33.500) y `onGameOver` se invoca una sola vez.
- [ ] Durante `dying` y `levelclear` las teclas no mueven la rana.
- [ ] Pulsar PAUSA congela la rana, los carriles y la barra de tiempo, aparece "EN PAUSA" y las teclas no tienen efecto; REANUDAR continúa sin saltos ni pérdida de tiempo del intento.
- [ ] El canvas no dibuja puntuación, vidas, nivel, tiempo como texto, "PAUSA" ni "GAME OVER".
- [ ] Con el modal abierto, escribir en el campo de iniciales (incluidas `W` `A` `S` `D` y las flechas) no mueve la rana.
- [ ] Saltar, llegar a un nenúfar, morir y subir de nivel reproducen cada uno su sonido; no suena nada en pausa ni tras el fin de partida.
- [ ] Si `AudioContext` no existe o falla, el juego sigue funcionando sin excepciones no controladas.
- [ ] `lib/games/ranaria/` no importa React y no referencia `document`, `window`, `Image`, `Audio` ni `AudioContext`; solo usa `addEventListener`, `requestAnimationFrame` y `performance`.
- [ ] El código no usa `localStorage` ni claves nuevas.

---

## Decisiones

- **Sí:** el tiempo se dibuja como barra en la franja inferior del canvas. `Tiempo` no está en el contrato de HUD (`Puntuación`, `Vidas`, `Líneas`, `Nivel`) y la barra es un elemento del mundo, no texto.
- **No:** ampliar el contrato del HUD con una métrica `Tiempo`. Tocaría `GamePlayer`, el registro y los demás juegos, fuera del alcance de esta spec.
- **No:** quitar el temporizador. La descripción del catálogo promete "antes de que se acabe el tiempo" y es una parte central del Frogger original.
- **Sí:** rejilla de 20×14 celdas de 40 px más una franja de 40 px para el tiempo. Encaja exacta en 800×600 (4:3, `.crt-screen`).
- **Sí:** carriles deterministas (objetos equiespaciados en un bucle de 960 px, sin azar). Garantiza huecos siempre pasables y facilita verificar la dificultad.
- **No:** generación aleatoria de tráfico. Puede producir muros imposibles de cruzar y complica la verificación.
- **Sí:** un salto por pulsación, ignorando las repeticiones del teclado. Es el control del Frogger original y evita cruzar con la tecla pulsada.
- **Sí:** la rana viaja sobre el tronco con `x` continua en píxeles; los saltos laterales de 40 px parten de esa `x`. Mantiene el arrastre sin saltos y no obliga a alinear la rana a la rejilla.
- **Sí:** tolerancia de 30 px de centro a centro en los nenúfares, y morir si el nenúfar está ocupado o se cae entre nenúfares. Es el comportamiento del original y hace que la meta exija precisión.
- **Sí:** 3 vidas, 10 niveles y victoria al completar el nivel 10 con `onGameOver`, como Bloque Buster y Serpentina. Da un tope de puntuación finito (33.500).
- **No:** niveles infinitos. Obligarían a recortar la puntuación para respetar el `CHECK` de `scores`.
- **Sí:** +10 por fila nueva, +50 por nenúfar más 10 por segundo restante y +1000 por nivel. Recompensa avanzar y la rapidez.
- **Sí:** paleta neón de la plataforma con primitivas del canvas; sin spritesheet, así el motor no necesita un tercer parámetro.
- **Sí:** sonido sintetizado con Web Audio en el wrapper; el motor emite `onHop`, `onPad`, `onDeath` y `onLevelUp`. No hay archivos de audio y evita licencias.
- **No:** tortugas, cocodrilos, moscas, mute, volumen, música, táctil ni ratón. Cada uno va en su propia spec.
- **Sí:** teclas leídas con `e.code` para que `WASD` funcione con cualquier distribución de teclado.

---

## Riesgos

| Riesgo                                                                            | Mitigación                                                                                                                                  |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| React StrictMode monta dos veces el efecto y duplica bucles o listeners           | `destroy()` idempotente en el cleanup; verificar con `npm run dev` que la velocidad de los carriles no se duplica.                          |
| La rana se desincroniza del tronco (jitter o deriva por `dt`)                     | La rana se mueve con el mismo incremento (`dir × speed × multiplicador × dt`) que la fase del carril, en el mismo fotograma.                |
| El tunelado de un vehículo a velocidad alta atraviesa la rana                     | Velocidad máxima de 190 px/s × 0,05 s = 9,5 px por fotograma, menor que cualquier hitbox; `dt` limitado a 0,05 s.                           |
| `dt` enorme tras reanudar o volver a la pestaña adelanta los carriles o el tiempo | Descartar el acumulado al reanudar y limitar `dt` a 0,05 s; el tiempo del intento no avanza en pausa.                                       |
| El nivel 10 resulta imposible (carriles a ×1,9)                                   | Constantes aisladas en `constants.ts` (`SPEED_STEP`, velocidades de la tabla) para ajustar sin tocar la lógica.                             |
| Teclas pegadas o saltos encolados tras pausar o abrir el modal                    | El motor ignora `e.repeat`, `input`/`textarea`/`select` y todo input fuera de `playing`; deja de aceptar input tras game over.              |
| `onGameOver` se dispara dos veces (muerte final + victoria)                       | Fase interna única: tras `over` o `won` el bucle deja de actualizar y el callback se emite una sola vez.                                    |
| La muerte por tiempo coincide con la llegada a un nenúfar en el mismo fotograma   | El salto a la meta se resuelve en el evento de teclado, antes de la actualización del tiempo; una muerte pasa a `dying` y bloquea el resto. |
| `AudioContext` bloqueado hasta un gesto del usuario                               | Se crea de forma perezosa en el primer evento (tras el primer salto); los errores se capturan y el juego sigue.                             |
| Puntuación fuera del `CHECK` de `scores`                                          | Máximo 33.500 puntos; `submitScore` ya valida el rango.                                                                                     |

---

## Lo que **no** está en esta spec

- Sonido por archivos, música, mute global y control de volumen.
- Controles táctiles y ratón.
- Canvas HiDPI.
- Tortugas, cocodrilos, moscas y otros bonus.
- Modo de dos jugadores, selector de nivel y dificultad seleccionable.
- Auth, anti-trampas y Realtime.
- Tests automatizados.

Cada uno de estos, si se aborda, va en su propia spec.
