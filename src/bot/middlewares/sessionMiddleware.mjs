import { session } from 'grammy';

import { ONBOARDING_STATES } from '../states/onboardingStates.mjs';

/** Creates the initial in-memory FSM session for a Telegram user. */
export function createInitialSession() {
  return {
    onboardingState: ONBOARDING_STATES.IDLE,
    selectedTrack: null,
    diagnosticChoice: null,
    englishScore: null,
    englishLevel: null,
    courseTitle: null,
    moduleTitle: null,
    currentLesson: null,
    totalLessons: null,
    currentModuleIndex: 0,
    currentLessonIndex: 0,
    completedLessonIds: [],
    lives: 3,
    maxLives: 3,
    livesRefresh: null,
  };
}

export const sessionMiddleware = session({
  initial: createInitialSession,
});

