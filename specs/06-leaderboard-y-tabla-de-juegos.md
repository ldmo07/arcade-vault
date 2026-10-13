# SPEC 06 — Tabla `games` y leaderboard real en Supabase

> **Status:** Aprobado
> **Depends on:** SPEC 01, SPEC 04, SPEC 05
> **Date:** 2026-10-13
> **Objective:** Integrar la app con Supabase (proyecto `jnkfrkejprbppolsspld`) creando en él las tablas `games` y `scores` (con RLS), migrar el catálogo de `lib/data.ts` a la tabla `games`, guardar las puntuaciones reales desde el modal de fin de partida y mostrar el top 10 por juego en `/salon` y en el detalle `/juegos/[id]`.

---

## Por qué existe esta spec

El catálogo (`GAMES`) y el ranking (`seededScores`) son datos falsos en `lib/data.ts`, y `saveScore` solo escribe en `localStorage` (SPEC 05 lo dejó como mock explícito). La SPEC 04 dejó Supabase configurado pero sin tablas. Esta spec añade el primer esquema real: `games` es la FK que necesita `scores`, y ambas juntas hacen que una partida de Asteroides termine en un ranking visible.

---

## Integración con Supabase (obligatoria)

Toda la persistencia de esta spec vive en Supabase; no hay datos en memoria, JSON ni `localStorage` como fuente de verdad.

- **Proyecto:** remoto `jnkfrkejprbppolsspld` (SPEC 04). Sin Supabase local ni Docker.
- **Esquema:** se crea en el proyecto remoto con el MCP de Supabase (`apply_migration`) y se versiona en `supabase/migrations/`. Las tablas `games` y `scores` y la vista `game_stats` están en el esquema `public`, con RLS activado.
- **Lecturas** (catálogo y top 10): Server Components → `lib/games-repo.ts` → `createClient()` de `@/lib/supabase/server` (tipado con `Database`).
- **Escritura** (score): Server Action `submitScore` → mismo cliente de servidor → `insert` en `public.scores`. El navegador nunca habla con las tablas; `@/lib/supabase/client` no se usa en esta spec.
- **Credenciales:** solo `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (SPEC 04). No se usa `service_role`; los permisos los dan las policies RLS.
- **Tipos:** `lib/supabase/database.types.ts` se regenera con MCP `generate_typescript_types` tras la migración y no se edita a mano.
- **Verificación contra la BD real:** cada paso se comprueba con MCP `list_tables`, `execute_sql` y `get_advisors`, no solo con la UI.
- Si Supabase no responde, la app no inventa datos: `/salon` y el catálogo muestran error y el modal de guardado muestra `ERROR, REINTENTAR`.

---

## Alcance

**Dentro:**

- Migración SQL (vía MCP `apply_migration`, guardada también en `supabase/migrations/`) con:
  - Tabla `games` y seed con los 8 juegos actuales de `lib/data.ts`.
  - Tabla `scores` con FK a `games`.
  - Vista `game_stats` (`best`, `plays` por juego, calculados de `scores`).
  - RLS: lectura pública de `games`, `scores` y `game_stats`; insert público en `scores`; sin update ni delete.
- Regenerar `lib/supabase/database.types.ts`.
- `lib/games-repo.ts` (solo servidor): `getGames()`, `getGame(id)`, `getTopScores(gameId, limit)`.
- Server Action `app/juegos/[id]/jugar/actions.ts` → `submitScore({ gameId, name, score })` que inserta en `scores` y devuelve `{ ok: true } | { ok: false, error }`.
- Migrar a datos de BD las pantallas que usan `GAMES`: `app/page.tsx` (preview), `app/games/page.tsx` / `components/library.tsx`, `app/juegos/[id]/page.tsx`, `app/juegos/[id]/jugar/page.tsx`, `components/game-card.tsx` y `components/hall-of-fame.tsx`.
- `/salon`: pestañas por juego (leídas de `games`) y tabla top 10 de `scores` con rango, nombre, puntuación y fecha; estado vacío "SIN PUNTUACIONES AÚN".
- `/juegos/[id]` (detalle): la sección "MEJORES PUNTUACIONES" lee el top 10 de `scores` del juego mostrado con `getTopScores`, con rango, nombre, fecha y puntuación; estado vacío "SIN PUNTUACIONES AÚN". Se elimina `seededScores` de `lib/data.ts`.
- `GamePlayer`: "GUARDAR PUNTUACIÓN" llama a `submitScore`; estados `GUARDANDO…`, `PUNTUACIÓN GUARDADA_` y `ERROR, REINTENTAR` (el modal permanece abierto y reintentable).
- `best` y `plays` del catálogo salen de `game_stats`; sin partidas guardadas valen `0`.
- Aplicar `/ui-ux-pro-max` al estado vacío, a los estados del botón y a la tabla de `/salon` (según `CLAUDE.md`).

**Fuera de alcance (para futuras specs):**

- Supabase Auth y sustitución de `lib/session.tsx` (los jugadores son iniciales anónimas; `user_id` existe pero queda siempre en `null`).
- Anti-trampas real (Edge Function, firma de partidas, rate limit).
- Realtime / actualización en vivo del ranking.
- Scores falsos de ejemplo en la BD.
- Datos mock de la home (`RECENT_SCORES`, `TOP_PLAYERS`, `HOME_STATS` en `lib/home-data.ts`).
- Fallback a `localStorage` si falla Supabase.
- Panel de administración de `games`.
- Tests automatizados.

---

## Modelo de datos

```sql
-- games
create table public.games (
  id         text primary key,                 -- "asteroides", "caida", ...
  title      text not null,
  short      text not null,
  long       text not null,
  cat        text not null check (cat in ('ARCADE','PUZZLE','SHOOTER','VERSUS')),
  cover      text not null,                    -- clase CSS, ej. "cover-asteroides"
  color      text not null check (color in ('cyan','magenta','yellow','green')),
  playable   boolean not null default false,   -- true solo para "asteroides"
  sort_order int not null
);

