import { useState } from "react";
import { brl, discountOf, LOW_STOCK, type Food } from "../data";
import { useApp } from "../store";
import Icon from "./Icon";
import Photo from "./Photo";
import PickupCountdown from "./PickupCountdown";
import StoreMark from "./StoreMark";

// "card": foto grande em cima (destaques do carrossel). "row": foto ao lado, compacta (lista do dia).
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
      <Icon name="heart" size={18} />
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

  const title = (
    <h3>
      <button className="food-open" type="button" onClick={() => openFood(food)}>
        {food.title}
      </button>
    </h3>
  );

  // Esgotado não tem prazo nem desconto a mostrar: só o aviso e onde fica.
  const meta = (
    <p className="food-meta">
      {soldOut ? <span className="sold-note">Esgotou por hoje</span> : <PickupCountdown food={food} />}
      <span className="food-spot">· {food.spot}</span>
    </p>
  );

  const price = (
    <div className="food-price">
      <strong>{brl.format(food.price)}</strong>
      {!soldOut && (
        <b className="discount" title={`Antes ${brl.format(food.original)}`}>
          −{discountOf(food)}%
        </b>
      )}
    </div>
  );

  if (layout === "row") {
    return (
      <article className={`food-card food-row halo ${soldOut ? "is-sold-out" : ""}`} data-food-card={food.id}>
        <div className="food-media">
          <Photo src={food.image} />
          {soldOut && <span className="stock-badge stock-badge--out">Esgotado</span>}
        </div>
        <div className="food-row-body">
          <p className="food-row-place">{food.place}</p>
          {title}
          {meta}
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
        {save}
        <span className="food-store">
          <StoreMark food={food} />
          {food.place}
        </span>
      </div>
      <div className="food-body">
        <div className="food-main">
          {title}
          {meta}
        </div>
        {price}
      </div>
    </article>
  );
}
