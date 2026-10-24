import Icon from "../components/Icon";
import PickupCountdown from "../components/PickupCountdown";
import { foodById } from "../data";
import { useApp } from "../store";

export default function Orders() {
  const { orders, activeOrders, openOrder, setTab } = useApp();
  const history = orders.filter((order) => order.collected);

  return (
    <main className="inside-page">
      <div className="page-header">
        <h1>Pedidos</h1>
        <p>Mostre o código no balcão e retire sem fila.</p>
      </div>

      {activeOrders.length ? (
        <div className="strip-list">
          {activeOrders.map((order) => {
            const food = foodById(order.foodId);
            return (
              <div className="halo strip-halo" key={order.id}>
                <button
                  className="ticket-strip"
                  type="button"
                  onClick={() => openOrder(order.id)}
                  aria-haspopup="dialog"
                >
                  <span className="strip-main">
                    <span className="status">Pronto para retirar</span>
                    <span className="strip-title">{food.title}</span>
                    <span className="strip-meta">
                      <PickupCountdown food={food} /> · {food.spot}
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
