import React from "react";

// Pure pixel-art arrow built from <rect>s. Renders crisp at any size.
// 16x16 grid; rotated via CSS transform for non-right directions.
const RIGHT_PIXELS = [
  // [x, y] coordinates of filled pixels for a chunky right-facing arrow
  [0, 6], [0, 7], [0, 8], [0, 9],
  [1, 6], [1, 7], [1, 8], [1, 9],
  [2, 6], [2, 7], [2, 8], [2, 9],
  [3, 6], [3, 7], [3, 8], [3, 9],
  [4, 6], [4, 7], [4, 8], [4, 9],
  [5, 6], [5, 7], [5, 8], [5, 9],
  [6, 6], [6, 7], [6, 8], [6, 9],
  [7, 6], [7, 7], [7, 8], [7, 9],
  [8, 4], [8, 5], [8, 6], [8, 7], [8, 8], [8, 9], [8, 10], [8, 11],
  [9, 5], [9, 6], [9, 7], [9, 8], [9, 9], [9, 10],
  [10, 6], [10, 7], [10, 8], [10, 9],
  [11, 7], [11, 8],
];

const ROTATIONS = {
  right: 0,
  down: 90,
  left: 180,
  up: 270,
  "up-right": 315,
  "down-right": 45,
  "down-left": 135,
  "up-left": 225,
};

const PIXEL_SIZE = 16;

export default function PixelArrow({
  direction = "right",
  color = "#FFB347",
  size = 48,
  bounce = false,
  style = {},
  shadow = "#0A0A0A",
}) {
  const rot = ROTATIONS[direction] ?? 0;

  return (
    <span
      className={bounce ? "dmge-arrow-bounce" : ""}
      style={{ display: "inline-block", lineHeight: 0, ...style }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${PIXEL_SIZE} ${PIXEL_SIZE}`}
        shapeRendering="crispEdges"
        style={{
          transform: `rotate(${rot}deg)`,
          display: "block",
          filter: `drop-shadow(2px 2px 0 ${shadow})`,
        }}
      >
        {RIGHT_PIXELS.map(([x, y], i) => (
          <rect key={i} x={x} y={y} width={1} height={1} fill={color} />
        ))}
      </svg>
    </span>
  );
}
