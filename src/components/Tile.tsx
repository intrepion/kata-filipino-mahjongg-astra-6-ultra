import type { CSSProperties } from "react";
import "./Tile.css";

export type TileShape = {
  id: string;
  suit: "dots" | "bamboo" | "characters" | "bonus";
  rank: number;
  label: string;
};

type TileProps = {
  tile?: TileShape;
  faceDown?: boolean;
  selected?: boolean;
  suggested?: boolean;
  small?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
};

const INK = "#243e49";
const GREEN = "#2c6752";
const RED = "#ac4b3e";
const GOLD = "#b18b48";
const NUMERALS = ["一", "二", "三", "四", "五", "六", "七", "八", "九"];

type DotPosition = [number, number, string];

const DOTS: Record<number, DotPosition[]> = {
  2: [
    [22, 23, GREEN],
    [22, 43, RED],
  ],
  3: [
    [13, 18, GREEN],
    [22, 33, RED],
    [31, 48, INK],
  ],
  4: [
    [13, 22, INK],
    [31, 22, GREEN],
    [13, 43, GREEN],
    [31, 43, INK],
  ],
  5: [
    [13, 20, INK],
    [31, 20, GREEN],
    [22, 33, RED],
    [13, 46, GREEN],
    [31, 46, INK],
  ],
  6: [
    [13, 18, GREEN],
    [31, 18, GREEN],
    [13, 33, RED],
    [31, 33, RED],
    [13, 48, RED],
    [31, 48, RED],
  ],
  7: [
    [12, 16, GREEN],
    [22, 24, GREEN],
    [32, 32, GREEN],
    [13, 42, RED],
    [31, 42, RED],
    [13, 53, RED],
    [31, 53, RED],
  ],
  8: [
    [13, 15, INK],
    [31, 15, INK],
    [13, 27, INK],
    [31, 27, INK],
    [13, 39, INK],
    [31, 39, INK],
    [13, 51, INK],
    [31, 51, INK],
  ],
  9: [
    [11, 18, GREEN],
    [22, 18, GREEN],
    [33, 18, GREEN],
    [11, 34, RED],
    [22, 34, RED],
    [33, 34, RED],
    [11, 50, INK],
    [22, 50, INK],
    [33, 50, INK],
  ],
};

function Dot({
  x,
  y,
  color,
  radius = 4.4,
}: {
  x: number;
  y: number;
  color: string;
  radius?: number;
}) {
  return (
    <g>
      <circle cx={x} cy={y} r={radius} fill={color} />
      <circle
        cx={x}
        cy={y}
        r={radius * 0.57}
        fill="none"
        stroke="#f7f2e5"
        strokeWidth="0.65"
      />
      <circle cx={x} cy={y} r={radius * 0.18} fill="#f7f2e5" />
    </g>
  );
}

function Dots({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <g>
        <circle cx="22" cy="33" r="13.5" fill={GREEN} />
        <circle
          cx="22"
          cy="33"
          r="10.7"
          fill="none"
          stroke="#f7f2e5"
          strokeWidth="1"
        />
        {Array.from({ length: 12 }, (_, index) => (
          <path
            key={index}
            d="M22 21.7V25.3"
            stroke="#f7f2e5"
            strokeWidth="1.15"
            transform={`rotate(${index * 30} 22 33)`}
          />
        ))}
        <circle
          cx="22"
          cy="33"
          r="6.1"
          fill={RED}
          stroke="#f7f2e5"
          strokeWidth="0.9"
        />
        <circle cx="22" cy="33" r="2.3" fill={GOLD} />
      </g>
    );
  }
  return (
    <>
      {(DOTS[rank] ?? DOTS[9]).map(([x, y, color], index) => (
        <Dot
          key={index}
          x={x}
          y={y}
          color={color}
          radius={rank > 6 ? 3.65 : 4.4}
        />
      ))}
    </>
  );
}

function BambooStick({
  x,
  y,
  color = GREEN,
  height = 13,
}: {
  x: number;
  y: number;
  color?: string;
  height?: number;
}) {
  return (
    <g transform={`translate(${x} ${y})`} fill={color}>
      <rect x="-1.7" y={-height / 2} width="3.4" height={height} rx="1.1" />
      <path
        d={`M-3 ${-height / 2 + 1}Q0 ${-height / 2 + 3.2} 3 ${-height / 2 + 1}M-3 ${height / 2 - 1}Q0 ${height / 2 - 3.2} 3 ${height / 2 - 1}`}
        fill="none"
        stroke={color}
        strokeWidth="1.25"
        strokeLinecap="round"
      />
      <path d="M-2.5 0H2.5" stroke="#f7f2e5" strokeWidth="0.7" />
      <path
        d={`M-.5 ${-height / 2 + 2}V-1.6`}
        stroke="#a4b89a"
        strokeWidth="0.55"
      />
    </g>
  );
}

