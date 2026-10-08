export interface ContactInput {
  name: string;
  email: string;
  msg: string;
}

export type ContactResult =
  | { ok: true; name: string }
  | { ok: false; error: "validation" | "send" };

const NAME_MAX = 80;
const EMAIL_MAX = 120;
const MSG_MAX = 2000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateContact(input: Partial<Record<keyof ContactInput, unknown>>): ContactInput | null {
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const email = typeof input.email === "string" ? input.email.trim() : "";
  const msg = typeof input.msg === "string" ? input.msg.trim() : "";

  if (!name || name.length > NAME_MAX) return null;
  if (!email || email.length > EMAIL_MAX || !EMAIL_RE.test(email)) return null;
  if (!msg || msg.length > MSG_MAX) return null;

  return { name, email, msg };
}
