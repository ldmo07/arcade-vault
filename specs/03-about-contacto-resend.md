# SPEC 03 — Página About y formulario de contacto con Resend

> **Status:** Aprobado
> **Depends on:** SPEC 01, SPEC 02
> **Date:** 2026-10-08
> **Objective:** Implementar la página `/about` idéntica a `references/templates/home-about/about.jsx` (misión, highlights y formulario de contacto), habilitar "Acerca de" en la navbar y enviar el mensaje del formulario por correo con Resend desde una Server Action.

---

## Por qué existe esta spec

SPEC 02 dejó "Acerca de" deshabilitado y la ruta `/about` sin implementar. El template `about.jsx` simula el envío (solo muestra el terminal de éxito). Esta spec conecta ese formulario a un envío real con Resend sin cambiar el diseño.

---

## Alcance

**Dentro:**

- Ruta `/about` con: hero ("ACERCA DE ARCADE VAULT", misión, 3 highlights con icono pixel), divisor animado y sección "CONTÁCTANOS" con formulario.
- Formulario con campos NOMBRE, CORREO ELECTRÓNICO y MENSAJE, animación `shake` ante error y terminal de éxito (`VAULT-OS // TERMINAL`) con "ENVIAR OTRO MENSAJE".
- Server Action `sendContactMessage` que valida en servidor y envía un correo al equipo con Resend (`reply-to` = correo del remitente).
- Dependencia nueva: `resend`.
- Variables de entorno `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`, documentadas en `.env.example`.
- Habilitar "Acerca de" en la navbar (escritorio y panel móvil) apuntando a `/about`, con estado activo en `/about`.
- Reutilizar `components/reveal.tsx` para las secciones `.reveal`.
- Portar a `app/globals.css` los estilos `ABOUT PAGE` (hero, highlights, divider, contacto, shake, terminal, `pxblink`) de `references/templates/home-about/styles.css` (líneas ~1071–1146), más `textarea` y `::placeholder` del formulario. Incluir `prefers-reduced-motion` para el divisor y el caret.

**Fuera de alcance (para futuras specs):**

- Autorespuesta de confirmación al usuario (requiere dominio verificado en Resend).
- Guardar mensajes en base de datos o historial.
- Rate limiting, CAPTCHA o protección anti-spam más allá de un campo honeypot.
- El gamepad interactivo, temas y floaters (`GAMEPAD`, `Theme variants`, `Score floaters`): `about.jsx` no los usa.
- Plantilla de correo con React Email; el correo es HTML/texto simple.
- Tests automatizados.
- Modificar el diseño visual del template.

---

## Modelo de datos

```ts
// lib/contact.ts
export interface ContactInput {
  name: string;   // 1–80 caracteres tras trim
  email: string;  // formato de correo válido, máx. 120
  msg: string;    // 1–2000 caracteres tras trim
}

export type ContactResult =
  | { ok: true; name: string }          // name se usa en "GRACIAS, {NAME}."
  | { ok: false; error: "validation" | "send" };

export function validateContact(input: Partial<Record<keyof ContactInput, unknown>>): ContactInput | null;
```

```ts
// app/about/actions.ts  ("use server")
export async function sendContactMessage(formData: FormData): Promise<ContactResult>;
```

Variables de entorno (`.env.local`, ya ignorado por `.env*` en `.gitignore`):

```
RESEND_API_KEY=
CONTACT_TO_EMAIL=          # destinatario del equipo
CONTACT_FROM_EMAIL=        # por defecto onboarding@resend.dev mientras no haya dominio verificado
```

Convenciones:

- La validación manual (sin zod) vive en `lib/contact.ts` y se usa en servidor; el cliente solo hace la comprobación de campos vacíos del template para disparar `shake`.
- Un campo honeypot oculto `website`: si viene con valor, la acción responde `{ ok: true }` sin enviar.
- Asunto del correo: `[Arcade Vault] Mensaje de {name}`; el contenido se escapa antes de insertarlo en HTML.
- Este feature no agrega persistencia ni claves de `localStorage`.

---

## Plan de implementación

Antes de empezar: leer `node_modules/next/dist/docs/01-app` (Server Actions, formularios, `useActionState`) y aplicar `/ui-ux-pro-max` según `CLAUDE.md`.

1. Instalar `resend` (`npm i resend`) y crear `.env.example` con las tres variables. Verificación: `npm run lint`.
2. Crear `lib/contact.ts` con `ContactInput`, `ContactResult` y `validateContact`. Verificación: `npm run lint`.
3. Crear `app/about/actions.ts` con `sendContactMessage`: valida, comprueba el honeypot, falla con `error: "send"` si faltan variables de entorno o Resend devuelve error, y envía el correo. Verificación: `npm run lint`.
4. Portar a `app/globals.css` los estilos `ABOUT PAGE` y de `textarea`/`::placeholder`, más `prefers-reduced-motion`. Verificación: `npm run build` sin errores de CSS.
5. Crear `components/about/highlight-icon.tsx` (servidor) con los iconos HEART, BROWSER y PLANT portados tal cual. Verificación: `npm run lint`.
6. Crear `components/about/contact-form.tsx` (cliente) con estado `form`, `sent`, `shake`, el terminal de éxito y estado de error de envío. Usa `sendContactMessage`; deshabilita el botón mientras envía (`▶  ENVIAR MENSAJE` → `ENVIANDO…`). Verificación: `npm run lint`.
7. Crear `app/about/page.tsx` (servidor) con hero, highlights, divisor y sección de contacto envueltos en `Reveal` donde el template usa `.reveal`, y `metadata` propia. Verificación: `/about` se ve como el template.
8. Habilitar "Acerca de" en `components/nav.tsx` (escritorio y panel móvil): `Link` a `/about`, `isAbout = pathname.startsWith("/about")`, `aria-current` y `active`. Verificación: `npm run dev`, el link navega y queda activo.
9. Correr `npm run lint` y `npm run build`.

