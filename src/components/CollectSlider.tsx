import { useRef, useState } from "react";
import Icon from "./Icon";

const PADDING = 6;

// "Deslize para retirar": gesto feito na frente do atendente, difícil de disparar sem querer.
// No teclado (Enter ou Espaço) e nos leitores de tela, ativar o botão confirma.
export default function CollectSlider({ onComplete }: { onComplete: () => void }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLButtonElement>(null);
  const start = useRef<number | null>(null);
  const [x, setX] = useState(0);
  const [max, setMax] = useState(1);
  const [dragging, setDragging] = useState(false);
  const [done, setDone] = useState(false);

  function measure() {
    const track = trackRef.current;
    const knob = knobRef.current;
    const value = track && knob ? track.clientWidth - knob.offsetWidth - PADDING * 2 : 1;
    setMax(value);
    return value;
  }

  function finish() {
    setX(measure());
    setDone(true);
    onComplete();
  }

  function onPointerDown(event: React.PointerEvent<HTMLButtonElement>) {
    if (done) return;
    measure();
    start.current = event.clientX - x;
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: React.PointerEvent<HTMLButtonElement>) {
    if (start.current === null) return;
    setX(Math.min(max, Math.max(0, event.clientX - start.current)));
  }

  function onPointerUp() {
    if (start.current === null) return;
    start.current = null;
    setDragging(false);
    if (x >= max * 0.85) finish();
    else setX(0);
  }

  const progress = Math.min(1, x / max);

  return (
    <div
      ref={trackRef}
      className={`collect ${dragging ? "is-dragging" : ""} ${done ? "is-done" : ""}`}
      style={{ "--p": progress } as React.CSSProperties}
    >
      <span className="collect-fill" style={{ width: `calc(${x}px + 58px)` }} />
      <span className="collect-label">{done ? "Retirada confirmada" : "Deslize para retirar"}</span>
      <button
        ref={knobRef}
        className="collect-knob"
        type="button"
        style={{ transform: `translateX(${x}px)` }}
        aria-label="Confirmar retirada: deslize para a direita ou pressione Enter"
        disabled={done}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        // Enter, Espaço e leitores de tela geram um clique sem ponteiro (detail 0); um toque
        // rápido com o dedo não confirma — só o gesto de deslizar.
        onClick={(event) => {
          if (!done && event.detail === 0) finish();
        }}
      >
        <Icon name={done ? "check" : "arrow"} size={22} />
      </button>
    </div>
  );
}
