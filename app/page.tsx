import Link from "next/link";
import { FeatureIcon } from "@/components/home/feature-icon";
import { MiniCard } from "@/components/home/mini-card";
import { Silhouettes } from "@/components/home/silhouettes";
import { Reveal } from "@/components/reveal";
import { GAMES } from "@/lib/data";
import { FEATURES, HOME_STATS, RECENT_SCORES, TOP_PLAYERS } from "@/lib/home-data";

function SectionHead({ kicker, color, title }: { kicker: string; color: string; title: string }) {
  return (
    <div className="section-head">
      <div className={`kicker pixel neon-${color}`}>{kicker}</div>
      <h2 className="section-title">{title}</h2>
      <div className="section-rule"></div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="home fade-in">
      {/* HERO */}
      <section className="home-hero">
        <Silhouettes />
        <div className="home-hero-inner">
          <div className="hero-eyebrow pixel neon-yellow">
            ▸ INSERTA UNA MONEDA<span className="blink">_</span>
          </div>
          <h1 className="home-title">
            <span className="line-1">EL ARCADE</span>
            <span className="line-2">CLÁSICO ESTÁ</span>
            <span className="line-3">DE VUELTA</span>
          </h1>
          <p className="home-sub">
            Juega los mejores clásicos directamente en tu navegador.
            <br />
            Sin descargas. Sin costo. Solo diversión.
          </p>
          <div className="home-ctas">
            <Link className="btn xl pulse" href="/games">
              ▶&nbsp; EXPLORAR JUEGOS
            </Link>
            <Link className="btn xl magenta" href="/auth">
              ✦&nbsp; CREAR CUENTA
            </Link>
          </div>
          <div className="hero-scroll" aria-hidden="true">
            <span>DESLIZA</span>
            <span className="arrow">▼</span>
          </div>
        </div>
      </section>

      {/* WHY */}
      <Reveal className="home-section">
        <SectionHead kicker="// 01" color="magenta" title="¿POR QUÉ ARCADE VAULT?" />
        <div className="feature-grid">
          {FEATURES.map((f, i) => (
            <div key={f.icon} className={"feature-card " + f.color} style={{ transitionDelay: i * 80 + "ms" }}>
              <FeatureIcon kind={f.icon} />
              <div className="ft-title pixel">{f.title}</div>
              <div className="ft-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </Reveal>

      {/* GAMES PREVIEW */}
      <Reveal className="home-section">
        <SectionHead kicker="// 02" color="cyan" title="JUEGOS DISPONIBLES AHORA" />
        <div className="mini-rail">
          {GAMES.slice(0, 6).map((g) => (
            <MiniCard key={g.id} game={g} />
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 24 }}>
          <Link className="btn lg" href="/games">
            VER TODOS LOS JUEGOS →
          </Link>
        </div>
      </Reveal>

      {/* STATS */}
      <Reveal className="home-stats">
        <div className="stats-inner">
          {HOME_STATS.map((st, i) => (
            <div key={st.n} className="stat-block" style={{ transitionDelay: i * 90 + "ms" }}>
              <div className="stat-n neon-yellow">{st.n}</div>
              <div className="stat-u pixel">{st.unit}</div>
              <div className="stat-s">{st.sub}</div>
            </div>
          ))}
        </div>
      </Reveal>

      {/* ACTIVITY */}
      <Reveal className="home-section">
        <SectionHead kicker="// 03" color="yellow" title="ACTIVIDAD EN VIVO" />
        <div className="activity-grid">
          <div className="activity-card">
            <div className="ac-head">
              <div className="ac-title pixel">▸ ÚLTIMAS PUNTUACIONES</div>
            </div>
            <div className="ticker">
              {RECENT_SCORES.map((r, i) => (
                <div key={r.player} className="tick-row" style={{ animationDelay: i * 60 + "ms" }}>
                  <span className={"tk-p neon-" + r.color}>{r.player}</span>
                  <span className="tk-mid">▸ {r.game}</span>
                  <span className="tk-s">+{r.score.toLocaleString("es-ES")}</span>
                  <span className="tk-t">{r.when}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="activity-card">
            <div className="ac-head">
              <div className="ac-title pixel neon-magenta">▸ TOP JUGADORES · HOY</div>
              <Link className="lb-link" href="/salon">
                VER SALÓN →
              </Link>
            </div>
            <div className="top-list">
              {TOP_PLAYERS.map((r, i) => (
                <div key={r.player} className={"top-row" + (i < 3 ? ` top${i + 1}` : "")}>
                  <span className="tp-rk">#{String(r.rank).padStart(2, "0")}</span>
                  <span className="tp-bar">
                    <span className="tp-fill" style={{ width: 100 - i * 16 + "%" }}></span>
                  </span>
                  <span className="tp-p">{r.player}</span>
                  <span className="tp-s">{r.score.toLocaleString("es-ES")}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Reveal>

      {/* PRICING */}
      <Reveal className="home-section">
        <SectionHead kicker="// 04" color="green" title="PRECIOS" />
        <div className="pricing-grid">
          <div className="price-card">
            <div className="pc-label pixel">PLAN ÚNICO</div>
            <div className="pc-name pixel">JUGADOR VAULT</div>
            <div className="pc-amount">
              <span className="pc-amount-n">$0</span>
              <span className="pc-amount-u">/ SIEMPRE</span>
            </div>
            <div className="pc-tag">SIN TRUCOS · SIN LETRA PEQUEÑA</div>
            <ul className="pc-list">
              <li>✔ Acceso a todos los juegos</li>
              <li>✔ Ranking global y salón de la fama</li>
              <li>✔ Sin anuncios entre partidas</li>
              <li>✔ Guarda tus puntuaciones</li>
              <li>✔ Nuevos juegos cada mes</li>
              <li>✔ Funciona en cualquier navegador</li>
            </ul>
            <Link className="btn xl pulse" style={{ width: "100%" }} href="/auth">
              EMPEZAR GRATIS →
            </Link>
            <div className="pc-foot">No pedimos tarjeta. Nunca lo haremos.</div>
            <div className="pc-stamp pixel">
              FREE
              <br />
              PLAY
            </div>
          </div>

          <div className="pricing-faq">
            <div className="faq-item">
              <div className="faq-q pixel">¿REALMENTE ES GRATIS?</div>
              <div className="faq-a">
                Sí. Arcade Vault es un proyecto sin fines de lucro hecho por amor a los clásicos. No hay versión
                &quot;premium&quot; escondida.
              </div>
            </div>
            <div className="faq-item">
              <div className="faq-q pixel">¿NECESITO CREAR CUENTA?</div>
              <div className="faq-a">
                No. Puedes jugar como invitado. Si quieres guardar tu puntuación y aparecer en el ranking, regístrate en
                10 segundos.
              </div>
            </div>
            <div className="faq-item">
              <div className="faq-q pixel">¿CÓMO SOBREVIVEN SIN COBRAR?</div>
              <div className="faq-a">
                Es un proyecto comunitario. Si te gusta, compártelo. Esa es toda la moneda que aceptamos.
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      {/* FINAL CTA */}
      <Reveal className="home-final">
        <h2 className="final-title pixel">¿LISTO PARA JUGAR?</h2>
        <Link className="btn xl pulse final-cta" href="/games">
          INSERTAR MONEDA →
        </Link>
        <div className="final-tag">Gratis. Sin registro obligatorio. Empieza en segundos.</div>
      </Reveal>
    </div>
  );
}
