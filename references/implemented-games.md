# Juegos implementados

Juegos con `games.playable = true` (jugables en `/juegos/[id]/jugar` con leaderboard).

> Fuente: migraciones de `supabase/migrations/` (la consulta directa a la BD dio timeout al generar este archivo).

| #   | id              | Título        | Categoría | Color   | HUD                       | Migración                                                          |
| --- | --------------- | ------------- | --------- | ------- | ------------------------- | ------------------------------------------------------------------ |
| 1   | `bloque-buster` | BLOQUE BUSTER | ARCADE    | cyan    | Puntuación, Vidas, Nivel  | `20261016152715_juego_bloque_buster.sql`                           |
| 2   | `caida`         | CAÍDA         | PUZZLE    | magenta | Puntuación, Líneas, Nivel | `20261016150600_juego_caida.sql`                                   |
| 3   | `serpentina`    | SERPENTINA    | ARCADE    | green   | Puntuación, Nivel         | `20261016155819_juego_serpentina.sql`                              |
| 6   | `asteroides`    | ASTEROIDES    | SHOOTER   | yellow  | Puntuación, Vidas, Nivel  | `20261013000000_games_and_scores.sql` (seed con `playable = true`) |

(# = `sort_order` en la tabla `games`.)

## Descripciones

- **BLOQUE BUSTER** — Rebota la pelota y destruye muros de neón. Único con sprites y ratón.
- **CAÍDA** — Encaja las piezas antes de que el techo te aplaste (tipo Tetris).
- **SERPENTINA** — Crece sin morder tu propia cola. Rejilla de 20×15 celdas, frutas pixel-art.
- **ASTEROIDES** — Pulveriza asteroides en gravedad cero.

## Pendientes (en catálogo, `playable = false`)

| #   | id            | Título      | Categoría |
| --- | ------------- | ----------- | --------- |
| 4   | `gloton`      | GLOTÓN      | ARCADE    |
| 5   | `invasores`   | INVASORES   | SHOOTER   |
| 7   | `ranaria`     | RANARIA     | ARCADE    |
| 8   | `duelo-pixel` | DUELO PIXEL | VERSUS    |
