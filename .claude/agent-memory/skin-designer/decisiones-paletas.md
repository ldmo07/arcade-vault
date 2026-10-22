---
name: decisiones-paletas
description: Decisiones de diseño de las skins neón/retro por juego y criterio de medición de contraste con scanlines
metadata:
  type: project
---

Criterio de contraste: se mide contra el fondo de la skin y también con scanlines (color × 0.82, `.crt-screen::after`); en la tabla se registra el peor de los dos.

**asteroides** (2026-10-22):

- Neón: fondo `--bg` #0a0a0f, nave cyan, rocas magenta, disparos/llama amarillos, power-up y texto verdes, `shadowBlur` 12. El magenta es el límite (3.63 con scanlines): no oscurecerlo.
- Retro: fósforo verde (#020a04 fondo, nave #7cff6b, rocas #33cc33, balas #e0ffd8) con ámbar #ffb000 para lo especial (power-up, propulsor, texto). Sin glow, `lineJoin: miter`.
- Las entidades se distinguen por forma (triángulo, polígono, rombo con "3x"), así que el tono es secundario.

**serpentina** (2026-10-22):

- Las frutas son sprites sin tintar; en skins oscuras se dibuja un marco detrás (`fruitFrame`: aro magenta en neón, cuadro ámbar en retro) porque berenjena/uvas se pierden sobre fondo oscuro.
- Neón: tablero ajedrezado #0a0a0f/#11111a, serpiente cyan con glow, ojos oscuros con pupila amarilla, chevron amarillo. Retro: tablero #020a04/#06140a, serpiente #33cc33 con `lineCap: square` + `miter` (bloques), ojos cuadrados.
- Clásico (Snake de Google, tablero claro) no cumple 3:1 (serpiente 2.22, chevron ~1.0), pero el contrato exige conservarlo idéntico: se registra como excepción, no se corrige.

**bloque-buster** (2026-10-22):

- Los nombres `BlockColor` no coinciden con el tono del sprite: `cyan` pinta verde azulado, `green` azul, `hotpink` naranja, `magenta` morado. El glow neón se asigna por tono visible.
- Neón: glow por bloque, paredes magenta (solo izq./arriba/der., abajo no hay pared), rejilla cyan tenue, paleta cyan, bola amarilla. Retro: spritesheet teñido con modo "color" (bloques #33ff33, paleta/bola #ffb000) + contorno #7cff6b y `imageSmoothingEnabled = false`.
- La fila morada es el mínimo en las 3 skins (≈3.1-3.2 con scanlines): no oscurecer fondos de neón/clásico.

**Why:** mantener coherencia entre juegos: neón = colores del sitio; retro = fósforo/8-bit limitado.
**How to apply:** reutilizar esta identidad (cyan jugador, magenta enemigos, amarillo proyectiles, verde extras en neón; verde + ámbar en retro) salvo que el usuario pida otra cosa.

Relacionado: [[trampas-motores]]
