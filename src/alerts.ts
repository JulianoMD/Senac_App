import { useEffect } from "react";
import { brl, clock, distance, foodById, foods } from "./data";
import { useApp } from "./store";
import { useNow } from "./time";

const SLOT_HEADS_UP = 10 * 60_000;
const CLOSING_SOON = 15 * 60_000;
const JUST_OPENED = 30 * 60_000;

// Avisos a caminho do sistema (evita mandar o mesmo duas vezes enquanto a promessa não volta).
const sending = new Set<string>();

export const canNotify = () => typeof Notification === "function";

// Aviso do sistema: pelo service worker aparece mesmo com o app em segundo plano (e no Android,
// com a tela bloqueada). Sem permissão, fica só o aviso dentro do app.
async function systemNotify(title: string, body: string, tag: string) {
  if (!canNotify() || Notification.permission !== "granted") return false;
  const icon = `${import.meta.env.BASE_URL}icons/icon-192.png`;
  const options = { body, tag, icon, badge: icon, data: { url: `${import.meta.env.BASE_URL}?aba=pedidos` } };
  try {
    const registration = await navigator.serviceWorker?.getRegistration();
    if (registration) await registration.showNotification(title, options);
    else new Notification(title, options);
    return true;
  } catch {
    return false;
  }
}

// Alertas: horário marcado chegando, retirada perto de fechar, favorita que abriu e oferta nova
// de uma cantina que a pessoa já salvou. Cada um sai uma vez só.
export function useAlerts() {
  const app = useApp();
  const now = useNow();

  useEffect(() => {
    if (!app.notify) return;
    // Só conta como enviado quando alguém viu: com o app na frente vira aviso na tela; em segundo
    // plano vai como notificação. Sem permissão, espera o app voltar para a frente.
    const send = (key: string, title: string, body: string) => {
      if (app.alerted.includes(key) || sending.has(key)) return;
      if (document.visibilityState === "visible") {
        app.markAlerted(key);
        app.toast(`${title}. ${body}`);
        return;
      }
      sending.add(key);
      void systemNotify(title, body, key).then((shown) => {
        sending.delete(key);
        if (shown) app.markAlerted(key);
      });
    };

    for (const order of app.activeOrders) {
      const food = foodById(order.foodId);
      const where = `${food.spot} · ${distance(food.patio)}`;
      if (order.slot && now >= order.slot - SLOT_HEADS_UP && now < order.slot + SLOT_HEADS_UP) {
        send(`slot-${order.id}`, `Seu horário é às ${clock(order.slot)}`, `${food.title} no ${where}. Mostre o ${order.code}.`);
      }
      if (now < food.pickupEnd && food.pickupEnd - now <= CLOSING_SOON) {
        send(`closing-${order.id}`, "Sua retirada fecha em 15 min", `${food.title} ainda está te esperando no ${where}.`);
      }
    }

    const favorites = app.favorites.map(foodById);
    const favoritePlaces = new Set(favorites.map((food) => food.place));
    for (const food of favorites) {
      const left = app.stock[food.id] ?? food.stock;
      if (left > 0 && now >= food.pickupStart && now - food.pickupStart < JUST_OPENED && now < food.pickupEnd) {
        send(`fav-${food.id}-${food.pickupStart}`, `${food.title} abriu para retirada`, `${food.place} · ${brl.format(food.price)} · até ${clock(food.pickupEnd)}`);
      }
    }
    for (const food of app.customFoods) {
      const live = foods.find((item) => item.id === food.id);
      const left = live ? (app.stock[live.id] ?? live.stock) : 0;
      if (live && left > 0 && favoritePlaces.has(live.place) && now < live.pickupEnd) {
        send(`new-${live.id}`, `${live.place} publicou uma oferta`, `${live.title} por ${brl.format(live.price)} · retire ${live.pickup}`);
      }
    }
  }, [app, now]);
}
