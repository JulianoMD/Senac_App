import { useSyncExternalStore } from "react";

// Um só relógio para o app inteiro: todas as contagens regressivas andam juntas
// e só existe um timer rodando, não importa quantos cards estejam na tela.
let now = Date.now();
let timer: number | undefined;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (timer === undefined) {
    timer = window.setInterval(() => {
      now = Date.now();
      listeners.forEach((notify) => notify());
    }, 15_000);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      window.clearInterval(timer);
      timer = undefined;
    }
  };
}

export function useNow() {
  return useSyncExternalStore(subscribe, () => now);
}
