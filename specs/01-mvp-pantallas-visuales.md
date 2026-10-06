# SPEC 01 — MVP visual: todas las pantallas de Arcade Vault

> **Status:** Implementado
> **Depends on:** ninguna
> **Date:** 2026-10-06
> **Objective:** Portar a Next.js (App Router) las 5 pantallas de `references/templates/` (biblioteca, detalle, reproductor, auth y salón de la fama) como MVP solo visual, con datos mock y sin implementar ningún juego.

---

## Por qué existe esta spec

`references/templates/` contiene un prototipo en React por CDN (`Arcade Vault.html` + `.jsx`) con navegación por hash. El proyecto real es Next 16 con App Router y TypeScript estricto, y `app/globals.css` ya contiene los estilos del template (`.av-nav`, `.card`, `.podium`, `.crt-screen`, `.auth-card`, etc.) y `app/layout.tsx` ya carga las fuentes y los fondos `.av-bg` / `.av-noise`. Esta spec convierte el prototipo en rutas reales sin cambiar su diseño.

---

## Alcance

**Dentro:**

- 5 rutas del App Router: `/` (Biblioteca), `/juegos/[id]` (Detalle), `/juegos/[id]/jugar` (Reproductor), `/auth` (Iniciar sesión / Crear cuenta) y `/salon` (Salón de la Fama).
- Navbar compartida (logo, links, contador de créditos, botón de sesión, menú móvil) y footer, montados en `app/layout.tsx`.
- Biblioteca: hero, búsqueda por nombre, chips de categoría, grilla de tarjetas con efecto tilt, estado "NO HAY RESULTADOS".
- Detalle: portada, tags, descripción, estadísticas, botones y leaderboard de 10 filas.
- Reproductor: HUD (jugador, puntuación, vidas, nivel), botones PAUSA/REANUDAR, FIN y SALIR, marco CRT con arena decorativa, puntuación simulada, overlay de pausa y modal de "FIN DEL JUEGO" con guardado de puntuación.
- Auth: tabs "INICIAR SESIÓN" / "CREAR CUENTA", formulario, "JUGAR COMO INVITADO", botones sociales (solo visuales).
- Salón de la Fama: tabs por juego, podio top 3, tabla de 12 filas y fila "TU MEJOR MARCA" cuando hay sesión.
- Datos mock tipados portados de `data.jsx` (8 juegos, categorías, ranking sembrado determinista).
- Sesión falsa y puntajes guardados en `localStorage` (como el template).
- Diseño responsive (menú hamburguesa en móvil) conforme a los estilos ya existentes.

**Fuera de alcance (para futuras specs):**

- Cualquier lógica real de juego (los 8 juegos).
- Autenticación real, backend, base de datos, OAuth real (Google/GitHub).
- Mezclar los puntajes guardados en `av_scores` dentro del Salón de la Fama o del leaderboard.
- Tests automatizados (el proyecto no tiene test runner).
- Internacionalización: la UI queda solo en español.
- Modificar el diseño visual o los estilos del template.

---

## Modelo de datos

Se portan a TypeScript las estructuras de `references/templates/data.jsx` y `app.jsx`.

```ts
// lib/data.ts
export type Category = "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";
export type GameColor = "cyan" | "magenta" | "yellow" | "green";

export interface Game {
  id: string;        // slug de la ruta, ej. "bloque-buster"
  title: string;
  short: string;
  long: string;
  cat: Category;
  cover: string;     // clase CSS existente, ej. "cover-bricks"
  color: GameColor;
  best: number;
  plays: string;     // ya formateado, ej. "12.4K"
}

export interface ScoreRow {
  rank: number;
  name: string;
  score: number;
  date: string;      // "DD/MM/2026"
}

export const GAMES: Game[];                      // 8 juegos, mismos datos que el template
export const CATS: readonly ["TODOS", ...Category[]];
export function seededScores(seed: number, count?: number): ScoreRow[];

// lib/session.tsx (cliente)
export interface SessionUser { name: string }    // MAYÚSCULAS, máx. 10 caracteres
export interface SavedScore { game: string; score: number; name: string; at: number }
```

Convenciones:

- Claves de `localStorage`: `av_user` (`SessionUser | null`) y `av_scores` (`SavedScore[]`), idénticas al template.
- Semillas del ranking: Salón usa `tab.length * 23 + 7` con 12 filas; Detalle usa `id.length * 17 + 3` con 10 filas.
- Números con `toLocaleString("es-ES")`.
- El contador de créditos es texto fijo `03`.

---

## Plan de implementación

Antes de empezar: leer `node_modules/next/dist/docs/01-app` (Next 16: `params` es una `Promise`, helpers de tipos globales como `PageProps`) y aplicar `/ui-ux-pro-max` según `CLAUDE.md`.

