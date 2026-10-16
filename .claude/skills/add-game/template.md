# Plantilla de spec de juego

Esqueleto que consulta `/add-game`. Los encabezados y estados siguen SPEC 05 y 06 (español). **No se copia literal**: se rellena con datos reales. Los marcadores `<…>` se sustituyen siempre; no dejes TODOs.

---

```markdown
# SPEC NN — Juego <Título> en canvas con leaderboard

> **Status:** Borrador
> **Depends on:** SPEC 05, SPEC 06
> **Date:** <fecha del contexto de sesión>
> **Objective:** Portar/Crear <juego> como motor TypeScript en `lib/games/<slug>/`, montarlo en `/juegos/<slug>/jugar` y guardar sus puntuaciones en el leaderboard de Supabase.

---

## Por qué existe esta spec

<Qué aporta este juego y qué fija: p. ej. primer juego con registro por id, o primer juego con ratón.>

---

## Alcance

**Dentro:**

- Motor en `lib/games/<slug>/` (`constants.ts`, `types.ts`, `entities.ts`, `engine.ts`) con el contrato de `.claude/skills/add-game/references/game-contract.md`.
- Wrapper `components/games/<slug>-canvas.tsx`.
- Entrada en `lib/games/registry.ts` (o creación del registro y migración de Asteroides si aún no existe).
- Migración `games`: <insert | update playable = true> para `<slug>`; portada `.cover-<slug>`.
- Controles: <lista exacta>.
- HUD: <métricas>.
- Fuente: <carpeta de references/started-games | diseño propio>; qué se descarta del original.

**Fuera de alcance (para futuras specs):**

- <sonido, táctil, HiDPI, ... según las respuestas>
- Auth, anti-trampas y Realtime (siguen fuera, como en SPEC 06).
- Modificar archivos de `references/`.
- Tests automatizados.

---

## Modelo de datos

<Interfaces `<Game>Callbacks`, `GameHandle`, entidades principales, constantes con valores reales (puntos, velocidades, tamaño del mundo). Fragmentos cortos.>

Convenciones:

- <origen de coordenadas, unidades, límite de dt, reglas de puntuación>

Fila en `games`:

| id  | title | cat | cover | color | playable | sort_order |
| --- | ----- | --- | ----- | ----- | -------- | ---------- |

---

## Plan de implementación

Antes de empezar: leer `node_modules/next/dist/docs/01-app` (Client Components) y aplicar `/ui-ux-pro-max` según `CLAUDE.md`.

<Pasos numerados del "Plan de implementación tipo" de platform-integration.md, con archivos y verificación concretos. Cada paso deja el sistema ejecutable.>

---

## Criterios de aceptación

<Criterios propios del juego (reglas de puntuación, colisiones, fin de partida) + criterios estándar de platform-integration.md con `<slug>` sustituido.>

---

## Decisiones

- **Sí / No:** <con motivo breve: registro por id, qué se descarta del original, assets, estilo visual>.

---

## Riesgos

| Riesgo                                                                                          | Mitigación |
| ----------------------------------------------------------------------------------------------- | ---------- |
| <StrictMode duplica bucles; teclas pegadas tras pausar; canvas no 4:3; tope de puntuación; ...> | <...>      |

---

## Lo que **no** está en esta spec

- <repetir el "Fuera de alcance">

Cada uno de estos, si se aborda, va en su propia spec.
```

## Reglas del documento

- Una idea por frase; nombres concretos de archivos y cadenas exactas.
- Criterios booleanos y verificables.
- Sin código de implementación largo; solo interfaces y firmas.
- Markdown estándar que renderice en GitHub.
