// Fotos de domínio público (Wikimedia Commons), guardadas no próprio app.
import coxinha from "./assets/photos/coxinha.jpg";
import donut from "./assets/photos/donut.jpg";

export const user = {
  name: "Marina Alves",
  firstName: "Marina",
  email: "marina.alves@aluno.sp.senac.br",
};

export type Food = {
  id: number;
  title: string;
  place: string;
  note: string;
  image: string;
  rating: string;
  original: number;
  price: number;
  /** Janela de retirada já formatada, ex.: "12:30–14:00". */
  pickup: string;
  pickupStart: number;
  pickupEnd: number;
  /** Pátio onde a retirada acontece (só existem três no campus). */
  patio: Patio;
  /** Nome do pátio, ex.: "Pátio 1". */
  spot: string;
  category: string;
  stock: number;
};

// Os três pátios do campus — os únicos pontos de retirada. Distância e tempo a pé contados
// da entrada principal; x/y é a posição no mapa do campus (viewBox 320×180).
export type Patio = { id: 1 | 2 | 3; name: string; meters: number; minutes: number; x: number; y: number };

export const patios: Record<Patio["id"], Patio> = {
  1: { id: 1, name: "Pátio 1", meters: 120, minutes: 2, x: 110, y: 121 },
  2: { id: 2, name: "Pátio 2", meters: 260, minutes: 4, x: 150, y: 60 },
  3: { id: 3, name: "Pátio 3", meters: 410, minutes: 6, x: 250, y: 50 },
};

export const distance = (patio: Patio) => `${patio.meters} m`;

const photo = (id: string, width = 900) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`;

type FoodSeed = Omit<Food, "pickup" | "pickupStart" | "pickupEnd" | "patio" | "spot"> & {
  patio: Patio["id"];
  /** Abertura e fechamento da retirada, em minutos a partir de agora. */
  window: [number, number];
};

const seeds: FoodSeed[] = [
  {
    id: 1,
    title: "Prato executivo",
    place: "Bistrô Escola Senac",
    note: "Arroz integral, proteína do dia, vagem e tomatinhos. Preparado hoje no almoço.",
    image: photo("photo-1547592180-85f173990554"),
    rating: "4,9",
    original: 32,
    price: 16.9,
    window: [-25, 65],
    patio: 1,
    category: "Pratos",
    stock: 3,
  },
  {
    id: 2,
    title: "Bowl vegetariano",
    place: "Cantina Central",
    note: "Tofu grelhado, ovos, milho, tomate e folhas. Montado hoje cedo.",
    image: photo("photo-1546069901-ba9599a7e63c"),
    rating: "4,8",
    original: 28,
    price: 14,
    window: [-70, 25],
    patio: 2,
    category: "Pratos",
    stock: 6,
  },
  {
    id: 3,
    title: "Sanduíche natural",
    place: "Café Biblioteca",
    note: "Pão integral, peito de peru, queijo, tomate e alface. Feito pela manhã.",
    image: photo("photo-1553909489-cd47e0907980"),
    rating: "4,7",
    original: 18,
    price: 8.9,
    window: [-10, 95],
    patio: 1,
    category: "Lanches",
    stock: 8,
  },
  {
    id: 4,
    title: "Combo de salgados",
    place: "Cantina do Pátio",
    note: "Quatro coxinhas de frango, todas da fornada de hoje.",
    image: coxinha,
    rating: "4,6",
    original: 20,
    price: 9.9,
    window: [20, 110],
    patio: 2,
    category: "Salgados",
    stock: 2,
  },
  {
    id: 5,
    title: "Wrap de frango + suco",
    place: "Espaço Gourmet",
    note: "Wrap de frango grelhado com suco natural de 300 ml.",
    image: photo("photo-1626700051175-6818013e1d4f"),
    rating: "4,9",
    original: 26,
    price: 12.9,
    window: [-40, 50],
    patio: 3,
    category: "Lanches",
    stock: 5,
  },
  {
    id: 6,
    title: "Caixa surpresa doce",
    place: "Doce Intervalo",
    note: "Seleção surpresa de donuts e doces que sobraram do dia.",
    image: photo("photo-1514517220017-8ce97a34a7b6"),
    rating: "4,5",
    original: 24,
    price: 10.9,
    window: [45, 120],
    patio: 3,
    category: "Doces",
    stock: 1,
  },
];

// Horários relativos ao momento em que o app abre: há sempre ofertas abertas, uma perto de
// fechar e outras abrindo em breve, para a contagem regressiva fazer sentido a qualquer hora.
function atMinutesFromNow(minutes: number) {
  const date = new Date(Date.now() + minutes * 60_000);
  date.setMinutes(Math.round(date.getMinutes() / 5) * 5, 0, 0);
  return date.getTime();
}

const clock = (time: number) =>
  new Date(time).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

// "à 00:30" / "à 01:00", mas "às 22:30".
export const atClock = (time: number) => `${new Date(time).getHours() <= 1 ? "à" : "às"} ${clock(time)}`;

export const foods: Food[] = seeds.map(({ window: [opens, closes], patio, ...food }) => {
  const pickupStart = atMinutesFromNow(opens);
  const pickupEnd = atMinutesFromNow(closes);
  return {
    ...food,
    patio: patios[patio],
    spot: patios[patio].name,
    pickupStart,
    pickupEnd,
    pickup: `${clock(pickupStart)}–${clock(pickupEnd)}`,
  };
});

export type PickupStatus = { phase: "soon" | "open" | "closed"; label: string; remaining: number };

function duration(ms: number) {
  const minutes = Math.max(1, Math.ceil(ms / 60_000));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h${String(rest).padStart(2, "0")}` : `${hours}h`;
}