-- scores
create table public.scores (
  id         bigint generated always as identity primary key,
  game_id    text not null references public.games(id),
  name       text not null check (char_length(name) between 1 and 12),
  score      int  not null check (score >= 0 and score <= 10000000),
  user_id    uuid null references auth.users(id) on delete set null, -- NULL = jugador anónimo
  created_at timestamptz not null default now()
);
create index scores_game_score_idx on public.scores (game_id, score desc);

-- game_stats (security_invoker = on)
create view public.game_stats as
  select g.id as game_id,
         coalesce(max(s.score), 0) as best,
         count(s.id)               as plays
  from public.games g left join public.scores s on s.game_id = g.id
  group by g.id;
```

RLS:

- `games`: `select` para `anon` y `authenticated`.
- `scores`: `select` e `insert` para `anon` y `authenticated`; sin `update` ni `delete`.
- `user_id` es **opcional (nullable)**: no se exige sesión para jugar ni para guardar. Hoy `submitScore` siempre inserta `user_id = null`. La policy de insert exige `user_id is null or user_id = auth.uid()` para que nadie suplante a otro usuario cuando exista Auth.

```ts
// lib/games-repo.ts (server-only)
export interface GameRow {
  id: string;
  title: string;
  short: string;
  long: string;
  cat: Category;
  cover: string;
  color: GameColor;
  playable: boolean;
  best: number;
  plays: number;
}
export interface ScoreEntry {
  rank: number;
  name: string;
  score: number;
  date: string;
}

export async function getGames(): Promise<GameRow[]>;
export async function getGame(id: string): Promise<GameRow | null>;
export async function getTopScores(
  gameId: string,
  limit?: number,
): Promise<ScoreEntry[]>;

// app/juegos/[id]/jugar/actions.ts ("use server")
export async function submitScore(input: {
  gameId: string;
  name: string;
  score: number;
}): Promise<
  | { ok: true }
  | { ok: false; error: "invalid" | "unknown_game" | "unavailable" }
