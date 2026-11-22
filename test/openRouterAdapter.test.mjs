import assert from 'node:assert/strict';
import test from 'node:test';

import { requestWithModelFallback } from '../src/services/llm/openRouterAdapter.mjs';

test('rotates after a 429 response and reports the failed model through the callback', async () => {
  const requests = [];
  const statuses = [];
  const fetchImpl = async (_url, options) => {
    requests.push(JSON.parse(options.body).model);
    if (requests.length === 1) {
      return new Response(JSON.stringify({ error: { message: 'rate limited' } }), {
        status: 429,
      });
    }
    return new Response(JSON.stringify({
      choices: [{ message: { content: 'ok' } }],
    }));
  };

  const result = await requestWithModelFallback({
    apiUrl: 'https://openrouter.test/chat',
    apiKey: 'secret',
    models: ['model-a', 'model-b'],
    options: { messages: [{ role: 'user', content: 'hello' }] },
    onStatusUpdate: async (message) => statuses.push(message),
    fetchImpl,
    sleepImpl: async () => {},
  });

  assert.equal(result.choices[0].message.content, 'ok');
  assert.deepEqual(requests, ['model-a', 'model-b']);
  assert.deepEqual(statuses, [
    '⚠️ [OpenRouter] model-a → 429, следующая модель...',
  ]);
});

test('rotates after a network error and throws the last error when every model fails', async () => {
  const statuses = [];

  await assert.rejects(
    requestWithModelFallback({
      apiUrl: 'https://openrouter.test/chat',
      apiKey: 'secret',
      models: ['model-a', 'model-b'],
      options: { messages: [{ role: 'user', content: 'hello' }] },
      onStatusUpdate: async (message) => statuses.push(message),
      fetchImpl: async () => {
        throw new TypeError('fetch failed');
      },
      sleepImpl: async () => {},
    }),
    /fetch failed/,
  );

  assert.deepEqual(statuses, [
    '❌ Ошибка сети на model-a, пробую другую...',
    '❌ Ошибка сети на model-b, пробую другую...',
  ]);
});
