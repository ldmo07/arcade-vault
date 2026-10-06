# SPEC 02 — Home (landing) de Arcade Vault

> **Status:** Aprovado
> **Depends on:** SPEC 01
> **Date:** 2026-10-06
> **Objective:** Implementar la landing page en `/` según `references/templates/home-about/home.jsx`, mover la Biblioteca a `/games` y añadir "Inicio" y un "Acerca de" deshabilitado a la navbar, sin implementar la página About.

---

## Por qué existe esta spec

`references/templates/home-about/` agrega al prototipo una landing (`home.jsx`) y una página About (`about.jsx`). En SPEC 01 la ruta `/` es la Biblioteca. Esta spec convierte `/` en el Home y reubica la Biblioteca, lo que obliga a tocar navegación existente. About queda para otra spec.

---

## Alcance

**Dentro:**

- Ruta `/` con el Home: hero, "¿POR QUÉ ARCADE VAULT?", "JUEGOS DISPONIBLES AHORA", stats, "ACTIVIDAD EN VIVO" (últimas puntuaciones + top jugadores), "PRECIOS" con FAQ y CTA final.
- Silhouettes SVG flotantes del hero (8 formas) y los 4 iconos pixel de las feature cards.
- Reveal on scroll (clase `.reveal` + `IntersectionObserver`) en las secciones del Home.
- Mover la Biblioteca de `/` a `/games` (el código de `components/library.tsx` no cambia).
- Navbar (escritorio y panel móvil): links "Inicio" (`/`), "Biblioteca" (`/games`), "Salón de la Fama" (`/salon`) y "Acerca de" deshabilitado (sin ruta).
- Actualizar todos los enlaces internos que apuntaban a la Biblioteca en `/` para que apunten a `/games`.
- Portar a `app/globals.css` los estilos del Home, Actividad y Precios de `references/templates/home-about/styles.css`.
- Datos mock del Home en `lib/home-data.ts`.

**Fuera de alcance (para futuras specs):**

- La página About y la ruta `/about` (incluido el gamepad interactivo y sus estilos `GAMEPAD`, `ABOUT PAGE`, temas y floaters).
- Que "Acerca de" navegue a algún sitio.
- Datos reales de actividad, jugadores o estadísticas (todo es mock estático).
- Modificar el diseño visual del template.
- Tests automatizados.

---

## Modelo de datos

```ts
// lib/home-data.ts
import type { GameColor } from "@/lib/data";

export interface Feature {
  icon: "GAMEPAD" | "FREE" | "TROPHY" | "ROCKET";
  title: string;
  desc: string;
  color: GameColor;
}

export interface HomeStat { n: string; unit: string; sub: string }

export interface RecentScore {
  player: string;
  game: string;
  score: number;
  when: string;      // ya formateado, ej. "hace 2 min"
  color: GameColor;
}

export interface TopPlayer { rank: number; player: string; score: number }

export const FEATURES: Feature[];          // 4 items
export const HOME_STATS: HomeStat[];       // 3 items
export const RECENT_SCORES: RecentScore[]; // 7 items
export const TOP_PLAYERS: TopPlayer[];     // 5 items
```

Convenciones:

- Los valores son los mismos que el array literal de `home.jsx`.
- Las mini-cards usan `GAMES.slice(0, 6)` de `lib/data.ts`; no se duplica ese dato.
- Números con `toLocaleString("es-ES")`.
- Este feature no agrega persistencia ni claves de `localStorage`.

---

## Plan de implementación

Antes de empezar: leer `node_modules/next/dist/docs/01-app` y aplicar `/ui-ux-pro-max` según `CLAUDE.md`.

1. Mover la Biblioteca: crear `app/games/page.tsx` con `<Library />` (y su `metadata`), y dejar `app/page.tsx` temporalmente igual. Verificación: `/games` muestra la Biblioteca.
2. Actualizar enlaces: en `components/nav.tsx` cambiar "Biblioteca" a `/games` y `isLibrary` a `pathname.startsWith("/games") || pathname.startsWith("/juegos")`; revisar todos los `href="/"` de `components/game-player.tsx`, `components/hall-of-fame.tsx` y `app/juegos/[id]/page.tsx` que signifiquen "volver a la biblioteca" y apuntarlos a `/games`. Los `router.push("/")` de `components/auth-form.tsx` se mantienen (van al Home). Verificación: `npm run lint`; SALIR del reproductor lleva a `/games`.
3. Agregar a la navbar el link "Inicio" (`/`, activo solo con `pathname === "/"`) y "Acerca de" deshabilitado (elemento no enlazable con `aria-disabled="true"`, sin navegación), en escritorio y panel móvil. El logo apunta a `/`. Verificación: `npm run dev`, 4 items en la navbar y en el panel móvil.
4. Portar a `app/globals.css` las secciones `HOME PAGE`, `ACTIVITY` y `PRICING` de `references/templates/home-about/styles.css`, más un bloque `@media (prefers-reduced-motion: reduce)` que desactive `.reveal`, silhouettes y ticker. No copiar `ABOUT PAGE` ni `GAMEPAD`. Verificación: `npm run build` sin errores de CSS.
5. Crear `lib/home-data.ts` con los tipos y constantes. Verificación: `npm run lint`.
6. Crear `components/reveal.tsx` (cliente): wrapper que aplica `.reveal` y añade `.in` con `IntersectionObserver` (umbral 0.12, `unobserve` tras revelar). Si `IntersectionObserver` no existe, muestra el contenido sin animar. Verificación: tipos correctos, sin uso aún.
7. Crear `components/home/silhouettes.tsx` y `components/home/feature-icon.tsx` (servidor, SVG portados tal cual, `aria-hidden` en las silhouettes). Verificación: `npm run lint`.
8. Crear `components/home/mini-card.tsx` (`Link` a `/juegos/[id]` con la misma estructura `.mini-card`). Verificación: `npm run lint`.
9. Reemplazar `app/page.tsx` por el Home (servidor) componiendo las secciones del template con `Link` en lugar de `navigate`: EXPLORAR JUEGOS y VER TODOS LOS JUEGOS → `/games`; CREAR CUENTA, EMPEZAR GRATIS → `/auth`; VER SALÓN → `/salon`; INSERTAR MONEDA → `/games`; mini-cards → `/juegos/<id>`. Envolver con `Reveal` las secciones con `.reveal`. Verificación: `/` se ve como el template y todos los CTAs navegan.
10. Actualizar `metadata` de `/` (título del Home) y correr `npm run lint` y `npm run build`.

