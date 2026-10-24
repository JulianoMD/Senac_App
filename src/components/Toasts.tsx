import { useEffect, useRef } from "react";
import { useApp } from "../store";

// Feedback imediato para cada ação (visibilidade do status), com "Desfazer" quando faz sentido.
// Fica num popover para aparecer por cima dos painéis abertos.
export default function Toasts() {
  const { toasts, dismissToast } = useApp();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof element.showPopover !== "function") return;
    try {
      if (element.matches(":popover-open")) element.hidePopover();
      if (toasts.length) element.showPopover();
    } catch {
      // Navegador sem suporte a popover: os avisos aparecem no fluxo normal.
    }
  }, [toasts]);

  return (
    <div ref={ref} popover="manual" className="toasts" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div className={`toast ${toast.leaving ? "is-leaving" : ""}`} key={toast.id}>
          <span>{toast.message}</span>
          {toast.action && (
            <button
              type="button"
              onClick={() => {
                toast.action?.run();
                dismissToast(toast.id);
              }}
            >
              {toast.action.label}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
