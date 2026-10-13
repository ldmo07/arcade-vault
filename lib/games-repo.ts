// Solo servidor: usa el cliente de servidor de Supabase (cookies). No importar desde componentes cliente.
import type { Category, GameColor } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

export interface GameRow {
  id: string;
  title: string;
  short: string;
  long: string;
  cat: Category;
  cover: string;
  color: GameColor;
  playable: boolean;
  best: number;
  plays: number;
}

export interface ScoreEntry {
  rank: number;
  name: string;
  score: number;
  date: string;
}

const GAME_COLUMNS = "id, title, short, long, cat, cover, color, playable";

interface StatsRow {
  game_id: string | null;
  best: number | null;
  plays: number | null;
}

function toGameRow(
  game: {
    id: string;
    title: string;
    short: string;
    long: string;
    cat: string;
    cover: string;
    color: string;
    playable: boolean;
  },
  stats?: StatsRow,
): GameRow {
  return {
    ...game,
    cat: game.cat as Category,
    color: game.color as GameColor,
    best: stats?.best ?? 0,
    plays: stats?.plays ?? 0,
  };
}

export async function getGames(): Promise<GameRow[]> {
  const supabase = await createClient();
  const [games, stats] = await Promise.all([
    supabase.from("games").select(GAME_COLUMNS).order("sort_order"),
    supabase.from("game_stats").select("game_id, best, plays"),
  ]);
  if (games.error) throw new Error(`getGames: ${games.error.message}`);
  if (stats.error) throw new Error(`getGames: ${stats.error.message}`);

  const byId = new Map(stats.data.map((s) => [s.game_id, s]));
  return games.data.map((g) => toGameRow(g, byId.get(g.id)));
}

export async function getGame(id: string): Promise<GameRow | null> {
  const supabase = await createClient();
  const [game, stats] = await Promise.all([
    supabase.from("games").select(GAME_COLUMNS).eq("id", id).maybeSingle(),
    supabase
      .from("game_stats")
      .select("game_id, best, plays")
      .eq("game_id", id)
      .maybeSingle(),
  ]);
  if (game.error) throw new Error(`getGame: ${game.error.message}`);
  if (stats.error) throw new Error(`getGame: ${stats.error.message}`);
  if (!game.data) return null;

  return toGameRow(game.data, stats.data ?? undefined);
}

const dateFormat = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "UTC",
});

export async function getTopScores(
  gameId: string,
  limit = 10,
): Promise<ScoreEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("scores")
    .select("name, score, created_at")
    .eq("game_id", gameId)
    .order("score", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error) throw new Error(`getTopScores: ${error.message}`);

  return data.map((row, i) => ({
    rank: i + 1,
    name: row.name,
    score: row.score,
    date: dateFormat.format(new Date(row.created_at)),
  }));
}
