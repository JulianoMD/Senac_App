const EAN_L = ["0001101", "0011001", "0010011", "0111101", "0100011", "0110001", "0101111", "0111011", "0110111", "0001011"];
const EAN_G = ["0100111", "0110011", "0011011", "0100001", "0011101", "0111001", "0000101", "0010001", "0001001", "0010111"];
const EAN_R = ["1110010", "1100110", "1101100", "1000010", "1011100", "1001110", "1010000", "1000100", "1001000", "1110100"];
const EAN_PARITY = ["LLLLLL", "LLGLGG", "LLGGLG", "LLGGGL", "LGLLGG", "LGGLLG", "LGGGLL", "LGLGLG", "LGLGGL", "LGGLGL"];

function encodeEan13(code: string) {
  const digits = code.split("").map(Number);
  const parity = EAN_PARITY[digits[0]];
  const left = digits
    .slice(1, 7)
    .map((digit, index) => (parity[index] === "L" ? EAN_L : EAN_G)[digit])
    .join("");
  const right = digits
    .slice(7)
    .map((digit) => EAN_R[digit])
    .join("");
  return `101${left}01010${right}101`;
}

export default function Barcode({
  code,
  className = "",
  barHeight = 58,
}: {
  code: string;
  className?: string;
  barHeight?: number;
}) {
  const quiet = 9;
  const modules = encodeEan13(code);
  const isGuard = (index: number) =>
    index < 3 || (index >= 45 && index < 50) || index >= 92;

  const bars: { x: number; width: number; guard: boolean }[] = [];
  for (let index = 0; index < modules.length; index += 1) {
    if (modules[index] !== "1") continue;
    const previous = bars[bars.length - 1];
    if (previous && previous.x + previous.width === index && previous.guard === isGuard(index)) {
      previous.width += 1;
    } else {
      bars.push({ x: index, width: 1, guard: isGuard(index) });
    }
  }

  return (
    <svg
      className={`barcode ${className}`}
      role="img"
      aria-label={`Código de barras ${code}`}
      viewBox={`0 0 ${95 + quiet * 2} ${barHeight + 12}`}
      shapeRendering="crispEdges"
    >
      {bars.map((bar) => (
        <rect
          key={bar.x}
          x={bar.x + quiet}
          y={0}
          width={bar.width}
          height={bar.guard ? barHeight + 6 : barHeight}
          fill="currentColor"
        />
      ))}
      <g className="barcode-digits" fill="currentColor" textAnchor="middle">
        <text x={quiet - 4} y={barHeight + 10}>
          {code[0]}
        </text>
        {code
          .slice(1)
          .split("")
          .map((digit, index) => (
            <text key={index} x={quiet + (index < 6 ? 3 : 8) + index * 7 + 3.5} y={barHeight + 10}>
              {digit}
            </text>
          ))}
      </g>
    </svg>
  );
}
