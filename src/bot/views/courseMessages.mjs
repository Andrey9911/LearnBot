import { getTrackCourse } from '../../domain/course/courseCatalog.mjs';
import { getAvailableLessons } from '../../domain/course/courseProgress.mjs';

/** Escapes untrusted text for Telegram HTML parse mode. */
export function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/** Renders the score as a ten-cell bar, with one cell per ten points. */
export function renderScoreProgressBar(score) {
  const safeScore = normalizeScore(score);
  const filledCells = Math.floor(safeScore / 10);
  return `${'■'.repeat(filledCells)}${'□'.repeat(10 - filledCells)}`;
}

/** Renders module completion as a ten-cell horizontal bar. */
export function renderModuleProgressBar(completedLessons, totalLessons) {
  const total = Number.isFinite(totalLessons) ? Math.max(0, totalLessons) : 0;
  const completed = Number.isFinite(completedLessons)
    ? Math.max(0, Math.min(total, completedLessons))
    : 0;
  const filledCells = total === 0 ? 0 : Math.floor((completed / total) * 10);
  return `${'■'.repeat(filledCells)}${'□'.repeat(10 - filledCells)}`;
}

/** Builds the formatted calibration result and quotes the AI feedback. */
export function buildCalibrationResult(verdict) {
  const score = normalizeScore(verdict.english_score);
  const level = escapeHtml(verdict.level);
  const message = escapeHtml(verdict.message);
  return `Уровень английского: [${renderScoreProgressBar(score)}] ${level}\nEnglish Score: ${score}/100\n\nВердикт:\n<blockquote>${message}</blockquote>`;
}

/** Renders the course profile with level, score, lives, and current module progress. */
export function renderCourseProfile(session) {
  const score = normalizeScore(session.englishScore);
  const level = escapeHtml(session.englishLevel ?? 'A1');
  const maximumLives = normalizeCount(session.maxLives, 3, 10);
  const lives = normalizeCount(session.lives, 3, maximumLives);
  const hearts = `${'❤️'.repeat(lives)}${'🖤'.repeat(maximumLives - lives)}`;

  const course = getTrackCourse(session.selectedTrack);
  const module = course?.modules[session.currentModuleIndex ?? 0];
  const lessons = module?.lessons ?? [];
  const visibleLessons = getAvailableLessons(session);
  const completedIds = new Set(
    visibleLessons.filter((lesson) => lesson.completed).map((lesson) => lesson.id),
  );
  const completedCount = lessons.filter((lesson) => completedIds.has(lesson.id)).length;
  const progress = renderModuleProgressBar(completedCount, lessons.length);
  const moduleNumber = (session.currentModuleIndex ?? 0) + 1;

  return `Уровень английского: ${level} · English Score: ${score}/100\nЖизни: ${hearts} ${lives}/${maximumLives}\n\nПрогресс модуля ${moduleNumber}\n[${progress}] ${completedCount}/${lessons.length} уроков`;
}

/** Normalizes a numeric score to the supported 0..100 range. */
function normalizeScore(score) {
  return Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : 0;
}

/** Normalizes a count while keeping the rendered value within its limit. */
function normalizeCount(value, fallback, maximum) {
  const count = Number.isInteger(value) ? value : fallback;
  return Math.max(0, Math.min(maximum, count));
}
