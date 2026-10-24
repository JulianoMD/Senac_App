import Icon from "../components/Icon";
import PickupCountdown from "../components/PickupCountdown";
import { foodById, orderStage, slotLabel } from "../data";
import { useApp } from "../store";
import { useNow } from "../time";

export default function Orders() {
  const { orders, activeOrders, openOrder, setTab } = useApp();
  const now = useNow();
  const history = orders.filter((order) => order.collected);
  // O que já dá para retirar vem primeiro (quem fecha antes no topo), depois o que ainda vai abrir.
  const rank = { open: 0, soon: 1, closed: 2 };
  const upcoming = [...activeOrders].sort((a, b) => {
    const foodA = foodById(a.foodId);
    const foodB = foodById(b.foodId);
    const byStage = rank[orderStage(foodA, now).phase] - rank[orderStage(foodB, now).phase];
    return byStage || foodA.pickupEnd - foodB.pickupEnd;
  });

  return (
    <main className="inside-page">
      <div className="page-header">
        <h1>Pedidos</h1>
        <p>Mostre o código no balcão e retire sem fila.</p>
      </div>

      {activeOrders.length ? (
        <div className="strip-list">
          {upcoming.map((order) => {
            const food = foodById(order.foodId);
            const stage = orderStage(food, now);
            return (
              <div className="halo strip-halo" key={order.id}>
                <button
                  className="ticket-strip"
                  type="button"
                  onClick={() => openOrder(order.id)}
                  aria-haspopup="dialog"
                >
                  <span className="strip-main">
                    <span className={`status status--${stage.phase}`}>{stage.label}</span>
                    <span className="strip-title">{food.title}</span>
                    <span className="strip-meta">
                      <PickupCountdown food={food} label={order.slot ? `Seu horário ${slotLabel(order.slot)}` : undefined} />
                      <span>· {food.spot}</span>
                    </span>
                  </span>
                  <span className="strip-stub">
                    <span className="order-code">{order.code}</span>
                    <span className="strip-hint">Abrir código</span>
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <span className="empty-icon tone-blue">
            <Icon name="ticket" size={26} />
          </span>
          <p>Nenhum pedido para retirar</p>
          <span>Quando você reservar, o código de retirada com seu nome aparece aqui.</span>
          <button className="primary-button" type="button" onClick={() => setTab("discover")}>
            Ver ofertas de hoje
          </button>
        </div>
      )}

      {history.length > 0 && (
        <section className="profile-section">
          <h2 className="section-title">Retirados</h2>
          <div className="history">
            {history.map((order) => {
              const food = foodById(order.foodId);
              return (
                <button className="history-row" type="button" key={order.id} onClick={() => openOrder(order.id)}>
                  <img src={food.image} alt="" />
                  <span>
                    <strong>{food.title}</strong>
                    <small>
                      {order.code} · {food.place}
                    </small>
                  </span>
                  <span className="history-check" aria-label="Retirado">
                    <Icon name="check" size={16} />
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
