"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";

export interface SessionUser {
  name: string;
}

export interface SavedScore {
  game: string;
  score: number;
  name: string;
  at: number;
}

const USER_KEY = "av_user";
const SCORES_KEY = "av_scores";

interface SessionValue {
  user: SessionUser | null;
  login: (user: SessionUser | null) => void;
  signOut: () => void;
  saveScore: (entry: Omit<SavedScore, "at">) => void;
}

const SessionContext = createContext<SessionValue | null>(null);

const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

function notify() {
  listeners.forEach((cb) => cb());
}

function readRawUser(): string | null {
  try {
    return localStorage.getItem(USER_KEY);
  } catch {
    return null;
  }
}

function parseUser(raw: string | null): SessionUser | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed.name === "string" ? { name: parsed.name } : null;
  } catch {
    return null;
  }
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  // Servidor y primer render de hidratación: sin sesión (snapshot null).
  const raw = useSyncExternalStore(subscribe, readRawUser, () => null);
  const user = useMemo(() => parseUser(raw), [raw]);

  const login = useCallback((u: SessionUser | null) => {
    try {
      if (u) localStorage.setItem(USER_KEY, JSON.stringify(u));
      else localStorage.removeItem(USER_KEY);
    } catch {}
    notify();
  }, []);

  const signOut = useCallback(() => login(null), [login]);

  const saveScore = useCallback((entry: Omit<SavedScore, "at">) => {
    try {
      const all: SavedScore[] = JSON.parse(localStorage.getItem(SCORES_KEY) || "[]");
      all.push({ ...entry, at: Date.now() });
      localStorage.setItem(SCORES_KEY, JSON.stringify(all));
    } catch {}
  }, []);

  const value = useMemo(
    () => ({ user, login, signOut, saveScore }),
    [user, login, signOut, saveScore],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession debe usarse dentro de <SessionProvider>");
  return ctx;
}
