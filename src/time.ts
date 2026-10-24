import { useSyncExternalStore } from "react";

// Um só relógio para o app inteiro: todas as contagens regressivas andam juntas
// e só existe um timer rodando, não importa quantos cards estejam na tela.
let now = Date.now();
let timer: number | undefined;
const listeners = new Set<() => void>();

function tick() {
  now = Date.now();
  listeners.forEach((notify) => notify());
}

// Ao voltar para o app (tela desbloqueada, outra aba), as contagens se atualizam na hora.
function onVisible() {
  if (document.visibilityState === "visible") tick();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (timer === undefined) {
    timer = window.setInterval(tick, 15_000);
    document.addEventListener("visibilitychange", onVisible);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      window.clearInterval(timer);
      timer = undefined;
      document.removeEventListener("visibilitychange", onVisible);
    }
  };
}

export function useNow() {
  return useSyncExternalStore(subscribe, () => now);
}
