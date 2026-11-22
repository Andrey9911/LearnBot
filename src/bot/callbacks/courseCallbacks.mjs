/** Stable callback identifiers for course navigation. */
export const COURSE_CALLBACKS = Object.freeze({
  SHOW_PROFILE: 'course_profile',
  START_LESSON: 'course_start',
  RETURN_TO_PROFILE: 'course_return_profile',
  CHANGE_TRACK: 'course_change_track',
  LOCKED_MODULE: 'course_locked_module',
  PREMIUM: 'course_premium',
  SELECT_LESSON_PREFIX: 'course_lesson:',
  COMPLETE_LESSON_PREFIX: 'course_complete:',
});

/** Builds callback data for one catalog lesson. */
export function selectLessonCallback(lessonId) {
  return `${COURSE_CALLBACKS.SELECT_LESSON_PREFIX}${lessonId}`;
}

/** Builds callback data tied to the lesson being completed. */
export function completeLessonCallback(lessonId) {
  return `${COURSE_CALLBACKS.COMPLETE_LESSON_PREFIX}${lessonId}`;
}
