import { CO2_PER_MEAL, courses, SOLIDARITY_BASE, user, WEEKLY_GOAL } from "../data";
import { useApp } from "../store";

const kg = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });

// Desafio do campus: meta coletiva da semana, ranking por curso (as reservas da pessoa contam
// para o curso dela) e o impacto somado — o uso individual vira um movimento do campus.
export default function CampusChallenge() {
  const app = useApp();
  const board = courses
    .map((course) => ({ ...course, saved: course.saved + (course.name === user.course ? app.orders.length : 0) }))
    .sort((a, b) => b.saved - a.saved);
  const total = board.reduce((sum, course) => sum + course.saved, 0) + app.leftoversDonated;
  const reached = total >= WEEKLY_GOAL;
  const leader = board[0].saved;

  return (
    <section className="profile-section" aria-labelledby="challenge-title">
      <h2 className="section-title" id="challenge-title">
        Desafio do campus
      </h2>
      <div className="challenge-card">
        <p className="challenge-kicker">Meta da semana</p>
        <p className="challenge-total">
          <strong>{total}</strong> de {WEEKLY_GOAL} refeições salvas
        </p>
        <div
          className="challenge-bar"
          role="progressbar"
          aria-label="Meta da semana"
          aria-valuemin={0}
          aria-valuemax={WEEKLY_GOAL}
          aria-valuenow={Math.min(total, WEEKLY_GOAL)}
        >
          <span style={{ width: `${Math.min(100, (total / WEEKLY_GOAL) * 100)}%` }} />
        </div>
        <p className="challenge-reward">
          {reached
            ? "Meta batida! Todo o campus ganhou 15% OFF na próxima reserva."
            : `Faltam ${WEEKLY_GOAL - total}. Se o campus bater a meta até domingo, todo mundo ganha 15% OFF.`}
        </p>

        <ol className="challenge-board" aria-label="Ranking por curso">
          {board.map((course, index) => (
            <li key={course.name} className={course.name === user.course ? "is-mine" : ""}>
              <span className="board-rank">{index + 1}º</span>
              <span className="board-name">
                {course.name}
                {course.name === user.course && <em>seu curso</em>}
              </span>
              <span className="board-bar" aria-hidden="true">
                <span style={{ width: `${(course.saved / leader) * 100}%` }} />
              </span>
              <b>{course.saved}</b>
            </li>
          ))}
        </ol>

        <ul className="challenge-facts">
          <li>
            <strong>{kg.format(total * CO2_PER_MEAL)} kg</strong>
            <span>de CO₂ evitados pelo campus</span>
          </li>
          <li>
            <strong>{SOLIDARITY_BASE + app.donated}</strong>
            <span>refeições solidárias pagas por estudantes</span>
          </li>
        </ul>
      </div>
    </section>
  );
}
