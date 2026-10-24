import { useEffect, useRef, useState } from "react";
import Checklist from "../components/Checklist";
import FoodCard from "../components/FoodCard";
import FoodCardSkeleton from "../components/FoodCardSkeleton";
import Icon from "../components/Icon";
import Photo from "../components/Photo";
import Swoosh from "../components/Swoosh";
import {
  categories,
  foodById,
  foods,
  greeting,
  LOW_STOCK,
  normalize,
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
  const order = orders.find((item) => orderStage(foodById(item.foodId), now).phase === "open") ?? orders[0];
  if (!order) return null;
  const food = foodById(order.foodId);
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
          {order.code} · {stage.phase === "soon" ? stage.detail : food.title}
        </span>
      </span>
      <span className="active-order-cta">Ver código</span>
    </button>
  );
}

const headline = "Bateu a fome? Garanta agora e retire sem fila.";

// As ofertas "chegam" uma vez por visita: na primeira entrada aparecem as silhuetas dos cards
// e depois o conteúdo real no mesmo lugar (com dados de um servidor, esse seria o tempo de busca).
let offersReady = false;

export default function Discover() {
  const { stock } = useApp();
  const now = useNow();
  const [category, setCategory] = useState("Todos");
  const [loading, setLoading] = useState(!offersReady);

  useEffect(() => {
    if (!loading) return;
    const timer = window.setTimeout(() => {
      offersReady = true;
      withTransition("skeleton", () => setLoading(false));
    }, 650);
    return () => window.clearTimeout(timer);
  }, [loading]);
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
        <p className="hero-sub">Pague no app e retire com seu código.</p>
      </section>

      <ActiveOrderBanner />
      <Checklist />

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

      <div className="results" key={loading ? "loading" : category}>
        {loading ? (
          <div role="status" aria-label="Carregando ofertas">
            <section className="content-section">
              <h2 className="section-title">
                <span className="live-dot" aria-hidden="true" />
                Acabando agora
              </h2>
              <div className="carousel">
                <FoodCardSkeleton />
                <FoodCardSkeleton />
              </div>
            </section>
            <section className="content-section">
              <h2 className="section-title">Disponíveis hoje</h2>
              <div className="feed">
                <FoodCardSkeleton />
                <FoodCardSkeleton />
              </div>
            </section>
          </div>
        ) : filtered.length === 0 ? (
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
            {others.length > 0 && (
              <section className="content-section">
                <h2 className="section-title">Disponíveis hoje</h2>
                <div className="feed">
                  {others.map((food) => (
                    <FoodCard food={food} key={food.id} />
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
