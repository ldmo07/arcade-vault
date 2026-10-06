"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "@/lib/session";

export function Nav() {
  const pathname = usePathname();
  const { user, signOut } = useSession();
  const [open, setOpen] = useState(false);

  const isHome = pathname === "/";
  const isLibrary =pathname.startsWith("/games") || pathname.startsWith("/juegos");
  const isHall = pathname.startsWith("/salon");
  const isAuth = pathname.startsWith("/auth");
  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <nav className="av-nav" aria-label="Principal">
        <Link className="logo" href="/" aria-label="Arcade Vault, ir al inicio">
          <div className="logo-mark" aria-hidden="true"></div>
          <div className="logo-text neon-cyan">
            ARCADE <span className="neon-magenta">VAULT</span>
          </div>
        </Link>
        <div className="links">
          <Link href="/" className={isHome ? "active" : ""} aria-current={isHome ? "page" : undefined}>
            Inicio
          </Link>
          <Link href="/games" className={isLibrary ? "active" : ""} aria-current={isLibrary ? "page" : undefined}>
            Biblioteca
          </Link>
          <Link href="/salon" className={isHall ? "active" : ""} aria-current={isHall ? "page" : undefined}>
            Salón de la Fama
          </Link>
          <a aria-disabled="true" title="Próximamente">
            Acerca de
          </a>
        </div>
        <div className="spacer"></div>
        <div className="coin-counter">
          <span className="coin" aria-hidden="true"></span>
          <span>CRÉDITOS · 03</span>
        </div>
        {user ? (
          <button type="button" className="btn ghost auth-btn" onClick={signOut} aria-label={`Cerrar sesión de ${user.name}`}>
            {user.name} ▾
          </button>
        ) : (
          <Link className="btn auth-btn" href="/auth">
            Iniciar Sesión
          </Link>
        )}
        <button
          type="button"
          className="btn ghost hamburger"
          onClick={() => setOpen(true)}
          aria-label="Menú"
          aria-expanded={open}
          aria-controls="av-mobile-panel"
        >
          ≡
        </button>
      </nav>

      <div className={"av-mobile-backdrop" + (open ? " open" : "")} onClick={close} aria-hidden="true"></div>
      <aside id="av-mobile-panel" className={"av-mobile-panel" + (open ? " open" : "")} inert={!open} aria-label="Menú móvil">
        <div className="pixel neon-cyan" style={{ fontSize: 11, marginBottom: 16 }}>MENÚ</div>
        <Link href="/" className={isHome ? "active" : ""} aria-current={isHome ? "page" : undefined} onClick={close}>
          Inicio
        </Link>
        <Link href="/games" className={isLibrary ? "active" : ""} aria-current={isLibrary ? "page" : undefined} onClick={close}>
          Biblioteca
        </Link>
        <Link href="/salon" className={isHall ? "active" : ""} aria-current={isHall ? "page" : undefined} onClick={close}>
          Salón de la Fama
        </Link>
        <a aria-disabled="true" title="Próximamente">
          Acerca de
        </a>
        <Link href="/auth" className={isAuth ? "active" : ""} aria-current={isAuth ? "page" : undefined} onClick={close}>
          {user ? "Cuenta" : "Iniciar Sesión"}
        </Link>
        <div style={{ flex: 1 }}></div>
        <div className="pixel" style={{ fontSize: 9, color: "var(--ink-faint)", letterSpacing: "0.16em" }}>
          CRÉDITOS · 03
        </div>
      </aside>
    </>
  );
}
