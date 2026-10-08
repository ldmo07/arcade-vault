# SPEC 04 — Configuración de Supabase en Next.js

> **Status:** Implementado
> **Depends on:** Ninguna
> **Date:** 2026-10-08
> **Objective:** Integrar Supabase en la app (SDK, clientes de navegador y servidor tipados, proxy de sesión y variables de entorno) contra el proyecto remoto, verificable con un endpoint de salud, sin añadir auth ni tablas.

---

## Por qué existe esta spec

Las próximas features (auth, puntuaciones, realtime, edge functions) dependen de Supabase. Esta spec deja solo la infraestructura lista para que cada una de esas specs se limite a su dominio.

---

## Alcance

**Dentro:**

- Dependencias `@supabase/supabase-js` y `@supabase/ssr`.
- Variables `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` en `.env.local` y documentadas en `.env.example`.
- `lib/supabase/client.ts`: cliente de navegador (`createBrowserClient`).
- `lib/supabase/server.ts`: cliente de servidor (`createServerClient` + `cookies()` de `next/headers`).
- `lib/supabase/proxy.ts`: helper `updateSession` que refresca cookies de sesión.
- `proxy.ts` en la raíz (convención Next 16, sustituye a `middleware.ts`) que llama a `updateSession`, con `matcher` que excluye `_next/static`, `_next/image`, `favicon.ico` e imágenes.
- `lib/supabase/database.types.ts` generado del proyecto remoto `jnkfrkejprbppolsspld` (sin tablas propias aún); ambos clientes tipados con `Database`.
- Route Handler `GET /api/health/supabase` que comprueba la conexión.

**Fuera de alcance (para futuras specs):**

- Supabase Auth: login, registro, logout y reemplazo de la sesión mock de `lib/session.tsx`.
- Tablas, migraciones (`supabase/migrations`), RLS y scores en base de datos.
- Realtime.
- Edge Functions.
- Supabase local con Docker / `supabase start`.
- Uso de `service_role` / secret key.
- Cambios visuales o en componentes existentes.
- Tests automatizados.

---

## Modelo de datos

Esta feature no introduce tablas ni estructuras de dominio. Solo tipos y contratos de infraestructura:

```ts
// lib/supabase/database.types.ts — generado, no se edita a mano
export type Database = {
  public: { Tables: {}; Views: {}; Functions: {} /* ... */ };
};

// lib/supabase/client.ts
export function createClient(): SupabaseClient<Database>;

// lib/supabase/server.ts
export async function createClient(): Promise<SupabaseClient<Database>>;

// lib/supabase/proxy.ts
export async function updateSession(
  request: NextRequest,
): Promise<NextResponse>;

// app/api/health/supabase/route.ts
type HealthResponse =
  | { ok: true; url: string }
  | { ok: false; error: "missing_env" | "unreachable" };
```

Variables de entorno:

```
NEXT_PUBLIC_SUPABASE_URL=https://jnkfrkejprbppolsspld.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Convenciones:

- Ambos clientes exportan `createClient` y se importan desde `@/lib/supabase/client` o `@/lib/supabase/server`.
- `server.ts` nunca se importa desde un componente cliente.
- `SUPABASE_DB_PASSWORD` (ya existente) no se usa en el código de la app.
- El endpoint de salud consulta `${URL}/auth/v1/health` con la cabecera `apikey`; no requiere tablas. Responde 200 si `ok`, 500 si `missing_env`, 503 si `unreachable`, y nunca devuelve la clave.
- No se añaden claves de `localStorage`.

---

## Plan de implementación

Antes de empezar: leer `node_modules/next/dist/docs/01-app` (`proxy.md`, `route.md`, `cookies`) y la guía de `@supabase/ssr` para Next.js (MCP `search_docs`).

1. `npm i @supabase/supabase-js @supabase/ssr`. Añadir las dos variables a `.env.example` y `.env.local` (valores vía MCP `get_project_url` y `get_publishable_keys`). Verificación: `npm run lint`.
2. Generar `lib/supabase/database.types.ts` con MCP `generate_typescript_types`. Verificación: `npm run lint`.
3. Crear `lib/supabase/client.ts` y `lib/supabase/server.ts` tipados con `Database`. Verificación: `npm run lint`.
4. Crear `lib/supabase/proxy.ts` (`updateSession`) y `proxy.ts` en la raíz con `matcher` negativo. Verificación: `npm run dev`, todas las rutas existentes cargan igual.
5. Crear `app/api/health/supabase/route.ts`. Verificación: `curl http://localhost:3000/api/health/supabase` → `{"ok":true,...}`.
6. Actualizar `CLAUDE.md` (sección Stack) mencionando Supabase y `lib/supabase/`. Correr `npm run lint` y `npm run build`.

