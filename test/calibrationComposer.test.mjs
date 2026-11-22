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
