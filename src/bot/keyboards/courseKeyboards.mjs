import { InlineKeyboard } from 'grammy';

import {
  completeLessonCallback,
  COURSE_CALLBACKS,
  selectLessonCallback,
} from '../callbacks/courseCallbacks.mjs';
import { getAvailableLessons } from '../../domain/course/courseProgress.mjs';
import { getTrackCourse } from '../../domain/course/courseCatalog.mjs';

/** Builds the post-calibration actions. */
export function calibrationResultKeyboard() {
  return new InlineKeyboard()
    .text('▶️ Начать урок', COURSE_CALLBACKS.START_LESSON)
    .row()
    .text('☰ Выйти в меню', COURSE_CALLBACKS.SHOW_PROFILE);
}

/** Builds a course profile keyboard with completed and currently unlocked lessons. */
export function courseProfileKeyboard(session) {
  const keyboard = new InlineKeyboard();
  for (const lesson of getAvailableLessons(session)) {
    const number = lesson.id.split('-').at(-1);
    keyboard
      .text(`${lesson.completed ? '✅' : '▶️'} Урок ${number}: ${lesson.title}`, selectLessonCallback(lesson.id))
      .row();
  }

  const course = getTrackCourse(session.selectedTrack);
  const nextModule = course?.modules[(session.currentModuleIndex ?? 0) + 1];
  if (nextModule) {
    keyboard.text(`🔒 Модуль ${(session.currentModuleIndex ?? 0) + 2} (Скоро)`, COURSE_CALLBACKS.LOCKED_MODULE).row();
  }

  return keyboard
    .text('🔄 Сменить направление', COURSE_CALLBACKS.CHANGE_TRACK)
    .row()
    .text('⭐️ Убрать лимит жизней', COURSE_CALLBACKS.PREMIUM);
}

/** Builds navigation and completion actions for a selected lesson. */
export function lessonKeyboard(lesson, completed) {
  const keyboard = new InlineKeyboard();
  if (!completed) {
    keyboard.text('✅ Завершить урок', completeLessonCallback(lesson.id)).row();
  }
  return keyboard.text('↩️ К курсу', COURSE_CALLBACKS.RETURN_TO_PROFILE);
}
