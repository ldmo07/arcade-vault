# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

Arcade Vault: an online games platform where players compete for the highest score. Early stage — `app/` still holds the Create Next App scaffold (default `page.tsx`, placeholder metadata in `app/layout.tsx`). No backend, database, or tests yet.

The README says the project follows Spec Driven Design using the `/spec` and `/spec-impl` skills from `Klerith/fernando-skills` (`npx skills@latest add Klerith/fernando-skills`).

## Stack

Next.js 16.3 (App Router, `app/` at repo root, no `src/`), React 19, TypeScript (strict), Tailwind CSS v4 via `@tailwindcss/postcss` (styles in `app/globals.css`, no `tailwind.config`). Path alias `@/*` → repo root. Fonts: Geist via `next/font/google`.

Supabase (`@supabase/supabase-js` + `@supabase/ssr`) contra el proyecto remoto `jnkfrkejprbppolsspld`. Clientes tipados con `Database` en `lib/supabase/`: `client.ts` (navegador), `server.ts` (servidor, nunca desde componentes cliente), `proxy.ts` (`updateSession`) y `database.types.ts` (generado, no se edita a mano). `proxy.ts` en la raíz refresca la sesión. Variables: `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (ver `.env.example`). Health check: `GET /api/health/supabase`.

Next 16 has breaking changes vs. older versions (e.g. `LayoutProps<"/">` global helper types used in `app/layout.tsx`). Consult `node_modules/next/dist/docs/` (`01-app` for App Router) before writing Next-specific code.

## skills

usa siempre /ui-ux-pro-max para diseñar la interfaz.
