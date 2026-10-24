import { useEffect, useRef, useState } from "react";
import { foods, tasks, type TaskId } from "../data";
import { useApp } from "../store";
import Icon from "./Icon";

function ProgressRing({ value, total }: { value: number; total: number }) {
  const radius = 19;
  const length = 2 * Math.PI * radius;
  const previous = useRef(value);
  const [justDone, setJustDone] = useState(0);

  // Quando um passo é concluído, um ✓ se desenha sobre o anel.
  useEffect(() => {
    if (value > previous.current) setJustDone((count) => count + 1);
    previous.current = value;
  }, [value]);

  return (
    <span className="progress-ring" role="img" aria-label={`${value} de ${total} concluídos`}>
      <svg viewBox="0 0 46 46">
        <circle cx="23" cy="23" r={radius} className="progress-ring-track" />
        <circle
          cx="23"
          cy="23"
          r={radius}
          className="progress-ring-value"
          strokeDasharray={length}
          strokeDashoffset={length * (1 - value / total)}
        />
      </svg>
      {justDone > 0 ? (
        <svg className="ring-check" key={justDone} viewBox="0 0 24 24" aria-hidden="true">
          <path d="m6 12.5 4 4L18 8" />
        </svg>
      ) : (
        <b>
          {value}/{total}
        </b>
      )}
    </span>
  );
}

// Primeiros passos: progresso já iniciado + próxima tarefa sempre à vista
// (Gradiente de Meta e Efeito Zeigarnik), numa linha só.
export default function Checklist() {
  const app = useApp();
  if (app.checklistHidden) return null;

  const total = tasks.length;
  const doneCount = tasks.filter((task) => app.done.includes(task.id)).length;
  const remaining = total - doneCount;
  const next = tasks.find((task) => !app.done.includes(task.id));

  function go(id: TaskId) {
    if (id === "favorite") {
      app.showHint("favorite");
      document.querySelector(".content-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    if (id === "reserve") {
      app.openFood(foods.find((food) => (app.stock[food.id] ?? food.stock) > 0) ?? foods[0]);
    }
    if (id === "code") {
      if (app.orders.length) app.openOrder(app.orders[0].id);
      else app.toast("Reserve uma oferta primeiro. O código aparece logo depois do pagamento.");
    }
    if (id === "coupon") {
      app.setTab("profile");
      app.showHint("coupon");
    }
  }

  return (
    <section className={`checklist ${next ? "" : "is-complete"}`} aria-label="Primeiros passos">
      <button className="checklist-main" type="button" onClick={() => next && go(next.id)} disabled={!next}>
        <ProgressRing value={doneCount} total={total} />
        <span className="checklist-text">
          <span className="checklist-title">{next ? next.label : "Primeiros passos concluídos"}</span>
          <span className="checklist-sub">
            {next
              ? `${remaining === 1 ? "Falta 1 passo" : `Faltam ${remaining} passos`} para ganhar R$\u00a05`
              : "Seu cupom de R$\u00a05 já está em Perfil."}
          </span>
        </span>
        {next && <Icon name="arrow" size={18} />}
      </button>
      <button className="checklist-hide" type="button" aria-label="Ocultar primeiros passos" onClick={app.hideChecklist}>
        <Icon name="close" size={16} />
      </button>
    </section>
  );
}
