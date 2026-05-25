/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 *
 * Modifications copyright 2026 Hanhai Team.
 * Modified: renamed from Qwen Dark to Hanhai Dark; banner gradient
 * switched to light-blue → dark-blue.
 */

import { type ColorsTheme, Theme } from './theme.js';
import { darkSemanticColors } from './semantic-tokens.js';

const hanhaiDarkColors: ColorsTheme = {
  type: 'dark',
  Background: '#0b0e14',
  Foreground: '#bfbdb6',
  LightBlue: '#59C2FF',
  AccentBlue: '#39BAE6',
  AccentPurple: '#D2A6FF',
  AccentCyan: '#95E6CB',
  AccentGreen: '#AAD94C',
  AccentYellow: '#FFD700',
  AccentRed: '#F26D78',
  AccentYellowDim: '#8B7530',
  AccentRedDim: '#8B3A4A',
  DiffAdded: '#AAD94C',
  DiffRemoved: '#F26D78',
  Comment: '#646A71',
  Gray: '#3D4149',
  GradientColors: ['#7DD3FC', '#1E3A8A'],
};

export const HanhaiDark: Theme = new Theme(
  'Hanhai Dark',
  'dark',
  {
    hljs: {
      display: 'block',
      overflowX: 'auto',
      padding: '0.5em',
      background: hanhaiDarkColors.Background,
      color: hanhaiDarkColors.Foreground,
    },
    'hljs-keyword': {
      color: hanhaiDarkColors.AccentYellow,
    },
    'hljs-literal': {
      color: hanhaiDarkColors.AccentPurple,
    },
    'hljs-symbol': {
      color: hanhaiDarkColors.AccentCyan,
    },
    'hljs-name': {
      color: hanhaiDarkColors.LightBlue,
    },
    'hljs-link': {
      color: hanhaiDarkColors.AccentBlue,
    },
    'hljs-function .hljs-keyword': {
      color: hanhaiDarkColors.AccentYellow,
    },
    'hljs-subst': {
      color: hanhaiDarkColors.Foreground,
    },
    'hljs-string': {
      color: hanhaiDarkColors.AccentGreen,
    },
    'hljs-title': {
      color: hanhaiDarkColors.AccentYellow,
    },
    'hljs-type': {
      color: hanhaiDarkColors.AccentBlue,
    },
    'hljs-attribute': {
      color: hanhaiDarkColors.AccentYellow,
    },
    'hljs-bullet': {
      color: hanhaiDarkColors.AccentYellow,
    },
    'hljs-addition': {
      color: hanhaiDarkColors.AccentGreen,
    },
    'hljs-variable': {
      color: hanhaiDarkColors.Foreground,
    },
    'hljs-template-tag': {
      color: hanhaiDarkColors.AccentYellow,
    },
    'hljs-template-variable': {
      color: hanhaiDarkColors.AccentYellow,
    },
    'hljs-comment': {
      color: hanhaiDarkColors.Comment,
      fontStyle: 'italic',
    },
    'hljs-quote': {
      color: hanhaiDarkColors.AccentCyan,
      fontStyle: 'italic',
    },
    'hljs-deletion': {
      color: hanhaiDarkColors.AccentRed,
    },
    'hljs-meta': {
      color: hanhaiDarkColors.AccentYellow,
    },
    'hljs-doctag': {
      fontWeight: 'bold',
    },
    'hljs-strong': {
      fontWeight: 'bold',
    },
    'hljs-emphasis': {
      fontStyle: 'italic',
    },
  },
  hanhaiDarkColors,
  darkSemanticColors,
);
