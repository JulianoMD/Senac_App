import { useState } from "react";
import Icon, { type IconName } from "../components/Icon";
import Photo from "../components/Photo";
import { discountOf, foods, user } from "../data";

const bestDiscount = Math.max(...foods.map(discountOf));

const slides: {
  tone: string;
  title: string;
  text: string;
  image: string;
  chips: { icon?: IconName; text: string; kind: string }[];
}[] = [
  {
    tone: "blue",
    title: "Comida boa, sem fila",
    text: "Reserve pelo app as refeições das cantinas do campus e passe só para retirar.",
    image: foods[0].image,
    chips: [
      { icon: "check", text: "Sem fila", kind: "brand" },
      { icon: "clock", text: "Retire 12:30", kind: "white" },
    ],
  },
  {
    tone: "orange",
    title: "Mais barato, menos desperdício",
    text: `O que sobra do dia sai com até ${bestDiscount}% de desconto. Você economiza e nada vai para o lixo.`,
    image: foods[3].image,
    chips: [
      { text: `−${bestDiscount}%`, kind: "sticker" },
      { icon: "leaf", text: "Salvo do lixo", kind: "white" },
    ],
  },
  {
    tone: "deep",
    title: "Seu nome, seu código",
    text: "Pagou, recebeu um código com o seu nome. Mostre no balcão e pronto.",
    image: foods[2].image,
    chips: [
      { icon: "ticket", text: `FZ-2048 · ${user.firstName}`, kind: "white" },
      { icon: "check", text: "Pago", kind: "brand" },
    ],
  },
];

// Tour curto e pulável (Paradoxo do Usuário Ativo): três ideias, uma por tela.
export default function Onboarding({ close }: { close: () => void }) {
  const [index, setIndex] = useState(0);
  const slide = slides[index];
  const last = index === slides.length - 1;

  return (
    <div className={`onboarding tone-${slide.tone}`}>
      <div className="onboarding-art" key={index}>
        <button className="onboarding-skip" type="button" onClick={close}>
          Pular
        </button>
        <div className="onboarding-photo">
          <Photo src={slide.image} eager />
        </div>
        {slide.chips.map((chip, chipIndex) => (
          <span className={`float-chip float-chip--${chip.kind} float-chip--${chipIndex}`} key={chip.text}>
            {chip.icon && <Icon name={chip.icon} size={16} />}
            {chip.text}
          </span>
        ))}
      </div>
      <div className="onboarding-panel">
        <div className="dots" aria-label={`Tela ${index + 1} de ${slides.length}`}>
          {slides.map((item, dotIndex) => (
            <button
              className={dotIndex === index ? "is-active" : ""}
              key={item.title}
              type="button"
              aria-label={`Ir para a tela ${dotIndex + 1}`}
              onClick={() => setIndex(dotIndex)}
            />
          ))}
        </div>
        <h2>{slide.title}</h2>
        <p>{slide.text}</p>
        <button
          className="primary-button primary-button--wide primary-button--accent"
          type="button"
          onClick={() => (last ? close() : setIndex(index + 1))}
        >
          {last ? "Começar a explorar" : "Continuar"}
          <Icon name="arrow" size={18} />
        </button>
      </div>
    </div>
  );
}