function Bamboo({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <g>
        <path d="M21 38C18 39 11 46 8 53C14 50 20 47 25 41Z" fill={GREEN} />
        <path d="M22 39C21 44 19 50 17 55C22 51 26 48 28 41Z" fill="#73906b" />
        <path
          d="M28 37C32 28 24 28 25 20C25 15 32 13 34 18L31 20C28 18 28 21 29 24C33 33 34 38 28 42C22 44 15 38 17 30C17 27 18 25 20 23C18 31 21 34 28 37Z"
          fill={GREEN}
        />
        <path d="M20 29C22 34 26 37 29 38C24 41 20 37 20 29Z" fill={RED} />
        <path d="M33 17L38 19L33 20Z" fill={GOLD} />
        <circle cx="31" cy="17" r="0.85" fill={INK} />
        <path
          d="M28 13L27 10M30 13L31 10M26 42L29 49L33 49M23 43L24 50L28 51"
          fill="none"
          stroke={GOLD}
          strokeWidth="1.1"
          strokeLinecap="round"
        />
        <path
          d="M11 54Q23 53 35 54"
          stroke={GREEN}
          strokeWidth="0.7"
          fill="none"
        />
      </g>
    );
  }
  const positions: [number, number][] =
    rank === 2
      ? [
          [22, 23],
          [22, 44],
        ]
      : rank === 3
        ? [
            [22, 20],
            [13, 44],
            [31, 44],
          ]
        : rank === 4
          ? [
              [13, 22],
              [31, 22],
              [13, 45],
              [31, 45],
            ]
          : rank === 5
            ? [
                [12, 21],
                [32, 21],
                [22, 33],
                [12, 46],
                [32, 46],
              ]
            : rank === 6
              ? [
                  [12, 22],
                  [22, 22],
                  [32, 22],
                  [12, 45],
                  [22, 45],
                  [32, 45],
                ]
              : rank === 7
                ? [
                    [22, 15],
                    [12, 32],
                    [22, 32],
                    [32, 32],
                    [12, 49],
                    [22, 49],
                    [32, 49],
                  ]
                : rank === 8
                  ? [
                      [11, 20],
                      [21, 20],
                      [31, 20],
                      [16, 34],
                      [28, 34],
                      [11, 49],
                      [21, 49],
                      [31, 49],
                    ]
                  : [
                      [11, 18],
                      [22, 18],
                      [33, 18],
                      [11, 34],
                      [22, 34],
                      [33, 34],
                      [11, 50],
                      [22, 50],
                      [33, 50],
                    ];
  return (
    <>
      {positions.map(([x, y], index) => (
        <BambooStick
          key={index}
          x={x}
          y={y}
          height={rank >= 7 ? 10.8 : 15}
          color={
            (rank === 5 && index === 2) ||
            (rank === 7 && index === 0) ||
            (rank === 9 && index > 2 && index < 6)
              ? RED
              : GREEN
          }
        />
      ))}
    </>
  );
}

function Flower({ variant }: { variant: number }) {
  const petals = variant % 2 === 0 ? 5 : 8;
  const flowerColor =
    variant % 3 === 0 ? RED : variant % 3 === 1 ? GOLD : "#75867a";
  return (
    <g>
      <path
        d="M22 46Q28 35 21 21M23 37Q13 28 11 36Q14 41 23 39M25 32Q33 24 34 31Q32 36 25 35"
        fill={GREEN}
        stroke={GREEN}
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      {Array.from({ length: petals }, (_, index) => (
        <ellipse
          key={index}
          cx="21"
          cy="18.5"
          rx="3.3"
          ry="6.2"
          fill={flowerColor}
          transform={`rotate(${(index * 360) / petals} 21 25)`}
          opacity="0.92"
        />
      ))}
      <circle
        cx="21"
        cy="25"
        r="3.4"
        fill={GOLD}
        stroke="#f7f2e5"
        strokeWidth="0.8"
      />
      <path
        d="M14 46H31M17 49H28"
        stroke={GOLD}
        strokeWidth="0.8"
        strokeLinecap="round"
      />
    </g>
  );
}

