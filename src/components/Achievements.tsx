import { useState } from "react";
import Icon, { type IconName } from "./Icon";

export type Achievement = {
  id: string;
  title: string;
  icon: IconName;
  unlocked: boolean;
  how: string;
  progress?: string;
};

// Medalhas que viram (giro 3D) ao tocar: na frente o símbolo, no verso como conquistar.
export default function Achievements({ items }: { items: Achievement[] }) {
  const [flipped, setFlipped] = useState<string | null>(null);

  return (
    <div className="medals">
      {items.map((item, index) => {
        const isFlipped = flipped === item.id;
        return (
          <button
            className={`medal halo ${item.unlocked ? "is-unlocked" : "is-locked"} ${isFlipped ? "is-flipped" : ""}`}
            key={item.id}
            type="button"
            style={{ animationDelay: `${index * 70}ms` }}
            aria-pressed={isFlipped}
            aria-label={`${item.title}: ${item.unlocked ? "conquistada" : "bloqueada"}. ${item.how}`}
            onClick={() => setFlipped(isFlipped ? null : item.id)}
          >
            <span className="medal-inner">
              <span className="medal-face">
                <span className="medal-coin">
                  <Icon name={item.unlocked ? item.icon : "lock"} size={24} />
                  <span className="medal-shine" aria-hidden="true" />
                </span>
                <span className="medal-title">{item.title}</span>
                <small>{item.unlocked ? "Conquistada" : (item.progress ?? "Bloqueada")}</small>
              </span>
              <span className="medal-face medal-back" aria-hidden="true">
                <small>{item.unlocked ? "Você conseguiu" : "Como ganhar"}</small>
                <span className="medal-how">{item.how}</span>
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
