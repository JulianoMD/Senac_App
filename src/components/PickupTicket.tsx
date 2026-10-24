import { foodById, orderStage, user, type Order } from "../data";
import { useNow } from "../time";
import Barcode from "./Barcode";
import PickupCountdown from "./PickupCountdown";

export default function PickupTicket({
  order,
  printing = false,
  torn = false,
  onCodeClick,
}: {
  order: Order;
  printing?: boolean;
  torn?: boolean;
  onCodeClick?: () => void;
}) {
  const food = foodById(order.foodId);
  const stage = orderStage(food, useNow());
  const showStub = !order.collected || torn;

  const ticket = (
    <div className={`ticket ${printing ? "ticket--print" : ""} ${torn ? "is-torn" : ""}`}>
      <div className="ticket-top">
        <span className="ticket-handle" aria-hidden="true" />
        <p className="ticket-label">Retirada em nome de</p>
        <p className="ticket-name">{user.name}</p>
        {onCodeClick ? (
          <button className="ticket-code" type="button" onClick={onCodeClick} aria-label={`Ampliar o código ${order.code} para o balcão`}>
            {order.code}
          </button>
        ) : (
          <p className="ticket-code">{order.code}</p>
        )}
        {order.collected ? (
          <p className="stamp-row">
            <span className="stamp">Retirado</span>
          </p>
        ) : (
          <ol className="status-steps" aria-label="Situação do pedido">
            <li className="is-done">Pago</li>
            <li className={stage.phase === "soon" ? "is-current" : "is-done"}>Separado</li>
            {stage.phase === "closed" ? (
              <li className="is-current is-closed">Retirada encerrada</li>
            ) : (
              <li className={stage.phase === "open" ? "is-current" : "is-pending"}>Pronto para retirar</li>
            )}
          </ol>
        )}
        <div className="ticket-band">
          <div className="ticket-item">
            <img src={food.image} alt="" />
            <div>
              <strong>{food.title}</strong>
              <span>{food.place}</span>
            </div>
          </div>
          <dl className="ticket-facts">
            <div>
              <dt>Retire hoje</dt>
              <dd>{food.pickup}</dd>
            </div>
            <div>
              <dt>Onde</dt>
              <dd>{food.spot}</dd>
            </div>
            <div>
              <dt>Pago via</dt>
              <dd>{order.paidWith}</dd>
            </div>
          </dl>
          {!order.collected && (
            <p className="ticket-countdown">
              <PickupCountdown food={food} size="md" />
            </p>
          )}
        </div>
      </div>
      {showStub && (
        <div className="ticket-stub">
          {/* Uma luz de leitor passa pelo código quando o ticket abre. */}
          <div className="scan">
            <Barcode code={order.ean} className="barcode--large" barHeight={30} />
            <span className="scan-line" aria-hidden="true" />
          </div>
          <p>Mostre no balcão e retire, sem fila</p>
        </div>
      )}
    </div>
  );

  // Ao pagar, o ticket "sai da impressora" por uma fenda.
  return printing ? (
    <>
      <span className="ticket-slot" aria-hidden="true" />
      <div className="print-window">{ticket}</div>
    </>
  ) : (
    ticket
  );
}