// Situação da retirada agora: abre em…, fecha em… ou encerrada (remaining vai de 1 a 0).
export function pickupStatus(food: Food, now: number): PickupStatus {
  if (now < food.pickupStart) {
    return { phase: "soon", label: `Abre em ${duration(food.pickupStart - now)}`, remaining: 1 };
  }
  if (now < food.pickupEnd) {
    const remaining = (food.pickupEnd - now) / (food.pickupEnd - food.pickupStart);
    const left = food.pickupEnd - now;
    return { phase: "open", label: left < 60_000 ? "Fecha em instantes" : `Fecha em ${duration(left)}`, remaining };
  }
  return { phase: "closed", label: `Encerrou ${atClock(food.pickupEnd)}`, remaining: 0 };
}

// Etapa de um pedido pago, conforme a janela de retirada: separado (ainda não abriu), pronto ou encerrado.
export function orderStage(food: Food, now: number) {
  const { phase } = pickupStatus(food, now);
  if (phase === "soon") {
    return { phase, title: "Pedido separado", label: "Separado", detail: `Retire a partir de ${clock(food.pickupStart)}` };
  }
  if (phase === "open") return { phase, title: "Pedido pronto", label: "Pronto para retirar", detail: "" };
  return { phase, title: "Retirada encerrada", label: "Retirada encerrada", detail: "" };
}

export const foodById = (id: number) => foods.find((food) => food.id === id) ?? foods[0];

export const LOW_STOCK = 3;

export const categories = [
  { id: "Todos", image: "" },
  { id: "Pratos", image: photo("photo-1546069901-ba9599a7e63c", 240) },
  { id: "Lanches", image: photo("photo-1553909489-cd47e0907980", 240) },
  { id: "Salgados", image: coxinha },
  { id: "Doces", image: donut },
];

export const searchSuggestions = ["vegetariano", "salgado", "doce", "sanduíche"];

export type Coupon = {
  id: string;
  value: string;
  category: string;
  code: string;
  ean: string;
  daysLeft: number;
  rule: string;
  image: string;
};

export const coupons: Coupon[] = [
  {
    id: "senac20",
    value: "20% OFF",
    category: "pratos do dia",
    code: "SENAC20",
    ean: ean13("789123400020"),
    daysLeft: 14,
    rule: "No próximo pedido",
    image: foods[0].image,
  },
  {
    id: "volte10",
    value: "R$ 10 OFF",
    category: "lanches e salgados",
    code: "VOLTE10",
    ean: ean13("789123400010"),
    daysLeft: 5,
    rule: "Acima de R$ 25",
    image: foods[4].image,
  },
];

export const welcomeCoupon: Coupon = {
  id: "bemvindo5",
  value: "R$ 5 OFF",
  category: "presente de boas-vindas",
  code: "BEMVINDO5",
  ean: ean13("789123400005"),
  daysLeft: 30,
  rule: "Em qualquer oferta",
  image: foods[5].image,
};

export type TaskId = "account" | "favorite" | "reserve" | "code" | "coupon";

export const tasks: { id: TaskId; label: string }[] = [
  { id: "account", label: "Criar sua conta" },
  { id: "favorite", label: "Salvar uma oferta nos favoritos" },
  { id: "reserve", label: "Reservar e pagar pelo app" },
  { id: "code", label: "Abrir seu código de retirada" },
  { id: "coupon", label: "Conhecer seus cupons" },
];

export type Order = {
  id: string;
  code: string;
  ean: string;
  foodId: number;
  paidWith: string;
  collected?: boolean;
};

export const paymentMethods = [
  { id: "pix", label: "Pix", short: "Pix", hint: "Aprovado na hora" },
  { id: "card", label: "Cartão de crédito", short: "Cartão", hint: "Final 4821" },
];

export function createOrder(food: Food, paidWith: string): Order {
  const number = Math.floor(1000 + Math.random() * 9000);
  return {
    id: `${food.id}-${number}-${Date.now()}`,
    code: `FZ-${number}`,
    ean: ean13(`78912345${number}`),
    foodId: food.id,
    paidWith,
  };
}

export const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function discountOf(food: Food) {
  return Math.round((1 - food.price / food.original) * 100);
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter((word) => word.length > 2)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

// Busca tolerante: ignora acentos e maiúsculas ("sanduiche" encontra "Sanduíche").
export function normalize(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

export function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

// EAN-13: appends the check digit to a 12-digit payload.
export function ean13(payload: string) {
  const sum = payload
    .split("")
    .reduce((total, digit, index) => total + Number(digit) * (index % 2 ? 3 : 1), 0);
  return payload + ((10 - (sum % 10)) % 10);
}
