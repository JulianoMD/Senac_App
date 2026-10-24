import { distance, patios, type Patio } from "../data";

// Caminho a pé da entrada principal até cada pátio, pelas calçadas do mapa (viewBox 320×180).
const routes: Record<Patio["id"], string> = {
  1: "16,152 110,152 110,135",
  2: "16,152 70,152 70,92 150,92 150,74",
  3: "16,152 70,152 70,92 250,92 250,64",
};

const buildings = [
  { x: 8, y: 18, w: 48, h: 62, label: "Bloco A" },
  { x: 82, y: 18, w: 42, h: 58, label: "Biblioteca" },
  { x: 182, y: 18, w: 40, h: 58, label: "Bloco B" },
  { x: 280, y: 18, w: 32, h: 62, label: "Bloco C" },
  { x: 8, y: 102, w: 52, h: 38, label: "Bloco D" },
  { x: 146, y: 102, w: 90, h: 38, label: "Ginásio" },
  { x: 250, y: 102, w: 62, h: 38, label: "Auditório" },
];

// Mapa simplificado do campus: os três pátios (os únicos pontos de retirada), as calçadas e a
// rota da entrada até o pátio da oferta.
export default function CampusMap({ patio }: { patio: Patio }) {
  return (
    <svg
      className="campus-map-svg"
      viewBox="0 0 320 180"
      role="img"
      aria-label={`Mapa do campus: da entrada principal até o ${patio.name}, ${patio.meters} metros a pé`}
    >
      <rect className="map-ground" width="320" height="180" rx="14" />
      <path className="map-walk" d="M0 152H320M70 152V18M70 92H300M150 92V74M250 92V64M110 152V135" />
      {buildings.map((item) => (
        <g key={item.label}>
          <rect className="map-building" x={item.x} y={item.y} width={item.w} height={item.h} rx="5" />
          <text className="map-building-label" x={item.x + item.w / 2} y={item.y + item.h / 2 + 3}>
            {item.label}
          </text>
        </g>
      ))}
      {Object.values(patios).map((item) => (
        <g key={item.id} className={item.id === patio.id ? "map-patio is-target" : "map-patio"}>
          <rect x={item.x - 22} y={item.y - 14} width="44" height="28" rx="8" />
          <text x={item.x} y={item.y + 4}>
            {item.name}
          </text>
        </g>
      ))}
      <polyline className="map-route" points={routes[patio.id]} />
      <g className="map-pin" transform={`translate(${patio.x} ${patio.y - 16})`}>
        <path d="M0 0c-6-7-9-11-9-15a9 9 0 0 1 18 0c0 4-3 8-9 15Z" />
        <circle cy="-15" r="3.2" />
      </g>
      <g className="map-you">
        <circle className="map-you-halo" cx="16" cy="152" r="9" />
        <circle cx="16" cy="152" r="5" />
        <text x="26" y="172">
          Você · entrada
        </text>
      </g>
      <text className="map-distance" x={patio.x} y={patio.y + 27}>
        {distance(patio)}
      </text>
    </svg>
  );
}
