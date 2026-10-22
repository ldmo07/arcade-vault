"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { submitScore } from "@/app/juegos/[id]/jugar/actions";
import type { GameRow } from "@/lib/data";
import { GAME_REGISTRY, type HudStat } from "@/lib/games/registry";
import {
  DEFAULT_SKIN,
  isSkinId,
  loadSkin,
  saveSkin,
  SKIN_IDS,
  SKIN_LABELS,
  subscribeSkin,
} from "@/lib/games/skins";
import { useSession } from "@/lib/session";

// HUD de los juegos simulados (sin entrada en el registro)
const DEFAULT_HUD: HudStat[] = [
  { label: "Puntuación", key: "score" },
  { label: "Vidas", key: "lives" },
  { label: "Nivel", key: "level" },
];

export function GamePlayer({ game }: { game: GameRow }) {
  const { user } = useSession();
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [lines, setLines] = useState(0);
  const [paused, setPaused] = useState(false);
  const [over, setOver] = useState(false);
  const [typedName, setTypedName] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [engineLevel, setEngineLevel] = useState(1);
  const [runId, setRunId] = useState(0);

  const entry = GAME_REGISTRY[game.id];
  const Canvas = entry?.Canvas;
  const hud = entry?.hud ?? DEFAULT_HUD;
  const hasSkins = !!entry?.skins;
  // Skin guardada por juego; servidor e hidratación usan la de por defecto
  const skin = useSyncExternalStore(
    subscribeSkin,
    () => loadSkin(game.id),
    () => DEFAULT_SKIN,
  );

  // La sesión se lee tras la hidratación; el nombre escrito en el modal tiene prioridad.
  const name = typedName ?? user?.name ?? "INVITADO";
  // Juegos simulados: el nivel sube cada 2.500 puntos. Los juegos del registro usan el nivel real del motor.
  const level = entry ? engineLevel : 1 + Math.floor(score / 2500);

  const hudValues: Record<HudStat["key"], string> = {
    score: score.toLocaleString("es-ES"),
    lives: "♥ ".repeat(lives).trim() || "—",
    lines: String(lines),
    level: String(level).padStart(2, "0"),
  };

  useEffect(() => {
    if (entry || over || paused) return;
    const t = setInterval(
      () => setScore((s) => s + Math.floor(10 + Math.random() * 90)),
      220,
    );
    return () => clearInterval(t);
  }, [entry, over, paused]);

  const restart = () => {
    setScore(0);
    setLives(3);
    setLines(0);
    setEngineLevel(1);
    setRunId((id) => id + 1);
    setPaused(false);
    setOver(false);
    setSaveStatus("idle");
  };

  const save = async () => {
    if (saveStatus === "saving" || saveStatus === "saved") return;
    setSaveStatus("saving");
    try {
      const res = await submitScore({ gameId: game.id, name, score });
      setSaveStatus(res.ok ? "saved" : "error");
    } catch {
      setSaveStatus("error");
    }
  };

  return (
    <div className="av-player fade-in">
      <div className="player-hud">
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <div className="hud-stat">
            <div className="l">Jugador</div>
            <div className="v" style={{ color: "var(--ink)" }}>
              {name}
            </div>
          </div>
          {hud.map((stat) => (
            <div
              key={stat.key}
              className={
                "hud-stat" +
                (stat.key === "lives" || stat.key === "level"
                  ? ` ${stat.key}`
                  : "")
              }
            >
              <div className="l">{stat.label}</div>
              <div
                className="v"
                aria-label={stat.key === "lives" ? `${lives} vidas` : undefined}
              >
                {hudValues[stat.key]}
              </div>
            </div>
          ))}
        </div>
        {hasSkins && (
          <div className="hud-stat">
            <label className="l" htmlFor="skin-select">
              Skin
            </label>
            <select
              id="skin-select"
              className="skin-select"
              value={skin}
              onChange={(e) => {
                if (!isSkinId(e.target.value)) return;
                saveSkin(game.id, e.target.value);
                // Devuelve el foco al juego: con el select enfocado las flechas
                // cambiarían de skin en vez de mover la nave
                e.target.blur();
              }}
            >
              {SKIN_IDS.map((id) => (
                <option key={id} value={id}>
                  {SKIN_LABELS[id]}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="hud-actions">
          <button
            type="button"
            className="btn yellow"
            onClick={() => setPaused((p) => !p)}
          >
            {paused ? "REANUDAR" : "PAUSA"}
          </button>
          <button
            type="button"
            className="btn magenta"
            onClick={() => setOver(true)}
          >
            FIN
          </button>
          <Link className="btn ghost" href={`/juegos/${game.id}`}>
            SALIR
          </Link>
        </div>
      </div>

      <div className="crt">
        <div className="crt-screen">
          {Canvas ? (
            <Canvas
              key={runId}
              paused={paused || over}
              skin={hasSkins ? skin : undefined}
              onScore={setScore}
              onLives={setLives}
              onLines={setLines}
              onLevel={setEngineLevel}
              onGameOver={() => setOver(true)}
            />
          ) : (
            <div className="game-arena">
              <div className="grid-floor"></div>
              <div className="enemy e1"></div>
              <div className="enemy e2"></div>
              <div className="enemy e3"></div>
              <div className="player-ship"></div>
            </div>
          )}
          {paused && (
            <div
              className="crt-content"
              style={{ background: "rgba(0,0,0,0.6)", zIndex: 5 }}
            >
              <div>
                <div className="pixel neon-yellow" style={{ fontSize: 22 }}>
                  EN PAUSA
                </div>
                <div
                  className="mono"
                  style={{
                    fontSize: 11,
                    color: "var(--ink-dim)",
                    marginTop: 10,
                    letterSpacing: "0.16em",
                  }}
                >
                  PULSA REANUDAR PARA CONTINUAR
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="crt-bottom">
          <span className="led">SEÑAL OK</span>
          <span>{game.title} · CRT-83 · 60 HZ</span>
          <span>CARGA · 1MB</span>
        </div>
      </div>

      {over && (
        <div className="modal-bd">
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="game-over-title"
          >
            <h2 id="game-over-title">FIN DEL JUEGO</h2>
            <div className="final-label">PUNTUACIÓN FINAL</div>
            <div className="final">{score.toLocaleString("es-ES")}</div>
            {saveStatus !== "saved" ? (
              <>
                <div className="input-row">
                  <input
                    value={name}
                    onChange={(e) =>
                      setTypedName(e.target.value.toUpperCase().slice(0, 10))
                    }
                    placeholder="TUS INICIALES"
                    aria-label="Tus iniciales"
                    disabled={saveStatus === "saving"}
                  />
                  <button
                    type="button"
                    className={
                      "btn yellow" + (saveStatus === "error" ? " is-error" : "")
                    }
                    disabled={saveStatus === "saving"}
                    aria-busy={saveStatus === "saving"}
                    onClick={save}
                  >
                    {saveStatus === "saving"
                      ? "GUARDANDO…"
                      : saveStatus === "error"
                        ? "ERROR, REINTENTAR"
                        : "GUARDAR PUNTUACIÓN"}
                  </button>
                </div>
                <div className="save-error" role="alert">
                  {saveStatus === "error"
                    ? "NO SE PUDO GUARDAR LA PUNTUACIÓN. INTÉNTALO DE NUEVO."
                    : ""}
                </div>
              </>
            ) : (
              <div className="toast-saved" role="status">
                ▸ PUNTUACIÓN GUARDADA_
              </div>
            )}
            <div className="actions">
              <button type="button" className="btn" onClick={restart}>
                JUGAR DE NUEVO
              </button>
              <Link className="btn magenta" href="/games">
                VOLVER AL VAULT
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
