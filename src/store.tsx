import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import { addFoods, createOrder, DEMO_SOLIDARITY_CODES, foods, tasks, type Food, type Order, type TaskId } from "./data";
import { flyToOrders, markMorphFrom, morphCard, withTransition } from "./motion";

export type Tab = "discover" | "orders" | "favorites" | "profile";

const tabOrder: Tab[] = ["discover", "orders", "favorites", "profile"];
export type Hint = "favorite" | "coupon" | null;

type Toast = { id: number; message: string; leaving?: boolean; action?: { label: string; run: () => void } };

export type MotionPreference = "system" | "full" | "reduced";
export type ThemePreference = "system" | "light" | "dark";

type Saved = {
  favorites: number[];
  orders: Order[];
  stock: Record<number, number>;
  done: TaskId[];
  onboarded: boolean;
  checklistHidden: boolean;
  notify: boolean;
  motion: MotionPreference;
  theme: ThemePreference;
  /** Ofertas publicadas pelo Modo cantina neste aparelho. */
  customFoods: Food[];
  /** Refeições solidárias que esta pessoa pagou para colegas. */
  donated: number;
  /** Sobras doadas ao banco de alimentos pelo Modo cantina. */
  leftoversDonated: number;
  /** Códigos solidários criados pelas refeições doadas neste aparelho. */
  solidarityCodes: string[];
  /** Códigos solidários já usados (cada um vale uma vez). */
  redeemed: string[];
  /** Avisos já enviados (para não repetir). */
  alerted: string[];
  /** Retiradas de outros estudantes confirmadas no balcão pelo Modo cantina. */
  counterCollected: string[];
};


// Atalhos do app instalado abrem direto numa aba: ?aba=pedidos, ?aba=favoritos ou ?aba=perfil.
function tabFromUrl(): Tab {
  try {
    const aba = new URLSearchParams(window.location.search).get("aba");
    if (aba === "pedidos") return "orders";
    if (aba === "favoritos") return "favorites";
    if (aba === "perfil") return "profile";
  } catch {
    // Sem URL disponível: começa em Descobrir.
  }
  return "discover";
}

// Acompanha uma preferência do sistema (reduzir movimento, tema escuro) e reage quando ela muda.
function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => typeof matchMedia === "function" && matchMedia(query).matches);
  useEffect(() => {
    if (typeof matchMedia !== "function") return;
    const list = matchMedia(query);
    const onChange = () => setMatches(list.matches);
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}

const STORAGE_KEY = "fila-zero:state:v1";

const initialState: Saved = {
  favorites: [],
  orders: [],
  stock: Object.fromEntries(foods.map((food) => [food.id, food.stock])),
  done: ["account"],
  onboarded: false,
  checklistHidden: false,
  notify: true,
  motion: "system",
  theme: "system",
  customFoods: [],
  donated: 0,
  leftoversDonated: 0,
  solidarityCodes: [],
  redeemed: [],
  alerted: [],
  counterCollected: [],
};

function load(): Saved {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const saved: Saved = raw ? { ...initialState, ...JSON.parse(raw) } : initialState;
    addFoods(saved.customFoods);
    return saved;
  } catch {
    return initialState;
  }
}

