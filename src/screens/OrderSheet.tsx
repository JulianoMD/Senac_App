import { useState } from "react";
import CollectSlider from "../components/CollectSlider";
import Confetti from "../components/Confetti";
import Icon from "../components/Icon";
import PickupTicket from "../components/PickupTicket";
import { brl, foodById, user, type Order } from "../data";
import { useApp } from "../store";

// Código de retirada: deslize para confirmar no balcão, ou cancele com confirmação (prevenção de erros).
export default function OrderSheet({ order, close }: { order: Order; close: () => void }) {
  const { cancelOrder, collectOrder } = useApp();
  const [confirming, setConfirming] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const food = foodById(order.foodId);

  function collect() {
    setCelebrating(true);
    window.setTimeout(() => collectOrder(order), 450);
  }

  return (
    <div className={`ticket-sheet ${celebrating ? "ticket-sheet--celebrate" : ""}`}>
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

      <PickupTicket order={order} torn={celebrating} />

      {!order.collected && (
        <>
          <CollectSlider onComplete={collect} />
          {!celebrating && (
            <p className="collect-help">Deslize na frente do atendente para confirmar a retirada.</p>
          )}
        </>
      )}

      {!order.collected &&
        !celebrating &&
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

      {order.collected && !celebrating && (
        <p className="collect-help">Obrigado por salvar essa refeição do lixo.</p>
      )}
    </div>
  );
}
