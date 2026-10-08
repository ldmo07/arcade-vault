import { NextResponse } from "next/server";

type HealthResponse =
  | { ok: true; url: string }
  | { ok: false; error: "missing_env" | "unreachable" };

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse<HealthResponse>> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    return NextResponse.json(
      { ok: false, error: "missing_env" },
      { status: 500 },
    );
  }

  try {
    const res = await fetch(`${url}/auth/v1/health`, {
      headers: { apikey: key },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`status ${res.status}`);
    return NextResponse.json({ ok: true, url });
  } catch {
    return NextResponse.json(
      { ok: false, error: "unreachable" },
      { status: 503 },
    );
  }
}
