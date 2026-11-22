import { Composer } from 'grammy';

import { COURSE_CALLBACKS } from '../callbacks/courseCallbacks.mjs';
import { directionKeyboard } from '../keyboards/onboardingKeyboards.mjs';
import {
  courseProfileKeyboard,
  lessonKeyboard,
} from '../keyboards/courseKeyboards.mjs';
import { ONBOARDING_STATES } from '../states/onboardingStates.mjs';
import { ONBOARDING_MESSAGES } from '../views/onboardingMessages.mjs';
import {
  completeCurrentLesson,
  getAvailableLessons,
  getCurrentLesson,
} from '../../domain/course/courseProgress.mjs';
import { getTrackCourse } from '../../domain/course/courseCatalog.mjs';
import { escapeHtml, renderCourseProfile } from '../views/courseMessages.mjs';

export const courseComposer = new Composer();

/** Edits the current Telegram message and ignores only the unchanged-message response. */
async function editCurrentMessage(ctx, text, options) {
  try {
    await ctx.editMessageText(text, options);
  } catch (error) {
    if (!String(error?.description ?? error?.message).includes('message is not modified')) {
      throw error;
    }
  }
}

/** Returns to direction selection when a course callback has no active track. */
async function requireActiveTrack(ctx) {
  if (getTrackCourse(ctx.session.selectedTrack)) return true;

  ctx.session.onboardingState = ONBOARDING_STATES.CHOOSING_DIRECTION;
  await ctx.answerCallbackQuery();
  await editCurrentMessage(ctx, ONBOARDING_MESSAGES.WELCOME, {
    parse_mode: 'HTML',
    reply_markup: directionKeyboard,
  });
  return false;
}

/** Shows the course profile in the current result or lesson message. */
export async function handleShowCourseProfile(ctx) {
  if (!(await requireActiveTrack(ctx))) return;
  await ctx.answerCallbackQuery();
  await editCurrentMessage(ctx, renderCourseProfile(ctx.session), {
    parse_mode: 'HTML',
    reply_markup: courseProfileKeyboard(ctx.session),
  });
}

/** Opens the current unlocked lesson from the post-calibration action. */
export async function handleStartCurrentLesson(ctx) {
  const lesson = getCurrentLesson(ctx.session);
  if (!lesson) return handleShowCourseProfile(ctx);
  return handleSelectLesson(ctx, lesson.id);
}

/** Opens a completed lesson or the current unlocked lesson. */
export async function handleSelectLesson(ctx, lessonId) {
  if (!(await requireActiveTrack(ctx))) return;
  const lesson = getAvailableLessons(ctx.session).find((item) => item.id === lessonId);
  if (!lesson) {
    await ctx.answerCallbackQuery({ text: 'Этот урок пока закрыт' });
    return;
  }

  await ctx.answerCallbackQuery();
  const title = `Урок ${lesson.id.split('-').at(-1)}: ${escapeHtml(lesson.title)}`;
  const message = `<b>${title}</b>\n\nМатериалы урока появятся здесь.`;
  await editCurrentMessage(ctx, message, {
    parse_mode: 'HTML',
    reply_markup: lessonKeyboard(lesson, lesson.completed),
  });
}

/** Completes the lesson named by the callback, preventing stale buttons from skipping ahead. */
export async function handleCompleteCurrentLesson(ctx, lessonId = getCurrentLesson(ctx.session)?.id) {
  if (!(await requireActiveTrack(ctx))) return;
  await ctx.answerCallbackQuery();
  completeCurrentLesson(ctx.session, lessonId);
  await editCurrentMessage(ctx, renderCourseProfile(ctx.session), {
    parse_mode: 'HTML',
    reply_markup: courseProfileKeyboard(ctx.session),
  });
}

/** Returns to the course profile from a lesson view. */
export async function handleReturnToCourseProfile(ctx) {
  return handleShowCourseProfile(ctx);
}

/** Opens the direction selector while preserving the old track until another is selected. */
export async function handleChangeTrack(ctx) {
  ctx.session.onboardingState = ONBOARDING_STATES.CHOOSING_DIRECTION;
  await ctx.answerCallbackQuery();
  await editCurrentMessage(ctx, ONBOARDING_MESSAGES.WELCOME, {
    parse_mode: 'HTML',
    reply_markup: directionKeyboard,
  });
}

/** Acknowledges that the next module is not available yet. */
export async function handleLockedModule(ctx) {
  await ctx.answerCallbackQuery({ text: 'Модуль появится позже' });
}

/** Acknowledges the future life-limit purchase entry point. */
export async function handlePremiumPlaceholder(ctx) {
  await ctx.answerCallbackQuery({ text: ONBOARDING_MESSAGES.PREMIUM_PLACEHOLDER });
}

courseComposer.callbackQuery(COURSE_CALLBACKS.SHOW_PROFILE, handleShowCourseProfile);
courseComposer.callbackQuery(COURSE_CALLBACKS.START_LESSON, handleStartCurrentLesson);
courseComposer.callbackQuery(COURSE_CALLBACKS.RETURN_TO_PROFILE, handleReturnToCourseProfile);
courseComposer.callbackQuery(COURSE_CALLBACKS.CHANGE_TRACK, handleChangeTrack);
courseComposer.callbackQuery(COURSE_CALLBACKS.LOCKED_MODULE, handleLockedModule);
courseComposer.callbackQuery(COURSE_CALLBACKS.PREMIUM, handlePremiumPlaceholder);
courseComposer.callbackQuery(/^course_lesson:(.+)$/, (ctx) =>
  handleSelectLesson(ctx, ctx.match[1]),
);
courseComposer.callbackQuery(/^course_complete:(.+)$/, (ctx) =>
  handleCompleteCurrentLesson(ctx, ctx.match[1]),
);
