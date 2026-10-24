import { useState } from "react";
import { brl, discountOf, LOW_STOCK, type Food } from "../data";
import { useApp } from "../store";
import Icon from "./Icon";
import Photo from "./Photo";
import StoreMark from "./StoreMark";

export default function FoodCard({ food }: { food: Food }) {
  const { favorites, toggleFavorite, openFood, stock, hint } = useApp();
  const [burst, setBurst] = useState(0);
  const left = stock[food.id] ?? food.stock;
  const soldOut = left === 0;
  const isFavorite = favorites.includes(food.id);

  function onFavorite() {
    if (!isFavorite) setBurst((count) => count + 1);
    toggleFavorite(food.id);
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
        <span className="food-store">
          <StoreMark food={food} />
          {food.place}
        </span>
      </div>
      <div className="food-body">
        <div className="food-main">
          <h3>
            <button className="food-open" type="button" onClick={() => openFood(food)}>
              {food.title}
            </button>
          </h3>
          <p className="food-meta">
            <Icon name="clock" size={14} />
            {food.pickup} · {food.spot}
          </p>
        </div>
        <div className="food-price">
          <strong>{brl.format(food.price)}</strong>
          <b className="discount" title={`Antes ${brl.format(food.original)}`}>
            −{discountOf(food)}%
          </b>
        </div>
      </div>
    </article>
  );
}
