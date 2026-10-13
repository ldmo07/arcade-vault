import type { Metadata } from "next";
import { Library } from "@/components/library";
import { getGames } from "@/lib/games-repo";

export const metadata: Metadata = { title: "Biblioteca" };

export default async function GamesPage() {
  const games = await getGames();
  return <Library games={games} />;
}
