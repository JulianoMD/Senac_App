import { useRef, useState } from "react";
import Confetti from "../components/Confetti";
import CounterView from "../components/CounterView";
import Icon from "../components/Icon";
import PickupTicket from "../components/PickupTicket";
import Sheet from "../components/Sheet";
import { atClock, brl, foodById, orderStage, user, type Order } from "../data";
import { canTransition, withTransition } from "../motion";
import { useApp } from "../store";
import { useNow } from "../time";

// Código de retirada: abre o modo balcão para o atendente ler e confirmar,
// ou cancela com confirmação (prevenção de erros).
export default function OrderSheet({ order, close }: { order: Order; close: () => void }) {
  const { cancelOrder, collectOrder } = useApp();
  const [confirming, setConfirming] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [counterOpen, setCounterOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const food = foodById(order.foodId);
  const phase = orderStage(food, useNow()).phase;
  const closed = phase === "closed";

  function collect() {
    setCelebrating(true);
    window.setTimeout(() => collectOrder(order), 450);
  }

  const codeElement = () => rootRef.current?.querySelector<HTMLElement>(".ticket-code") ?? null;

  // O código do ticket "cresce" até o centro da tela cheia (e volta ao fechar).
  function openCounter() {
    const code = codeElement();
    if (code) code.style.viewTransitionName = "pickup-code";
    withTransition("counter", () => {
      if (code) code.style.viewTransitionName = "";
      setCounterOpen(true);
    });
  }

  function closeCounter(then?: () => void) {
    const code = codeElement();
    const transition = withTransition("counter", () => {
      setCounterOpen(false);
      if (code) code.style.viewTransitionName = "pickup-code";
    });
    const done = () => {
      if (code) code.style.viewTransitionName = "";
      then?.();
    };
    if (transition) transition.finished.finally(done);
    else done();
  }

  return (
    <div ref={rootRef} className={`ticket-sheet ${celebrating ? "ticket-sheet--celebrate" : ""}`}>
      {celebrating && <Confetti />}
      <div className="ticket-sheet-bar" data-sheet-handle>
        <span className="sheet-grabber" aria-hidden="true" />
        <span>{order.collected ? "Pedido retirado" : "Seu código de retirada"}</span>
        <button type="button" aria-label="Fechar" onClick={close}>
          <Icon name="close" size={20} />
        </button>
      </div>

      {celebrating && (
        <div className="celebrate">
          <p className="celebrate-title">Bom apetite, {user.firstName}!</p>
          <p>Retirada confirmada, sem pegar fila.</p>
        </div>
      )}

      <PickupTicket order={order} torn={celebrating} onCodeClick={order.collected ? undefined : openCounter} />

      {!order.collected && !celebrating && (
        <>
          <button className="sheet-action" type="button" onClick={openCounter}>
            <Icon name="expand" size={18} />
            Mostrar no balcão
          </button>
          <p className="collect-help">
            {closed
              ? `A retirada encerrou ${atClock(food.pickupEnd)}. Mostre o código no balcão de ${food.place} para combinar a entrega.`
              : "Abre o código em tela cheia para o atendente ler e confirmar."}
          </p>
        </>
      )}

      {/* Cancelamento só até a retirada abrir: a partir daí a cantina já separou a comida. */}
      {!order.collected &&
        !celebrating &&
        phase === "soon" &&
        (confirming ? (
          <div className="confirm" role="alertdialog" aria-label="Confirmar cancelamento">
            <p>
              <strong>Cancelar esta reserva?</strong>
              {brl.format(food.price)} voltam pelo {order.paidWith}. A oferta fica disponível para outra pessoa.
            </p>
            <div className="confirm-actions">
              <button className="ghost-button" type="button" onClick={() => setConfirming(false)}>
                Manter reserva
              </button>
              <button className="danger-button" type="button" onClick={() => cancelOrder(order)}>
                Sim, cancelar
              </button>
            </div>
          </div>
        ) : (
          <button className="link-button" type="button" onClick={() => setConfirming(true)}>
            Cancelar reserva
          </button>
        ))}

      {!order.collected && !celebrating && phase === "open" && (
        <p className="collect-help">A retirada já começou, então esta reserva não pode mais ser cancelada.</p>
      )}

      {order.collected && !celebrating && (
        <p className="collect-help">Obrigado por salvar essa refeição do lixo.</p>
      )}

      <Sheet
        open={counterOpen}
        onClose={() => closeCounter()}
        label="Modo balcão"
        variant="fullscreen"
        vt={canTransition()}
      >
        {(closeView) => (
          <CounterView
            order={order}
            close={closeView}
            onCollect={() => window.setTimeout(() => closeCounter(collect), 350)}
          />
        )}
      </Sheet>
    </div>
  );
}
