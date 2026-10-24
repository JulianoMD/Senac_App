import { useLayoutEffect, useRef } from "react";
import { isReducedMotion } from "../motion";
import { useApp, type Tab } from "../store";
import Icon, { type IconName } from "./Icon";

const tabs: { id: Tab; label: string; icon: IconName }[] = [
  { id: "discover", label: "Descobrir", icon: "compass" },
  { id: "orders", label: "Pedidos", icon: "ticket" },
  { id: "favorites", label: "Favoritos", icon: "heart" },
  { id: "profile", label: "Perfil", icon: "profile" },
];

export default function BottomNav() {
  const app = useApp();
  const index = tabs.findIndex((item) => item.id === app.tab);
  const pillRef = useRef<HTMLSpanElement>(null);
  const previous = useRef(index);

  // A pílula escorrega até a aba nova e estica no meio do caminho, como uma gota.
  useLayoutEffect(() => {
    const from = previous.current;
    previous.current = index;
    const pill = pillRef.current;
    if (!pill || from === index || typeof pill.animate !== "function") return;
    if (isReducedMotion()) {
      pill.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: "ease-out" });
      return;
    }
    const distance = Math.abs(index - from);
    pill.animate(
      [
        { transform: `translateX(${from * 100}%) scaleX(1)` },
        {
          transform: `translateX(${((from + index) / 2) * 100}%) scaleX(${1 + distance * 0.5})`,
          offset: 0.4,
        },
        { transform: `translateX(${index * 100}%) scaleX(1)` },
      ],
      { duration: 460 + distance * 60, easing: "cubic-bezier(0.3, 1.25, 0.4, 1)" },
    );
  }, [index]);

  return (
    <nav className="bottom-nav" aria-label="Navegação principal">
      <span
        ref={pillRef}
        className="nav-pill"
        style={{ transform: `translateX(${index * 100}%)` }}
        aria-hidden="true"
      />
      {tabs.map((item) => (
        <button
          className={app.tab === item.id ? "is-active" : ""}
          key={item.id}
          data-tab={item.id}
          onClick={() => app.setTab(item.id)}
          type="button"
          aria-current={app.tab === item.id ? "page" : undefined}
        >
          <span className="nav-icon">
            <Icon name={item.icon} size={22} />
          </span>
          <span className="nav-label">{item.label}</span>
          {item.id === "orders" && app.activeOrders.length > 0 && (
            <em className="nav-count" aria-label={`${app.activeOrders.length} pedidos para retirar`}>
              {app.activeOrders.length}
            </em>
          )}
        </button>
      ))}
    </nav>
  );
}
