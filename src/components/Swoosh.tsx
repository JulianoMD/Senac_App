// Arcos decorativos no laranja do logo Senac.
export default function Swoosh({ className = "" }: { className?: string }) {
  return (
    <svg className={`swoosh ${className}`} viewBox="0 0 220 160" aria-hidden="true">
      <path d="M38 158C52 88 118 34 220 30v-30C116 4 54 62 38 158Z" fill="#f7941d" />
      <path d="M90 158c18-52 64-86 130-92V44C140 50 102 96 90 158Z" fill="#fbc08a" opacity="0.85" />
    </svg>
  );
}
