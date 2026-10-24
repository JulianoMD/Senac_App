const colors = ["#f7941d", "#ffc27a", "#ffffff", "#8db7f2", "#f7941d", "#ffffff"];

export default function Confetti({ pieces = 32 }: { pieces?: number }) {
  return (
    <div className="confetti" aria-hidden="true">
      {Array.from({ length: pieces }, (_, index) => (
        <span
          key={index}
          style={
            {
              "--x": `${(index * 37) % 100}%`,
              "--c": colors[index % colors.length],
              "--d": `${(index % 8) * 70}ms`,
              "--r": `${(index * 53) % 360}deg`,
              "--drift": `${((index % 5) - 2) * 18}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
