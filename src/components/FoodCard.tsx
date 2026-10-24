import { useState } from "react";
import { brl, distance, LOW_STOCK, type Food } from "../data";
import { useApp } from "../store";
import Icon from "./Icon";
import Photo from "./Photo";
import PickupCountdown from "./PickupCountdown";
import StoreMark from "./StoreMark";

// "card": foto grande em cima (destaques do carrossel). "row": foto ao lado, compacta (lista do dia).
// Nos dois: cantina em cima, prato em negrito, horário de retirada e metros até o pátio, preço.
export default function FoodCard({ food, layout = "card" }: { food: Food; layout?: "card" | "row" }) {
  const { favorites, toggleFavorite, openFood, stock, hint } = useApp();
  const [burst, setBurst] = useState(0);
  const left = stock[food.id] ?? food.stock;
  const soldOut = left === 0;
  const isFavorite = favorites.includes(food.id);

  function onFavorite() {
    if (!isFavorite) setBurst((count) => count + 1);
    toggleFavorite(food.id);
  }

  const save = (
    <button
      className={`save-button ${isFavorite ? "is-saved" : ""} ${hint === "favorite" ? "is-hinted" : ""}`}
      type="button"
      aria-label={isFavorite ? `Remover ${food.title} dos favoritos` : `Salvar ${food.title} nos favoritos`}
      aria-pressed={isFavorite}
      onClick={onFavorite}
    >
      <Icon name="heart" size={20} />
      {burst > 0 && (
        <span className="burst" key={burst} aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
        </span>
      )}
    </button>
  );

  const heading = (
    <>
      <p className="food-place">{food.place}</p>
      <h3>
        <button className="food-open" type="button" onClick={() => openFood(food)}>
          {food.title}
        </button>
      </h3>
    </>
  );

  // Até onde ir: metros da entrada até o pátio (o mapa completo está na oferta).
  const where = (
    <span className="food-distance">
      <Icon name="location" size={14} />
      {distance(food.patio)}
    </span>
  );

  const price = (
    <span className="food-price">
      {!soldOut && <s>{brl.format(food.original)}</s>}
      <strong>{brl.format(food.price)}</strong>
    </span>
  );

  if (layout === "row") {
    return (
      <article className={`food-card food-row halo ${soldOut ? "is-sold-out" : ""}`} data-food-card={food.id}>
        <div className="food-media">
          <Photo src={food.image} />
          {soldOut && <span className="stock-badge stock-badge--out">Esgotado</span>}
        </div>
        <div className="food-row-body">
          {heading}
          <p className="food-meta">
            {soldOut ? (
              <span className="sold-note">Esgotou por hoje</span>
            ) : (
              <PickupCountdown food={food} label={food.pickup} />
            )}
            <span className="food-sep" aria-hidden="true" />
            {where}
          </p>
          {price}
        </div>
        {save}
      </article>
    );
  }

  return (
    <article className={`food-card halo ${soldOut ? "is-sold-out" : ""}`} data-food-card={food.id}>
      <div className="food-media">
        <Photo src={food.image} />
        {soldOut ? (
          <span className="stock-badge stock-badge--out">Esgotado</span>
        ) : left <= LOW_STOCK ? (
          <span className="stock-badge">{left === 1 ? "Última unidade" : `Restam ${left}`}</span>
        ) : null}
        <span className="rating-chip" role="img" aria-label={`Nota ${food.rating} de 5`}>
          <Icon name="star" size={13} />
          {food.rating}
        </span>
        <span className="food-store">
          <StoreMark food={food} />
        </span>
      </div>
      <div className="food-body">
        <div className="food-head">
          <div className="food-main">{heading}</div>
          {save}
        </div>
        <p className="food-meta">
          {soldOut ? <span className="sold-note">Esgotou por hoje</span> : <span>Retire hoje {food.pickup}</span>}
          <span className="food-sep" aria-hidden="true" />
          {where}
        </p>
        <div className="food-foot">
          {soldOut ? <span className="sold-note">Volta amanhã</span> : <PickupCountdown food={food} />}
          {price}
        </div>
      </div>
    </article>
  );
}
