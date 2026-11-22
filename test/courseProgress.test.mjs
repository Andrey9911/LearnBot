import assert from 'node:assert/strict';
import test from 'node:test';

import {
  completeCurrentLesson,
  getAvailableLessons,
  getCurrentLesson,
  resetCourseProgress,
} from '../src/domain/course/courseProgress.mjs';
import { createInitialSession } from '../src/bot/middlewares/sessionMiddleware.mjs';

test('fresh track unlocks only the first lesson', () => {
  const session = createInitialSession();
  session.selectedTrack = 'blockchain';
  resetCourseProgress(session);

  assert.equal(getCurrentLesson(session).id, 'blockchain-1-1');
  assert.deepEqual(getAvailableLessons(session).map((lesson) => lesson.id), [
    'blockchain-1-1',
  ]);
});

test('completing the current lesson reveals exactly the next lesson', () => {
  const session = createInitialSession();
  session.selectedTrack = 'blockchain';
  resetCourseProgress(session);

  const result = completeCurrentLesson(session, 'blockchain-1-1');

  assert.equal(result.completed, true);
  assert.equal(getCurrentLesson(session).id, 'blockchain-1-2');
  assert.deepEqual(getAvailableLessons(session).map((lesson) => lesson.id), [
    'blockchain-1-1',
    'blockchain-1-2',
  ]);
});

test('repeated or out-of-order completion cannot skip the current lesson', () => {
  const session = createInitialSession();
  session.selectedTrack = 'blockchain';
  resetCourseProgress(session);

  assert.equal(completeCurrentLesson(session, 'blockchain-1-2').completed, false);
  assert.equal(completeCurrentLesson(session, 'blockchain-1-1').completed, true);
  assert.equal(completeCurrentLesson(session, 'blockchain-1-1').completed, false);
  assert.equal(getCurrentLesson(session).id, 'blockchain-1-2');
  assert.deepEqual(session.completedLessonIds, ['blockchain-1-1']);
});

test('changing tracks resets lesson progress and completion history', () => {
  const session = createInitialSession();
  session.selectedTrack = 'blockchain';
  resetCourseProgress(session);
  completeCurrentLesson(session, 'blockchain-1-1');

  session.selectedTrack = 'trading';
  resetCourseProgress(session);

  assert.equal(getCurrentLesson(session).id, 'trading-1-1');
  assert.deepEqual(session.completedLessonIds, []);
});

test('finishing the final configured lesson does not create another current lesson', () => {
  const session = createInitialSession();
  session.selectedTrack = 'blockchain';
  resetCourseProgress(session);

  for (const lessonId of [
    'blockchain-1-1',
    'blockchain-1-2',
    'blockchain-1-3',
    'blockchain-1-4',
    'blockchain-1-5',
  ]) {
    assert.equal(completeCurrentLesson(session, lessonId).completed, true);
  }

  assert.equal(getCurrentLesson(session), null);
  assert.equal(session.currentLesson, null);
  assert.equal(session.completedLessonIds.length, 5);
});
