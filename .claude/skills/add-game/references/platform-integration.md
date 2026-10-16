# Integración con la plataforma

Extraído de SPEC 06 y del código actual. Un juego nuevo **no necesita código de leaderboard nuevo**: la spec solo debe exigir la migración, la portada, el registro y la verificación.

## Base de datos (Supabase `jnkfrkejprbppolsspld`)

- Fila en `public.games`: `id` (slug de las rutas), `title`, `short`, `long`, `cat` ∈ `ARCADE|PUZZLE|SHOOTER|VERSUS`, `cover` (`cover-<slug>`), `color` ∈ `cyan|magenta|yellow|green`, `playable`, `sort_order`.
- Si la fila ya existe (se siembraron 8: `bloque-buster`, `caida`, `serpentina`, `gloton`, `invasores`, `asteroides`, `ranaria`, `duelo-pixel`): migración `update public.games set playable = true where id = '<slug>'`. Si no: `insert` con el siguiente `sort_order`. Comprueba el estado real con MCP `list_tables`/`execute_sql` al redactar el plan.
- Migración aplicada con MCP `apply_migration` y copiada a `supabase/migrations/<timestamp>_juego_<slug>.sql`.
- `lib/supabase/database.types.ts` solo se regenera si cambia el esquema (no se edita a mano).
- El `CHECK` de `scores` limita `score` a 0–10.000.000 y `name` a 1–12 caracteres: la spec debe confirmar que el juego no supera ese tope.

## Lo que ya funciona sin tocar

- `submitScore({ gameId, name, score })` en `app/juegos/[id]/jugar/actions.ts` (valida, inserta con `user_id = null`, revalida `/salon`, `/games`, `/` y `/juegos/[id]`).
- `getGames`, `getGame`, `getTopScores(gameId, limit)` en `lib/games-repo.ts`; `best` y `plays` salen de la vista `game_stats`.
- `/salon?juego=<slug>` y `/juegos/<slug>` filtran por `game_id`.
- El modal de fin de `GamePlayer` ya llama a `submitScore` con `game.id`.

## Portada

Clase `.cover-<slug>` en `app/globals.css`, siguiendo el patrón de `.cover-asteroides` (fondo + `::after`/`::before`, colores `var(--cyan)` etc.). Se usa como `cover-bg <cover>`. La spec indica aplicar `/ui-ux-pro-max` (regla de `CLAUDE.md`).

## Assets

Imágenes o sonidos del juego original se copian a `public/games/<slug>/` solo si el usuario los incluyó en el alcance.

## Criterios de aceptación estándar (incluir siempre, adaptando `<slug>`)

- [ ] `npm run lint` y `npm run build` terminan sin errores.
- [ ] `/juegos/<slug>/jugar` muestra el canvas del juego y el HUD (`Puntuación` y las métricas declaradas) alimentado por los callbacks, sin errores en consola.
- [ ] PAUSA congela el juego y las teclas no tienen efecto; REANUDAR continúa sin saltos.
- [ ] Al terminar la partida se abre el modal con la puntuación del HUD y `onGameOver` se invoca una sola vez.
- [ ] Guardar con nombre `abc` inserta en `scores` una fila con `game_id = '<slug>'`, `name = 'ABC'`, puntuación del HUD y `user_id` nulo (MCP `execute_sql`).
- [ ] La puntuación aparece en `/salon?juego=<slug>` y en `/juegos/<slug>` sin reiniciar el servidor, y no aparece en los demás juegos.
- [ ] `best` y `plays` del juego se actualizan en catálogo y detalle.
- [ ] "JUGAR DE NUEVO" arranca con valores iniciales sin duplicar listeners ni bucles.
- [ ] FIN abre el modal y el juego deja de responder al teclado.
- [ ] SALIR o navegar cancela `requestAnimationFrame` y listeners.
- [ ] Las flechas y `Espacio` no hacen scroll ni activan el botón enfocado; escribir en el campo de iniciales no mueve el juego.
- [ ] Asteroides y los juegos aún simulados siguen funcionando igual.
- [ ] `lib/games/<slug>/` no importa React ni usa `document`/`window` fuera de listeners, rAF y `performance`.
- [ ] Ningún componente cliente importa `lib/supabase/server.ts` ni `lib/games-repo.ts`.
- [ ] `get_advisors` (seguridad) sin alertas nuevas.

## Plan de implementación tipo

1. (Solo si no existe) Crear `lib/games/registry.ts` y migrar Asteroides. Verificación: jugar Asteroides y `/juegos/caida/jugar`.
2. `lib/games/<slug>/constants.ts` y `types.ts`. `npm run lint`.
3. `entities.ts` con la lógica del juego. `npm run lint`.
4. `engine.ts` con bucle, input, pausa, callbacks. `npm run lint`.
5. `components/games/<slug>-canvas.tsx`. `npm run lint`.
6. Migración (`games`) y portada `.cover-<slug>`. Verificación: `execute_sql`, `/games`.
7. Entrada en el registro y HUD. Verificación: jugar y guardar un score; fila en BD y en `/salon`.
8. Actualizar `CLAUDE.md` si cambia el stack; `npm run lint` y `npm run build`.

Cada paso debe dejar el sistema ejecutable; divide los que superen ~50 líneas.
