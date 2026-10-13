"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const MAX_NAME = 12;
const MAX_SCORE = 10_000_000;
const FK_VIOLATION = "23503";

export type SubmitScoreResult =
  | { ok: true }
  | { ok: false; error: "invalid" | "unknown_game" | "unavailable" };

export async function submitScore(input: {
  gameId: string;
  name: string;
  score: number;
}): Promise<SubmitScoreResult> {
  const { gameId, score } = input;
  const name = String(input.name ?? "")
    .trim()
    .toUpperCase()
    .slice(0, MAX_NAME);

  if (
    typeof gameId !== "string" ||
    gameId.length === 0 ||
    name.length === 0 ||
    !Number.isInteger(score) ||
    score < 0 ||
    score > MAX_SCORE
  ) {
    return { ok: false, error: "invalid" };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("scores")
      .insert({ game_id: gameId, name, score, user_id: null });

    if (error) {
      return {
        ok: false,
        error: error.code === FK_VIOLATION ? "unknown_game" : "unavailable",
      };
    }
  } catch {
    return { ok: false, error: "unavailable" };
  }

  revalidatePath("/salon");
  revalidatePath("/games");
  revalidatePath("/");
  revalidatePath("/juegos/[id]", "page");
  return { ok: true };
}
