import { useEffect, useRef, useState } from "react";
import { isReducedMotion } from "../motion";

// Número que "sobe" até o valor final quando aparece na tela.
export default function CountUp({
  value,
  format = (current) => String(Math.round(current)),
  duration = 1200,
}: {
  value: number;
  format?: (current: number) => string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (isReducedMotion() || typeof IntersectionObserver !== "function") {
      setDisplay(value);
      return;
    }
    let frame = 0;
    let start: number | null = null;
    const run = (time: number) => {
      start ??= time;
      const progress = Math.min(1, (time - start) / duration);
      setDisplay(value * (1 - Math.pow(1 - progress, 3)));
      if (progress < 1) frame = requestAnimationFrame(run);
    };
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      frame = requestAnimationFrame(run);
      observer.disconnect();
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value, duration]);

  return (
    <span ref={ref} className="count-up" aria-label={format(value)}>
      <span aria-hidden="true">{format(display)}</span>
    </span>
  );
}
