"use server";

import { Resend } from "resend";
import { validateContact, type ContactResult } from "@/lib/contact";

const ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ESCAPES[c]);
}

export async function sendContactMessage(formData: FormData): Promise<ContactResult> {
  // Honeypot: un bot rellenó el campo oculto. Se responde "ok" sin enviar nada.
  const honeypot = formData.get("website");
  if (typeof honeypot === "string" && honeypot.trim() !== "") {
    return { ok: true, name: "" };
  }

  const input = validateContact({
    name: formData.get("name"),
    email: formData.get("email"),
    msg: formData.get("msg"),
  });
  if (!input) return { ok: false, error: "validation" };

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL || "onboarding@resend.dev";
  if (!apiKey || !to) return { ok: false, error: "send" };

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: `Arcade Vault <${from}>`,
      to,
      replyTo: input.email,
      subject: `[Arcade Vault] Mensaje de ${input.name}`.replace(/[\r\n]+/g, " "),
      text: `De: ${input.name} <${input.email}>\n\n${input.msg}`,
      html:
        `<p><strong>De:</strong> ${escapeHtml(input.name)} &lt;${escapeHtml(input.email)}&gt;</p>` +
        `<p style="white-space:pre-wrap">${escapeHtml(input.msg)}</p>`,
    });
    if (error) return { ok: false, error: "send" };
  } catch {
    return { ok: false, error: "send" };
  }

  return { ok: true, name: input.name };
}
