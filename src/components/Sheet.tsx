import { useLayoutEffect, useRef, useState } from "react";

type Drag = {
  startY: number;
  lastY: number;
  lastTime: number;
  velocity: number;
  active: boolean;
  panel: HTMLElement;
};

// Painel que sobe da parte de baixo. Fecha pelo X, Esc, toque fora ou arrastando
// para baixo a partir das áreas marcadas com data-sheet-handle (controle e liberdade).
// Com `vt`, a entrada e a saída ficam por conta da View Transition.
export default function Sheet({
  open,
  onClose,
  label,
  variant = "sheet",
  vt = false,
  children,
}: {
  open: boolean;
  onClose: (reason?: "drag") => void;
  label: string;
  variant?: "sheet" | "fullscreen";
  vt?: boolean;
  children: (close: () => void) => React.ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const drag = useRef<Drag | null>(null);
  const suppressClick = useRef(false);
  const [closing, setClosing] = useState(false);

  // Layout effect: o dialog abre dentro do mesmo quadro da View Transition.
  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setClosing(false);
      dialog.style.removeProperty("--drag");
      dialog.showModal();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  function requestClose() {
    if (closing) return;
    if (vt) {
      onClose();
      return;
    }
    setClosing(true);
    window.setTimeout(() => {
      setClosing(false);
      onClose();
    }, 220);
  }

  function onPointerDown(event: React.PointerEvent<HTMLDialogElement>) {
    if (variant !== "sheet" || (event.pointerType === "mouse" && event.button !== 0)) return;
    if (!(event.target as HTMLElement).closest("[data-sheet-handle]")) return;
    const panel = dialogRef.current?.firstElementChild;
    if (!(panel instanceof HTMLElement)) return;
    drag.current = {
      startY: event.clientY,
      lastY: event.clientY,
      lastTime: event.timeStamp,
      velocity: 0,
      active: false,
      panel,
    };
  }

  function onPointerMove(event: React.PointerEvent<HTMLDialogElement>) {
    const state = drag.current;
    if (!state) return;
    const distance = event.clientY - state.startY;
    if (!state.active) {
      if (Math.abs(distance) < 6) return;
      if (distance < 0) {
        drag.current = null;
        return;
      }
      state.active = true;
      dialogRef.current?.setPointerCapture(event.pointerId);
      state.panel.style.animation = "none";
      state.panel.style.transition = "none";
    }
    const offset = Math.max(0, distance);
    state.panel.style.transform = `translateY(${offset}px)`;
    dialogRef.current?.style.setProperty("--drag", String(Math.min(1, offset / state.panel.offsetHeight)));
    state.velocity = (event.clientY - state.lastY) / Math.max(1, event.timeStamp - state.lastTime);
    state.lastY = event.clientY;
    state.lastTime = event.timeStamp;
  }

  function onPointerUp(event: React.PointerEvent<HTMLDialogElement>) {
    const state = drag.current;
    drag.current = null;
    if (!state?.active) return;
    suppressClick.current = true;
    const { panel } = state;
    const dialog = dialogRef.current;
    const distance = event.clientY - state.startY;

    // Fecha se passou de ~1/4 da altura, ou num "arremesso" rápido que já percorreu um bom trecho.
    if (distance > panel.offsetHeight * 0.28 || (state.velocity > 0.6 && distance > 90)) {
      panel.style.transition = "transform 200ms ease-in";
      panel.style.transform = "translateY(100%)";
      dialog?.style.setProperty("--drag", "1");
      window.setTimeout(() => onClose("drag"), 200);
    } else {
      // Volta para o lugar com um leve "quique" de mola.
      panel.style.transition = "transform 480ms cubic-bezier(0.2, 1.5, 0.4, 1)";
      panel.style.transform = "";
      dialog?.style.setProperty("--drag", "0");
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className={`${variant} ${vt ? "is-vt" : ""} ${closing ? "is-closing" : ""}`}
      aria-label={label}
      onCancel={(event) => {
        event.preventDefault();
        requestClose();
      }}
      onClick={(event) => {
        if (suppressClick.current) {
          suppressClick.current = false;
          return;
        }
        if (event.target === event.currentTarget) requestClose();
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {open && children(requestClose)}
    </dialog>
  );
}
