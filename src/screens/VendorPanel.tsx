import { useState } from "react";
import CodeScanner from "../components/CodeScanner";
import Icon from "../components/Icon";
import Photo from "../components/Photo";
import PickupCountdown from "../components/PickupCountdown";
import {
  brl,
  campusReservations,
  cantinas,
  categories,
  clock,
  CO2_PER_MEAL,
  distance,
  foodById,
  foods,
  patios,
  user,
  type Food,
  type Patio,
} from "../data";
import { useApp } from "../store";
import { useNow } from "../time";

type Pickup = { id: string; name: string; code: string; ean: string; foodId: number; slot?: number; ownOrderId?: string };

const KG_PER_MEAL = 0.45;
const kg = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

// Modo cantina: o lado de quem vende. Publica a sobra em segundos, vê as retiradas na ordem dos
// horários, confirma lendo o código do aluno e acompanha (ou doa) o que sobrou no dia.
export default function VendorPanel({ close }: { close: () => void }) {
  const app = useApp();
  const now = useNow();
  const [place, setPlace] = useState(cantinas[0]);
  const [view, setView] = useState<"pickups" | "offers" | "impact">("pickups");
  const [publishing, setPublishing] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [confirmDonate, setConfirmDonate] = useState(false);

  const offers = foods.filter((food) => food.place === place);
  const own: Pickup[] = app.activeOrders
    .filter((order) => foodById(order.foodId).place === place)
    .map((order) => ({ ...order, name: user.name, ownOrderId: order.id }));
  const campus: Pickup[] = offers
    .flatMap((food) => campusReservations(food, now))
    .filter((item) => !app.counterCollected.includes(item.id));
  const pickups = [...own, ...campus].sort((a, b) => (a.slot ?? Infinity) - (b.slot ?? Infinity));

  // Retiradas já confirmadas hoje nesta cantina (do aparelho e dos colegas simulados).
  const confirmedFoods = [
    ...app.orders.filter((order) => order.collected && foodById(order.foodId).place === place).map((order) => order.foodId),
    ...app.counterCollected
      .map((id) => Number(id.split("-")[1]))
      .filter((id) => offers.some((food) => food.id === id)),
  ];
  const savedMeals = confirmedFoods.length + pickups.length;
  const recovered = [...confirmedFoods, ...pickups.map((item) => item.foodId)].reduce((sum, id) => sum + foodById(id).price, 0);
  const leftovers = offers.reduce((sum, food) => sum + (app.stock[food.id] ?? food.stock), 0);

  function confirm(item: Pickup) {
    const order = item.ownOrderId ? app.orders.find((entry) => entry.id === item.ownOrderId) : undefined;
    if (order) app.collectOrder(order);
    else app.confirmCounterPickup(item.id);
    app.toast(`Retirada confirmada: ${item.name}`);
  }

  // Aceita o código de barras (EAN) ou o código escrito, com ou sem hífen.
  function matchCode(value: string) {
    const clean = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    const item = pickups.find((entry) => entry.ean === clean || entry.code.replace("-", "") === clean);
    if (!item) return false;
    confirm(item);
    setScanning(false);
    return true;
  }

  function donate() {
    const amount = app.donateLeftovers(place);
    setConfirmDonate(false);
    if (amount) app.toast(`${amount} ${amount === 1 ? "refeição vai" : "refeições vão"} para o banco de alimentos parceiro`);
  }

  return (
    <div className="vendor">
      <header className="vendor-head">
        <div>
          <p className="vendor-kicker">Modo cantina</p>
          <label className="vendor-place">
            <span className="sr-only">Cantina</span>
            <select value={place} onChange={(event) => setPlace(event.target.value)}>
              {cantinas.map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
          </label>
        </div>
        <button className="vendor-close" type="button" aria-label="Sair do modo cantina" onClick={close}>
          <Icon name="close" size={20} />
        </button>
      </header>

      <fieldset className="segmented vendor-tabs">
        <legend>Seção</legend>
        {(
          [
            ["pickups", `Retiradas (${pickups.length})`],
            ["offers", "Ofertas"],
            ["impact", "Impacto"],
          ] as const
        ).map(([id, label]) => (
          <label key={id}>
            <input
              type="radio"
              name="vendor-view"
              checked={view === id}
              onChange={() => {
                setView(id);
                setPublishing(false);
                setScanning(false);
              }}
            />
            <span>{label}</span>
          </label>
        ))}
      </fieldset>

      <div className="vendor-body">
        {view === "pickups" && (
          <>
            {scanning ? (
              <section className="vendor-card">
                <div className="vendor-card-head">
                  <h2>Confirmar retirada</h2>
                  <button className="link-button" type="button" onClick={() => setScanning(false)}>
                    Voltar
                  </button>
                </div>
                <CodeScanner onCode={matchCode} />
              </section>
            ) : (
              <button className="primary-button primary-button--wide" type="button" onClick={() => setScanning(true)}>
                <Icon name="ticket" size={18} />
                Ler código do aluno
              </button>
            )}

            <h2 className="vendor-title">Próximas retiradas</h2>
            {pickups.length ? (
              <ul className="vendor-list">
                {pickups.map((item) => {
                  const food = foodById(item.foodId);
                  return (
                    <li key={item.id} className="pickup-row">
                      <span className="pickup-time">{item.slot ? clock(item.slot) : "—"}</span>
                      <span className="pickup-text">
                        <strong>
                          {item.name}
                          {item.ownOrderId && <em>neste aparelho</em>}
                        </strong>
                        <small>
                          {item.code} · {food.title}
                        </small>
                      </span>
                      <button className="code-button" type="button" onClick={() => confirm(item)}>
                        Entregar
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="vendor-empty">Nenhuma retirada pendente agora.</p>
            )}
          </>
        )}

        {view === "offers" &&
          (publishing ? (
            <PublishForm
              place={place}
              onCancel={() => setPublishing(false)}
              onPublish={(food) => {
                app.publishFood(food);
                setPublishing(false);
                app.toast("Oferta publicada: já aparece em Descobrir");
              }}
            />
          ) : (
            <>
              <button className="primary-button primary-button--wide" type="button" onClick={() => setPublishing(true)}>
                <Icon name="gift" size={18} />
                Publicar sobra do dia
              </button>
              <h2 className="vendor-title">Ofertas de hoje</h2>
              <ul className="vendor-list">
                {offers.map((food) => {
                  const left = app.stock[food.id] ?? food.stock;
                  return (
                    <li key={food.id} className="offer-row">
                      <span className="offer-thumb">
                        <Photo src={food.image} />
                      </span>
                      <span className="pickup-text">
                        <strong>
                          {food.title}
                          {app.customFoods.some((item) => item.id === food.id) && <em>nova</em>}
                        </strong>
                        <PickupCountdown food={food} label={food.pickup} />
                      </span>
                      <span className="stepper" role="group" aria-label={`Quantidade de ${food.title}`}>
                        <button type="button" aria-label="Diminuir" onClick={() => app.setStock(food.id, left - 1)} disabled={left === 0}>
                          −
                        </button>
                        <output aria-live="polite">{left}</output>
                        <button type="button" aria-label="Aumentar" onClick={() => app.setStock(food.id, left + 1)}>
                          +
                        </button>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </>
          ))}

        {view === "impact" && (
          <>
            <section className="vendor-stats" aria-label="Impacto de hoje">
              <div>
                <strong>{savedMeals}</strong>
                <span>refeições salvas hoje</span>
              </div>
              <div>
                <strong>{brl.format(recovered)}</strong>
                <span>que iriam para o lixo</span>
              </div>
              <div>
                <strong>{kg.format(savedMeals * KG_PER_MEAL)} kg</strong>
                <span>de comida aproveitada</span>
              </div>
              <div>
                <strong>{kg.format(savedMeals * CO2_PER_MEAL)} kg</strong>
                <span>de CO₂ evitados</span>
              </div>
            </section>

            <section className="vendor-card">
              <h2>Fim do dia</h2>
              <p>
                {leftovers
                  ? `Ainda ${leftovers === 1 ? "sobra 1 refeição" : `sobram ${leftovers} refeições`} nas ofertas. O que não sair pode ir para o banco de alimentos parceiro.`
                  : "Nada sobrando nas ofertas de hoje."}
              </p>
              {confirmDonate ? (
                <div className="confirm-inline" role="alertdialog" aria-label="Confirmar doação">
                  <p>
                    Doar {leftovers} {leftovers === 1 ? "refeição" : "refeições"}? Elas saem das ofertas de hoje.
                  </p>
                  <div>
                    <button className="code-button" type="button" onClick={() => setConfirmDonate(false)}>
                      Manter
                    </button>
                    <button className="primary-button" type="button" onClick={donate}>
                      Doar agora
                    </button>
                  </div>
                </div>
              ) : (
                <button className="primary-button primary-button--wide" type="button" disabled={!leftovers} onClick={() => setConfirmDonate(true)}>
                  <Icon name="heart" size={18} />
                  Doar sobras ao banco de alimentos
                </button>
              )}
              <p className="vendor-note">
                {app.leftoversDonated} {app.leftoversDonated === 1 ? "refeição doada" : "refeições doadas"} pelo app até agora.
              </p>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

const photoChoices = categories.filter((item) => item.image).map((item) => ({ label: item.id, image: item.image }));

// Formulário curto: o essencial para a sobra aparecer para os alunos em menos de um minuto.
function PublishForm({
  place,
  onPublish,
  onCancel,
}: {
  place: string;
  onPublish: (food: Food) => void;
  onCancel: () => void;
}) {
  const usual = foods.find((food) => food.place === place);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(usual?.category ?? "Pratos");
  const [image, setImage] = useState(photoChoices.find((item) => item.label === category)?.image ?? photoChoices[0].image);
  const [stock, setStock] = useState(5);
  const [original, setOriginal] = useState("");
  const [price, setPrice] = useState("");
  const [startIn, setStartIn] = useState(0);
  const [duration, setDuration] = useState(60);
  const [patioId, setPatioId] = useState<Patio["id"]>(usual?.patio.id ?? 1);
  const [tried, setTried] = useState(false);

  const originalValue = Number(original.replace(",", "."));
  const priceValue = Number(price.replace(",", "."));
  const titleError = !title.trim();
  const priceError = !(originalValue > 0 && priceValue > 0 && priceValue < originalValue);
  const discount = priceError ? 0 : Math.round((1 - priceValue / originalValue) * 100);

  // Foto tirada na hora vira um JPEG pequeno (cabe no armazenamento do aparelho).
  function onFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const picture = new Image();
    picture.onload = () => {
      const scale = Math.min(1, 900 / picture.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(picture.width * scale);
      canvas.height = Math.round(picture.height * scale);
      canvas.getContext("2d")?.drawImage(picture, 0, 0, canvas.width, canvas.height);
      setImage(canvas.toDataURL("image/jpeg", 0.78));
      URL.revokeObjectURL(url);
    };
    picture.src = url;
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setTried(true);
    if (titleError || priceError) return;
    const fiveMinutes = 5 * 60_000;
    const pickupStart = Math.round((Date.now() + startIn * 60_000) / fiveMinutes) * fiveMinutes;
    const pickupEnd = pickupStart + duration * 60_000;
    const patio = patios[patioId];
    onPublish({
      id: Math.max(...foods.map((food) => food.id)) + 1,
      title: title.trim(),
      place,
      note: `Sobra de hoje, feita em ${place}. Retire no ${patio.name}.`,
      image,
      rating: usual?.rating ?? "Nova",
      original: originalValue,
      price: priceValue,
      pickupStart,
      pickupEnd,
      pickup: `${clock(pickupStart)}–${clock(pickupEnd)}`,
      patio,
      spot: patio.name,
      category,
      stock,
    });
  }

  return (
    <form className="publish" onSubmit={submit} noValidate>
      <div className="vendor-card-head">
        <h2>Publicar sobra</h2>
        <button className="link-button" type="button" onClick={onCancel}>
          Cancelar
        </button>
      </div>

      <label className="field">
        <span>O que sobrou?</span>
        <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ex.: Marmita de frango com legumes" aria-invalid={tried && titleError} />
        {tried && titleError && <small role="alert">Dê um nome para a oferta.</small>}
      </label>

      <fieldset className="field">
        <legend>Categoria e foto</legend>
        <div className="photo-pick">
          {photoChoices.map((item) => (
            <label key={item.label}>
              <input
                type="radio"
                name="photo"
                checked={image === item.image}
                onChange={() => {
                  setImage(item.image);
                  setCategory(item.label);
                }}
              />
              <span>
                <img src={item.image} alt="" />
                {item.label}
              </span>
            </label>
          ))}
          <label className="photo-upload">
            <input type="file" accept="image/*" capture="environment" onChange={onFile} />
            <span>
              {photoChoices.some((item) => item.image === image) ? <Icon name="camera" size={20} /> : <img src={image} alt="" />}
              Foto da sobra
            </span>
          </label>
        </div>
      </fieldset>

      <div className="field-row">
        <label className="field">
          <span>Preço normal</span>
          <input inputMode="decimal" value={original} onChange={(event) => setOriginal(event.target.value)} placeholder="R$ 24,00" aria-invalid={tried && priceError} />
        </label>
        <label className="field">
          <span>Preço Fila Zero</span>
          <input inputMode="decimal" value={price} onChange={(event) => setPrice(event.target.value)} placeholder="R$ 11,90" aria-invalid={tried && priceError} />
        </label>
      </div>
      {tried && priceError ? (
        <small className="field-error" role="alert">
          O preço Fila Zero precisa ser menor que o normal.
        </small>
      ) : discount > 0 ? (
        <small className="field-hint">Desconto de {discount}% para quem salvar a refeição.</small>
      ) : null}

      <div className="field">
        <span>Quantas unidades?</span>
        <span className="stepper stepper--big" role="group" aria-label="Quantidade">
          <button type="button" aria-label="Diminuir" onClick={() => setStock((value) => Math.max(1, value - 1))}>
            −
          </button>
          <output aria-live="polite">{stock}</output>
          <button type="button" aria-label="Aumentar" onClick={() => setStock((value) => Math.min(30, value + 1))}>
            +
          </button>
        </span>
      </div>

      <fieldset className="field">
        <legend>Retirada</legend>
        <div className="chip-group">
          {[
            [0, "Agora"],
            [30, "Em 30 min"],
            [60, "Em 1 h"],
          ].map(([value, label]) => (
            <label key={value}>
              <input type="radio" name="start" checked={startIn === value} onChange={() => setStartIn(value as number)} />
              <span>{label}</span>
            </label>
          ))}
        </div>
        <div className="chip-group">
          {[30, 60, 90].map((value) => (
            <label key={value}>
              <input type="radio" name="duration" checked={duration === value} onChange={() => setDuration(value)} />
              <span>{value === 60 ? "por 1 h" : value === 90 ? "por 1h30" : "por 30 min"}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="field">
        <legend>Pátio de retirada</legend>
        <div className="chip-group">
          {Object.values(patios).map((patio) => (
            <label key={patio.id}>
              <input type="radio" name="patio" checked={patioId === patio.id} onChange={() => setPatioId(patio.id)} />
              <span>
                {patio.name} · {distance(patio)}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <button className="primary-button primary-button--wide" type="submit">
        Publicar para os alunos
      </button>
    </form>
  );
}
