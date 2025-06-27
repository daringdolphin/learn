/**
 * Configuration for Anthropic Claude API integration
 */
export const ANTHROPIC_CONFIG = {
  // Analysis settings
  MAX_RETRIES: 1,
  ANALYSIS_TIMEOUT: 120000, // 120 seconds

  // Image processing settings
  MAX_REFERENCE_IMAGES: 8,
  REFERENCE_IMAGE_MAX_WIDTH: 1024,
  REFERENCE_IMAGE_QUALITY: 60,
  
  // Download settings
  DOWNLOAD_TIMEOUT: 15000, // 15 seconds
  
  // Model settings
  MODEL: 'claude-3-5-sonnet-20241022',
  MAX_TOKENS: 1500,
  TEMPERATURE: 0.1,
  
  // Retry backoff settings
  INITIAL_RETRY_DELAY: 1000, // 1 second
  MAX_RETRY_DELAY: 8000, // 8 seconds

  // API settings
  API_VERSION: '2023-06-01',
} as const

export type AnthropicConfig = typeof ANTHROPIC_CONFIG 