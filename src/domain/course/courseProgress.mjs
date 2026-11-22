import { findTrackLesson, getTrackCourse } from './courseCatalog.mjs';

/** Resets user progress to the first lesson of the selected track. */
export function resetCourseProgress(session) {
  session.currentModuleIndex = 0;
  session.currentLessonIndex = 0;
  session.completedLessonIds = [];

  const course = getTrackCourse(session.selectedTrack);
  const module = course?.modules[0];
  session.courseTitle = course?.title ?? null;
  session.moduleTitle = module?.title ?? null;
  session.currentLesson = module?.lessons.length ? 1 : null;
  session.totalLessons = module?.lessons.length ?? null;
}

/** Returns the one lesson currently unlocked for the learner. */
export function getCurrentLesson(session) {
  const course = getTrackCourse(session.selectedTrack);
  const module = course?.modules[session.currentModuleIndex ?? 0];
  return module?.lessons[session.currentLessonIndex ?? 0] ?? null;
}

/** Lists completed lessons and the current lesson, omitting all future lessons. */
export function getAvailableLessons(session) {
  const course = getTrackCourse(session.selectedTrack);
  if (!course) return [];

  const completed = new Set(session.completedLessonIds ?? []);
  const visible = [];
  for (const module of course.modules) {
    for (const lesson of module.lessons) {
      if (completed.has(lesson.id)) visible.push({ ...lesson, completed: true });
    }
  }

  const currentLesson = getCurrentLesson(session);
  if (currentLesson && !completed.has(currentLesson.id)) {
    visible.push({ ...currentLesson, completed: false });
  }
  return visible;
}

/** Completes only the current lesson and advances progress once. */
export function completeCurrentLesson(session, lessonId) {
  const lesson = getCurrentLesson(session);
  const descriptor = findTrackLesson(session.selectedTrack, lessonId);
  if (!lesson || lesson.id !== lessonId || !descriptor) {
    return { completed: false, nextLesson: lesson };
  }

  const completedIds = new Set(session.completedLessonIds ?? []);
  if (completedIds.has(lessonId)) {
    return { completed: false, nextLesson: lesson };
  }

  completedIds.add(lessonId);
  session.completedLessonIds = [...completedIds];
  session.currentLessonIndex += 1;

  const course = getTrackCourse(session.selectedTrack);
  const module = course.modules[session.currentModuleIndex];
  const nextLesson = module.lessons[session.currentLessonIndex] ?? null;
  session.currentLesson = nextLesson ? session.currentLessonIndex + 1 : null;
  session.totalLessons = module.lessons.length;

  return { completed: true, nextLesson };
}