---

## Criterios de aceptación

- [ ] `npm run lint` y `npm run build` terminan sin errores.
- [x] `/about` renderiza el hero, 3 highlights con icono, el divisor de 24 píxeles y el formulario, sin errores en la consola.
- [x] La navbar y el panel móvil muestran "Acerca de" como enlace a `/about`, activo solo en `/about`, sin `aria-disabled`.
- [x] Enviar el formulario con algún campo vacío no llama a la acción y aplica la clase `shake` durante 400 ms.
- [ ] Con datos válidos y `RESEND_API_KEY` configurada, llega un correo a `CONTACT_TO_EMAIL` con asunto `[Arcade Vault] Mensaje de {name}`, el mensaje y `reply-to` igual al correo del remitente.
- [x] Tras un envío correcto se muestra el terminal con `MENSAJE RECIBIDO. TE RESPONDEREMOS PRONTO. GRACIAS, {NOMBRE}.` en mayúsculas.
- [x] "ENVIAR OTRO MENSAJE" limpia el formulario y vuelve a mostrar los campos.
- [ ] Sin `RESEND_API_KEY` (o si Resend falla) el formulario conserva lo escrito y muestra un mensaje de error visible; no se muestra el terminal de éxito.
- [x] La acción rechaza en servidor un correo con formato inválido, un mensaje de más de 2000 caracteres y un nombre vacío, devolviendo `{ ok: false, error: "validation" }`.
- [x] Con el campo honeypot `website` relleno no se envía ningún correo.
- [ ] El texto del usuario se escapa en el HTML del correo (`<script>` llega como texto).
- [x] La clave `RESEND_API_KEY` no aparece en el bundle del cliente ni en el repositorio; `.env.example` sí existe.
- [x] Con `prefers-reduced-motion: reduce` el divisor y el caret no se animan y las secciones se ven completas.
- [ ] A 375 px de ancho no hay scroll horizontal en `/about` y el formulario ocupa una columna.

---

## Decisiones

- **Sí:** Server Action para el envío. La API key queda solo en servidor y no hay endpoint público extra.
- **No:** Route Handler `/api/contact`. Añade una superficie pública sin necesidad hoy.
- **Sí:** un único correo al equipo con `reply-to` del remitente. Es lo que pide el formulario y funciona con el remitente de prueba de Resend.
- **No:** autorespuesta al usuario. Resend solo envía a terceros con dominio verificado; queda para otra spec.
- **Sí:** direcciones y API key en variables de entorno, con `.env.example`. Permite cambiar de `onboarding@resend.dev` a un dominio propio sin tocar código.
- **No:** direcciones fijas en código.
- **Sí:** validación manual en `lib/contact.ts`. Tres campos no justifican añadir zod.
- **No:** zod.
- **Sí:** honeypot como única defensa anti-spam. Costo mínimo y sin cambios visibles; rate limiting y CAPTCHA van aparte.
- **Sí:** respetar el template tal cual (textos, clases, terminal de éxito) y portar solo los estilos de `ABOUT PAGE`.
- **No:** portar `GAMEPAD`, temas ni floaters. `about.jsx` no los usa.
- **Sí:** formulario como componente cliente aislado y resto de `/about` como componente de servidor, igual que se hizo con `Reveal` en SPEC 02.
- **Sí:** bloque `prefers-reduced-motion` para el divisor y el caret; el template no lo tiene.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| `onboarding@resend.dev` solo entrega al correo dueño de la cuenta de Resend | `CONTACT_TO_EMAIL` debe ser ese correo mientras no haya dominio verificado; se documenta en `.env.example`. |
| Spam o abuso del formulario | Honeypot y límites de longitud; rate limiting queda para otra spec. |
| Inyección de HTML en el correo | Escapar `name`, `email` y `msg` antes de construir el HTML; enviar además versión `text`. |
| Colisión de clases (`.field`, `.btn`, `.kicker`) con estilos existentes | Reutilizar `.field` de `auth`, solo añadir `textarea`; comparar contra `app/globals.css` antes de pegar. |
| Fallo de red o de Resend deja al usuario sin feedback | Estado de error visible y formulario conservado para reintentar. |
| Falta de variables de entorno en despliegue | La acción devuelve `error: "send"` en lugar de lanzar excepción; sin crash de página. |

---

## Lo que **no** está en esta spec

- Autorespuesta al usuario y dominio verificado en Resend.
- Guardado de mensajes, panel de administración o historial.
- Rate limiting y CAPTCHA.
- Gamepad interactivo, temas y floaters.
- Plantillas de correo con React Email.
- Cambios al diseño visual del template.
- Tests automatizados.

Cada uno de estos, si se aborda, va en su propia spec.
