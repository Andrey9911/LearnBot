import 'dotenv/config';

const DEFAULT_OPENROUTER_MODELS = [
  'openrouter/free',
  'inclusionai/ling-3.0-flash-fin:free',
  'google/gemma-4-26b-a4b-it:free',
  'google/gemma-4-31b-it:free',
  'meta-llama/llama-3.2-3b-instruct:free',
  'qwen/qwen3-next-80b-a3b-instruct:free',
  'cohere/north-mini-code:free',
];

/** Parses a comma-separated model route while preserving its priority order. */
function parseModelRoute(value) {
  const models = value
    .map((model) => model.trim())
    .filter(Boolean);

  return models?.length ? models : [...DEFAULT_OPENROUTER_MODELS];
}

/** Reads a required secret and fails before the bot starts when it is missing. */
function requireSecret(name, value) {
  if (!value?.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value.trim();
}

export const config = Object.freeze({
  botToken: requireSecret('BOT_TOKEN', process.env.BOT_TOKEN), // [SECURE_VARIABLE]
  openRouterApiKey: process.env.OPENROUTER_API_KEY ?? '', // [SECURE_VARIABLE]
  openRouterModels: Object.freeze(
    parseModelRoute(DEFAULT_OPENROUTER_MODELS), // [SECURE_VARIABLE]
  ),
  supabaseUrl: process.env.SUPABASE_URL?.trim() ?? '', // [SECURE_VARIABLE]
  supabaseServiceRoleKey:
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? '', // [SECURE_VARIABLE]
});

