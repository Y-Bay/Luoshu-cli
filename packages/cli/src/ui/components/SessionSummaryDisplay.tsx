/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from 'react';
import { Box, Text } from 'ink';
import Gradient from 'ink-gradient';
import { StatsDisplay } from './StatsDisplay.js';
import { miniAsciiLogo } from './AsciiArt.js';
import { useSessionStats } from '../contexts/SessionContext.js';
import { useConfig } from '../contexts/ConfigContext.js';
import { theme } from '../semantic-colors.js';
import { getRenderableGradientColors } from '../utils/gradientUtils.js';
import { t } from '../../i18n/index.js';

interface SessionSummaryDisplayProps {
  duration: string;
  width: number;
}

export const SessionSummaryDisplay: React.FC<SessionSummaryDisplayProps> = ({
  duration,
  width,
}) => {
  const config = useConfig();
  const { stats } = useSessionStats();

  // Only show the resume message if there were messages in the session AND
  // chat recording is enabled (otherwise there is nothing to resume).
  const hasMessages = stats.promptCount > 0;
  const canResume = !!config.getChatRecordingService();

  const gradientColors = getRenderableGradientColors(theme.ui.gradient);
  const banner = gradientColors ? (
    <Gradient colors={gradientColors}>
      <Text>{miniAsciiLogo}</Text>
    </Gradient>
  ) : (
    <Text color={theme.text.accent}>{miniAsciiLogo}</Text>
  );

  return (
    <Box flexDirection="column">
      {/* Compact farewell banner + brand motto, sitting above the stats card. */}
      <Box flexDirection="column" marginBottom={1}>
        {banner}
        <Text color={theme.text.secondary}> 知识如瀚海，闻而行之</Text>
      </Box>

      <StatsDisplay
        title={t('Agent powering down. Goodbye!')}
        duration={duration}
        width={width}
      />

      {hasMessages && canResume && (
        <Box marginTop={1} flexDirection="column">
          <Text color={theme.text.secondary}>
            {t('To continue this session, run')}
          </Text>
          <Text color={theme.text.accent}>
            {'  '}hanhai --resume {stats.sessionId}
          </Text>
        </Box>
      )}
    </Box>
  );
};
