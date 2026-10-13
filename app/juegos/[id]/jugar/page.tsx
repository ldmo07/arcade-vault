import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GamePlayer } from "@/components/game-player";
import { getGame } from "@/lib/games-repo";

export async function generateMetadata(props: PageProps<"/juegos/[id]/jugar">): Promise<Metadata> {
  const { id } = await props.params;
  const game = await getGame(id);
  return game ? { title: `Jugando ${game.title}` } : {};
}

export default async function PlayPage(props: PageProps<"/juegos/[id]/jugar">) {
  const { id } = await props.params;
  const game = await getGame(id);
  if (!game) notFound();

  return <GamePlayer game={game} />;
}
