import { useEffect } from "react";
import { foodById, slotLabel, user, type Order } from "../data";
import Barcode from "./Barcode";
import CollectSlider from "./CollectSlider";
import Icon from "./Icon";
import PickupCountdown from "./PickupCountdown";

// Modo balcão: código grande em tela cheia, fundo branco e contraste máximo para o atendente ler.
export default function CounterView({
  order,
  close,
  onCollect,
}: {
  order: Order;
  close: () => void;
  onCollect: () => void;
}) {
  const food = foodById(order.foodId);

  // Mantém a tela acesa enquanto o código está sendo mostrado.
  useEffect(() => {
    let lock: WakeLockSentinel | undefined;
    navigator.wakeLock
      ?.request("screen")
      .then((sentinel) => {
        lock = sentinel;
      })
      .catch(() => {});
    return () => {
      lock?.release().catch(() => {});
    };
  }, []);

  return (
    <div className="counter">
      <div className="counter-bar">
        <span>Mostre para o atendente</span>
        <button type="button" aria-label="Sair do modo balcão" onClick={close}>
          <Icon name="close" size={22} />
        </button>
      </div>

      <div className="counter-main">
        <p className="counter-label">Retirada em nome de</p>
        <p className="counter-name">{user.name}</p>
        <p className="counter-code" style={{ viewTransitionName: "pickup-code" }}>
          {order.code}
        </p>
        <div className="counter-barcode">
          <Barcode code={order.ean} barHeight={34} />
        </div>
        <p className="counter-info">
          {food.title} · {food.spot}
          {order.slot && ` · ${slotLabel(order.slot)}`}
        </p>
        <PickupCountdown food={food} size="lg" />
      </div>

      <div className="counter-collect">
        <CollectSlider onComplete={onCollect} />
        <p>O atendente desliza para confirmar a entrega.</p>
      </div>
    </div>
  );
}
