/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * Modifications copyright 2026 Luoshu Team.
 * Modified: removed Alibaba ModelStudio re-exports.
 */

// Types
export type {
  BaseUrlOption,
  ModelSpec,
  ProviderId,
  ProviderConfig,
  ProviderInstallPlan,
  ProviderInstallState,
  ProviderModelConfig,
  ProviderModelProvidersPatch,
  ProviderSettingsAdapter,
  ProviderSetupInputs,
} from './types.js';

// Provider config utilities
export {
  buildInstallPlan,
  buildProviderTemplate,
  computeModelListVersion,
  getDefaultBaseUrlForProtocol,
  getDefaultModelIds,
  providerMatchesCredentials,
  PROVIDER_METADATA_NS,
  resolveBaseUrl,
  resolveMetadataKey,
  resolveOwnsModel,
  shouldShowStep,
} from './provider-config.js';

// Provider registry
export {
  ALL_PROVIDERS,
  CUSTOM_API_KEY_ENV_PREFIX,
  customProvider,
  deepseekProvider,
  findProviderByCredentials,
  findProviderById,
  generateCustomEnvKey,
  getAllProviderBaseUrls,
  idealabProvider,
  minimaxProvider,
  modelscopeProvider,
  openRouterProvider,
  THIRD_PARTY_PROVIDERS,
  zaiProvider,
} from './all-providers.js';

// Preset constants
export {
  OPENROUTER_BASE_URL,
  OPENROUTER_ENV_KEY,
} from './presets/openrouter.js';

// Install logic
export {
  applyProviderInstallPlan,
  ProviderInstallError,
  type ApplyProviderInstallPlanOptions,
  type ApplyProviderInstallPlanResult,
} from './install.js';
