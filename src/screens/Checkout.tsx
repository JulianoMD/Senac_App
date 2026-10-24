import { useRef, useState } from "react";
import CampusMap from "../components/CampusMap";
import Confetti from "../components/Confetti";
import Icon, { type IconName } from "../components/Icon";
import Photo from "../components/Photo";
import PickupCountdown from "../components/PickupCountdown";
import PickupTicket from "../components/PickupTicket";
import StoreMark from "../components/StoreMark";
import { brl, discountOf, distance, paymentMethods, pickupStatus, type Food, type Order } from "../data";
import { withTransition } from "../motion";
import { useNow } from "../time";
import { useApp } from "../store";

const methodIcon: Record<string, IconName> = { pix: "pix", card: "card" };

function Steps({ current }: { current: 1 | 2 | 3 }) {
  const labels = ["Oferta", "Pagamento", "Retirada"];
  return (
    <ol className="steps" aria-label={`Etapa ${current} de 3`}>
      {labels.map((label, index) => (
        <li
          key={label}
          className={index + 1 < current ? "is-done" : index + 1 === current ? "is-current" : ""}
          aria-current={index + 1 === current ? "step" : undefined}
        >
          <span>{index + 1 < current ? <Icon name="check" size={12} /> : index + 1}</span>
          {label}
        </li>
      ))}
    </ol>
  );
}

