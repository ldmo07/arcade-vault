# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

Arcade Vault: an online games platform where players compete for the highest score. Early stage — `app/` still holds the Create Next App scaffold (default `page.tsx`, placeholder metadata in `app/layout.tsx`). No backend, database, or tests yet.

The README says the project follows Spec Driven Design using the `/spec` and `/spec-impl` skills from `Klerith/fernando-skills` (`npx skills@latest add Klerith/fernando-skills`).

## Stack

Next.js 16.3 (App Router, `app/` at repo root, no `src/`), React 19, TypeScript (strict), Tailwind CSS v4 via `@tailwindcss/postcss` (styles in `app/globals.css`, no `tailwind.config`). Path alias `@/*` → repo root. Fonts: Geist via `next/font/google`.

Next 16 has breaking changes vs. older versions (e.g. `LayoutProps<"/">` global helper types used in `app/layout.tsx`). Consult `node_modules/next/dist/docs/` (`01-app` for App Router) before writing Next-specific code.

## skills

usa siempre /ui-ux-pro-max para diseñar la interfaz.