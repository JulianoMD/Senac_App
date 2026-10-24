import { useSyncExternalStore } from "react";

// Instalação como app (PWA). Chrome/Android avisam que dá para instalar com o evento
// "beforeinstallprompt"; o Safari do iPhone não tem esse aviso, então lá mostramos o passo a passo.

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let deferred: InstallPromptEvent | null = null;
let installed =
  typeof window !== "undefined" &&
  (window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true);

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferred = event as InstallPromptEvent;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    installed = true;
    deferred = null;
    notify();
  });
}

let snapshot = { canPrompt: false, installed };

function getSnapshot() {
  if (snapshot.canPrompt !== Boolean(deferred) || snapshot.installed !== installed) {
    snapshot = { canPrompt: Boolean(deferred), installed };
  }
  return snapshot;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export const isIOS = typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent);

export function useInstall() {
  const state = useSyncExternalStore(subscribe, getSnapshot);

  async function install() {
    if (!deferred) return "unavailable" as const;
    const event = deferred;
    deferred = null;
    notify();
    await event.prompt();
    return (await event.userChoice).outcome;
  }

  return { ...state, install };
}
