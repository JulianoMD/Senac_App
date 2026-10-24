import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createOrder, foods, tasks, type Food, type Order, type TaskId } from "./data";
import { flyToOrders, morphCard, withTransition } from "./motion";

export type Tab = "discover" | "orders" | "favorites" | "profile";

const tabOrder: Tab[] = ["discover", "orders", "favorites", "profile"];
export type Hint = "favorite" | "coupon" | null;

type Toast = { id: number; message: string; leaving?: boolean; action?: { label: string; run: () => void } };

export type MotionPreference = "system" | "full" | "reduced";

type Saved = {
  favorites: number[];
  orders: Order[];
  stock: Record<number, number>;
  done: TaskId[];
  onboarded: boolean;
  checklistHidden: boolean;
  notify: boolean;
  motion: MotionPreference;
};

const reduceQuery = "(prefers-reduced-motion: reduce)";

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

function systemPrefersReduced() {
  return typeof matchMedia === "function" && matchMedia(reduceQuery).matches;
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
};

function load(): Saved {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...initialState, ...JSON.parse(raw) } : initialState;
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
  const [hint, setHintState] = useState<Hint>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [systemReduced, setSystemReduced] = useState(systemPrefersReduced);
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

  useEffect(() => {
    if (typeof matchMedia !== "function") return;
    const query = matchMedia(reduceQuery);
    const onChange = () => setSystemReduced(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  // Segue o "reduzir movimento" do sistema, a menos que a pessoa escolha outra coisa no Perfil.
  const reducedMotion = saved.motion === "reduced" || (saved.motion === "system" && systemReduced);
  useLayoutEffect(() => {
    document.documentElement.dataset.motion = reducedMotion ? "reduced" : "full";
  }, [reducedMotion]);

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
    withTransition(card ? "sheet" : "page", () => {
      if (card) delete card.dataset.morph;
      setSelected(food);
    });
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

  function pay(food: Food, paidWith: string) {
    const order = createOrder(food, paidWith);
    pendingFly.current = true;
    update((current) => ({
      orders: [order, ...current.orders],
      stock: { ...current.stock, [food.id]: Math.max(0, (current.stock[food.id] ?? 0) - 1) },
    }));
    complete("reserve");
    return order;
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
