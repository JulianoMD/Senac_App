import { initials, type Food } from "../data";

export default function StoreMark({ food, size = "md" }: { food: Food; size?: "md" | "sm" }) {
  return (
    <span className={`store-mark store-mark--${size}`} aria-hidden="true">
      {initials(food.place)}
    </span>
  );
}
