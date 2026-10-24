import { useEffect, useRef, useState } from "react";
import Checklist from "../components/Checklist";
import FoodCard from "../components/FoodCard";
import Icon from "../components/Icon";
import Photo from "../components/Photo";
import Swoosh from "../components/Swoosh";
import {
  categories,
  clock,
  foods,
  greeting,
  LOW_STOCK,
  normalize,
  orderFood,
  orderStage,
  pickupStatus,
  searchSuggestions,
  user,
  type Food,
} from "../data";
import { withTransition } from "../motion";
import { useApp } from "../store";
import { useNow } from "../time";

function ActiveOrderBanner() {
  const { activeOrders: orders, openOrder } = useApp();
  const now = useNow();
  // Mostra primeiro o pedido que já dá para retirar.
  const order = orders.find((item) => orderStage(orderFood(item), now).phase === "open") ?? orders[0];
  if (!order) return null;
  const food = orderFood(order);
  const stage = orderStage(food, now);

  return (
    <button className="active-order halo" type="button" onClick={() => openOrder(order.id)}>
      <span className="active-order-icon">
        <Icon name="ticket" size={20} />
      </span>
      <span className="active-order-text">
        <strong>
          {stage.title}
          {orders.length > 1 && ` (+${orders.length - 1})`}
        </strong>
        <span>
          {order.code} ·{" "}
          {order.slot && stage.phase !== "closed" ? `seu horário ${clock(order.slot)}` : stage.phase === "soon" ? stage.detail : food.title}
        </span>
      </span>
      <span className="active-order-cta">Ver código</span>
    </button>
  );
}

const headline = "Bateu a fome? Retire sem fila.";

export default function Discover() {
  const { stock, activeOrders } = useApp();
  const now = useNow();
  const [category, setCategory] = useState("Todos");
  const [search, setSearch] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Atalho para quem já conhece o app: "/" leva direto à busca.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      if (event.key === "/" && !["INPUT", "TEXTAREA"].includes(target.tagName)) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const query = normalize(search);
  const filtered = foods.filter(
    (food) =>
      (category === "Todos" || food.category === category) &&
      normalize(`${food.title} ${food.place} ${food.category}`).includes(query),
  );
  const left = (food: Food) => stock[food.id] ?? food.stock;
  const available = (food: Food) => left(food) > 0 && pickupStatus(food, now).phase !== "closed";
  const endingSoon = filtered.filter((food) => available(food) && left(food) <= LOW_STOCK);
  // Esgotados e com retirada encerrada vão para o fim: primeiro aparece o que ainda dá para pegar.
  const others = [
    ...filtered.filter((food) => available(food) && left(food) > LOW_STOCK),
    ...filtered.filter((food) => !available(food)),
  ];

  function clearFilters() {
    setSearch("");
    setCategory("Todos");
  }

  // O anel da categoria escolhida desliza até a nova opção.
  function pickCategory(id: string) {
    if (id !== category) withTransition("category", () => setCategory(id));
  }

  return (
    <main className="discover-page">
      {/* Topo enxuto para a comida aparecer já na primeira tela. Com pedido em andamento,
          o banner do pedido (o que mais importa agora) ocupa o lugar da saudação. */}
      {activeOrders.length > 0 ? (
        <ActiveOrderBanner />
      ) : (
        <section className="hero">
          <Swoosh className="hero-swoosh" />
          <p className="hero-greeting">
            {greeting()}, {user.firstName}
          </p>
          {/* O título surge palavra por palavra na primeira entrada. */}
          <h1 className="reveal-words" aria-label={headline}>
            {headline.split(" ").map((word, index) => (
              <span key={index} aria-hidden="true">
                <span style={{ animationDelay: `${120 + index * 55}ms` }}>{word}</span>{" "}
              </span>
            ))}
          </h1>
        </section>
      )}

      <div className="search-wrap">
        <label className="search-box">
          <Icon name="search" size={18} />
          <input
            ref={inputRef}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Buscar prato ou cantina"
            type="search"
            aria-label="Buscar prato ou cantina"
          />
          <kbd aria-hidden="true">/</kbd>
        </label>
        {focused && !search && (
          <div className="suggestions">
            <span>Populares:</span>
            {searchSuggestions.map((item) => (
              <button
                key={item}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => setSearch(item)}
              >
                {item}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="category-row" aria-label="Categorias">
        {categories.map((item) => (
          <button
            className={`category ${category === item.id ? "is-active" : ""}`}
            key={item.id}
            onClick={() => pickCategory(item.id)}
            type="button"
            aria-pressed={category === item.id}
          >
            <span className="category-media">
              {item.image ? <Photo src={item.image} /> : <Icon name="grid" size={24} />}
            </span>
            {category === item.id && (
              <span className="category-ring" aria-hidden="true" />
            )}
            {item.id}
          </button>
        ))}
      </div>

      <div className="results" key={category}>
        {filtered.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon tone-blue">
              <Icon name="search" size={26} />
            </span>
            <p>{search ? `Nada encontrado para “${search}”` : "Nada nesta categoria agora"}</p>
            <span>Confira a grafia ou tente uma destas buscas. Novas ofertas entram ao longo do dia.</span>
            <div className="suggestions suggestions--center">
              {searchSuggestions.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setCategory("Todos");
                    setSearch(item);
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
            <button className="primary-button" type="button" onClick={clearFilters}>
              Limpar busca
            </button>
          </div>
        ) : (
          <>
            {endingSoon.length > 0 && (
              <section className="content-section">
                <h2 className="section-title">
                  <span className="live-dot" aria-hidden="true" />
                  Acabando agora
                </h2>
                <div className="carousel">
                  {endingSoon.map((food) => (
                    <FoodCard food={food} key={food.id} />
                  ))}
                </div>
              </section>
            )}
            {/* Primeiros passos entre as seções: à vista, sem empurrar a comida para baixo. */}
            <Checklist />
            {others.length > 0 && (
              <section className="content-section">
                <h2 className="section-title">Disponíveis hoje</h2>
                {/* Lista compacta (foto ao lado): cabem 4–5 ofertas por tela em vez de 2. */}
                <div className="feed feed--rows">
                  {others.map((food) => (
                    <FoodCard food={food} key={food.id} layout="row" />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
