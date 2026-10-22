// Skins comunes a todos los juegos. Cada juego define su paleta en
// lib/games/<slug>/skins.ts como Record<SkinId, Palette>.

export type SkinId = "clasico" | "neon" | "retro";

export const SKIN_IDS: readonly SkinId[] = ["clasico", "neon", "retro"];

export const DEFAULT_SKIN: SkinId = "clasico";

export const SKIN_LABELS: Record<SkinId, string> = {
  clasico: "CLÁSICO",
  neon: "NEÓN",
  retro: "RETRO",
};

export function isSkinId(value: unknown): value is SkinId {
  return (
    typeof value === "string" && (SKIN_IDS as readonly string[]).includes(value)
  );
}

const storageKey = (gameId: string) => `av_skin_${gameId}`;

// localStorage puede no existir (SSR), estar bloqueado o contener basura.
export function loadSkin(gameId: string): SkinId {
  try {
    const raw = localStorage.getItem(storageKey(gameId));
    return isSkinId(raw) ? raw : DEFAULT_SKIN;
  } catch {
    return DEFAULT_SKIN;
  }
}

const listeners = new Set<() => void>();

export function saveSkin(gameId: string, id: SkinId): void {
  try {
    localStorage.setItem(storageKey(gameId), id);
  } catch {
    // Sin persistencia: la skin solo dura lo que la pestaña
  }
  listeners.forEach((cb) => cb());
}

// Para useSyncExternalStore: notifica cambios locales y de otras pestañas.
export function subscribeSkin(cb: () => void): () => void {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}
