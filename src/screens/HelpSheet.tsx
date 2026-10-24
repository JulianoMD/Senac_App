import Icon from "../components/Icon";
import { useApp } from "../store";

const faq = [
  {
    question: "Como funciona a retirada?",
    answer:
      "Depois de pagar, você recebe um código com o seu nome. Vá ao balcão no horário indicado e mostre o código. Sem fila e sem pagar de novo.",
  },
  {
    question: "Por que os preços são menores?",
    answer:
      "São refeições e lanches feitos no dia que não foram vendidos. Em vez de ir para o lixo, saem com desconto. A cantina não perde e você economiza.",
  },
  {
    question: "Para que serve o horário marcado?",
    answer:
      "Ao reservar você escolhe uma faixa de 10 minutos, e cada faixa recebe poucas pessoas. Assim ninguém chega junto e você é atendido na hora, sem fila.",
  },
  {
    question: "O que é a refeição solidária?",
    answer:
      "Ao pagar, você pode pagar uma refeição a mais para um colega que precisa. A assistência estudantil entrega códigos (SOL-1234) de forma discreta; quem recebe usa o código no pagamento e retira normalmente, sem ninguém saber. Na demonstração, teste com o código SOL-2026.",
  },
  {
    question: "Posso cancelar uma reserva?",
    answer:
      "Sim, até o início do horário de retirada. Abra o pedido em Pedidos e toque em Cancelar reserva. O valor volta pela mesma forma de pagamento.",
  },
  {
    question: "E se eu não conseguir retirar no horário?",
    answer:
      "Fale com a cantina pelo balcão. Depois que o horário termina, as sobras podem ser doadas e o pedido não é reembolsado.",
  },
  {
    question: "O que é o Desafio do campus?",
    answer:
      "Uma meta da semana para o campus inteiro. Cada reserva conta para o seu curso no ranking; se a meta for batida até domingo, todo mundo ganha um cupom.",
  },
  {
    question: "Como uso um cupom de desconto?",
    answer: "Abra o cupom em Perfil > Descontos e mostre o código de barras no caixa.",
  },
];

export default function HelpSheet({ close }: { close: () => void }) {
  const { showOnboarding } = useApp();

  return (
    <div className="item-sheet help-sheet">
      <div className="sheet-head" data-sheet-handle>
        <span className="sheet-grabber sheet-grabber--dark" aria-hidden="true" />
        <span />
        <h2>Ajuda</h2>
        <button type="button" aria-label="Fechar ajuda" onClick={close}>
          <Icon name="close" size={20} />
        </button>
      </div>
      <div className="faq">
        {faq.map((item, index) => (
          <details key={item.question} open={index === 0}>
            <summary>
              {item.question}
              <Icon name="arrow" size={18} />
            </summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </div>
      <div className="sheet-footer">
        <button
          className="primary-button primary-button--wide"
          type="button"
          onClick={() => {
            close();
            window.setTimeout(showOnboarding, 260);
          }}
        >
          <Icon name="play" size={18} />
          Ver o tour de novo
        </button>
      </div>
    </div>
  );
}
