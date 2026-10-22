# Game jam — Ranaria (Frogger), spec 02: integración con la plataforma

> **Status:** Borrador
> **Depends on:** SPEC 05, SPEC 06, SPEC 07, game-jam/ranaria/01-motor-ranaria.md
> **Date:** 2026-10-22
> **Objective:** Marcar `ranaria` como jugable en Supabase, registrar su motor en `lib/games/registry.ts` con el HUD `Puntuación`, `Vidas`, `Nivel` y verificar que sus puntuaciones llegan al leaderboard.

---

## Por qué existe esta spec

El motor y el wrapper de Ranaria (`01-motor-ranaria.md`) no cambian el esquema ni el registro. Esta spec reúne lo que conecta el juego con la plataforma: la fila de `games`, la entrada del registro y los criterios del leaderboard de SPEC 06, que no necesita código nuevo.

---

## Alcance

**Dentro:**

- Entrada `ranaria` en `lib/games/registry.ts` con HUD `Puntuación`, `Vidas`, `Nivel`.
- Migración `supabase/migrations/<timestamp>_juego_ranaria.sql` (vía MCP `apply_migration`): `update public.games set playable = true where id = 'ranaria'`. La fila ya existe (`RANARIA`, `ARCADE`, `cover-rana`, `green`, `sort_order` 7) y la portada `.cover-rana` ya está en `app/globals.css`.
- Guardado y ranking: sin código nuevo; usan `submitScore`, `getTopScores`, `/salon?juego=ranaria` y `/juegos/ranaria` de SPEC 06.
- Actualizar `CLAUDE.md` con el juego nuevo.

**Fuera de alcance (para futuras specs):**

- Cambios en el motor o en el wrapper (van en `01-motor-ranaria.md`).
- Modificar `GamePlayer` o el contrato del HUD.
- Auth, anti-trampas y Realtime (siguen fuera, como en SPEC 06).
- Modificar archivos de `references/`.
- Tests automatizados.

---

## Modelo de datos

No introduce estructuras nuevas: el HUD usa los tipos `HudStat` y `GameRegistryEntry` de `lib/games/registry.ts` y el esquema de SPEC 06.

Fila en `games` (ya sembrada, solo cambia `playable`):

| id        | title   | cat    | cover        | color | playable | sort_order |
| --------- | ------- | ------ | ------------ | ----- | -------- | ---------- |
| `ranaria` | RANARIA | ARCADE | `cover-rana` | green | true     | 7          |

Entrada del registro:

```ts
// lib/games/registry.ts
ranaria: {
  Canvas: RanariaCanvas,
  hud: [
    { label: "Puntuación", key: "score" },
    { label: "Vidas", key: "lives" },
    { label: "Nivel", key: "level" },
  ],
},
```

---

## Plan de implementación

Antes de empezar: el motor y el wrapper de `01-motor-ranaria.md` deben existir. Aplicar `/ui-ux-pro-max` según `CLAUDE.md`.

1. Aplicar con MCP `apply_migration` la migración `playable = true` para `ranaria` y guardarla en `supabase/migrations/<timestamp>_juego_ranaria.sql`. Verificación: MCP `execute_sql` (`select id, playable from games where id = 'ranaria'`) y `get_advisors` sin alertas nuevas.
2. Añadir la entrada `ranaria` a `GAME_REGISTRY` en `lib/games/registry.ts` (HUD: puntuación, vidas, nivel). Verificación: `npm run dev`, jugar `/juegos/ranaria/jugar`, guardar la puntuación y comprobar la fila en `scores` (MCP `execute_sql`) y en `/salon?juego=ranaria`.
3. Actualizar `CLAUDE.md` (juegos jugables: añadir `ranaria` con HUD Puntuación, Vidas, Nivel; motor por carriles deterministas, barra de tiempo dibujada en el canvas y sonido sintetizado en el wrapper). Correr `npm run lint` y `npm run build`.

---

## Criterios de aceptación

- [ ] `npm run lint` y `npm run build` terminan sin errores.
- [ ] `/juegos/ranaria/jugar` muestra el canvas con la meta de 5 nenúfares, 5 carriles de río, la mediana, 5 carriles de carretera, la zona de salida, la rana en la celda (`START_X`, fila 13) y la barra de tiempo llena, sin errores en la consola.
- [ ] El HUD muestra `Puntuación`, `Vidas` y `Nivel` alimentados por los callbacks, con valores iniciales 0, 3 y 1.
- [ ] "GUARDAR PUNTUACIÓN" con nombre `abc` inserta en `scores` una fila con `game_id = 'ranaria'`, `name = 'ABC'`, la puntuación del HUD y `user_id` nulo (MCP `execute_sql`), y el botón muestra `PUNTUACIÓN GUARDADA_`.
- [ ] La puntuación guardada aparece en `/salon?juego=ranaria` y en `/juegos/ranaria` sin reiniciar el servidor, y no aparece en los demás juegos.
- [ ] `best` y `plays` de Ranaria se actualizan en el catálogo y en el detalle.
- [ ] "JUGAR DE NUEVO" arranca con 0 puntos, 3 vidas y nivel 1, sin duplicar listeners ni bucles (la velocidad de los carriles no cambia tras reiniciar).
- [ ] FIN abre el modal con la puntuación actual y la rana deja de responder al teclado.
- [ ] Al salir con SALIR o navegar a otra ruta se cancelan el `requestAnimationFrame` y los listeners de teclado.
- [ ] `/juegos/asteroides/jugar`, `/juegos/caida/jugar`, `/juegos/bloque-buster/jugar` y `/juegos/serpentina/jugar` se juegan igual que antes, y `/juegos/gloton/jugar` sigue con la arena simulada.
- [ ] En `public.games`, `ranaria` tiene `playable = true` y el resto de columnas no cambian; `get_advisors` (seguridad) no reporta alertas nuevas.
- [ ] Ningún componente cliente importa `lib/supabase/server.ts` ni `lib/games-repo.ts`.

---

## Decisiones

- **Sí:** reutilizar la fila `ranaria` y poner `playable = true`. Mantiene URLs, portada `cover-rana` y descripción ya sembrada; no hay que migrar rutas.
- **No:** crear una fila `frogger`. Dejaría `ranaria` duplicada como juego simulado.
- **Sí:** solo añadir una entrada al registro de SPEC 07; el HUD declara `score`, `lives` y `level`.
- **Sí:** el tope de puntuación (33.500) se calcula en la spec del motor; aquí solo se comprueba que `submitScore` lo acepta.

---

## Riesgos

| Riesgo                                                                 | Mitigación                                                                                                           |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| La migración marca `ranaria` como jugable antes de que exista el motor | Aplicar la migración solo cuando `01-motor-ranaria.md` esté implementado y el registro tenga la entrada.             |
| La entrada del registro rompe otros juegos                             | Verificar jugando asteroides, caída, bloque buster y serpentina, y comprobar que gloton sigue con la arena simulada. |
| El estado real de la fila difiere de lo sembrado                       | La fila ya existe: solo cambia `playable`; comprobar el estado real con `execute_sql` antes de aplicar la migración. |

---

## Lo que **no** está en esta spec

- Cambios en el motor y el wrapper.
- Modificar `GamePlayer` o el contrato del HUD.
- Auth, anti-trampas y Realtime.
- Tests automatizados.

Cada uno de estos, si se aborda, va en su propia spec.
