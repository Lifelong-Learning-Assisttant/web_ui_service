export const PROVIDERS = [
  { id: 'zai', name: 'Z.ai (GLM)' },
  { id: 'openai', name: 'OpenAI' },
  { id: 'openrouter', name: 'OpenRouter' },
  { id: 'mistral', name: 'Mistral AI' },
] as const;

export const MODELS_BY_PROVIDER = {
  zai: [
    { id: 'glm-4.6v', name: 'GLM-4.6V (Vision)' },
    { id: 'glm-4.7', name: 'GLM-4.7 (Reasoning)' },
    { id: 'glm-4', name: 'GLM-4 Standard' },
  ],
  openai: [
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
    { id: 'gpt-4o', name: 'GPT-4o' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
  ],
  openrouter: [
    { id: 'openrouter/auto', name: 'Auto (Best available)' },
    { id: 'anthropic/claude-3-5-sonnet', name: 'Claude 3.5 Sonnet' },
    { id: 'google/gemini-pro-1.5', name: 'Gemini Pro 1.5' },
  ],
  mistral: [
    { id: 'mistral-large-latest', name: 'Mistral Large' },
    { id: 'mistral-medium-latest', name: 'Mistral Medium' },
    { id: 'mistral-small-latest', name: 'Mistral Small' },
  ],
} as const;

export type ProviderId = keyof typeof MODELS_BY_PROVIDER;
