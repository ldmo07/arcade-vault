---
name: add-game
description: Redacta la spec para añadir un juego jugable con su leaderboard a Arcade Vault, portándolo desde references/started-games/ (Tetris, Arkanoid, etc.) o diseñándolo desde cero. Úsalo siempre que el usuario quiera crear, portar, integrar o hacer jugable un juego en la plataforma, o conectar un juego con puntuaciones y /salon, aunque no mencione la palabra "spec". Solo produce la spec; la implementación va con /spec-impl.
argument-hint: "nombre del juego o carpeta de references/started-games (ej. 03-tetris)"
allowed-tools: Read, Glob, Grep, Write, AskUserQuestion, Bash(ls:*), Bash(date:*)
---

# /add-game — Spec de un juego nuevo con leaderboard

## Contexto de sesión

Fecha de hoy (úsala en la cabecera de la spec, nunca la adivines):
!`date +%F`

Specs existentes:
!`ls specs/ 2>/dev/null || echo "No existe specs/"`

Juegos de referencia disponibles:
!`ls references/started-games/ 2>/dev/null || echo "No existe references/started-games/"`

Motores ya portados (si aparece `registry.ts`, el registro por id ya existe):
!`ls lib/games/ 2>/dev/null || echo "No existe lib/games/"`

---

Este skill convierte "quiero el juego X en la plataforma" en una spec lista para `/spec-impl`, siguiendo el patrón que fijaron SPEC 05 (motor en canvas) y SPEC 06 (Supabase y leaderboard). **No escribes código aquí**: solo `specs/NN-juego-<slug>.md`. Responde en el idioma del usuario (las specs del repo están en español).

El valor del skill está en que cada juego nuevo respete el mismo contrato; sin él, cada juego improvisa su HUD, su pausa y su guardado de puntuación.

## Fases

### Fase 1 — Contexto

1. Lee `CLAUDE.md`, `specs/05-juego-asteroides.md` y `specs/06-leaderboard-y-tabla-de-juegos.md`. Si hay specs de juegos posteriores, lee la más reciente.
2. Lee `references/game-contract.md`, `references/platform-integration.md` y `references/porting-guide.md` (en este directorio).
3. Lee `supabase/migrations/*.sql` para saber qué filas hay en `games`, y mira el contexto de sesión para saber si existe `lib/games/registry.ts`. Un juego puede mapear a una fila existente (p. ej. Tetris ↔ `caida`, Arkanoid ↔ `bloque-buster`, ya sembradas con `playable = false`).

Si `$ARGUMENTS` está vacío, pregunta qué juego quiere y si viene de `references/started-games/`.

### Fase 2 — Fuente del juego

- **Hay referencia** (el argumento o la respuesta coincide con una carpeta de `references/started-games/`): lee sus archivos y analízala con el checklist de `porting-guide.md`. Presenta un resumen corto: controles, qué es HUD/overlay/pausa propios, puntuación, vidas/nivel, assets, tamaño de canvas.
- **No hay referencia**: haz la entrevista de diseño de `porting-guide.md` (mecánica, controles, puntuación, fin de partida, progresión) antes de pasar a la Fase 3.

### Fase 3 — Preguntas

Usa `AskUserQuestion` en bloques de 3 a 4, recomendación primero. No preguntes lo que ya contesta el contrato o la referencia. Cubre:

- Fila en `games`: reutilizar la existente o crear una nueva (slug, `cat`, `color`, `sort_order`).
- Métricas del HUD que el motor reporta además de `onScore`/`onGameOver` (vidas, nivel, líneas…).
- Qué se elimina del original (HUD, overlay de game over, pausa propia, reinicio por tecla) y qué se conserva.
- Assets, sonido, entrada por ratón o táctil: dentro o fuera de alcance.
- Encaje visual en `.crt-screen` (4:3) si el canvas original no es 800×600; fidelidad al original vs paleta neón.
- Cualquier idea grande que surja (multijugador, niveles editables): propón spec aparte.

Para cuando termines debes poder responder sin suponer: qué archivos aparecen o cambian, cuál es el primer y último paso, y cómo se verifica. Si no, sigue preguntando.

### Fase 4 — Escribir y guardar

0. **Antes de crear el archivo, lee el skill `/spec`**: `.claude/skills/spec/SKILL.md` y `.claude/skills/spec/template.md` (si no existen, usa `.agents/skills/spec/`). Esa es la fuente de verdad de cómo se escribe una spec en este repo; si contradice a `template.md` de este skill, gana `/spec` en estructura, estados, numeración, reglas del documento y paso de `specs/.spec-config.yml`, y este skill aporta el contenido específico del juego. Si ninguno de los dos existe, avisa al usuario y sigue con `template.md` de este directorio.
1. Número siguiente según el listado de `specs/`, con dos dígitos; slug `NN-juego-<slug>.md`.
2. Rellena `template.md` (en este directorio) con datos reales del juego, respetando el formato que acabas de leer en `/spec`. Estado `Borrador`, `Depends on: SPEC 05, SPEC 06` (más las specs de juego previas si aportan algo), fecha del contexto de sesión.
3. Incluye siempre el paso del registro por id si `lib/games/registry.ts` no existe, y los criterios de leaderboard de `platform-integration.md`.
4. Comprueba que cada spec referenciada exista en `specs/`.
5. Escribe el archivo sin pedir permiso. Si el destino existe, pregunta. Si `specs/.spec-config.yml` no existe, créalo como indica `/spec` (si existe, no lo toques).
6. Confirma: ruta creada, estado `Borrador` (el usuario la pasa a `Aprobado` tras revisarla) y siguiente paso `/spec-impl NN-juego-<slug>`. **Detente ahí**: no propongas implementar.

## Reglas

- Nunca escribas código de la app; solo la spec. Los fragmentos en la spec son firmas e interfaces cortas.
- Los criterios de aceptación son booleanos y verificables; nada de "funciona bien".
- No inventes controles, puntuaciones ni constantes: salen de la referencia o de las respuestas del usuario.
- No modifiques `references/`; la spec indica qué se porta y qué se descarta.
- Si el juego implica más de tres áreas nuevas (p. ej. multijugador + backend + juego), propón dividirlo en varias specs.
