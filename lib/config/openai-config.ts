/**
 * Configuration for OpenAI API integration
 */
export const OPENAI_CONFIG = {
  // Analysis settings
  MAX_RETRIES: 2,
  ANALYSIS_TIMEOUT: 120000, // 120 seconds

  // Image processing settings
  MAX_REFERENCE_IMAGES: 4,
  REFERENCE_IMAGE_MAX_WIDTH: 1024,
  REFERENCE_IMAGE_QUALITY: 60,
  
  // Download settings
  DOWNLOAD_TIMEOUT: 15000, // 15 seconds
  
  // Model settings
  MODEL: 'gpt-4o',
  MAX_TOKENS: 1500,
  TEMPERATURE: 0.1,
  
  // Retry backoff settings
  INITIAL_RETRY_DELAY: 1000, // 1 second
  MAX_RETRY_DELAY: 8000, // 8 seconds
} as const

export type OpenAIConfig = typeof OPENAI_CONFIG 