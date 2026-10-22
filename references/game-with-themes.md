# Juegos con skins

Registro de qué juegos tienen las 3 skins obligatorias: `clasico` (default), `neon` y `retro`. Lo mantiene el subagente `skin-designer` (`.claude/agents/skin-designer.md`), que trabaja un solo juego por invocación y solo actualiza la fila de ese juego.

Leyenda: ✅ implementada y validada en oscuro · ❌ pendiente.

| Juego         | Clásico | Neón | Retro | Contraste mín.                                                                  | Fecha      | Notas                                                                                                                                                                                                    |
| ------------- | ------- | ---- | ----- | ------------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| asteroides    | ✅      | ✅   | ✅    | Clásico 4.37 · Neón 3.63 · Retro 6.37 (con scanlines; texto ≥ 7.37)             | 2026-10-22 | Vectorial, sin sprites. Mínimos: llama del propulsor (clásico), rocas magenta (neón), rocas verdes (retro). Primer juego con selector                                                                    |
| caida         | ❌      | ❌   | ❌    | –                                                                               | –          |                                                                                                                                                                                                          |
| bloque-buster | ✅      | ✅   | ✅    | Clásico 3.24 · Neón 3.08 · Retro 4.70 (medido en píxeles, con scanlines)        | 2026-10-22 | Sprites y ratón. Sin texto en canvas. Mínimo: fila morada en las 3. Neón: glow por bloque, paredes magenta, rejilla. Retro: spritesheet teñido (bloques verde fósforo, paleta/bola ámbar), sin suavizado |
| serpentina    | ✅      | ✅   | ✅    | Clásico 2.22 (original, tablero claro) · Neón 3.45 · Retro 6.01 (con scanlines) | 2026-10-22 | Sprite de frutas sin tintar; en neón/retro lleva marco (aro magenta / cuadro ámbar). Clásico idéntico al original: serpiente azul sobre verde claro < 3:1 y chevron blanco casi invisible, no se tocó    |
