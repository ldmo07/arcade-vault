import type { Metadata } from "next";
import { HallOfFame } from "@/components/hall-of-fame";
import { getGames, getTopScores } from "@/lib/games-repo";

export const metadata: Metadata = { title: "Salón de la Fama" };

export default async function HallOfFamePage(props: PageProps<"/salon">) {
  const { juego } = await props.searchParams;
  const games = await getGames();
  const selected = games.find((g) => g.id === juego) ?? games[0];
  const rows = selected ? await getTopScores(selected.id, 10) : [];

  if (!selected) return null;
  return <HallOfFame games={games} selected={selected} rows={rows} />;
}
