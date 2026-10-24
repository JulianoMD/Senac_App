import { flushSync } from "react-dom";

// Com "reduzir movimento" ligado a transição continua, mas o CSS troca deslizes e zoom
// por um esmaecer simples (sem movimento na tela).
export function canTransition() {
  return typeof document !== "undefined" && typeof document.startViewTransition === "function";
}

// Preferência efetiva do app (sistema ou escolha da pessoa no Perfil), espelhada em <html data-motion>.
export function isReducedMotion() {
  return typeof document !== "undefined" && document.documentElement.dataset.motion === "reduced";
}

// Roda a atualização dentro de uma View Transition (quando o navegador suporta).
// `kind` vai para <html data-vt> para o CSS escolher a animação certa.
export function withTransition(kind: string, update: () => void) {
  if (!canTransition()) {
    update();
    return null;
  }
  const root = document.documentElement;
  root.dataset.vt = kind;
  const transition = document.startViewTransition(() => flushSync(update));
  // Uma transição interrompida por outra (ex.: toques rápidos) é normal: a tela só pula para o fim.
  transition.ready.catch(() => {});
  transition.finished.finally(() => {
    if (root.dataset.vt === kind) delete root.dataset.vt;
  });
  return transition;
}

// Depois de pagar, um ticket "voa" até a aba Pedidos (mostra onde o pedido foi parar).
export function flyToOrders() {
  const icon = document.querySelector<HTMLElement>('.bottom-nav button[data-tab="orders"] .nav-icon');
  if (!icon) return;
  const bump = () => {
    icon.classList.remove("is-bumped");
    void icon.offsetWidth;
    icon.classList.add("is-bumped");
  };
  if (isReducedMotion() || typeof icon.animate !== "function") {
    bump();
    return;
  }
  const target = icon.getBoundingClientRect();
  const fromX = window.innerWidth / 2 - 22;
  const fromY = window.innerHeight * 0.42;
  const toX = target.left + target.width / 2 - 22;
  const toY = target.top + target.height / 2 - 22;
  const ticket = document.createElement("div");
  ticket.className = "fly-ticket";
  ticket.setAttribute("aria-hidden", "true");
  ticket.innerHTML =
    '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8a3 3 0 0 0 0 6v4h18v-4a3 3 0 0 0 0-6V4H3v4Z"/><path d="M14 4v2M14 10v2M14 16v2"/></svg>';
  document.body.append(ticket);
  const flight = ticket.animate(
    [
      { transform: `translate(${fromX}px, ${fromY}px) scale(0.4) rotate(-12deg)`, opacity: 0 },
      { transform: `translate(${fromX}px, ${fromY - 30}px) scale(1.25) rotate(-6deg)`, opacity: 1, offset: 0.2 },
      {
        transform: `translate(${(fromX + toX) / 2 - 40}px, ${Math.min(fromY, toY) - 70}px) scale(1) rotate(8deg)`,
        offset: 0.55,
      },
      { transform: `translate(${toX}px, ${toY}px) scale(0.45) rotate(0deg)`, opacity: 0.9 },
    ],
    { duration: 900, easing: "cubic-bezier(0.45, 0, 0.25, 1)" },
  );
  flight.finished.finally(() => {
    ticket.remove();
    bump();
  });
}

// Foto do card visível na tela, usada como ponto de partida da animação card → oferta.
export function visibleCardPhoto(foodId: number) {
  const photo = document.querySelector<HTMLElement>(`[data-food-card="${foodId}"] .photo`);
  if (!photo) return null;
  const rect = photo.getBoundingClientRect();
  const onScreen =
    rect.bottom > 0 && rect.top < window.innerHeight && rect.right > 0 && rect.left < window.innerWidth;
  return onScreen ? photo : null;
}