function Bonus({ tile }: { tile: TileShape }) {
  const label = tile.label.toLowerCase();
  const wind = label.includes("east")
    ? "東"
    : label.includes("south")
      ? "南"
      : label.includes("west")
        ? "西"
        : label.includes("north")
          ? "北"
          : null;
  const dragon = label.includes("red")
    ? "中"
    : label.includes("green")
      ? "發"
      : null;
  const isWhite = label.includes("white");
  return (
    <>
      {wind || dragon ? (
        <text
          x="22"
          y="41"
          textAnchor="middle"
          fill={dragon ? (label.includes("red") ? RED : GREEN) : INK}
          className="tile-glyph"
          fontSize="29"
        >
          {wind || dragon}
        </text>
      ) : isWhite ? (
        <g fill="none" stroke={INK}>
          <rect x="12" y="18" width="20" height="26" rx="1" strokeWidth="2" />
          <rect x="15" y="21" width="14" height="20" strokeWidth="0.75" />
          <path
            d="M12 18L15 21M32 18L29 21M12 44L15 41M32 44L29 41"
            strokeWidth="1"
          />
        </g>
      ) : (
        <Flower variant={tile.rank} />
      )}
      <text
        x="22"
        y="56"
        textAnchor="middle"
        fill={GOLD}
        fontSize="4.2"
        fontWeight="700"
        letterSpacing="0.8"
      >
        BONUS
      </text>
    </>
  );
}

export function TileFace({ tile }: { tile: TileShape }) {
  const cornerColor =
    tile.suit === "characters"
      ? RED
      : tile.suit === "bamboo"
        ? GREEN
        : tile.suit === "bonus"
          ? GOLD
          : INK;
  return (
    <svg
      className="tile-art"
      viewBox="0 0 44 62"
      fill="none"
      aria-hidden="true"
    >
      {tile.suit !== "bonus" && (
        <text
          x="4.4"
          y="9.6"
          fill={cornerColor}
          fontSize="7"
          fontWeight="700"
          fontFamily="Arial, sans-serif"
        >
          {tile.rank}
        </text>
      )}
      {tile.suit === "dots" && <Dots rank={tile.rank} />}
      {tile.suit === "bamboo" && <Bamboo rank={tile.rank} />}
      {tile.suit === "characters" && (
        <g className="tile-glyph" textAnchor="middle">
          <text x="22" y="28" fontSize="23" fill={INK}>
            {NUMERALS[tile.rank - 1] ?? tile.rank}
          </text>
          <text x="22" y="52" fontSize="24" fill={RED}>
            萬
          </text>
        </g>
      )}
      {tile.suit === "bonus" && <Bonus tile={tile} />}
    </svg>
  );
}

function TileBack() {
  return (
    <svg
      className="tile-back-art"
      viewBox="0 0 44 62"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="5"
        y="5"
        width="34"
        height="52"
        rx="3"
        stroke="currentColor"
        strokeWidth="0.8"
      />
      <rect
        x="7.5"
        y="7.5"
        width="29"
        height="47"
        rx="2"
        stroke="currentColor"
        strokeWidth="0.4"
      />
      <path
        d="M22 18L31 31L22 44L13 31Z"
        stroke="currentColor"
        strokeWidth="0.8"
      />
      <path
        d="M22 24L27 31L22 38L17 31ZM22 12V16M22 46V50M10 31H12M32 31H34"
        stroke="currentColor"
        strokeWidth="0.8"
      />
      <circle cx="22" cy="31" r="1.4" fill="currentColor" />
      <path
        d="M10 12L13 16M34 12L31 16M10 50L13 46M34 50L31 46"
        stroke="currentColor"
        strokeWidth="0.6"
      />
    </svg>
  );
}

export default function Tile({
  tile,
  faceDown = false,
  selected = false,
  suggested = false,
  small = false,
  onClick,
  disabled = false,
  className = "",
  style,
}: TileProps) {
  const back = faceDown || !tile;
  const classes = [
    "mahjong-tile",
    back ? "tile--back" : "tile--face",
    selected && "tile--selected",
    suggested && "tile--suggested",
    small && "tile--small",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  const label = back ? "Face-down tile" : tile.label;
  const content = (
    <span className="tile-surface">
      {back ? <TileBack /> : <TileFace tile={tile} />}
      {suggested && !back && <span className="tile-hint-dot" />}
    </span>
  );

  return onClick ? (
    <button
      type="button"
      className={classes}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={selected}
      title={label}
      style={style}
    >
      {content}
    </button>
  ) : (
    <div
      className={classes}
      role="img"
      aria-label={label}
      title={label}
      style={style}
    >
      {content}
    </div>
  );
}
