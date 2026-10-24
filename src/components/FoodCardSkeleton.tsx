// Silhueta do card de oferta enquanto as ofertas carregam: mesmas medidas do card real,
// para a troca pelo conteúdo não mexer nada na tela.
export default function FoodCardSkeleton() {
  return (
    <div className="food-card skeleton-card" aria-hidden="true">
      <div className="sk sk-media">
        <span className="sk-store" />
      </div>
      <div className="food-body">
        <div className="food-main">
          <span className="sk sk-line sk-line--title" />
          <span className="sk sk-line sk-line--meta" />
        </div>
        <div className="food-price">
          <span className="sk sk-line sk-line--price" />
          <span className="sk sk-pill" />
        </div>
      </div>
    </div>
  );
}
