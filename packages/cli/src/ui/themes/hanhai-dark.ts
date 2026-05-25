/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 *
 * Modifications copyright 2026 Luoshu Team.
 * Modified: renamed from Qwen Dark to Luoshu Dark; banner gradient
 * switched to light-blue → dark-blue.
 */

import { type ColorsTheme, Theme } from './theme.js';
import { darkSemanticColors } from './semantic-tokens.js';

const luoshuDarkColors: ColorsTheme = {
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

export const LuoshuDark: Theme = new Theme(
  'Luoshu Dark',
  'dark',
  {
    hljs: {
      display: 'block',
      overflowX: 'auto',
      padding: '0.5em',
      background: luoshuDarkColors.Background,
      color: luoshuDarkColors.Foreground,
    },
    'hljs-keyword': {
      color: luoshuDarkColors.AccentYellow,
    },
    'hljs-literal': {
      color: luoshuDarkColors.AccentPurple,
    },
    'hljs-symbol': {
      color: luoshuDarkColors.AccentCyan,
    },
    'hljs-name': {
      color: luoshuDarkColors.LightBlue,
    },
    'hljs-link': {
      color: luoshuDarkColors.AccentBlue,
    },
    'hljs-function .hljs-keyword': {
      color: luoshuDarkColors.AccentYellow,
    },
    'hljs-subst': {
      color: luoshuDarkColors.Foreground,
    },
    'hljs-string': {
      color: luoshuDarkColors.AccentGreen,
    },
    'hljs-title': {
      color: luoshuDarkColors.AccentYellow,
    },
    'hljs-type': {
      color: luoshuDarkColors.AccentBlue,
    },
    'hljs-attribute': {
      color: luoshuDarkColors.AccentYellow,
    },
    'hljs-bullet': {
      color: luoshuDarkColors.AccentYellow,
    },
    'hljs-addition': {
      color: luoshuDarkColors.AccentGreen,
    },
    'hljs-variable': {
      color: luoshuDarkColors.Foreground,
    },
    'hljs-template-tag': {
      color: luoshuDarkColors.AccentYellow,
    },
    'hljs-template-variable': {
      color: luoshuDarkColors.AccentYellow,
    },
    'hljs-comment': {
      color: luoshuDarkColors.Comment,
      fontStyle: 'italic',
    },
    'hljs-quote': {
      color: luoshuDarkColors.AccentCyan,
      fontStyle: 'italic',
    },
    'hljs-deletion': {
      color: luoshuDarkColors.AccentRed,
    },
    'hljs-meta': {
      color: luoshuDarkColors.AccentYellow,
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
  luoshuDarkColors,
  darkSemanticColors,
);
