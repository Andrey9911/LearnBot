/** @typedef {{id: string, title: string}} LessonDescriptor */
/** @typedef {{id: string, title: string, lessons: LessonDescriptor[], locked?: boolean}} ModuleDescriptor */
/** @typedef {{title: string, modules: ModuleDescriptor[]}} TrackDescriptor */

/** @type {Readonly<Record<string, TrackDescriptor>>} */
export const COURSE_CATALOG = Object.freeze({
  blockchain: {
    title: 'Блокчейн и смарт-контракты',
    modules: [
      {
        id: 'blockchain-module-1',
        title: 'Основы блокчейна',
        lessons: [
          { id: 'blockchain-1-1', title: 'Знакомство с блокчейном' },
          { id: 'blockchain-1-2', title: 'Блоки и транзакции' },
          { id: 'blockchain-1-3', title: 'Кошельки и ключи' },
          { id: 'blockchain-1-4', title: 'Комиссии сети' },
          { id: 'blockchain-1-5', title: 'Проверка транзакции' },
        ],
      },
      { id: 'blockchain-module-2', title: 'Смарт-контракты', lessons: [], locked: true },
    ],
  },
  trading: {
    title: 'Крипта и трейдинг',
    modules: [
      {
        id: 'trading-module-1',
        title: 'Основы рынка',
        lessons: [
          { id: 'trading-1-1', title: 'Устройство рынка' },
          { id: 'trading-1-2', title: 'Типы ордеров' },
          { id: 'trading-1-3', title: 'Свечи и графики' },
          { id: 'trading-1-4', title: 'Управление риском' },
          { id: 'trading-1-5', title: 'Торговый сценарий' },
        ],
      },
      { id: 'trading-module-2', title: 'Продвинутые стратегии', lessons: [], locked: true },
    ],
  },
});

/** Returns the configured course for an active learning track. */
export function getTrackCourse(track) {
  return COURSE_CATALOG[track] ?? null;
}

/** Finds a lesson in an active track by its stable identifier. */
export function findTrackLesson(track, lessonId) {
  const course = getTrackCourse(track);
  if (!course) return null;

  for (const [moduleIndex, module] of course.modules.entries()) {
    const lessonIndex = module.lessons.findIndex((lesson) => lesson.id === lessonId);
    if (lessonIndex >= 0) {
      return { ...module.lessons[lessonIndex], moduleIndex, lessonIndex };
    }
  }

  return null;
}
