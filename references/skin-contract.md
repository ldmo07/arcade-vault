# Contrato de skins

Lo mantiene el subagente `skin-designer` (`.claude/agents/skin-designer.md`). Cada juego jugable tiene al menos 3 skins: `clasico` (default, aspecto original), `neon` y `retro`, todas legibles sobre fondo oscuro.

## Infraestructura común

- `lib/games/skins.ts`:
  - `type SkinId = "clasico" | "neon" | "retro"`, `SKIN_IDS`, `DEFAULT_SKIN = "clasico"`, `SKIN_LABELS` (`CLÁSICO`, `NEÓN`, `RETRO`), `isSkinId`.
  - `loadSkin(gameId)` / `saveSkin(gameId, id)` con localStorage `av_skin_<gameId>` dentro de try/catch (puede fallar o estar vacío; si falla se usa `DEFAULT_SKIN`).
  - `subscribeSkin(cb)` para leer la skin con `useSyncExternalStore` (servidor e hidratación usan `DEFAULT_SKIN`, sin desajuste).
- `lib/games/registry.ts`: `GameCanvasProps` gana `skin?: SkinId`; `GameRegistryEntry` gana `skins?: boolean`. Solo los juegos con `skins: true` muestran el selector.
- `components/game-player.tsx`: selector como lista desplegable (`<select id="skin-select" class="skin-select">` nativo con `<label>` "Skin") dentro de `.player-hud`, con una `<option>` por skin y etiquetas con tilde (`SKIN_LABELS`; el control usa la fuente mono, no la pixel, que no tiene Á/Ó). Alto mínimo 44 px y foco visible (estilos `.skin-select` en `app/globals.css`). Al cambiar, el select pierde el foco para que las flechas vuelvan a controlar el juego. La elección se guarda por juego y se aplica en caliente sin reiniciar la partida.

## Por juego

- `lib/games/<slug>/skins.ts`: `interface <Game>Palette` con todos los colores que pinta el motor y `SKINS: Record<SkinId, <Game>Palette>`. `clasico` reproduce exactamente el visual original.
- Motor: recibe la paleta al crearse y expone `setPalette(palette)` en el handle. No cambia la lógica de juego.
- Wrapper: lee `skin` (por defecto `DEFAULT_SKIN`), crea el motor con `SKINS[skin]` y llama a `setPalette` cuando cambia.
- Sprites (`bloque-buster`, `serpentina`): la skin cambia fondo, rejilla, bordes, texto y efectos; tintar el sprite es opcional.

## Identidad

- **Clásico**: lo actual.
- **Neón**: glow con `shadowBlur`, colores del sitio (cyan `#00f5ff`, magenta `#ff006e`, amarillo `#f5ff00`, verde `#00ff88`) sobre `--bg` `#0a0a0f`.
- **Retro**: paleta limitada tipo 8-bit/fósforo, sin glow, bordes duros (`lineJoin: "miter"`, `lineCap: "butt"`).

## Validación en oscuro

- Fondo de referencia: el de la skin (o `#000` del `.crt-screen`), también con scanlines (`.crt-screen::after` oscurece al 82 % las franjas alternas).
- Elementos de juego ≥ 3:1; texto dibujado en canvas ≥ 4.5:1 (WCAG).
- Entidades distinguibles no solo por tono (forma, texto, tamaño).
- El contraste mínimo medido por skin se registra en `references/game-with-themes.md`.
