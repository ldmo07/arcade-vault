# Guía de portado y entrevista de diseño

## Checklist para analizar un juego de `references/started-games/<carpeta>`

Lee todos los archivos de la carpeta (no modifiques ninguno) y responde:

1. **Controles:** teclas (`e.key` vs `e.code`), ratón, táctil.
2. **HUD:** ¿se dibuja en el canvas o en el DOM (`getElementById`)? En la plataforma lo muestra `GamePlayer`: lista qué métricas hay (puntos, vidas, nivel, líneas, siguiente pieza…).
3. **Overlays:** game over, victoria, pausa, selector de nivel, reinicio por tecla. Se eliminan del canvas; React los sustituye.
4. **Pausa propia:** teclas `P`/`Esc`, que se descartan (la pausa es solo `setPaused`).
5. **Puntuación:** reglas exactas y tope posible frente a `score <= 10000000`.
6. **Fin de partida:** condición y si hay vidas.
7. **Assets y audio:** spritesheets, `new Audio(...)`. Decidir si entran (`public/games/<slug>/`).
8. **Tamaño del canvas:** si no es 4:3 (800×600 encaja en `.crt-screen`), decidir letterbox, ajuste del mundo o canvas auxiliar.
9. **Estado global y DOM:** variables globales, `document.*`, temas, botones: se convierten en estado interno del motor o se descartan.
10. **Tiempo:** `setInterval` o `Date.now` → migrar a `dt` con rAF y límite de 0.05 s.

## Notas de las referencias actuales

- **02-asteroids:** ya portado (SPEC 05). Es la plantilla.
- **03-tetris** (`caida`): canvas `#board` 300×600 y `#next-canvas` 120×120; HUD (score, lines, level, next) en el DOM; overlay y tema en DOM; sin vidas; nivel cada 10 líneas; puntos 100/300/500/800 × nivel; controles ← → ↑/X ↓ Espacio y `P` para pausa. Decidir: encaje del canvas no 4:3, dónde mostrar "siguiente pieza" (callback `onNext` o dibujada en el canvas) y callbacks `onLines`/`onLevel`.
- **04-arkanoid** (`bloque-buster`): canvas 800×600; HUD y overlays en canvas; 3 vidas, 5 niveles en `levels.js`; ratón y flechas; pausa con `P`/`Esc` y selector de nivel; sonidos y spritesheet. Decidir: assets y audio, ratón relativo al canvas escalado, fuera el selector de nivel.

## Entrevista para un juego sin referencia

Pregunta (con `AskUserQuestion`, recomendación primero):

1. Mecánica en una frase y objetivo.
2. Controles (teclado; ratón/táctil fuera de alcance salvo que se pida).
3. Puntuación: eventos que suman y cuánto.
4. Fin de partida: vidas, tiempo o condición de derrota.
5. Progresión: niveles, dificultad creciente.
6. Estilo visual: vectorial blanco/negro, pixel o paleta neón.

Con las respuestas, la spec describe entidades, constantes y reglas con nombres concretos (no deja valores "a decidir").
