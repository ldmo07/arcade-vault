import Link from "next/link";
import type { GameRow, ScoreEntry } from "@/lib/games-repo";

const fmt = (n: number) => n.toLocaleString("es-ES");

function PodiumSlot({
  entry,
  place,
  className,
}: {
  entry: ScoreEntry | undefined;
  place: 1 | 2 | 3;
  className: "gold" | "silver" | "bronze";
}) {
  const champion = place === 1;
  return (
    <div className={`podium-slot ${className}`}>
      {champion && (
        <div
          className="pixel"
          style={{ fontSize: 9, color: "var(--gold)", letterSpacing: "0.18em" }}
        >
          CAMPEÓN
        </div>
      )}
      <div
        className="rank-num"
        style={champion ? { fontSize: 36, marginTop: 4 } : undefined}
      >
        {String(place).padStart(2, "0")}
      </div>
      <div className="name">{entry?.name ?? "—"}</div>
      <div className="score" style={champion ? { fontSize: 20 } : undefined}>
        {entry ? fmt(entry.score) : "—"}
      </div>
      <div className="date">{entry?.date ?? ""}</div>
    </div>
  );
}

export function HallOfFame({
  games,
  selected,
  rows,
}: {
  games: GameRow[];
  selected: GameRow;
  rows: ScoreEntry[];
}) {
  return (
    <div className="av-hall fade-in">
      <div className="hall-head">
        <h1>SALÓN DE LA FAMA</h1>
        <p className="pixel" style={{ fontSize: 10 }}>
          LOS NOMBRES QUE NUNCA SE BORRAN DE LA PANTALLA
        </p>
      </div>

      <nav className="hall-tabs" aria-label="Elegir juego">
        {games.map((g) => (
          <Link
            key={g.id}
            href={`/salon?juego=${g.id}`}
            className={"chip" + (selected.id === g.id ? " active" : "")}
            aria-current={selected.id === g.id ? "page" : undefined}
            scroll={false}
          >
            {g.title}
          </Link>
        ))}
      </nav>

      {rows.length === 0 ? (
        <div className="hall-empty" role="status">
          <div className="pixel neon-magenta" style={{ fontSize: 14 }}>
            SIN PUNTUACIONES AÚN
          </div>
          <p>
            Nadie ha guardado una marca en {selected.title}. ¿Serás el primero?
          </p>
          {selected.playable && (
            <Link className="btn lg" href={`/juegos/${selected.id}/jugar`}>
              ▶&nbsp; JUGAR AHORA
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="podium">
            <PodiumSlot entry={rows[1]} place={2} className="silver" />
            <PodiumSlot entry={rows[0]} place={1} className="gold" />
            <PodiumSlot entry={rows[2]} place={3} className="bronze" />
          </div>

          <div className="hall-table">
            <div className="th">
              <div>RANGO</div>
              <div>JUGADOR</div>
              <div>PUNTUACIÓN</div>
              <div>FECHA</div>
            </div>
            {rows.map((r, i) => (
              <div
                key={r.rank}
                className={
                  "tr" +
                  (i === 0
                    ? " top1"
                    : i === 1
                      ? " top2"
                      : i === 2
                        ? " top3"
                        : "")
                }
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="rk">#{String(r.rank).padStart(2, "0")}</div>
                <div className="pl">{r.name}</div>
                <div className="sc">{fmt(r.score)}</div>
                <div className="dt">{r.date}</div>
              </div>
            ))}
          </div>
        </>
      )}

      <div style={{ textAlign: "center", marginTop: 32 }}>
        <Link className="btn lg" href="/games">
          VOLVER A LA BIBLIOTECA
        </Link>
      </div>
    </div>
  );
}
