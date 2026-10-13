import Link from "next/link";
import type { GameRow } from "@/lib/games-repo";

export function MiniCard({ game }: { game: GameRow }) {
  return (
    <Link className="mini-card" href={`/juegos/${game.id}`}>
      <div className="mini-cover">
        <div className={"cover-bg " + game.cover}></div>
      </div>
      <div className="mini-meta">
        <div className="mini-title">{game.title}</div>
        <div className="mini-cat">{game.cat}</div>
      </div>
    </Link>
  );
}
