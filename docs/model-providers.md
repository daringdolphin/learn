# Model Providers

This application now supports multiple LLM providers for chemistry answer analysis. You can choose between OpenAI's GPT-4o and Anthropic's Claude models.

## Supported Providers

### OpenAI (Default)
- Model: GPT-4o
- Strengths: Fast response times, excellent image analysis
- API Key Required: `OPENAI_API_KEY`

### Anthropic Claude
- Model: Claude 3.5 Sonnet
- Strengths: High-quality reasoning, detailed analysis
- API Key Required: `ANTHROPIC_API_KEY`

## Configuration

### Environment Variables

Add these environment variables to your `.env.local` file:

```bash
# OpenAI
OPENAI_API_KEY=your-openai-api-key-here

# Anthropic
ANTHROPIC_API_KEY=your-anthropic-api-key-here

# Optional: Set default model provider (defaults to 'openai')
DEFAULT_MODEL_PROVIDER=openai
```

### Switching Default Provider

You can change the default provider by setting the `DEFAULT_MODEL_PROVIDER` environment variable:

```bash
# Use OpenAI by default
DEFAULT_MODEL_PROVIDER=openai

# Use Anthropic by default
DEFAULT_MODEL_PROVIDER=anthropic
```

## Usage

### Server Actions

The `analyzeAnswerAction` now accepts an optional `modelProvider` parameter:

```typescript
import { analyzeAnswerAction } from '@/lib/actions/analyze-answer'

// Use default provider (from environment)
const result = await analyzeAnswerAction(formData)

// Use specific provider
const result = await analyzeAnswerAction(formData, 'anthropic')
const result = await analyzeAnswerAction(formData, 'openai')
```

### API Routes

You can specify the model provider via query parameters or headers:

#### Query Parameter
```bash
POST /api/analyze-answer?modelProvider=anthropic
```

#### Header
```bash
POST /api/analyze-answer
X-Model-Provider: anthropic
```

### Direct API Usage

Using the unified analyzer directly:

```typescript
import { analyzeChemistryAnswer } from '@/lib/api/llm-analyzer'

const result = await analyzeChemistryAnswer({
  studentImageDataUrl: 'data:image/jpeg;base64,...',
  modelAnswerJson: [...],
  referenceImageUrls: [...],
  modelProvider: 'anthropic' // or 'openai'
})
```

## Error Handling

The system now handles provider-specific errors:

- **Rate Limiting**: Returns 429 status code with user-friendly message
- **Image Size Limits**: Returns 413 status code for oversized images
- **Timeout Errors**: Returns 504 status code for analysis timeouts
- **Authentication**: Returns 401 status code for invalid API keys

## Performance Considerations

### OpenAI
- Faster response times
- Better suited for high-volume applications
- Lower cost per request

### Anthropic Claude
- More detailed analysis
- Better reasoning capabilities
- Higher cost per request
- Slightly slower response times

## Troubleshooting

### Common Issues

1. **Missing API Key**: Ensure the appropriate API key is set in your environment
2. **Invalid Provider**: Check that the provider is either 'openai' or 'anthropic'
3. **Rate Limits**: Both providers have rate limits; implement appropriate retry logic
4. **Image Format**: Ensure images are in supported formats (JPEG, PNG, GIF, WebP)

### Debugging

Enable detailed logging by checking the server console for provider-specific error messages. Each error is tagged with the provider name for easier debugging.
