---
name: trampas-motores
description: Trampas al refactorizar motores/wrapper para skins (hook eslint --fix, CRLF, fuente pixel sin tildes, Supabase inalcanzable al verificar)
metadata:
  type: feedback
---

Trampas encontradas al añadir skins (primera vez: asteroides, 2026-10-22).

- **Hook PostToolUse ejecuta eslint --fix tras cada Edit**: si declaras `let palette` antes de añadir `setPalette`, `prefer-const` la convierte en `const` y rompe tsc. **How to apply:** añade la asignación en el mismo paso o revisa `let` tras editar.
- **Archivos con CRLF**: los reemplazos multilínea con `node -e`/`sed` fallan; usa la herramienta Edit.
- **Press Start 2P no tiene Á/Ó mayúsculas** (Ñ sí): "CLÁSICO" se ve "CLASICO" y "NEÓN" como "NEóN". **How to apply:** cualquier control con etiquetas de skin usa la fuente mono (`--mono`), como el `.skin-select`, para mostrar `SKIN_LABELS` con tilde.
- **Capturas por elemento de `.player-hud`** salen recortadas por arriba (se solapa la cabecera fija). **How to apply:** usar `page.screenshot({ clip })` con margen alrededor del HUD.
- **Select con foco roba las flechas**: el motor ignora teclas si el foco está en un SELECT. **How to apply:** `blur()` en `onChange`.
- **Supabase no es alcanzable desde la máquina** (ni dentro ni fuera del sandbox) y `/juegos/[id]/jugar` da 500. **How to apply:** verificar con un mock PostgREST en el scratchpad (`/rest/v1/games` devuelve array) y `next dev` con `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:<puerto>`; `playwright-core` instalado en el scratchpad con `executablePath` en `%LOCALAPPDATA%/ms-playwright/chromium-1228/chrome-win64/chrome.exe`. No hay Python (la skill ui-ux-pro-max se consulta con grep sobre sus CSV).
- **Verificación visual rápida sin Supabase ni next dev** (serpentina, 2026-10-22): empaquetar con `esbuild` (en el scratchpad) un entry que importe `entities.ts` + `skins.ts` del repo por ruta absoluta y llame a `draw(...)` con cada paleta en canvases de una página `file://`; capturar con `playwright-core` (`--allow-file-access-from-files` para el sprite). Útil cuando otro agente usa el dev server en paralelo.
- **Motores que nacen tras cargar un sprite** (serpentina, bloque-buster): la skin inicial va en un ref que se actualiza en el effect `[skin]`, para que el motor creado en `img.onload` use la skin vigente y no la del primer render.
- Wrapper: la skin inicial se guarda en `useRef(skin)` para no recrear el motor; los cambios van por un effect `[skin]` → `setPalette`. La skin se lee en GamePlayer con `useSyncExternalStore` (servidor = `DEFAULT_SKIN`) para evitar desajustes de hidratación.

- **Motores con sprites que nacen al cargar la imagen** (bloque-buster): el motor puede crearse después de un cambio de skin, así que el wrapper usa un `skinRef` actualizado en el effect `[skin]`, no la skin inicial. Las copias teñidas del spritesheet se cachean por tinte.
- **Medir contraste en píxeles reales**: con sprites, `getImageData` del canvas vía Playwright (mediana por bloque) es más fiable que calcular a mano. Ojo con muestrear el fondo sobre una línea de la rejilla o incluir el borde al buscar la paleta.
- Si ya hay un `next dev` en :3000 (usuario u otro agente), reutilízalo para verificar en vez de arrancar otro ni `npm run build` (bloqueo de `.next`).

Relacionado: [[decisiones-paletas]]