function useAppState() {
  const [saved, setSaved] = useState<Saved>(load);
  const [tab, setTabState] = useState<Tab>(tabFromUrl);
  const [selected, setSelected] = useState<Food | null>(null);
  const [openOrderId, setOpenOrderId] = useState<string | null>(null);
  const [onboardingOpen, setOnboardingOpen] = useState(() => !load().onboarded);
  const [helpOpen, setHelpOpen] = useState(false);
  const [vendorOpen, setVendorOpen] = useState(() => new URLSearchParams(window.location.search).get("modo") === "cantina");
  const [hint, setHintState] = useState<Hint>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const systemReduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  const systemDark = useMediaQuery("(prefers-color-scheme: dark)");
  const toastId = useRef(0);
  const hintTimer = useRef<number>(undefined);
  const pendingFly = useRef(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    } catch {
      // Sem armazenamento (aba anônima): o app funciona, só não lembra entre visitas.
    }
  }, [saved]);

  // Demonstração em duas janelas (aluno e Modo cantina): o que muda numa aparece na outra na hora.
  // Se a outra janela reiniciou a demonstração, esta recarrega do zero também.
  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key !== STORAGE_KEY) return;
      if (event.newValue === null) {
        window.location.reload();
        return;
      }
      try {
        const next: Saved = { ...initialState, ...JSON.parse(event.newValue) };
        addFoods(next.customFoods);
        setSaved(next);
      } catch {
        // Valor ilegível: mantém o estado desta janela.
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Segue o "reduzir movimento" do sistema, a menos que a pessoa escolha outra coisa no Perfil.
  const reducedMotion = saved.motion === "reduced" || (saved.motion === "system" && systemReduced);
  useLayoutEffect(() => {
    document.documentElement.dataset.motion = reducedMotion ? "reduced" : "full";
  }, [reducedMotion]);

  // Tema: segue o claro/escuro do celular, a menos que a pessoa escolha outro no Perfil.
  // (O index.html aplica o mesmo tema antes da primeira pintura, sem piscar branco.)
  const dark = saved.theme === "dark" || (saved.theme === "system" && systemDark);
  useLayoutEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#0d1220" : "#faf7f2");
  }, [dark]);

  function update(patch: (current: Saved) => Partial<Saved>) {
    setSaved((current) => ({ ...current, ...patch(current) }));
  }

  function toast(message: string, action?: Toast["action"]) {
    const id = ++toastId.current;
    setToasts((current) => [...current.slice(-1), { id, message, action }]);
    window.setTimeout(() => dismissToast(id), action ? 5000 : 3200);
  }

  // O aviso sai deslizando antes de sumir.
  function dismissToast(id: number) {
    setToasts((current) => current.map((item) => (item.id === id ? { ...item, leaving: true } : item)));
    window.setTimeout(() => setToasts((current) => current.filter((item) => item.id !== id)), 240);
  }

  function complete(task: TaskId) {
    if (saved.done.includes(task)) return;
    update((current) => (current.done.includes(task) ? {} : { done: [...current.done, task] }));
    if (saved.done.length + 1 === tasks.length) {
      window.setTimeout(() => toast("Primeiros passos concluídos! Você ganhou um cupom de R$ 5."), 600);
    }
  }

  // Troca de aba deslizando para o lado certo (para frente ou para trás na barra).
  function setTab(next: Tab, options: { closeOffer?: boolean } = {}) {
    if (next === tab && !options.closeOffer) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const forward = tabOrder.indexOf(next) >= tabOrder.indexOf(tab);
    const transition = withTransition(forward ? "tab-forward" : "tab-back", () => {
      if (options.closeOffer) setSelected(null);
      setTabState(next);
      window.scrollTo({ top: 0 });
    });
    if (options.closeOffer) afterOfferClosed(transition);
  }

  // Se acabou de pagar, o ticket voa até a aba Pedidos assim que a oferta fecha.
  function afterOfferClosed(transition: ViewTransition | null) {
    if (!pendingFly.current) return;
    pendingFly.current = false;
    if (transition) transition.finished.finally(flyToOrders);
    else window.requestAnimationFrame(flyToOrders);
  }

  // O card cresce até virar a página da oferta, e a foto vai junto até o topo.
  function openFood(food: Food) {
    // data-morph diz ao CSS qual card vira a página (com a foto viajando à parte).
    const card = morphCard(food.id);
    if (card) card.dataset.morph = "photo";
    const transition = withTransition(card ? "sheet" : "page", () => {
      if (card) delete card.dataset.morph;
      setSelected(food);
    });
    markMorphFrom(card, transition);
  }

  // E volta para o card ao fechar (a menos que o painel tenha sido arrastado para fora).
  function closeFood(animated = true) {
    const food = selected;
    if (!animated || !food) {
      setSelected(null);
      afterOfferClosed(null);
      return;
    }
    // A foto só viaja de volta se estiver aparecendo na oferta (na etapa de pagamento ela some).
    const card = morphCard(food.id);
    const morph = document.querySelector(".item-hero .photo") ? "photo" : "card";
    const transition = withTransition(card ? "sheet-back" : "page", () => {
      setSelected(null);
      if (card) card.dataset.morph = morph;
    });
    markMorphFrom(card, transition);
    const clear = () => {
      if (card) delete card.dataset.morph;
    };
    if (transition) transition.finished.finally(clear);
    else clear();
    afterOfferClosed(transition);
  }

  function showHint(next: Hint) {
    window.clearTimeout(hintTimer.current);
    setHintState(next);
    hintTimer.current = window.setTimeout(() => setHintState(null), 4500);
  }

  // Na tela de Favoritos, a lista se reorganiza deslizando quando um item sai ou volta.
  function changeFavorites(next: (current: number[]) => number[]) {
    const apply = () => update((current) => ({ favorites: next(current.favorites) }));
    if (tab === "favorites") withTransition("list", apply);
    else apply();
  }

  function toggleFavorite(id: number) {
    const wasSaved = saved.favorites.includes(id);
    changeFavorites((current) => (wasSaved ? current.filter((item) => item !== id) : [...current, id]));
    if (wasSaved) {
      toast("Removido dos favoritos", {
        label: "Desfazer",
        run: () => changeFavorites((current) => [...current, id]),
      });
    } else {
      complete("favorite");
      toast("Salvo nos favoritos");
    }
  }

  function pay(food: Food, paidWith: string, extra: Pick<Order, "slot" | "donated" | "solidarity"> = {}) {
    const order = createOrder(food, paidWith, extra);
    pendingFly.current = true;
    // Refeição doada vira um código novo no fundo solidário (para a assistência entregar).
    const gift = extra.donated ? `SOL-${Math.floor(1000 + Math.random() * 9000)}` : null;
    update((current) => ({
      orders: [order, ...current.orders],
      stock: { ...current.stock, [food.id]: Math.max(0, (current.stock[food.id] ?? 0) - 1) },
      donated: current.donated + (gift ? 1 : 0),
      solidarityCodes: gift ? [...current.solidarityCodes, gift] : current.solidarityCodes,
    }));
    complete("reserve");
    return order;
  }

  // Código solidário (entregue pela assistência estudantil): vale uma refeição, uma vez só.
  const solidarityPool = [...DEMO_SOLIDARITY_CODES, ...saved.solidarityCodes];

  function checkSolidarityCode(raw: string): "ok" | "invalid" | "unknown" | "used" {
    const code = raw.trim().toUpperCase();
    if (!/^SOL-\d{4}$/.test(code)) return "invalid";
    if (!solidarityPool.includes(code)) return "unknown";
    return saved.redeemed.includes(code) ? "used" : "ok";
  }

  function redeemSolidarityCode(raw: string) {
    const code = raw.trim().toUpperCase();
    update((current) => ({ redeemed: [...current.redeemed, code] }));
  }

  // Modo cantina: publicar sobra, ajustar quantidade, doar o que sobrou e confirmar retiradas.
  function publishFood(food: Food) {
    addFoods([food]);
    update((current) => ({
      customFoods: [...current.customFoods, food],
      stock: { ...current.stock, [food.id]: food.stock },
    }));
  }

  function setStock(id: number, value: number) {
    update((current) => ({ stock: { ...current.stock, [id]: Math.max(0, Math.min(99, value)) } }));
  }

  function donateLeftovers(place: string) {
    const ids = foods.filter((food) => food.place === place).map((food) => food.id);
    const amount = ids.reduce((sum, id) => sum + (saved.stock[id] ?? 0), 0);
    if (amount === 0) return 0;
    update((current) => ({
      leftoversDonated: current.leftoversDonated + amount,
      stock: { ...current.stock, ...Object.fromEntries(ids.map((id) => [id, 0])) },
    }));
    return amount;
  }

  function confirmCounterPickup(id: string) {
    update((current) => ({ counterCollected: [...current.counterCollected, id] }));
  }

  function markAlerted(key: string) {
    update((current) => (current.alerted.includes(key) ? {} : { alerted: [...current.alerted.slice(-80), key] }));
  }

  function cancelOrder(order: Order) {
    update((current) => ({
      orders: current.orders.filter((item) => item.id !== order.id),
      stock: { ...current.stock, [order.foodId]: (current.stock[order.foodId] ?? 0) + 1 },
    }));
    setOpenOrderId(null);
    toast("Reserva cancelada. O valor volta pela mesma forma de pagamento.");
  }

  function collectOrder(order: Order) {
    update((current) => ({
      orders: current.orders.map((item) => (item.id === order.id ? { ...item, collected: true } : item)),
    }));
    toast("Retirada confirmada. Bom apetite!");
  }

  function openOrder(id: string) {
    setOpenOrderId(id);
    complete("code");
  }

  // Volta tudo ao começo (pedidos, favoritos, ofertas publicadas) para apresentar de novo.
  function resetDemo() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Sem armazenamento: recarregar já começa do zero.
    }
    window.location.replace(import.meta.env.BASE_URL);
  }

  function finishOnboarding() {
    setOnboardingOpen(false);
    update(() => ({ onboarded: true }));
  }

  return {
    ...saved,
    activeOrders: saved.orders.filter((order) => !order.collected),
    tab,
    setTab,
    selected,
    openFood,
    closeFood,
    collectOrder,
    openOrderId,
    openOrder,
    closeOrder: () => setOpenOrderId(null),
    onboardingOpen,
    showOnboarding: () => setOnboardingOpen(true),
    finishOnboarding,
    helpOpen,
    setHelpOpen,
    vendorOpen,
    setVendorOpen,
    resetDemo,
    checkSolidarityCode,
    redeemSolidarityCode,
    availableSolidarityCodes: solidarityPool.filter((code) => !saved.redeemed.includes(code)),
    publishFood,
    setStock,
    donateLeftovers,
    confirmCounterPickup,
    markAlerted,
    hint,
    showHint,
    toasts,
    toast,
    dismissToast,
    complete,
    toggleFavorite,
    pay,
    cancelOrder,
    hideChecklist: () => update(() => ({ checklistHidden: true })),
    setNotify: (notify: boolean) => update(() => ({ notify })),
    reducedMotion,
    systemReduced,
    setMotion: (motion: MotionPreference) => update(() => ({ motion })),
    theme: saved.theme,
    // A troca de tema esmaece a tela inteira de uma vez (sem cada cor mudar no seu tempo).
    setTheme: (theme: ThemePreference) => withTransition("theme", () => update(() => ({ theme }))),
  };
}

type AppState = ReturnType<typeof useAppState>;

const AppContext = createContext<AppState | null>(null);

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp precisa estar dentro de <AppProvider>");
  return context;
}

export default function AppProvider({ children }: { children: React.ReactNode }) {
  const state = useAppState();
  return <AppContext.Provider value={state}>{children}</AppContext.Provider>;
}
