# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

Arcade Vault: an online games platform where players compete for the highest score. Early stage — `app/` still holds the Create Next App scaffold (default `page.tsx`, placeholder metadata in `app/layout.tsx`). No backend, database, or tests yet.

The README says the project follows Spec Driven Design using the `/spec` and `/spec-impl` skills from `Klerith/fernando-skills` (`npx skills@latest add Klerith/fernando-skills`). Para añadir un juego nuevo con su leaderboard usa `/add-game` (redacta la spec basada en SPEC 05 y 06; luego `/spec-impl`).

## Stack

Next.js 16.3 (App Router, `app/` at repo root, no `src/`), React 19, TypeScript (strict), Tailwind CSS v4 via `@tailwindcss/postcss` (styles in `app/globals.css`, no `tailwind.config`). Path alias `@/*` → repo root. Fonts: Geist via `next/font/google`.

Supabase (`@supabase/supabase-js` + `@supabase/ssr`) contra el proyecto remoto `jnkfrkejprbppolsspld`. Clientes tipados con `Database` en `lib/supabase/`: `client.ts` (navegador), `server.ts` (servidor, nunca desde componentes cliente), `proxy.ts` (`updateSession`) y `database.types.ts` (generado, no se edita a mano). `proxy.ts` en la raíz refresca la sesión. Variables: `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (ver `.env.example`). Health check: `GET /api/health/supabase`.

Datos en Supabase (esquema `public`, RLS activado, migración en `supabase/migrations/`): `games` (catálogo; ya no existe `GAMES` en `lib/data.ts`), `scores` (`user_id` nullable: se juega y se guarda sin autenticación) y la vista `game_stats` (`best` y `plays` calculados). Las lecturas pasan por `lib/games-repo.ts` (`getGames`, `getGame`, `getTopScores`; solo servidor) y la escritura por la Server Action `submitScore` en `app/juegos/[id]/jugar/actions.ts`. `/salon` muestra el top 10 por juego con `?juego=<id>`.

Juegos jugables: cada uno es un motor TS puro en `lib/games/<slug>/` (`createX(canvas, callbacks)` → `{ setPaused, destroy }`) más un wrapper cliente en `components/games/<slug>-canvas.tsx`. `lib/games/registry.ts` (`GAME_REGISTRY`: `id → { Canvas, hud }`) los enlaza con `GamePlayer`, que pinta el HUD según `hud` y usa la arena simulada para los juegos sin entrada. Hoy: `asteroides` (Puntuación, Vidas, Nivel), `caida` (Puntuación, Líneas, Nivel) y `bloque-buster` (Puntuación, Vidas, Nivel). `bloque-buster` es el único con sprites y ratón: su wrapper carga `public/games/bloque-buster/spritesheet-breakout.png` y le pasa la imagen al motor como tercer parámetro de `createBloqueBuster`. El motor emite `onBounce`/`onBlockBreak` y el wrapper reproduce los `.mp3` de `public/games/bloque-buster/sounds/`. Un juego es jugable en BD con `games.playable = true`.

Next 16 has breaking changes vs. older versions (e.g. `LayoutProps<"/">` global helper types used in `app/layout.tsx`). Consult `node_modules/next/dist/docs/` (`01-app` for App Router) before writing Next-specific code.

## skills

usa siempre /ui-ux-pro-max para diseñar la interfaz.