1. Crear `lib/data.ts` con tipos, `GAMES`, `CATS` y `seededScores`. Verificación: `npm run lint` sin errores.
2. Crear `lib/session.tsx` (`SessionProvider` + hook `useSession` con `user`, `login`, `signOut`, `saveScore`). Leer `localStorage` dentro de `useEffect` para evitar errores de hidratación. Montarlo en `app/layout.tsx`.
3. Crear `components/nav.tsx` (cliente; link activo según `usePathname`, menú móvil con backdrop) y footer en `app/layout.tsx`, dentro de `<main className="av-main">`. Verificación: `npm run dev`, navbar y footer visibles en `/`.
4. Crear `components/game-card.tsx` (cliente, tilt) y `components/library.tsx` (cliente, búsqueda + chips). Reemplazar `app/page.tsx` por la Biblioteca. Verificación: filtrar por texto y categoría; clic en tarjeta navega a `/juegos/[id]` (aún 404).
5. Crear `app/juegos/[id]/page.tsx` (servidor, `generateStaticParams`, `notFound()` si el id no existe) con la pantalla de Detalle. Verificación: `/juegos/caida` muestra datos y leaderboard.
6. Crear `components/game-player.tsx` y `app/juegos/[id]/jugar/page.tsx` con HUD, pausa, FIN, modal y guardado vía `saveScore`. Verificación: puntuación sube sola, pausa la detiene, FIN abre el modal, guardar muestra "PUNTUACIÓN GUARDADA_".
7. Crear `components/auth-form.tsx` y `app/auth/page.tsx`. Verificación: entrar con usuario fija `av_user` y la navbar muestra el nombre.
8. Crear `components/hall-of-fame.tsx` y `app/salon/page.tsx` con tabs, podio, tabla y fila "TU MEJOR MARCA". Verificación: cambiar de juego cambia el ranking.
9. Actualizar `metadata` por ruta (títulos) y `npm run build` sin errores de tipos.

---

## Criterios de aceptación

- [x] `npm run lint` y `npm run build` terminan sin errores.
- [x] Existen las rutas `/`, `/juegos/[id]`, `/juegos/[id]/jugar`, `/auth` y `/salon`, y cada una renderiza sin errores en la consola del navegador.
- [x] `/juegos/no-existe` y `/juegos/no-existe/jugar` devuelven la página 404.
- [x] La Biblioteca muestra 8 tarjetas; el chip "SHOOTER" deja exactamente 2 (INVASORES y ROCAS).
- [x] Buscar "xyz" en la Biblioteca muestra "NO HAY RESULTADOS".
- [x] Clic en una tarjeta o en su botón JUGAR lleva a `/juegos/<id>`; el botón "JUGAR AHORA" lleva a `/juegos/<id>/jugar`.
- [x] Detalle muestra 10 filas de leaderboard y los valores `plays` y `best` del juego.
- [x] En el Reproductor la puntuación aumenta sola, PAUSA la detiene y muestra "EN PAUSA", y REANUDAR la retoma.
- [x] FIN abre el modal "FIN DEL JUEGO"; GUARDAR PUNTUACIÓN agrega una entrada a `av_scores` en `localStorage` y muestra "PUNTUACIÓN GUARDADA_".
- [x] "JUGAR DE NUEVO" reinicia puntuación, vidas y nivel (3 vidas, nivel 01, puntuación 0).
- [x] Iniciar sesión con el usuario "kai" guarda `av_user = {"name":"KAI"}`, redirige a `/` y la navbar muestra "KAI ▾".
- [x] "JUGAR COMO INVITADO" redirige a `/` sin sesión.
- [x] Recargar la página conserva la sesión sin warnings de hidratación en consola.
- [x] El Salón muestra 8 tabs, podio con 3 posiciones y 12 filas; la fila "TU MEJOR MARCA" solo aparece con sesión.
- [x] A 375 px de ancho la navbar muestra el botón hamburguesa y el panel móvil abre y cierra; no hay scroll horizontal.
- [x] El link activo de la navbar es "Biblioteca" en `/`, `/juegos/*` y su reproductor, y "Salón de la Fama" en `/salon`.

---

## Decisiones

- **Sí:** rutas reales del App Router. Permiten enlaces directos, `notFound()` y generación estática; el hash del template era un artefacto del prototipo CDN.
- **No:** SPA con estado de ruta en el hash. Va contra las convenciones de Next y pierde SSR.
- **Sí:** mantener la simulación del reproductor (puntaje aleatorio, modal de fin). Permite validar el flujo completo jugar → guardar sin tener juegos.
- **No:** reproductor solo con "PRÓXIMAMENTE". Dejaría sin cubrir el modal y el guardado de puntajes presentes en el template.
- **Sí:** `localStorage` con las claves `av_user` y `av_scores`. Es lo que usa el template y no requiere backend.
- **No:** sesión solo en memoria. Se perdería al recargar y rompería el flujo de "TU MEJOR MARCA".
- **Sí:** datos mock tipados en `lib/data.ts` y ranking sembrado determinista. Renderizado estable entre servidor y cliente.
- **No:** mezclar `av_scores` en el Salón. Se difiere hasta tener backend y puntajes reales.
- **Sí:** reutilizar `app/globals.css` sin cambios de diseño. El pedido es portar, no rediseñar.
- **Sí:** componentes cliente solo donde hay estado o eventos (nav, biblioteca, tarjeta, reproductor, auth, salón); Detalle queda como componente de servidor.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Next 16 difiere de versiones anteriores (`params` asíncrono, helpers de tipos) | Leer `node_modules/next/dist/docs/01-app` antes de escribir las páginas dinámicas. |
| Hidratación: `localStorage` no existe en el servidor | Leer la sesión en `useEffect` y renderizar estado "sin sesión" en el primer render. |
| `localStorage` bloqueado (modo privado) | Envolver lecturas/escrituras en `try/catch`; la app sigue funcionando sin persistir. |
| `Math.random` en el reproductor causa desajuste servidor/cliente | Usarlo solo dentro de `setInterval` en un efecto del cliente. |
| `app/layout.tsx` ya envuelve los hijos en `<div id="root">`; el template asumía otro contenedor | Mantener `#root` y colocar navbar, `<main className="av-main">` y footer dentro. |

---

## Lo que **no** está en esta spec

- Ningún juego jugable (ni Bloque Buster, ni Caída, etc.).
- Backend, base de datos o autenticación real (incluidos Google y GitHub).
- Puntajes reales en el Salón o en el leaderboard del Detalle.
- Tests automatizados.
- Cambios al diseño visual o nuevos estilos.

Cada uno de estos, si se aborda, va en su propia spec.
