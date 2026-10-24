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
  pickup: string;
  spot: string;
  walk: string;
  category: string;
  stock: number;
};

const photo = (id: string, width = 900) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`;

export const foods: Food[] = [
  {
    id: 1,
    title: "Prato executivo",
    place: "Bistrô Escola Senac",
    note: "Arroz, feijão, proteína do dia e salada. Preparado hoje no almoço.",
    image: photo("photo-1707274860723-52233290a977"),
    rating: "4,9",
    original: 32,
    price: 16.9,
    pickup: "12:30–14:00",
    spot: "Pátio 1",
    walk: "2 min",
    category: "Pratos",
    stock: 3,
  },
  {
    id: 2,
    title: "Bowl vegetariano",
    place: "Cantina Central",
    note: "Grãos, legumes assados e molho da casa. Montado hoje cedo.",
    image: photo("photo-1626266799523-941311ea2273"),
    rating: "4,8",
    original: 28,
    price: 14,
    pickup: "12:00–15:00",
    spot: "Pátio 2",
    walk: "4 min",
    category: "Pratos",
    stock: 6,
  },
  {
    id: 3,
    title: "Sanduíche natural",
    place: "Café Biblioteca",
    note: "Pão integral, frango desfiado, cenoura e requeijão. Feito pela manhã.",
    image: photo("photo-1496113269490-84ffe1a410cb"),
    rating: "4,7",
    original: 18,
    price: 8.9,
    pickup: "16:30–18:00",
    spot: "Pátio 1",
    walk: "1 min",
    category: "Lanches",
    stock: 8,
  },
  {
    id: 4,
    title: "Combo de salgados",
    place: "Cantina do Pátio",
    note: "Quatro salgados assados sortidos, todos da fornada de hoje.",
    image: photo("photo-1567234669013-216f3a40e02e"),
    rating: "4,6",
    original: 20,
    price: 9.9,
    pickup: "18:00–19:30",
    spot: "Pátio 2",
    walk: "3 min",
    category: "Salgados",
    stock: 2,
  },
  {
    id: 5,
    title: "Wrap de frango + suco",
    place: "Espaço Gourmet",
    note: "Wrap de frango grelhado com suco natural de 300 ml.",
    image: photo("photo-1635352768520-1d33dc341a21"),
    rating: "4,9",
    original: 26,
    price: 12.9,
    pickup: "17:00–18:30",
    spot: "Pátio 3",
    walk: "5 min",
    category: "Lanches",
    stock: 5,
  },
  {
    id: 6,
    title: "Caixa surpresa doce",
    place: "Doce Intervalo",
    note: "Seleção surpresa de doces e fatias de bolo que sobraram do dia.",
    image: photo("photo-1596698185611-31d8a250f164"),
    rating: "4,5",
    original: 24,
    price: 10.9,
    pickup: "19:00–20:00",
    spot: "Pátio 3",
    walk: "6 min",
    category: "Doces",
    stock: 1,
  },
];

export const foodById = (id: number) => foods.find((food) => food.id === id) ?? foods[0];

export const LOW_STOCK = 3;

export const categories = [
  { id: "Todos", image: "" },
  { id: "Pratos", image: photo("photo-1707274860723-52233290a977", 240) },
  { id: "Lanches", image: photo("photo-1496113269490-84ffe1a410cb", 240) },
  { id: "Salgados", image: photo("photo-1567234669013-216f3a40e02e", 240) },
  { id: "Doces", image: photo("photo-1596698185611-31d8a250f164", 240) },
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
