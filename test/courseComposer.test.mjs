import assert from 'node:assert/strict';
import test from 'node:test';

import {
  handleChangeTrack,
  handleCompleteCurrentLesson,
  handleLockedModule,
  handlePremiumPlaceholder,
  handleSelectLesson,
  handleShowCourseProfile,
} from '../src/bot/handlers/courseComposer.mjs';
import { ONBOARDING_STATES } from '../src/bot/states/onboardingStates.mjs';
import { createInitialSession } from '../src/bot/middlewares/sessionMiddleware.mjs';
import { resetCourseProgress } from '../src/domain/course/courseProgress.mjs';

function createContext() {
  const session = createInitialSession();
  session.selectedTrack = 'blockchain';
  session.englishLevel = 'A1';
  session.englishScore = 15;
  resetCourseProgress(session);
  const edits = [];
  const answers = [];
  return {
    session,
    edits,
    answers,
    answerCallbackQuery: async (options) => answers.push(options ?? null),
    editMessageText: async (text, options) => edits.push({ text, options }),
  };
}

test('profile callback edits the current message and exposes only the first lesson', async () => {
  const ctx = createContext();

  await handleShowCourseProfile(ctx);

  assert.equal(ctx.edits.length, 1);
  assert.match(ctx.edits[0].text, /Уровень английского: A1 · English Score: 15\/100/);
  assert.equal(ctx.edits[0].options.reply_markup.inline_keyboard.flat().length, 4);
  assert.match(ctx.edits[0].options.reply_markup.inline_keyboard[0][0].text, /^▶️ Урок 1:/);
  assert.equal(ctx.answers.length, 1);
});

test('selecting a locked lesson does not edit the message or alter progress', async () => {
  const ctx = createContext();

  await handleSelectLesson(ctx, 'blockchain-1-2');

  assert.deepEqual(ctx.session.completedLessonIds, []);
  assert.equal(ctx.session.currentLessonIndex, 0);
  assert.equal(ctx.edits.length, 0);
  assert.equal(ctx.answers[0].text, 'Этот урок пока закрыт');
});

test('completing the current lesson refreshes the profile and reveals lesson two', async () => {
  const ctx = createContext();

  await handleCompleteCurrentLesson(ctx, 'blockchain-1-1');
  await handleCompleteCurrentLesson(ctx, 'blockchain-1-1');

  assert.deepEqual(ctx.session.completedLessonIds, ['blockchain-1-1']);
  assert.equal(ctx.session.currentLessonIndex, 1);
  assert.equal(ctx.edits.length, 2);
  assert.match(ctx.edits[0].options.reply_markup.inline_keyboard[0][0].text, /^✅ Урок 1:/);
  assert.match(ctx.edits[0].options.reply_markup.inline_keyboard[1][0].text, /^▶️ Урок 2:/);
});

test('changing direction returns to the selector without losing progress before selection', async () => {
  const ctx = createContext();
  ctx.session.onboardingState = ONBOARDING_STATES.CALIBRATION_EVALUATED;
  ctx.session.completedLessonIds = ['blockchain-1-1'];

  await handleChangeTrack(ctx);

  assert.equal(ctx.session.onboardingState, ONBOARDING_STATES.CHOOSING_DIRECTION);
  assert.equal(ctx.session.selectedTrack, 'blockchain');
  assert.deepEqual(ctx.session.completedLessonIds, ['blockchain-1-1']);
  assert.match(ctx.edits[0].text, /Выберите направление/);
});

test('locked module and premium buttons explain that those options are coming later', async () => {
  const ctx = createContext();

  await handleLockedModule(ctx);
  await handlePremiumPlaceholder(ctx);

  assert.equal(ctx.answers[0].text, 'Модуль появится позже');
  assert.equal(ctx.answers[1].text, 'Покупка подписки скоро появится.');
});
