import assert from 'node:assert/strict';
import test from 'node:test';

import { renderProgressWidget } from '../src/bot/widgets/widgetProgressBarLearn/renderWidget.mjs';
import { createInitialSession } from '../src/bot/middlewares/sessionMiddleware.mjs';
import { handleStart, sendMainMenuWidget, startComposer } from '../src/bot/handlers/startComposer.mjs';
import { MAIN_MENU_TEXT, mainMenuKeyboard } from '../src/bot/keyboards/mainMenuKeyboard.mjs';

test('renders escaped session values and bounded score progress into the widget template', () => {
  const html = renderProgressWidget({
    ...createInitialSession(),
    englishScore: 57,
    englishLevel: 'B1',
    courseTitle: 'English <Core>',
    moduleTitle: 'Functions & logic',
    currentLesson: 4,
    totalLessons: 15,
    lives: 2,
    maxLives: 3,
    livesRefresh: '5 часов',
  });

  assert.match(html, /id="english-level">B1</);
  assert.match(html, /id="english-score">57<\/span> \/ 100/);
  assert.match(html, /id="english-progress"[^>]*style="width:57%"/);
  assert.match(html, /English &lt;Core&gt;/);
  assert.match(html, /Functions &amp; logic/);
  assert.match(html, /id="current-lesson">4 \/ 15</);
  assert.match(html, /id="lives" aria-label="Жизни">♥♥♡</);
  assert.match(html, /id="lives-refresh">Обновится через: 5 часов</);
});

test('renders blank dynamic fields when the session has no progress data', () => {
  const html = renderProgressWidget(createInitialSession());

  assert.match(html, /id="english-level"><\/span>/);
  assert.match(html, /id="english-score"><\/span>/);
  assert.match(html, /id="course-title"><\/span>/);
  assert.match(html, /id="module-title"><\/span>/);
  assert.match(html, /id="current-lesson"><\/span>/);
  assert.match(html, /id="lives" aria-label="Жизни">♥♥♥<\/span>/);
});

test('start and the main-menu keyboard button send the widget in private chats', async () => {
  const ctx = {
    chat: { id: 42, type: 'private' },
    message: { text: MAIN_MENU_TEXT },
    session: createInitialSession(),
    api: { raw: { sendWidget: async (payload) => payload } },
    reply: async (_text, options) => { ctx.replyOptions = options; },
  };
  const payloads = [];
  ctx.api.raw.sendWidget = async (payload) => {
    payloads.push(payload);
    return { message_id: payloads.length };
  };

  await handleStart(ctx);
  await sendMainMenuWidget(ctx);

  assert.equal(payloads.length, 2);
  assert.equal(payloads[0].chat_id, 42);
  assert.equal(payloads[0].html, payloads[1].html);
  assert.match(payloads[0].html, /<style>.*\.learn-widget/s);
  assert.equal('widget' in payloads[0], false);
  assert.equal(ctx.replyOptions.reply_markup, mainMenuKeyboard);
  assert.equal(ctx.session.onboardingState, 'onboarding.choosing_direction');
  assert.equal(typeof startComposer, 'object');
  assert.equal(MAIN_MENU_TEXT, 'Главное меню');
});

test('does not send Bot API 10.4 widgets to non-private chats', async () => {
  let sends = 0;
  const ctx = {
    chat: { id: -42, type: 'group' },
    message: { text: MAIN_MENU_TEXT },
    session: createInitialSession(),
    api: { raw: { sendWidget: async () => sends++ } },
  };

  await sendMainMenuWidget(ctx);

  assert.equal(sends, 0);
});
