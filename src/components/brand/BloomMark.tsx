"use client";

type BloomMarkProps = {
  size?: number;
  core?: string;
  fila?: string;
  tip?: string;
  leaf?: string;
  stem?: string;
  vein?: string;
  className?: string;
  style?: React.CSSProperties;
};

const SCARLET = "#c8321a";
const EMBER = "#e25a2b";
const POLLEN = "#e8b547";
const EUCALYPT = "#455944";
const SHADOW = "#2c3b2d";

export function BloomMark({
  size = 200,
  core = SCARLET,
  fila = EMBER,
  tip = POLLEN,
  leaf = EUCALYPT,
  stem = EUCALYPT,
  vein = SHADOW,
  className,
  style,
}: BloomMarkProps) {
  return (
    <svg
      viewBox="0 0 260 260"
      width={size}
      height={size}
      className={className}
      style={{ display: "block", overflow: "visible", ...style }}
      aria-hidden
    >
      <path
        d="M130,250 C130,210 138,180 142,150"
        stroke={stem}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <Leaf x={138} y={205} length={110} width={26} rot={-65} fill={leaf} vein={vein} />
      <Leaf x={132} y={175} length={92} width={22} rot={135} fill={leaf} vein={vein} />
      <PomGroup cx={130} cy={108} size={200} core={core} fila={fila} tip={tip} />
    </svg>
  );
}

function Leaf({
  x,
  y,
  length,
  width,
  rot,
  fill,
  vein,
}: {
  x: number;
  y: number;
  length: number;
  width: number;
  rot: number;
  fill: string;
  vein: string;
}) {
  const w = width / 2;
  const d = `M0,0 C${length * 0.25},${-w} ${length * 0.75},${-w} ${length},0 C${length * 0.75},${w} ${length * 0.25},${w} 0,0 Z`;
  return (
    <g transform={`translate(${x},${y}) rotate(${rot})`}>
      <path d={d} fill={fill} />
      <line
        x1={length * 0.05}
        y1={0}
        x2={length * 0.92}
        y2={0}
        stroke={vein}
        strokeWidth={1}
        opacity={0.4}
      />
    </g>
  );
}

function PomGroup({
  cx,
  cy,
  size,
  count = 22,
  stroke = 2.4,
  core,
  fila,
  tip,
}: {
  cx: number;
  cy: number;
  size: number;
  count?: number;
  stroke?: number;
  core: string;
  fila: string;
  tip: string;
}) {
  const innerR = size * 0.16;
  const outerR = size * 0.43;
  const tipR = size * 0.05;
  const fil: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    fil.push({
      x1: cx + Math.cos(a) * innerR,
      y1: cy + Math.sin(a) * innerR,
      x2: cx + Math.cos(a) * outerR,
      y2: cy + Math.sin(a) * outerR,
    });
  }
  return (
    <g>
      {fil.map((f, i) => (
        <line
          key={`l${i}`}
          x1={f.x1}
          y1={f.y1}
          x2={f.x2}
          y2={f.y2}
          stroke={fila}
          strokeWidth={stroke}
          strokeLinecap="round"
        />
      ))}
      {fil.map((f, i) => (
        <circle key={`t${i}`} cx={f.x2} cy={f.y2} r={tipR} fill={tip} />
      ))}
      <circle cx={cx} cy={cy} r={innerR} fill={core} />
    </g>
  );
}
