import { useEffect } from "react";
import BottomNav from "./components/BottomNav";
import Sheet from "./components/Sheet";
import Toasts from "./components/Toasts";
import Checkout from "./screens/Checkout";
import Discover from "./screens/Discover";
import Favorites from "./screens/Favorites";
import HelpSheet from "./screens/HelpSheet";
import Onboarding from "./screens/Onboarding";
import Orders from "./screens/Orders";
import OrderSheet from "./screens/OrderSheet";
import Profile from "./screens/Profile";
import VendorPanel from "./screens/VendorPanel";
import logo from "./assets/senac-logo.png";
import avatar from "./assets/avatar-marina.png";
import { foods } from "./data";
import { useAlerts } from "./alerts";
import { canTransition } from "./motion";
import AppProvider, { useApp } from "./store";

function Shell() {
  const app = useApp();
  const openOrder = app.orders.find((order) => order.id === app.openOrderId) ?? null;
  useAlerts();

  // Depois da primeira entrada, quem anima a troca de telas é a View Transition
  // (evita animar duas vezes o mesmo conteúdo).
  useEffect(() => {
    if (!canTransition()) return;
    const timer = window.setTimeout(() => document.documentElement.classList.add("booted"), 900);
    return () => window.clearTimeout(timer);
  }, []);

  // Deixa as fotos das ofertas baixadas e decodificadas em segundo plano: a primeira troca de aba
  // e a primeira oferta aberta não travam esperando a imagem.
  useEffect(() => {
    const warm = () =>
      foods.forEach((food) => {
        const image = new Image();
        image.src = food.image;
        image.decode?.().catch(() => {});
      });
    const idle = window.requestIdleCallback?.(warm) ?? window.setTimeout(warm, 1200);
    return () => {
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
    };
  }, []);

  return (
    <div className="app-shell">
      <header className="app-header">
        <img className="brand-logo" src={logo} alt="Senac" />
        <span className="wordmark">
          <svg className="zero-mark" viewBox="0 0 20 20" aria-hidden="true">
            <circle cx="10" cy="10" r="7" transform="rotate(-50 10 10)" />
          </svg>
          <span>
            Fila<span>Zero</span>
          </span>
        </span>
        <button className="header-avatar halo" type="button" aria-label="Abrir perfil" onClick={() => app.setTab("profile")}>
          <img src={avatar} alt="" />
        </button>
      </header>

      {app.tab === "discover" && <Discover />}
      {app.tab === "orders" && <Orders />}
      {app.tab === "favorites" && <Favorites />}
      {app.tab === "profile" && <Profile />}

      <Sheet
        open={app.selected !== null}
        onClose={(reason) => app.closeFood(reason !== "drag")}
        label="Detalhes da oferta"
        variant="page"
        vt={canTransition()}
      >
        {(close) => app.selected && <Checkout food={app.selected} close={close} />}
      </Sheet>

      <Sheet open={openOrder !== null} onClose={app.closeOrder} label="Código de retirada">
        {(close) => openOrder && <OrderSheet order={openOrder} close={close} />}
      </Sheet>

      <Sheet open={app.helpOpen} onClose={() => app.setHelpOpen(false)} label="Ajuda">
        {(close) => <HelpSheet close={close} />}
      </Sheet>

      <Sheet open={app.vendorOpen} onClose={() => app.setVendorOpen(false)} label="Modo cantina" variant="fullscreen">
        {(close) => <VendorPanel close={close} />}
      </Sheet>

      <Sheet open={app.onboardingOpen} onClose={app.finishOnboarding} label="Boas-vindas ao Fila Zero" variant="fullscreen">
        {(close) => <Onboarding close={close} />}
      </Sheet>

      <Toasts />
      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
