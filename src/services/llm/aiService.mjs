import { config } from '../../core/config.mjs';
import { updateStatus } from '../../core/baseFunc.mjs';


const CONTENT_QUALITY_SYSTEM_PROMPT = `You create adaptive practical English content for adult learners.
Use natural, current language and realistic work or market scenarios. Avoid schoolbook cliches.
Follow the task-specific criteria and return only the requested format.`;

/**
 * @typedef {object} ChatMessage
 * @property {'system'|'user'|'assistant'} role
 * @property {string} content
 */

/**
 * @typedef {object} ChatOptions
 * @property {ChatMessage[]} messages
 * @property {number} [max_tokens]
 * @property {number} [temperature]
 * @property {{type: 'json_object'}} [response_format]
 */

export class AIService {
  /** Creates the future OpenRouter adapter with an ordered fallback route. */
  constructor() {
    this.apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
    this.apiKey = config.openRouterApiKey;
    this.models = config.openRouterModels;
  }

  /**
   * Defines the single entry point for future OpenRouter model routing.
   * @param {ChatOptions} _options
   * @param {((message: string) => Promise<void>)|null} [_onStatusUpdate]
   * @returns {Promise<never>}
   */
  async chatWithModelFallback(ctx, opts, _onStatusUpdate = null) {
    const { messages, max_tokens, temperature } = opts;
    let lastErr = null;

    for (let i = 0; i < this.models.length; i++) {
      const model = this.models[i];
      try {
        const response = await fetch(this.apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages,
            max_tokens,
            temperature,
            ...(opts.response_format ? { response_format: opts.response_format } : {})
          }),
        });

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
          if (ROTATE_STATUSES.has(response.status)) {
            // Если получили 429 или 5xx, уведомляем интерфейс через колбэк
            if (updateStatus) {
              await updateStatus(ctx, `⚠️ [OpenRouter] ${model} → ${response.status}, следующая модель...`);
            }
            continue;
          }
          lastErr = new Error(
            data?.error?.message || `HTTP ${response.status}`,
          );
          if (shouldTryNextModel(response.status, data)) {
            console.warn(
              `[OpenRouter] ${model} → ${response.status}, следующая модель…`,
            );
            if (response.status === 429) await sleep(350 + i * 150);
            else await sleep(120);
            continue;
          }
          throw lastErr;
        }

        if (data?.choices?.[0]?.message?.content != null) {
          console.log(`[OpenRouter] ${model} response content:`, data.choices[0].message.content);
          return data;
        }

        if (data.error && shouldTryNextModel(200, data)) {
          console.warn(
            `[OpenRouter] ${model} error in body, следующая модель…`,
            data.error,
          );
          lastErr = new Error(data.error.message || 'OpenRouter error');
          await sleep(200);
          continue;
        }

        return data;
      } catch (err) {
        if (updateStatus) {
          await updateStatus(ctx, `❌ Ошибка сети на ${model}, пробую другую...`);
        }
      }
    }
    // throw new Error('OpenRouter adapter is a scaffold and is not implemented yet.');
  }

  /**
   * Evaluates a learner's calibration answer against a compact CEFR rubric.
   * @param {string} answer
   * @returns {Promise<{verdict: {english_score: number, level: string, message: string}}>} 
   */
  async evaluateCalibrationAnswer(ctx, answer) {
    

    const response = await this.chatWithModelFallback(ctx, {
      messages: [
        { role: 'system', content: CONTENT_QUALITY_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Evaluate this English answer. Score 0-100, assign CEFR A1-C2, and give one short constructive message. Return JSON only: {"verdict":{"english_score":int,"level":"A1","message":"..."}}.\n\nAnswer: ${answer.trim()}`,
        },
      ],
      max_tokens: 1000,
      temperature: 0,
      response_format: { type: 'json_object' },
    });

    console.log('AIService.evaluateCalibrationAnswer response:', response);
    return parseCalibrationVerdict(response);
  }

  /**
   * Generates lesson text tailored to a learner score and a structured lesson template.
   * @param {{englishScore: number, track: string, lessonTemplate: object}} options
   * @returns {Promise<string>}
   */
  async generateLesson({ englishScore, track, lessonTemplate }) {
    if (!Number.isInteger(englishScore) || englishScore < 0 || englishScore > 100) {
      throw new Error('English score must be an integer between 0 and 100.');
    }
    if (!track?.trim()) {
      throw new Error('Lesson track must not be empty.');
    }
    if (!lessonTemplate || typeof lessonTemplate !== 'object') {
      throw new Error('Lesson template must be an object.');
    }

    const response = await this.chatWithModelFallback({
      messages: [
        { role: 'system', content: CONTENT_QUALITY_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Create one practical English lesson. Adapt vocabulary, grammar and task complexity to the learner.\nEnglish score: ${englishScore}\nTrack: ${track.trim()}\nLesson template: ${JSON.stringify(lessonTemplate)}\nReturn only the lesson text requested by the template.`,
        },
      ],
      max_tokens: 700,
      temperature: 0.7,
    });

    const content = response?.choices?.[0]?.message?.content?.trim();
    if (!content) {
      throw new Error('Model returned an empty lesson.');
    }

    return content;
  }
}

/**
 * Parses and validates the model response expected by the calibration flow.
 * @param {{choices?: Array<{message?: {content?: string}}>} } response
 * @returns {{verdict: {english_score: number, level: string, message: string}}}
 */
function parseCalibrationVerdict(response) {
  const content = response?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('Model returned an empty calibration verdict.');
  }

  let result;
  try {
    result = JSON.parse(content);
  } catch {
    throw new Error('Model returned an invalid calibration verdict.');
  }

  const { english_score: englishScore, level, message } = result?.verdict ?? {};
  if (
    !Number.isInteger(englishScore) ||
    englishScore < 0 ||
    englishScore > 100 ||
    !/^[ABC][1-2]$/.test(level) ||
    typeof message !== 'string' ||
    !message.trim()
  ) {
    throw new Error('Model returned a malformed calibration verdict.');
  }

  return {
    verdict: {
      english_score: englishScore,
      level,
      message: message.trim(),
    },
  };
}

export const aiService = new AIService();

