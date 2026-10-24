import { useState } from "react";
import Achievements, { type Achievement } from "../components/Achievements";
import ActivityRings from "../components/ActivityRings";
import Barcode from "../components/Barcode";
import CountUp from "../components/CountUp";
import CouponTicket from "../components/CouponTicket";
import Icon from "../components/Icon";
import Sheet from "../components/Sheet";
import { coupons, foodById, tasks, user, welcomeCoupon, type Coupon } from "../data";
import avatar from "../assets/avatar-marina.png";
import { isIOS, useInstall } from "../install";
import { useApp } from "../store";

const LEVEL_START = 10;
const LEVEL_SIZE = 5;
const MEALS_GOAL = 15;
const SAVINGS_GOAL = 200;
const HOURS_GOAL = 5;

const wholeBrl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

function CopyCodeButton({ code }: { code: string }) {
  const { toast } = useApp();

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      toast(`Código ${code} copiado`);
    } catch {
      toast("Não deu para copiar. Mostre o código de barras no caixa.");
    }
  }

  return (
    <button className="sheet-action" type="button" onClick={copy}>
      <Icon name="copy" size={18} />
      Copiar código {code}
    </button>
  );
}

export default function Profile() {
  const app = useApp();
  const [openCoupon, setOpenCoupon] = useState<Coupon | null>(null);
  const install = useInstall();
  const [installHelp, setInstallHelp] = useState(false);

  const meals = 11 + app.orders.length;
  const saved =
    148 +
    app.orders.reduce((sum, order) => {
      const food = foodById(order.foodId);
      return sum + food.original - food.price;
    }, 0);
  const hours = 3 + app.orders.filter((order) => order.collected).length * 0.25;
  const levelProgress = Math.min(LEVEL_SIZE, meals - LEVEL_START);
  const unlocked = tasks.every((task) => app.done.includes(task.id));
  const myCoupons = unlocked ? [welcomeCoupon, ...coupons] : coupons;

  const achievements: Achievement[] = [
    {
      id: "first",
      title: "Primeira reserva",
      icon: "bag",
      unlocked: app.orders.length > 0,
      how: "Reserve uma oferta pelo app.",
    },
    {
      id: "pickup",
      title: "Fila zero",
      icon: "ticket",
      unlocked: app.orders.some((order) => order.collected),
      how: "Retire um pedido deslizando o código no balcão.",
    },
    {
      id: "explorer",
      title: "Exploradora",
      icon: "compass",
      unlocked,
      how: "Complete os primeiros passos do app.",
      progress: `${app.done.length}/${tasks.length}`,
    },
    {
      id: "heart",
      title: "Coração mole",
      icon: "heart",
      unlocked: app.favorites.length >= 3,
      how: "Salve 3 ofertas nos favoritos.",
      progress: `${Math.min(3, app.favorites.length)}/3`,
    },
    {
      id: "ten",
      title: "10 refeições",
      icon: "leaf",
      unlocked: meals >= 10,
      how: "Salve 10 refeições do lixo.",
    },
    {
      id: "early",
      title: "Madrugadora",
      icon: "clock",
      unlocked: false,
      how: "Reserve uma oferta antes das 10h.",
    },
  ];
  const unlockedCount = achievements.filter((item) => item.unlocked).length;

  function open(coupon: Coupon) {
    setOpenCoupon(coupon);
    app.complete("coupon");
  }

  return (
    <main className="inside-page profile-page">
      <section className="profile-hero">
        <div className="aurora" aria-hidden="true">
          <span />
          <span />
        </div>
        <div className="glass profile-glass">
          {/* O anel em volta da foto é o progresso de nível e se desenha ao abrir o perfil. */}
          <div
            className="avatar-ring"
            role="progressbar"
            aria-label="Progresso de nível"
            aria-valuemin={0}
            aria-valuemax={LEVEL_SIZE}
            aria-valuenow={levelProgress}
          >
            <svg viewBox="0 0 100 100" aria-hidden="true">
              <circle className="avatar-ring-track" cx="50" cy="50" r="46" />
              <circle
                className="avatar-ring-value"
                cx="50"
                cy="50"
                r="46"
                pathLength={100}
                strokeDasharray={100}
                strokeDashoffset={100 - (levelProgress / LEVEL_SIZE) * 100}
              />
            </svg>
            <img className="profile-avatar" src={avatar} alt="Foto de perfil de Marina" />
          </div>
          <h1>{user.name}</h1>
          <p className="level-chip">Nível 2 · Salva-refeições</p>
          <p className="profile-level-note">
            {levelProgress >= LEVEL_SIZE
              ? "Nível 3 desbloqueado!"
              : LEVEL_SIZE - levelProgress === 1
                ? "Falta 1 reserva para o Nível 3"
                : `Faltam ${LEVEL_SIZE - levelProgress} reservas para o Nível 3`}
          </p>
        </div>
      </section>

      <section className="impact-card" aria-label="Seu impacto">
        <div className="impact-head">
          <h2>Seu impacto</h2>
        </div>
        <div className="impact-body">
          <ActivityRings
            rings={[
              { label: "Refeições salvas", value: meals / MEALS_GOAL, from: "#f7941d", to: "#ffc27a" },
              { label: "Economia", value: saved / SAVINGS_GOAL, from: "#3d7ddb", to: "#8db7f2" },
              { label: "Tempo sem fila", value: hours / HOURS_GOAL, from: "#b9cff0", to: "#ffffff" },
            ]}
          />
          <ul className="impact-legend">
            <li style={{ "--c": "#ffb15c" } as React.CSSProperties}>
              <span>Refeições salvas</span>
              <strong>
                <CountUp value={meals} />
                <small>/{MEALS_GOAL}</small>
              </strong>
            </li>
            <li style={{ "--c": "#8db7f2" } as React.CSSProperties}>
              <span>Economizados</span>
              <strong>
                <CountUp value={saved} format={(value) => wholeBrl.format(value)} />
              </strong>
            </li>
            <li style={{ "--c": "#e3ecfa" } as React.CSSProperties}>
              <span>Fora da fila</span>
              <strong>
                <CountUp value={hours} format={(value) => `${value.toFixed(1).replace(".", ",")} h`} />
              </strong>
            </li>
          </ul>
        </div>
      </section>

      <section className="profile-section">
        <div className="section-row">
          <h2 className="section-title">Conquistas</h2>
          <span className="section-count">
            {unlockedCount} de {achievements.length}
          </span>
        </div>
        <Achievements items={achievements} />
      </section>

      <section className="profile-section">
        <h2 className="section-title">Descontos</h2>
        <div className={`strip-list ${app.hint === "coupon" ? "is-hinted" : ""}`}>
          {myCoupons.map((coupon) => (
            <div className="halo strip-halo" key={coupon.id}>
              <button
                className={`ticket-strip ticket-strip--coupon ${coupon.id === welcomeCoupon.id ? "is-new" : ""}`}
                type="button"
                onClick={() => open(coupon)}
                aria-haspopup="dialog"
              >
                <span className="strip-main">
                  <span className="strip-category">{coupon.category}</span>
                  <span className="strip-value">{coupon.value}</span>
                  <span className="strip-meta">
                    {coupon.rule} · vence em {coupon.daysLeft} dias
                  </span>
                </span>
                <span className="strip-stub">
                  <Barcode code={coupon.ean} />
                  <span className="strip-hint">Toque para abrir</span>
                </span>
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="profile-section">
        <h2 className="section-title">Conta</h2>
        <div className="settings-card">
          <label className="menu-row">
            <span className="menu-icon">
              <Icon name="bell" size={18} />
            </span>
            <span>
              Avisar quando um favorito tiver oferta
              <small>{app.notify ? "Ativado" : "Desativado"}</small>
            </span>
            <input
              className="switch"
              type="checkbox"
              role="switch"
              checked={app.notify}
              onChange={(event) => {
                app.setNotify(event.target.checked);
                app.toast(event.target.checked ? "Avisos ativados" : "Avisos desativados");
              }}
            />
          </label>
          <label className="menu-row">
            <span className="menu-icon">
              <Icon name="play" size={18} />
            </span>
            <span>
              Animações completas
              <small>
                {app.reducedMotion
                  ? app.systemReduced && app.motion === "system"
                    ? "Seu dispositivo pede menos movimento"
                    : "Só esmaecer, sem deslizes"
                  : "Deslizes, molas e confete"}
              </small>
            </span>
            <input
              className="switch"
              type="checkbox"
              role="switch"
              checked={!app.reducedMotion}
              onChange={(event) => {
                app.setMotion(event.target.checked ? "full" : "reduced");
                app.toast(event.target.checked ? "Animações completas ativadas" : "Movimento reduzido");
              }}
            />
          </label>
          {!install.installed && (
            <button
              className="menu-row"
              type="button"
              aria-expanded={install.canPrompt ? undefined : installHelp}
              onClick={async () => {
                if (!install.canPrompt) {
                  setInstallHelp((open) => !open);
                  return;
                }
                const outcome = await install.install();
                if (outcome === "accepted") app.toast("Fila Zero instalado na tela inicial");
              }}
            >
              <span className="menu-icon">
                <Icon name="download" size={18} />
              </span>
              <span>
                Instalar o app no celular
                <small>Abre da tela inicial, até sem internet</small>
              </span>
              <Icon name="arrow" size={18} />
            </button>
          )}
          {installHelp && !install.installed && (
            <p className="install-help">
              {isIOS
                ? "No Safari, toque em Compartilhar e depois em “Adicionar à Tela de Início”."
                : "No menu do navegador, escolha “Instalar app” ou “Adicionar à tela inicial”."}
            </p>
          )}
          <button className="menu-row" type="button" onClick={app.showOnboarding}>
            <span className="menu-icon">
              <Icon name="compass" size={18} />
            </span>
            <span>Como funciona o Fila Zero</span>
            <Icon name="arrow" size={18} />
          </button>
          <button className="menu-row" type="button" onClick={() => app.setHelpOpen(true)}>
            <span className="menu-icon">
              <Icon name="help" size={18} />
            </span>
            <span>Ajuda e dúvidas frequentes</span>
            <Icon name="arrow" size={18} />
          </button>
        </div>
      </section>

      <Sheet open={openCoupon !== null} onClose={() => setOpenCoupon(null)} label="Cupom de desconto">
        {(close) =>
          openCoupon && (
            <div className="ticket-sheet">
              <div className="ticket-sheet-bar" data-sheet-handle>
                <span className="sheet-grabber" aria-hidden="true" />
                <span>Cupom</span>
                <button type="button" aria-label="Fechar cupom" onClick={close}>
                  <Icon name="close" size={20} />
                </button>
              </div>
              <CouponTicket coupon={openCoupon} />
              <CopyCodeButton code={openCoupon.code} />
            </div>
          )
        }
      </Sheet>
    </main>
  );
}
