import { config } from '../../core/config.mjs';
import { requestWithModelFallback } from './openRouterAdapter.mjs';


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
  /** Creates an OpenRouter client with an ordered fallback route. */
  constructor() {
    this.apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
    this.apiKey = config.openRouterApiKey;
    this.models = config.openRouterModels;
  }

  /**
   * Defines the single entry point for OpenRouter model routing.
   * @param {ChatOptions} opts
   * @param {((message: string) => Promise<void>)|null} [onStatusUpdate]
   * @returns {Promise<object>}
   */
  async chatWithModelFallback(opts, onStatusUpdate = null) {
    return requestWithModelFallback({
      apiUrl: this.apiUrl,
      apiKey: this.apiKey,
      models: this.models,
      options: opts,
      onStatusUpdate,
    });
  }

  /**
   * Evaluates a learner's calibration answer against a compact CEFR rubric.
   * @param {string} answer
   * @param {((message: string) => Promise<void>)|null} [onStatusUpdate]
   * @returns {Promise<{verdict: {english_score: number, level: string, message: string}}>} 
   */
  async evaluateCalibrationAnswer(answer, onStatusUpdate = null) {
    

    const response = await this.chatWithModelFallback({
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
    }, onStatusUpdate);

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