---

## Criterios de aceptación

- [ ] `npm run lint` y `npm run build` terminan sin errores.
- [ ] `package.json` incluye `@supabase/supabase-js` y `@supabase/ssr`.
- [ ] `.env.example` documenta `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` sin valores reales.
- [ ] `GET /api/health/supabase` con las variables configuradas responde 200 y `{ "ok": true, "url": "https://jnkfrkejprbppolsspld.supabase.co" }`.
- [ ] Sin `NEXT_PUBLIC_SUPABASE_URL` el endpoint responde 500 con `{ "ok": false, "error": "missing_env" }` y la app no crashea.
- [ ] Con una URL inalcanzable el endpoint responde 503 con `{ "ok": false, "error": "unreachable" }`.
- [ ] `proxy.ts` existe en la raíz, exporta `proxy` y `config.matcher`; no existe `middleware.ts`.
- [ ] `/`, `/games`, `/salon`, `/about`, `/auth` y `/juegos/[id]` cargan igual que antes, sin errores en consola.
- [ ] Las peticiones a `/_next/static/*` no pasan por el proxy.
- [ ] `lib/supabase/client.ts` y `server.ts` usan el genérico `Database`.
- [ ] Ninguna clave secreta (`service_role`, `SUPABASE_DB_PASSWORD`) aparece en el código ni en el bundle del cliente.

---

## Decisiones

- **Sí:** `@supabase/ssr` + `@supabase/supabase-js`. Patrón oficial para App Router; cookies compartidas entre servidor y cliente.
- **No:** solo `supabase-js`. Los Server Components no verían la sesión.
- **Sí:** solo proyecto remoto `jnkfrkejprbppolsspld`. Sin Docker.
- **No:** Supabase local con CLI. Complejidad sin necesidad hoy.
- **Sí:** `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (`sb_publishable_…`). Formato actual de Supabase.
- **No:** `ANON_KEY` legacy.
- **Sí:** `proxy.ts` de refresco de sesión ya en esta spec. Infraestructura lista para la spec de auth; hoy no cambia comportamiento.
- **Sí:** tipos generados desde el inicio, aunque el esquema esté vacío.
- **Sí:** endpoint `/api/health/supabase` contra `/auth/v1/health`. Verificación real sin depender de tablas.
- **No:** tablas, migraciones o auth. Specs futuras (auth; luego scores, realtime, edge functions).
- **Nota:** el usuario empezó eligiendo "base + auth" y luego acotó a solo configuración.

---

## Riesgos

| Riesgo                                                                                              | Mitigación                                                                                                         |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Diferencias de Next 16 (`proxy.ts`, `cookies()` asíncrono) con ejemplos de Supabase para Next 14/15 | Leer `node_modules/next/dist/docs/` antes; `cookies()` con `await`.                                                |
| Proxy demasiado amplio ralentiza assets                                                             | `matcher` negativo para estáticos e imágenes.                                                                      |
| Variables ausentes en despliegue                                                                    | El endpoint devuelve `missing_env`; los clientes no se instancian al cargar módulos sino al llamar `createClient`. |
| Exponer claves secretas                                                                             | Solo la publishable key es `NEXT_PUBLIC_`; no se usa `service_role`.                                               |

---

## Lo que **no** está en esta spec

- Auth (login, registro, logout, OAuth).
- Tablas, migraciones, RLS y scores en base de datos.
- Realtime y Edge Functions.
- Supabase local.
- Cambios visuales.
- Tests automatizados.

Cada uno de estos, si se aborda, va en su propia spec.
