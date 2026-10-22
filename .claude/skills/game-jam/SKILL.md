---
name: game-jam
description: Game jam de Arcade Vault. Dado un tema ("juego sobre café"), lanza 3 agentes game-jam en paralelo que proponen 3 juegos distintos con 2 specs completas cada uno en specs/game-jam/<game-id>/, pregunta al usuario cuál se va a implementar y deja un veredicto con su elección. Úsalo cuando el usuario pida una game jam, juegos sobre un tema, o varias propuestas de juego con spec para elegir. Solo produce specs; no implementa.
argument-hint: "tema del juego (ej. café)"
allowed-tools: Read, Glob, Grep, Write, Agent, AskUserQuestion, Bash(ls:*), Bash(date:*)
---

# /game-jam — 3 juegos, 3 specs en paralelo, 1 ganador

## Contexto de sesión

Fecha de hoy (úsala en las specs, nunca la adivines):
!`date +%F`

Game jams existentes:
!`ls specs/game-jam/ 2>/dev/null || echo "No existe specs/game-jam/"`

---

Un subagente no puede lanzar otros subagentes, por eso este skill corre en la sesión principal y es quien lanza los 3 agentes `game-jam` (`.claude/agents/game-jam.md`). **No escribes código ni migraciones**: solo specs y el veredicto. Responde en español.

## Fases

### Fase 1 — Tema y contexto

1. Si `$ARGUMENTS` está vacío, pregunta el tema.
2. Lee `references/implemented-games.md` y `supabase/migrations/*.sql` para saber qué ids, categorías (`ARCADE`, `PUZZLE`, `SHOOTER`, `VERSUS`) y colores están ocupados.

### Fase 2 — Reparto

Define 3 ángulos creativos **distintos** para el tema (mecánica y categoría diferentes; p. ej. para "café": reflejos arcade, puzzle y shooter o versus) y 3 `game-id` únicos (slug en minúsculas con guiones) que no existan en `games` ni en `specs/game-jam/`. Cada juego debe verse neón/retro, ser competitivo por puntuación y caber en el HUD del contrato.

### Fase 3 — 3 agentes en paralelo

Lanza los 3 `Agent` con `subagent_type: "game-jam"` **en un solo mensaje**. A cada uno pásale: tema, su ángulo, su `game-id`, los otros dos ángulos, la fecha de hoy y los ids/colores ocupados. Pide que no pregunte al usuario.

### Fase 4 — Comprobación

Cuando vuelvan los 3, comprueba con `Glob` que existan `specs/game-jam/<game-id>/01-motor-<game-id>.md` y `02-plataforma-<game-id>.md` de cada juego. Si falta algo, reenvía el encargo al agente correspondiente. Comprueba que ningún `game-id`, `cover` ni color nuevo colisione con `games`.

### Fase 5 — Evaluación y elección del usuario

Puntúa cada juego de 1 a 5 en: competitivo por puntuación, cabe en 4:3, teclado, HUD del contrato, equilibrio de categoría y color, esfuerzo, estética neón y **fidelidad al tema**. Encaje = media a un decimal.

**Pregunta al usuario cuál se va a implementar.** No lo decides tú. Usa `AskUserQuestion` con los 3 juegos como opciones: pon primero tu recomendación con "(Recomendado)" y en cada descripción pon categoría, HUD, esfuerzo, encaje y riesgo principal. Espera la respuesta.

### Fase 6 — Veredicto

Escribe `specs/game-jam/<tema-slug>-veredicto.md` con:

- Tema y fecha.
- Tabla comparativa con puntuaciones.
- **Juego elegido por el usuario** y por qué (tu recomendación, si difiere, aparte); riesgos de cada juego.
- Colisiones entre propuestas (`sort_order`, color, prefijo de migración) a resolver al integrar el elegido.
- Enlaces a las 6 specs.
- Siguiente paso: revisar las 2 specs del elegido y, tras aprobarlas, copiarlas a `specs/NN-juego-<slug>.md`.

### Fase 7 — Respuesta

Muestra la tabla y el juego elegido, y **detente**: no copies las specs a `specs/`, no ejecutes `/spec-impl` ni implementes nada. La implementación la pide el usuario después.

## Reglas

- Solo creas archivos dentro de `specs/game-jam/`.
- La elección del juego es siempre del usuario.
- El orquestador no redacta las specs; las escriben los agentes.
- Cada juego lleva 2 specs: `01-motor-` y `02-plataforma-`.