>;
```

Convenciones:

- `Game` en `lib/data.ts` se sustituye por `GameRow`; `CATS` y los tipos `Category`/`GameColor` se conservan. `GAMES` y `seededScores` se eliminan de `lib/data.ts` (`seededScores` en el paso 9).
- `name` se normaliza en servidor: `trim`, mayúsculas, máximo 12 caracteres, no vacío. `score` debe ser entero ≥ 0.
- `date` en `ScoreEntry` se formatea `dd/mm/aaaa` (es-ES) en el servidor.
- `getTopScores` ordena por `score desc, created_at asc` y devuelve máximo 10 por defecto.
- Los repos usan `createClient` de `@/lib/supabase/server`; nunca se importan desde componentes cliente.
- `saveScore` y la clave `av_scores` de `lib/session.tsx` dejan de usarse por `GamePlayer`; `av_user` se conserva.
- Sin claves nuevas de `localStorage`.

---

## Plan de implementación

Antes de empezar: leer `node_modules/next/dist/docs/01-app` (Server Actions, data fetching, caching/revalidación y `generateStaticParams`) y la guía de RLS de Supabase (MCP `search_docs`). Inspeccionar el esquema actual con MCP `list_tables`.

1. Aplicar la migración con MCP `apply_migration` (tablas, índice, vista, RLS, seed de los 8 juegos con `playable = true` solo para `asteroides`) y copiarla a `supabase/migrations/`. Verificación: MCP `list_tables`, `execute_sql` (`select count(*) from games` = 8) y `get_advisors` sin alertas de seguridad de RLS.
2. Regenerar `lib/supabase/database.types.ts` con MCP `generate_typescript_types`. Verificación: `npm run lint`.
3. Crear `lib/games-repo.ts` con `getGames`, `getGame`, `getTopScores` (une `games` con `game_stats`). Verificación: `npm run lint`.
4. Migrar el catálogo a la BD: `app/page.tsx`, `app/games/page.tsx` + `components/library.tsx`, `components/game-card.tsx`, `app/juegos/[id]/page.tsx` y `app/juegos/[id]/jugar/page.tsx` (`notFound()` si `getGame` devuelve `null`; `generateStaticParams` se retira o se adapta según la doc de Next 16). Verificación: `npm run dev`, esas rutas se ven como antes con `best` y `plays` en `0`.
5. Crear `submitScore` en `app/juegos/[id]/jugar/actions.ts` (validación + insert + `revalidatePath("/salon")`). Verificación: `npm run lint`.
6. Integrar en `components/game-player.tsx`: botón de guardado con estados `GUARDANDO…` / `PUNTUACIÓN GUARDADA_` / `ERROR, REINTENTAR`, deshabilitado mientras guarda o tras guardar. Verificación: jugar Asteroides, guardar y ver la fila en BD (MCP `execute_sql`).
7. Reescribir `/salon`: `app/salon/page.tsx` (Server Component) carga juegos y top 10 del juego seleccionado; `components/hall-of-fame.tsx` conserva pestañas (por `searchParams` o estado cliente según la doc) y estado vacío. Verificación: `npm run dev`, el score guardado en el paso 6 aparece en el puesto 1 de `/salon`.
8. Actualizar `CLAUDE.md` (Stack: tablas `games` y `scores`, `lib/games-repo.ts`). Correr `npm run lint` y `npm run build`.
9. (Añadido tras la implementación inicial) En `app/juegos/[id]/page.tsx` sustituir `seededScores` por `getTopScores(game.id, 10)` y pintar el estado vacío; eliminar `seededScores`, `ScoreRow` y `PLAYERS` de `lib/data.ts` si quedan sin uso. Verificación: `npm run dev`, `/juegos/asteroides` lista los scores guardados y `/juegos/caida` muestra el estado vacío; después `npm run lint` y `npm run build`.

---

## Criterios de aceptación

- [x] `npm run lint` y `npm run build` terminan sin errores.
- [x] Ninguna pantalla de esta spec lee datos de `lib/data.ts` (salvo `CATS` y tipos): catálogo y ranking vienen de Supabase.
- [x] Las filas guardadas desde la app se ven en la BD remota (`execute_sql` sobre `public.scores`) y en el dashboard de Supabase.
- [x] En el proyecto remoto existen `games` (8 filas), `scores` (vacía de partida) y la vista `game_stats`, con RLS activado en `games` y `scores`.
- [x] `get_advisors` (seguridad) no reporta tablas sin RLS ni vistas `security definer`.
- [ ] Con la clave publishable se puede `select` en `games`, `scores` y `game_stats`, e `insert` en `scores`; `update` y `delete` sobre `scores` son rechazados.
- [x] Un `insert` en `scores` con `score < 0`, `name` vacío, `name` de más de 12 caracteres o `game_id` inexistente es rechazado por la BD.
- [ ] `/`, `/games`, `/juegos/[id]` y `/juegos/[id]/jugar` muestran el catálogo leído de `games` con títulos, categorías, portadas y colores idénticos a los actuales.
- [ ] `/games` lista exactamente los juegos de la tabla `games` (hoy 8, ordenados por `sort_order`), con el filtro por categoría funcionando; añadir una fila en `games` (MCP `execute_sql`) hace que aparezca en `/games` sin tocar código.
- [x] Sin sesión iniciada se puede jugar Asteroides y guardar el score; la fila queda con `user_id = null`.
- [x] Un `insert` en `scores` con un `user_id` distinto de `auth.uid()` es rechazado por RLS.
- [x] Un id inexistente en `/juegos/[id]` y `/juegos/[id]/jugar` devuelve 404.
- [x] Sin partidas guardadas, `best` y `plays` se muestran como `0` en tarjetas y detalle.
- [x] Terminar una partida de Asteroides y pulsar "GUARDAR PUNTUACIÓN" con nombre `abc` inserta una fila en `scores` con `game_id = 'asteroides'`, `name = 'ABC'` y la puntuación del HUD, y el botón muestra `PUNTUACIÓN GUARDADA_`.
- [ ] Mientras guarda, el botón muestra `GUARDANDO…` y no se puede pulsar dos veces; tras guardar no se puede insertar un segundo score desde el mismo modal.
- [x] Si `submitScore` falla (p. ej. variables de entorno inválidas), el modal muestra `ERROR, REINTENTAR`, sigue abierto y un nuevo intento funciona al restablecer la conexión.
- [x] `/salon` lista una pestaña por juego en el orden de `sort_order`; al seleccionar un juego sin scores muestra "SIN PUNTUACIONES AÚN".
- [x] El score recién guardado aparece en `/salon` (pestaña Asteroides) sin reiniciar el servidor.
- [ ] `/salon` muestra como máximo 10 filas ordenadas por puntuación descendente; empates se ordenan por antigüedad.
- [x] `best` de Asteroides en el catálogo pasa a ser el máximo guardado y `plays` el número de scores.
- [x] `GamePlayer` ya no escribe en `localStorage` bajo `av_scores`.
- [x] `/juegos/[id]` muestra en "MEJORES PUNTUACIONES" las filas de `scores` de ese juego (máximo 10, por puntuación descendente y empate por antigüedad), distintas para cada juego.
- [x] Un juego sin scores muestra "SIN PUNTUACIONES AÚN" en `/juegos/[id]`.
- [x] Un score recién guardado aparece en `/juegos/[id]` del mismo juego sin reiniciar el servidor, y no en los demás.
- [x] `seededScores` ya no existe en el código.
- [ ] Ningún componente cliente importa `lib/supabase/server.ts` ni `lib/games-repo.ts`.

---

## Decisiones

- **Sí:** tabla `games` en Supabase con `id text` como PK (el slug actual de las rutas). Evita migrar URLs y sirve de FK para `scores`.
- **No:** solo tabla de UI o catálogo en código. El usuario eligió BD.
- **Sí:** `playable` en `games` en lugar de codificar `game.id === "asteroides"` en la BD. `GamePlayer` sigue con su rama actual; el campo queda como base para generalizar.
- **Sí:** `best` y `plays` calculados en la vista `game_stats`, no almacenados. Una sola fuente de verdad; coste despreciable a esta escala.
- **No:** guardar contadores desnormalizados en `games`.
- **Sí:** jugadores anónimos con iniciales (el nombre del modal). Auth va en otra spec.
- **Sí:** `scores.user_id` nullable (FK a `auth.users`). Por ahora no queremos que jugar exija autenticación; todos los scores se guardan con `null`. Cuando exista Auth se rellenará sin migrar la tabla.
- **No:** exigir login para jugar o guardar score en esta spec.
- **Sí:** RLS con insert público y `CHECK` de nombre y rango de puntuación. Protección mínima proporcional a la fase.
- **No:** anti-cheat real, Route Handler con rate limit ni Edge Function. Cualquiera puede insertar scores falsos con la clave publishable; se acepta de forma explícita hasta una spec de seguridad.
- **Sí:** el insert pasa por una Server Action (`submitScore`) que valida y normaliza el nombre, aunque RLS permita insert directo. Un solo punto de entrada de la UI y revalidación de `/salon`.
- **Sí:** catálogo y ranking vacíos sembrados solo con `games`; scores reales empiezan en 0. Sin datos falsos mezclados con reales.
- **No:** mantener los mocks como fallback si la BD falla.
- **Sí:** el leaderboard se muestra en `/salon` y en `/juegos/[id]`, ambos con `getTopScores`. Ampliación decidida por el usuario tras la implementación inicial; sustituye a la decisión de dejar `/juegos/[id]` con `seededScores`.
- **No:** mantener `seededScores` como relleno en `/juegos/[id]`.
- **No:** Realtime. Revalidación bajo demanda es suficiente.
- **Sí:** error visible y reintento en el modal; sin fallback a `localStorage`.
- **Nota:** el usuario dejó marcada solo la opción "Guardar score real" en el alcance y luego aceptó `/salon` con top 10 por juego como lectura.

---

## Riesgos

| Riesgo                                                                                  | Mitigación                                                                                                                 |
| --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Scores falsos desde el navegador con la clave publishable                               | Aceptado en esta fase; `CHECK` de rango y nombre; spec futura de Edge Function / anti-cheat.                               |
| `generateStaticParams` y `cookies()` del cliente de servidor son incompatibles en build | Leer la doc de Next 16; retirar `generateStaticParams` o usar cliente sin cookies para catálogo público.                   |
| Vista `game_stats` evade RLS si se crea como `security definer`                         | Crear con `security_invoker = on` y verificar con `get_advisors`.                                                          |
| Páginas cacheadas muestran `best`/`plays` o ranking obsoletos                           | `revalidatePath` en `submitScore` para `/salon`, `/games`, `/` y `/juegos/[id]`; revisar la estrategia de caché en la doc. |
| Guardado doble por doble clic o reintento                                               | Botón deshabilitado durante el envío y tras el éxito.                                                                      |
| Supabase caído en lectura                                                               | Las páginas muestran error de Next sin datos mock; aceptado en esta fase.                                                  |
| Pérdida del score si falla el guardado                                                  | Modal sigue abierto y permite reintentar; no se persiste localmente.                                                       |
| Seed desalineado con `lib/data.ts`                                                      | Copiar los 8 juegos literalmente y verificar títulos y portadas en los criterios.                                          |

---

## Lo que **no** está en esta spec

- Auth y jugadores con cuenta.
- Anti-cheat y rate limiting.
- Realtime.
- Mocks de la home.
- Scores de ejemplo en la BD.
- Panel de administración de juegos.
- Tests automatizados.

Cada uno de estos, si se aborda, va en su propia spec.
