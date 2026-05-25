/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 *
 * Modifications copyright 2026 Hanhai Team.
 * Modified: renamed from Qwen Light to Hanhai Light; banner gradient
 * switched to light-blue → dark-blue.
 */

import { type ColorsTheme, Theme } from './theme.js';
import { lightSemanticColors } from './semantic-tokens.js';

const hanhaiLightColors: ColorsTheme = {
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

export const HanhaiLight: Theme = new Theme(
  'Hanhai Light',
  'light',
  {
    hljs: {
      display: 'block',
      overflowX: 'auto',
      padding: '0.5em',
      background: hanhaiLightColors.Background,
      color: hanhaiLightColors.Foreground,
    },
    'hljs-comment': {
      color: hanhaiLightColors.Comment,
      fontStyle: 'italic',
    },
    'hljs-quote': {
      color: hanhaiLightColors.AccentCyan,
      fontStyle: 'italic',
    },
    'hljs-string': {
      color: hanhaiLightColors.AccentGreen,
    },
    'hljs-constant': {
      color: hanhaiLightColors.AccentCyan,
    },
    'hljs-number': {
      color: hanhaiLightColors.AccentPurple,
    },
    'hljs-keyword': {
      color: hanhaiLightColors.AccentYellow,
    },
    'hljs-selector-tag': {
      color: hanhaiLightColors.AccentYellow,
    },
    'hljs-attribute': {
      color: hanhaiLightColors.AccentYellow,
    },
    'hljs-variable': {
      color: hanhaiLightColors.Foreground,
    },
    'hljs-variable.language': {
      color: hanhaiLightColors.LightBlue,
      fontStyle: 'italic',
    },
    'hljs-title': {
      color: hanhaiLightColors.AccentBlue,
    },
    'hljs-section': {
      color: hanhaiLightColors.AccentGreen,
      fontWeight: 'bold',
    },
    'hljs-type': {
      color: hanhaiLightColors.LightBlue,
    },
    'hljs-class .hljs-title': {
      color: hanhaiLightColors.AccentBlue,
    },
    'hljs-tag': {
      color: hanhaiLightColors.LightBlue,
    },
    'hljs-name': {
      color: hanhaiLightColors.AccentBlue,
    },
    'hljs-builtin-name': {
      color: hanhaiLightColors.AccentYellow,
    },
    'hljs-meta': {
      color: hanhaiLightColors.AccentYellow,
    },
    'hljs-symbol': {
      color: hanhaiLightColors.AccentRed,
    },
    'hljs-bullet': {
      color: hanhaiLightColors.AccentYellow,
    },
    'hljs-regexp': {
      color: hanhaiLightColors.AccentCyan,
    },
    'hljs-link': {
      color: hanhaiLightColors.LightBlue,
    },
    'hljs-deletion': {
      color: hanhaiLightColors.AccentRed,
    },
    'hljs-addition': {
      color: hanhaiLightColors.AccentGreen,
    },
    'hljs-emphasis': {
      fontStyle: 'italic',
    },
    'hljs-strong': {
      fontWeight: 'bold',
    },
    'hljs-literal': {
      color: hanhaiLightColors.AccentCyan,
    },
    'hljs-built_in': {
      color: hanhaiLightColors.AccentRed,
    },
    'hljs-doctag': {
      color: hanhaiLightColors.AccentRed,
    },
    'hljs-template-variable': {
      color: hanhaiLightColors.AccentCyan,
    },
    'hljs-selector-id': {
      color: hanhaiLightColors.AccentRed,
    },
  },
  hanhaiLightColors,
  lightSemanticColors,
);
