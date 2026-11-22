const ROTATE_STATUSES = new Set([408, 409, 425, 429]);

const sleep = (milliseconds) => new Promise((resolve) => {
  setTimeout(resolve, milliseconds);
});

/** Sends an OpenRouter request and follows the configured model route on retryable failures. */
export async function requestWithModelFallback({
  apiUrl,
  apiKey,
  models,
  options,
  onStatusUpdate = null,
  fetchImpl = fetch,
  sleepImpl = sleep,
}) {
  let lastErr = null;

  for (let i = 0; i < models.length; i += 1) {
    const model = models[i];
    let response;

    try {
      response = await fetchImpl(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ model, ...options }),
      });
    } catch (error) {
      lastErr = error instanceof Error ? error : new Error(String(error));
      await onStatusUpdate(`❌ Ошибка сети на ${model}, пробую другую...`);
      continue;
    }

    const text = await response.text();
    console.log(`OpenRouter response for model ${model}:`, text);

    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      lastErr = new Error(`OpenRouter: невалидный JSON (${model})`);
      if (shouldTryNextModel(response.status, {})) continue;
      throw lastErr;
    }

    if (!response.ok) {
      lastErr = new Error(data?.error?.message || `HTTP ${response.status}`);
      if (shouldTryNextModel(response.status, data)) {
        console.warn(`[OpenRouter] ${model} → ${response.status}, следующая модель…`);
        await onStatusUpdate(`⚠️ [OpenRouter] ${model} → ${response.status}, следующая модель...`);
        await sleepImpl(response.status === 429 ? 350 + i * 150 : 120);
        continue;
      }
      throw lastErr;
    }

    if (data?.choices?.[0]?.message?.content != null) {
      console.log(`[OpenRouter] ${model} response content:`, data.choices[0].message.content);
      return data;
    }

    if (data.error && shouldTryNextModel(200, data)) {
      console.warn(`[OpenRouter] ${model} error in body, следующая модель…`, data.error);
      lastErr = new Error(data.error.message || 'OpenRouter error');
      await sleepImpl(200);
      continue;
    }

    return data;
  }

  throw lastErr ?? new Error('OpenRouter: маршрут моделей пуст');
}

function shouldTryNextModel(status, data) {
  return ROTATE_STATUSES.has(status)
    || status >= 500
    || Boolean(data?.error?.metadata?.provider_name)
    || data?.error?.code === 429;
}
