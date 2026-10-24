import FoodCard from "../components/FoodCard";
import Icon from "../components/Icon";
import { foods } from "../data";
import { useApp } from "../store";

export default function Favorites() {
  const { favorites, setTab, showHint } = useApp();
  const favoriteFoods = foods.filter((food) => favorites.includes(food.id));

  return (
    <main className="inside-page">
      <div className="page-header">
        <h1>Favoritos</h1>
        <p>Suas ofertas preferidas, num lugar só.</p>
      </div>
      {favoriteFoods.length ? (
        <div className="feed feed--flush">
          {favoriteFoods.map((food) => (
            <FoodCard food={food} key={food.id} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <span className="empty-icon tone-blue">
            <Icon name="heart" size={26} />
          </span>
          <p>Nenhum favorito ainda</p>
          <span>Toque no coração de uma oferta para encontrá-la aqui depois.</span>
          <button
            className="primary-button"
            type="button"
            onClick={() => {
              setTab("discover");
              showHint("favorite");
            }}
          >
            Escolher favoritos
          </button>
        </div>
      )}
    </main>
  );
}
