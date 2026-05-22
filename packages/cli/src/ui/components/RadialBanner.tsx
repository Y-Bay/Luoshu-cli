/**
 * Copyright 2026 Luoshu Team.
 * SPDX-License-Identifier: Apache-2.0
 *
 * Per-character radial gradient renderer for the LUOSHU startup banner.
 *
 * - `colors` may be 2+ hex stops; interpolation is piecewise-linear in sRGB.
 * - `origin` controls where t=0 lives (default `'top-left'`). t=1 lives at
 *   the farthest character cell from the origin.
 * - Cells are weighted ~`cellAspect`× vertically so the radial isodistance
 *   ring is visually circular rather than a stretched ellipse, since most
 *   monospace cells are taller than they are wide.
 */

import type React from 'react';
import { Box, Text } from 'ink';

type Origin =
  | 'center'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

interface RadialBannerProps {
  text: string;
  /** 2+ hex color stops interpolated from t=0 (origin) to t=1 (far corner). */
  colors: string[];
  /** Radial origin position; default `'top-left'`. */
  origin?: Origin;
  /** Terminal cell height ÷ width ratio. Default 2. */
  cellAspect?: number;
}

function parseHex(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const full =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

function toHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return (
    '#' +
    [clamp(r), clamp(g), clamp(b)]
      .map((v) => v.toString(16).padStart(2, '0'))
      .join('')
  );
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function multiStopColor(colors: string[], t: number): string {
  if (colors.length === 1) return colors[0];
  const segs = colors.length - 1;
  const scaled = Math.max(0, Math.min(1, t)) * segs;
  const idx = Math.min(segs - 1, Math.floor(scaled));
  const localT = scaled - idx;
  const [ar, ag, ab] = parseHex(colors[idx]);
  const [br, bg, bb] = parseHex(colors[idx + 1]);
  return toHex(
    lerp(ar, br, localT),
    lerp(ag, bg, localT),
    lerp(ab, bb, localT),
  );
}

function resolveOrigin(
  origin: Origin,
  numCols: number,
  numRows: number,
): { ox: number; oy: number } {
  const maxX = numCols - 1;
  const maxY = numRows - 1;
  switch (origin) {
    case 'center':
      return { ox: maxX / 2, oy: maxY / 2 };
    case 'top-left':
      return { ox: 0, oy: 0 };
    case 'top-right':
      return { ox: maxX, oy: 0 };
    case 'bottom-left':
      return { ox: 0, oy: maxY };
    case 'bottom-right':
      return { ox: maxX, oy: maxY };
    default:
      return { ox: 0, oy: 0 };
  }
}

export const RadialBanner: React.FC<RadialBannerProps> = ({
  text,
  colors,
  origin = 'top-left',
  cellAspect = 2,
}) => {
  const rows = text.split('\n');
  while (rows.length > 0 && rows[0].trim() === '') rows.shift();
  while (rows.length > 0 && rows[rows.length - 1].trim() === '') rows.pop();

  const numRows = rows.length;
  const numCols = rows.reduce((max, r) => Math.max(max, [...r].length), 0);

  if (numRows === 0 || numCols === 0 || colors.length < 2) {
    return <Text>{text}</Text>;
  }

  const { ox, oy } = resolveOrigin(origin, numCols, numRows);

  // Compute maxDist as the largest distance from the origin to any corner cell.
  const corners = [
    [0, 0],
    [numCols - 1, 0],
    [0, numRows - 1],
    [numCols - 1, numRows - 1],
  ];
  const maxDist =
    Math.max(
      ...corners.map(([cx, cy]) => {
        const dx = cx - ox;
        const dy = (cy - oy) * cellAspect;
        return Math.sqrt(dx * dx + dy * dy);
      }),
    ) || 1;

  return (
    <Box flexDirection="column">
      {rows.map((row, rowIdx) => {
        const chars = [...row];
        return (
          <Text key={rowIdx}>
            {chars.map((char, colIdx) => {
              if (char === ' ') {
                return <Text key={colIdx}>{char}</Text>;
              }
              const dx = colIdx - ox;
              const dy = (rowIdx - oy) * cellAspect;
              const d = Math.sqrt(dx * dx + dy * dy);
              const t = d / maxDist;
              const color = multiStopColor(colors, t);
              return (
                <Text key={colIdx} color={color}>
                  {char}
                </Text>
              );
            })}
          </Text>
        );
      })}
    </Box>
  );
};
