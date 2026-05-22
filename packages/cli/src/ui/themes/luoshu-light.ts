/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 *
 * Modifications copyright 2026 Luoshu Team.
 * Modified: renamed from Qwen Light to Luoshu Light; banner gradient
 * switched to light-blue → dark-blue.
 */

import { type ColorsTheme, Theme } from './theme.js';
import { lightSemanticColors } from './semantic-tokens.js';

const luoshuLightColors: ColorsTheme = {
  type: 'light',
  Background: '#f8f9fa',
  Foreground: '#5c6166',
  LightBlue: '#55b4d4',
  AccentBlue: '#399ee6',
  AccentPurple: '#a37acc',
  AccentCyan: '#4cbf99',
  AccentGreen: '#86b300',
  AccentYellow: '#f2ae49',
  AccentRed: '#f07171',
  AccentYellowDim: '#8B7000',
  AccentRedDim: '#993333',
  DiffAdded: '#86b300',
  DiffRemoved: '#f07171',
  Comment: '#ABADB1',
  Gray: '#CCCFD3',
  GradientColors: ['#7DD3FC', '#1E3A8A'],
};

export const LuoshuLight: Theme = new Theme(
  'Luoshu Light',
  'light',
  {
    hljs: {
      display: 'block',
      overflowX: 'auto',
      padding: '0.5em',
      background: luoshuLightColors.Background,
      color: luoshuLightColors.Foreground,
    },
    'hljs-comment': {
      color: luoshuLightColors.Comment,
      fontStyle: 'italic',
    },
    'hljs-quote': {
      color: luoshuLightColors.AccentCyan,
      fontStyle: 'italic',
    },
    'hljs-string': {
      color: luoshuLightColors.AccentGreen,
    },
    'hljs-constant': {
      color: luoshuLightColors.AccentCyan,
    },
    'hljs-number': {
      color: luoshuLightColors.AccentPurple,
    },
    'hljs-keyword': {
      color: luoshuLightColors.AccentYellow,
    },
    'hljs-selector-tag': {
      color: luoshuLightColors.AccentYellow,
    },
    'hljs-attribute': {
      color: luoshuLightColors.AccentYellow,
    },
    'hljs-variable': {
      color: luoshuLightColors.Foreground,
    },
    'hljs-variable.language': {
      color: luoshuLightColors.LightBlue,
      fontStyle: 'italic',
    },
    'hljs-title': {
      color: luoshuLightColors.AccentBlue,
    },
    'hljs-section': {
      color: luoshuLightColors.AccentGreen,
      fontWeight: 'bold',
    },
    'hljs-type': {
      color: luoshuLightColors.LightBlue,
    },
    'hljs-class .hljs-title': {
      color: luoshuLightColors.AccentBlue,
    },
    'hljs-tag': {
      color: luoshuLightColors.LightBlue,
    },
    'hljs-name': {
      color: luoshuLightColors.AccentBlue,
    },
    'hljs-builtin-name': {
      color: luoshuLightColors.AccentYellow,
    },
    'hljs-meta': {
      color: luoshuLightColors.AccentYellow,
    },
    'hljs-symbol': {
      color: luoshuLightColors.AccentRed,
    },
    'hljs-bullet': {
      color: luoshuLightColors.AccentYellow,
    },
    'hljs-regexp': {
      color: luoshuLightColors.AccentCyan,
    },
    'hljs-link': {
      color: luoshuLightColors.LightBlue,
    },
    'hljs-deletion': {
      color: luoshuLightColors.AccentRed,
    },
    'hljs-addition': {
      color: luoshuLightColors.AccentGreen,
    },
    'hljs-emphasis': {
      fontStyle: 'italic',
    },
    'hljs-strong': {
      fontWeight: 'bold',
    },
    'hljs-literal': {
      color: luoshuLightColors.AccentCyan,
    },
    'hljs-built_in': {
      color: luoshuLightColors.AccentRed,
    },
    'hljs-doctag': {
      color: luoshuLightColors.AccentRed,
    },
    'hljs-template-variable': {
      color: luoshuLightColors.AccentCyan,
    },
    'hljs-selector-id': {
      color: luoshuLightColors.AccentRed,
    },
  },
  luoshuLightColors,
  lightSemanticColors,
);
