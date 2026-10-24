import { pickupStatus, type Food } from "../data";
import { useNow } from "../time";

const RADIUS = 7;
const LENGTH = 2 * Math.PI * RADIUS;

// O anel do "zero" esvazia até o fim do horário de retirada.
// Antes de abrir fica cheio e azul; aberto, laranja e esvaziando; encerrado, vazio.
// `label` troca o texto (ex.: a janela de retirada); depois de encerrar, sempre diz quando fechou.
export default function PickupCountdown({
  food,
  size = "sm",
  label,
}: {
  food: Food;
  size?: "sm" | "md" | "lg";
  label?: string;
}) {
  const now = useNow();
  const status = pickupStatus(food, now);

  return (
    <span className={`countdown countdown--${size} is-${status.phase}`} title={`Retirada hoje, ${food.pickup}`}>
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <circle className="countdown-track" cx="10" cy="10" r={RADIUS} />
        <circle
          className="countdown-value"
          cx="10"
          cy="10"
          r={RADIUS}
          strokeDasharray={LENGTH}
          strokeDashoffset={LENGTH * (1 - status.remaining)}
        />
      </svg>
      <span>{label && status.phase !== "closed" ? label : status.label}</span>
    </span>
  );
}