export default function Checkout({ food, close }: { food: Food; close: () => void }) {
  const app = useApp();
  const [step, setStep] = useState<"details" | "payment" | "done">("details");
  // Cada etapa "encaixa" na outra: o painel muda de altura suavemente e o conteúdo troca com esmaecer.
  const go = (next: "details" | "payment" | "done", extra?: () => void) =>
    withTransition("step", () => {
      extra?.();
      setStep(next);
    });
  const [method, setMethod] = useState(paymentMethods[0].id);
  const [paying, setPaying] = useState(false);
  const payingRef = useRef(false);
  const [order, setOrder] = useState<Order | null>(null);

  const left = app.stock[food.id] ?? food.stock;
  // Depois do horário de retirada não dá para reservar (prevenção de erro).
  const phase = pickupStatus(food, useNow()).phase;
  const closed = phase === "closed";
  const existing = app.activeOrders.find((item) => item.foodId === food.id);

  // Um toque só: um segundo toque rápido no "Pagar" não gera outra cobrança.
  function pay() {
    if (payingRef.current || left === 0 || closed) return;
    payingRef.current = true;
    setPaying(true);
    window.setTimeout(() => {
      const paidWith = paymentMethods.find((item) => item.id === method)?.short ?? "Pix";
      const created = app.pay(food, paidWith);
      go("done", () => {
        setOrder(created);
        setPaying(false);
      });
    }, 1100);
  }

  if (step === "done" && order) {
    return (
      <div className="ticket-sheet ticket-sheet--celebrate">
        <Confetti />
        <div className="ticket-sheet-bar" data-sheet-handle>
          <span className="sheet-grabber" aria-hidden="true" />
          <span className="paid-title">
            <span className="paid-check">
              <Icon name="check" size={16} />
            </span>
            Pagamento aprovado
          </span>
          <button type="button" aria-label="Fechar" onClick={close}>
            <Icon name="close" size={20} />
          </button>
        </div>
        <div className="celebrate">
          <p className="celebrate-title">Você salvou uma refeição!</p>
          <p>
            E economizou <strong>{brl.format(food.original - food.price)}</strong>. Agora é só passar no balcão.
          </p>
        </div>
        <PickupTicket order={order} printing />
        <button className="sheet-action" type="button" onClick={() => app.setTab("orders", { closeOffer: true })}>
          <Icon name="ticket" size={18} />
          Ver meus pedidos
        </button>
      </div>
    );
  }

  if (step === "payment") {
    return (
      <div className="item-sheet">
        <div className="sheet-head" data-sheet-handle>
          <span className="sheet-grabber sheet-grabber--dark" aria-hidden="true" />
          <button type="button" aria-label="Voltar para a oferta" onClick={() => go("details")}>
            <Icon name="back" size={20} />
          </button>
          <h2>Pagamento</h2>
          <button type="button" aria-label="Fechar" onClick={close}>
            <Icon name="close" size={20} />
          </button>
        </div>
        <Steps current={2} />

        <div className="order-summary">
          <img src={food.image} alt="" />
          <div>
            <strong>{food.title}</strong>
            <span>
              {food.place} · retire hoje, {food.pickup}
            </span>
          </div>
          <b>{brl.format(food.price)}</b>
        </div>

        <fieldset className="pay-methods">
          <legend>Como você quer pagar?</legend>
          {paymentMethods.map((item) => (
            <label className="pay-option" key={item.id}>
              <span className="pay-icon">
                <Icon name={methodIcon[item.id]} size={20} />
              </span>
              <span className="pay-text">
                {item.label}
                <small>{item.hint}</small>
              </span>
              <input
                type="radio"
                name="payment"
                value={item.id}
                checked={method === item.id}
                onChange={() => setMethod(item.id)}
              />
            </label>
          ))}
        </fieldset>

        <p className="pay-note">
          <Icon name="info" size={18} />
          {phase === "open"
            ? "A retirada já está aberta: depois de pagar, a reserva não pode mais ser cancelada."
            : "Você pode cancelar até o início do horário de retirada e o valor volta pela mesma forma de pagamento."}
        </p>

        <div className="sheet-footer">
          <button
            className="primary-button primary-button--wide"
            type="button"
            disabled={paying || left === 0 || closed}
            aria-busy={paying}
            onClick={pay}
          >
            {paying ? (
              <>
                <span className="spinner" aria-hidden="true" />
                Confirmando pagamento…
              </>
            ) : left === 0 ? (
              "Esgotou enquanto você escolhia"
            ) : closed ? (
              "Retirada encerrada"
            ) : (
              `Pagar ${brl.format(food.price)}`
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="item-sheet">
      <div className="item-hero" data-sheet-handle>
        <Photo src={food.image} alt={food.title} eager style={{ viewTransitionName: "food-hero" }} />
        <span className="sheet-grabber" aria-hidden="true" />
        <button className="item-close" type="button" aria-label="Fechar" onClick={close}>
          <Icon name="close" size={20} />
        </button>
      </div>
      <div className="item-body">
        <p className="item-store">
          <StoreMark food={food} size="sm" />
          {food.place}
          <span className="item-rating">
            <Icon name="star" size={13} />
            {food.rating}
          </span>
        </p>
        <h2>{food.title}</h2>
        <p className="item-note">{food.note}</p>

        {existing && (
          <button className="notice" type="button" onClick={() => app.openOrder(existing.id)}>
            <Icon name="ticket" size={18} />
            <span>
              Você já reservou este item. <u className="nowrap">Ver código {existing.code}</u>
            </span>
          </button>
        )}

        <ul className="item-facts">
          <li>
            <span className="fact-icon tone-blue">
              <Icon name="clock" size={18} />
            </span>
            <span className="fact-text">
              Retire hoje, {food.pickup}
              <PickupCountdown food={food} />
            </span>
          </li>
          <li>
            <span className="fact-icon tone-blue">
              <Icon name="leaf" size={18} />
            </span>
            Feito hoje. Preço reduzido para não ir para o lixo.
          </li>
        </ul>

        {/* Onde retirar: mapa do campus com a rota da entrada até o pátio. */}
        <figure className="campus-map">
          <CampusMap patio={food.patio} />
          <figcaption>
            <Icon name="location" size={16} />
            <span>
              <strong>{food.spot}</strong> · {distance(food.patio)} · {food.patio.minutes} min a pé
              <small>Saindo da entrada principal do campus</small>
            </span>
          </figcaption>
        </figure>
      </div>
      <div className="sheet-footer">
        <div className="footer-price">
          <span>
            <s>{brl.format(food.original)}</s>
            <b className="discount">−{discountOf(food)}%</b>
          </span>
          <strong>{brl.format(food.price)}</strong>
        </div>
        {closed ? (
          <button className="primary-button" type="button" disabled>
            Retirada encerrada
          </button>
        ) : left > 0 ? (
          <button className="primary-button primary-button--accent" type="button" onClick={() => go("payment")}>
            Reservar
            {left <= 3 && <small>{left === 1 ? "última" : `restam ${left}`}</small>}
          </button>
        ) : (
          <button className="primary-button" type="button" disabled>
            Esgotado hoje
          </button>
        )}
      </div>
    </div>
  );
}
