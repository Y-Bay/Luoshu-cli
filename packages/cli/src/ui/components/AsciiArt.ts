/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 *
 * Modifications copyright 2026 Hanhai Team.
 * Modified: banner replaced with a HANHAI wordmark in the ANSI Shadow
 * figlet font (block glyphs + box-drawing drop shadow). RadialBanner.tsx
 * applies its per-character radial gradient across the title.
 */

export const shortAsciiLogo = `
██╗  ██╗ █████╗ ███╗   ██╗██╗  ██╗ █████╗ ██╗
██║  ██║██╔══██╗████╗  ██║██║  ██║██╔══██╗██║
███████║███████║██╔██╗ ██║███████║███████║██║
██╔══██║██╔══██║██║╚██╗██║██╔══██║██╔══██║██║
██║  ██║██║  ██║██║ ╚████║██║  ██║██║  ██║██║
╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝
`;

/**
 * Compact HANHAI wordmark (figlet "Small") used on the /quit summary screen,
 * where the full ANSI Shadow banner would be too tall. Backslashes/backticks
 * are escaped for the template literal.
 */
export const miniAsciiLogo = `
  _  _   _   _  _ _  _   _   ___ 
 | || | /_\\ | \\| | || | /_\\ |_ _|
 | __ |/ _ \\| .\` | __ |/ _ \\ | | 
 |_||_/_/ \\_\\_|\\_|_||_/_/ \\_\\___|
`;