---

## Criterios de aceptación

- [ ] `npm run lint` y `npm run build` terminan sin errores.
- [ ] `/` renderiza el Home con 6 secciones (hero, por qué, juegos, stats + actividad, precios, CTA final) sin errores en la consola.
- [ ] `/games` renderiza la Biblioteca de SPEC 01: 8 tarjetas, el chip "SHOOTER" deja 2, buscar "xyz" muestra "NO HAY RESULTADOS".
- [ ] No existe la ruta `/about`: `/about` devuelve 404.
- [ ] La navbar muestra "Inicio", "Biblioteca", "Salón de la Fama" y "Acerca de", en escritorio y en el panel móvil.
- [ ] "Acerca de" no navega al hacer clic, tiene `aria-disabled="true"` y no es enfocable como enlace.
- [ ] "Inicio" está activo solo en `/`; "Biblioteca" está activo en `/games`, `/juegos/*` y el reproductor; "Salón de la Fama" lo está en `/salon`.
- [ ] El hero muestra las 8 silhouettes y la sección "¿POR QUÉ…" muestra 4 feature cards con su icono.
- [ ] "JUEGOS DISPONIBLES AHORA" muestra 6 mini-cards (las primeras 6 de `GAMES`); clic en una lleva a `/juegos/<id>`.
- [ ] "ÚLTIMAS PUNTUACIONES" muestra 7 filas y "TOP JUGADORES · HOY" muestra 5 filas, con la fila #01 como `top1`.
- [ ] EXPLORAR JUEGOS, VER TODOS LOS JUEGOS e INSERTAR MONEDA llevan a `/games`; CREAR CUENTA y EMPEZAR GRATIS llevan a `/auth`; VER SALÓN lleva a `/salon`.
- [ ] Las secciones `.reveal` empiezan ocultas y reciben la clase `in` al entrar en el viewport.
- [ ] Con `prefers-reduced-motion: reduce` las secciones se ven completas sin animación.
- [ ] SALIR en el reproductor y el botón de regreso del Salón llevan a `/games`; iniciar sesión o "JUGAR COMO INVITADO" redirige a `/`.
- [ ] A 375 px de ancho no hay scroll horizontal en `/`.
- [ ] `app/globals.css` no contiene los selectores `.about-*` ni los del gamepad.

---

## Decisiones

- **Sí:** Biblioteca en `/games`. Decisión del usuario; libera `/` para la landing.
- **No:** dejar la Biblioteca en `/` y poner el Home en otra ruta. La landing debe ser la entrada del sitio.
- **Sí:** mantener `/juegos/[id]` sin renombrar. Renombrar rutas existentes queda fuera de esta spec, aunque deje `/games` y `/juegos` conviviendo.
- **Sí:** link "Acerca de" visible pero deshabilitado. Decisión del usuario; mantiene el diseño de 4 items del template sin crear la ruta.
- **No:** omitir "Acerca de" de la navbar. Se descartó para conservar la navbar final desde ya.
- **Sí:** datos mock estáticos en `lib/home-data.ts` y `GAMES.slice(0, 6)` para las mini-cards. Igual que el template y sin duplicar datos.
- **No:** derivar "Top jugadores" de `seededScores`. Se aparta del template y no aporta nada sin backend.
- **Sí:** reveal on scroll fiel al template, aislado en `components/reveal.tsx` (cliente). El resto del Home queda como componente de servidor.
- **No:** convertir todo el Home en componente cliente solo por el hook `useReveal`.
- **Sí:** bloque `prefers-reduced-motion`. El template no lo tiene; se agrega por accesibilidad sin alterar el diseño por defecto.
- **Sí:** copiar solo los estilos del Home, Actividad y Precios. Los de About y gamepad van con la spec de About.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Quedan enlaces a `/` que antes significaban "Biblioteca" | Buscar con `grep` todo `href="/"` y `push("/")` en `app/` y `components/` y revisar cada uno (paso 2). |
| Contenido oculto por `.reveal` si falla el JS o el observer | `Reveal` muestra el contenido si no existe `IntersectionObserver`; se añade el bloque `prefers-reduced-motion`. |
| Desajuste de hidratación por el observer | La clase `in` se agrega solo en un efecto del cliente; el primer render es idéntico en servidor y cliente. |
| Colisión de nombres de clase CSS (`.section-head`, `.kicker`, `.stat-n`) con estilos existentes | Comparar contra `app/globals.css` antes de pegar y resolver sin cambiar el aspecto de SPEC 01. |
| "Acerca de" deshabilitado confunde a quien navega | `aria-disabled="true"` y estilo atenuado; se retira al implementar About. |

---

## Lo que **no** está en esta spec

- La página About y la ruta `/about`.
- Que "Acerca de" navegue a algún sitio.
- Datos reales de actividad, ranking o estadísticas.
- Renombrar `/juegos/[id]` a `/games/[id]`.
- Cambios al diseño visual del template.
- Tests automatizados.

Cada uno de estos, si se aborda, va en su propia spec.
