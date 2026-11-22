import assert from 'node:assert/strict';
import test from 'node:test';

import { handleCalibrationAnswer } from '../src/bot/handlers/calibrationComposer.mjs';
import { aiService } from '../src/services/llm/aiService.mjs';
import { ONBOARDING_STATES } from '../src/bot/states/onboardingStates.mjs';

test('handleCalibrationAnswer saves the verdict and advances the onboarding state', async () => {
  const originalEvaluate = aiService.evaluateCalibrationAnswer;
  const replies = [];
  aiService.evaluateCalibrationAnswer = async () => ({
    verdict: {
      english_score: 57,
      level: 'B1',
      message: 'You can handle familiar work scenarios.',
    },
  });

  const ctx = {
    message: { text: 'I am checking the terms before I confirm the deal.' },
    session: { onboardingState: ONBOARDING_STATES.DIAGNOSTIC_BASIC_SELECTED },
    reply: async (message, options) => replies.push({ message, options }),
  };

  try {
    await handleCalibrationAnswer(ctx);

    assert.equal(replies.length, 2);
    assert.match(replies[1].message, /Уровень английского: \[■■■■■□□□□□\] B1/);
    assert.match(replies[1].message, /English Score: 57\/100/);
    assert.match(replies[1].message, /<blockquote>You can handle familiar work scenarios\.<\/blockquote>/);
    assert.equal(replies[1].options.parse_mode, 'HTML');
    assert.ok(replies[1].options.reply_markup);
    assert.equal(ctx.session.englishScore, 57);
    assert.equal(ctx.session.englishLevel, 'B1');
    assert.equal(
      ctx.session.onboardingState,
      ONBOARDING_STATES.CALIBRATION_EVALUATED,
    );
  } finally {
    aiService.evaluateCalibrationAnswer = originalEvaluate;
  }
});

test('handleCalibrationAnswer displays adapter status updates in the loading message', async () => {
  const originalEvaluate = aiService.evaluateCalibrationAnswer;
  const edits = [];
  aiService.evaluateCalibrationAnswer = async (_answer, onStatusUpdate) => {
    await onStatusUpdate('⚠️ [OpenRouter] model<free> → 429, следующая модель...');
    return {
      verdict: { english_score: 57, level: 'B1', message: 'Good.' },
    };
  };

  const ctx = {
    message: { text: 'I am checking the terms.' },
    session: { onboardingState: ONBOARDING_STATES.DIAGNOSTIC_BASIC_SELECTED },
    reply: async () => ({ chat: { id: 42 }, message_id: 7 }),
    api: {
      editMessageText: async (...args) => edits.push(args),
    },
  };

  try {
    await handleCalibrationAnswer(ctx);

    assert.equal(edits.length, 1);
    assert.deepEqual(edits[0].slice(0, 2), [42, 7]);
    assert.match(edits[0][2], /model&lt;free&gt;/);
    assert.equal(edits[0][3].parse_mode, 'HTML');
  } finally {
    aiService.evaluateCalibrationAnswer = originalEvaluate;
  }
});
