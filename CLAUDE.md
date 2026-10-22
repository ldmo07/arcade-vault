# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

Arcade Vault: an online games platform where players compete for the highest score. Hay home, catálogo, juegos jugables con leaderboard, /salon, /about con formulario de contacto y /auth. No hay tests.

Scripts: `npm run dev | build | start | lint | format` (Prettier).

Rutas (`app/`): `/` (landing), `/games` (catálogo), `/juegos/[id]` (detalle), `/juegos/[id]/jugar` (juego + Server Action `submitScore`), `/salon`, `/about`, `/auth`, `/api/health/supabase`.

El proyecto sigue Spec Driven Design con las skills `/spec` y `/spec-impl` de `Klerith/fernando-skills` (`npx skills@latest add Klerith/fernando-skills`). Las specs viven en `specs/` (01–09, una por feature/juego). Para añadir un juego nuevo con su leaderboard usa `/add-game` (redacta la spec basada en SPEC 05 y 06; luego `/spec-impl`). Los juegos de partida se portan desde `references/started-games/`.

Juegos implementados y pendientes: ver `references/implemented-games.md`.

Para decidir qué juego añadir usa el subagente `game-planner` (`.claude/agents/game-planner.md`): registra sus sugerencias en `references/game-suggestions-todo.md` y su memoria en `.claude/agent-memory/game-planner/`.

Para añadir skins (`clasico` por defecto, `neon`, `retro`, todas legibles en oscuro) a un juego usa el subagente `skin-designer` (`.claude/agents/skin-designer.md`) indicándole el juego: trabaja de uno en uno y solo el que le pidas. El estado vive en `references/game-with-themes.md`.

Para una game jam sobre un tema usa `/game-jam <tema>` (`.claude/skills/game-jam/SKILL.md`): lanza 3 subagentes `game-jam` (`.claude/agents/game-jam.md`) en paralelo, cada uno escribe 2 specs (`01-motor-` y `02-plataforma-`) en `specs/game-jam/<game-id>/`, pregunta al usuario qué juego se va a implementar y deja el veredicto en `specs/game-jam/<tema>-veredicto.md`. Solo genera specs; no implementa.

Contacto: `/about` envía mensajes con Resend vía la Server Action `sendContactMessage` (`app/about/actions.ts`, validación en `lib/contact.ts`, honeypot `website`). Variables: `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL` (ver `.env.example`).

Sesión: `lib/session.tsx` (`SessionProvider`, localStorage `av_user`/`av_scores`) es una sesión local de cliente, no Supabase Auth.

## Stack

Next.js 16.3 (App Router, `app/` at repo root, no `src/`), React 19, TypeScript (strict), Tailwind CSS v4 via `@tailwindcss/postcss` (styles in `app/globals.css`, no `tailwind.config`). Path alias `@/*` → repo root. Fonts: Geist via `next/font/google`.

Supabase (`@supabase/supabase-js` + `@supabase/ssr`) contra el proyecto remoto `jnkfrkejprbppolsspld`. Clientes tipados con `Database` en `lib/supabase/`: `client.ts` (navegador), `server.ts` (servidor, nunca desde componentes cliente), `proxy.ts` (`updateSession`) y `database.types.ts` (generado, no se edita a mano). `proxy.ts` en la raíz refresca la sesión. Variables: `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (ver `.env.example`). Health check: `GET /api/health/supabase`.

Datos en Supabase (esquema `public`, RLS activado, migración en `supabase/migrations/`): `games` (catálogo; ya no existe `GAMES` en `lib/data.ts`), `scores` (`user_id` nullable: se juega y se guarda sin autenticación) y la vista `game_stats` (`best` y `plays` calculados). Las lecturas pasan por `lib/games-repo.ts` (`getGames`, `getGame`, `getTopScores`; solo servidor) y la escritura por la Server Action `submitScore` en `app/juegos/[id]/jugar/actions.ts`. `/salon` muestra el top 10 por juego con `?juego=<id>`.

Juegos jugables: cada uno es un motor TS puro en `lib/games/<slug>/` (`createX(canvas, callbacks)` → `{ setPaused, destroy }`) más un wrapper cliente en `components/games/<slug>-canvas.tsx`. `lib/games/registry.ts` (`GAME_REGISTRY`: `id → { Canvas, hud }`) los enlaza con `GamePlayer`, que pinta el HUD según `hud` y usa la arena simulada para los juegos sin entrada. Cada juego nuevo añade además una migración en `supabase/migrations/` que lo marca `playable = true`. Hoy: `asteroides` (Puntuación, Vidas, Nivel), `caida` (Puntuación, Líneas, Nivel), `bloque-buster` (Puntuación, Vidas, Nivel) y `serpentina` (Puntuación, Nivel). `bloque-buster` es el único con sprites y ratón: su wrapper carga `public/games/bloque-buster/spritesheet-breakout.png` y le pasa la imagen al motor como tercer parámetro de `createBloqueBuster`. El motor emite `onBounce`/`onBlockBreak` y el wrapper reproduce los `.mp3` de `public/games/bloque-buster/sounds/`. `serpentina` avanza por ticks sobre una rejilla de 20×15 celdas de 40 px; su wrapper carga `public/games/serpentina/fruits.png` (frutas pixel-art, tercer parámetro de `createSerpentina`) y sintetiza el sonido con Web Audio a partir de `onEat`/`onCrash`, sin archivos de audio. Un juego es jugable en BD con `games.playable = true`.

Next 16 has breaking changes vs. older versions (e.g. `LayoutProps<"/">` global helper types used in `app/layout.tsx`). Consult `node_modules/next/dist/docs/` (`01-app` for App Router) before writing Next-specific code.

## skills

usa siempre /ui-ux-pro-max para diseñar la interfaz.
