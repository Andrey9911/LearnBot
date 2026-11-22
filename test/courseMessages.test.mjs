import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildCalibrationResult,
  renderCourseProfile,
  renderModuleProgressBar,
  renderScoreProgressBar,
} from '../src/bot/views/courseMessages.mjs';

test('score bar rounds down to ten-point segments and clamps to the score range', () => {
  assert.equal(renderScoreProgressBar(15), '■□□□□□□□□□');
  assert.equal(renderScoreProgressBar(100), '■■■■■■■■■■');
  assert.equal(renderScoreProgressBar(-4), '□□□□□□□□□□');
  assert.equal(renderScoreProgressBar(130), '■■■■■■■■■■');
});

test('module bar shows a horizontal ten-cell completion ratio', () => {
  assert.equal(renderModuleProgressBar(2, 5), '■■■■□□□□□□');
  assert.equal(renderModuleProgressBar(0, 5), '□□□□□□□□□□');
});

test('calibration result escapes model content and puts verdict in a blockquote', () => {
  const result = buildCalibrationResult({
    english_score: 15,
    level: 'A1',
    message: "Use <b>I</b> & say 'I am checking'.",
  });

  assert.equal(
    result,
    'Уровень английского: [■□□□□□□□□□] A1\nEnglish Score: 15/100\n\nВердикт:\n<blockquote>Use &lt;b&gt;I&lt;/b&gt; &amp; say &#39;I am checking&#39;.</blockquote>',
  );
});

test('course profile shows level and score, then lives, then module progress without track title', () => {
  const message = renderCourseProfile({
    selectedTrack: 'blockchain',
    englishScore: 15,
    englishLevel: 'A1',
    lives: 3,
    maxLives: 3,
    completedLessonIds: ['blockchain-1-1', 'blockchain-1-2'],
    currentModuleIndex: 0,
    currentLessonIndex: 2,
  });

  assert.equal(
    message,
    'Уровень английского: A1 · English Score: 15/100\nЖизни: ❤️❤️❤️ 3/3\n\nПрогресс модуля 1\n[■■■■□□□□□□] 2/5 уроков',
  );
  assert.equal(message.includes('Блокчейн'), false);
});
