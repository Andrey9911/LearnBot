import assert from 'node:assert/strict';
import test from 'node:test';

import { aiService } from '../src/services/llm/aiService.mjs';

test('evaluateCalibrationAnswer returns the structured verdict from the model', async () => {
  const originalChat = aiService.chatWithModelFallback;
  let request;
  aiService.chatWithModelFallback = async (options) => {
    request = options;
    return {
      choices: [
        {
          message: {
            content: JSON.stringify({
              verdict: {
                english_score: 10,
                level: 'A1',
                message: 'The standard falls short of the target level.',
              },
            }),
          },
        },
      ],
    };
  };

  try {
    const result = await aiService.evaluateCalibrationAnswer('I check deal terms.');

    assert.deepEqual(result, {
      verdict: {
        english_score: 10,
        level: 'A1',
        message: 'The standard falls short of the target level.',
      },
    });
    assert.equal(request.response_format.type, 'json_object');
    assert.match(request.messages.at(-1).content, /I check deal terms\./);
  } finally {
    aiService.chatWithModelFallback = originalChat;
  }
});

test('generateLesson adapts the lesson request to the learner score', async () => {
  const originalChat = aiService.chatWithModelFallback;
  let request;
  aiService.chatWithModelFallback = async (options) => {
    request = options;
    return { choices: [{ message: { content: 'Write a concise trade update.' } }] };
  };

  try {
    const lesson = await aiService.generateLesson({
      englishScore: 72,
      track: 'trading',
      lessonTemplate: { target_grammar: 'First Conditional', score_reward: 20 },
    });

    assert.equal(lesson, 'Write a concise trade update.');
    assert.match(request.messages.at(-1).content, /English score: 72/);
    assert.match(request.messages.at(-1).content, /First Conditional/);
  } finally {
    aiService.chatWithModelFallback = originalChat;
  }
});
