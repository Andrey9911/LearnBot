import { readFileSync } from 'node:fs';
const template = readFileSync(new URL('./template.html', import.meta.url), 'utf8');
export const widgetStyles = readFileSync(new URL('./styles.css', import.meta.url), 'utf8');

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function asText(value) {
  return value === null || value === undefined ? '' : escapeHtml(value);
}

function hearts(lives, maxLives) {
  if (!Number.isInteger(lives) || !Number.isInteger(maxLives)) return '';
  const safeMaximum = Math.max(0, Math.min(maxLives, 10));
  const safeLives = Math.max(0, Math.min(lives, safeMaximum));
  return `${'♥'.repeat(safeLives)}${'♡'.repeat(safeMaximum - safeLives)}`;
}

/** Builds the Telegram HTML widget from the current grammY session. */
export function renderProgressWidget(session) {
  const score = Number.isFinite(session.englishScore)
    ? Math.max(0, Math.min(100, session.englishScore))
    : null;
  const currentLesson = Number.isFinite(session.currentLesson)
    ? session.currentLesson
    : null;
  const totalLessons = Number.isFinite(session.totalLessons)
    ? session.totalLessons
    : null;

  const markup = template
    .replace('<span class="learn-widget__level" id="english-level"></span>', `<span class="learn-widget__level" id="english-level">${asText(session.englishLevel)}</span>`)
    .replace('<span id="english-score"></span> / 100', `<span id="english-score">${score ?? ''}</span> / 100`)
    .replace('id="english-progress"></span>', `id="english-progress" style="width:${score ?? 0}%"></span>`)
    .replace('<span class="learn-widget__course-title" id="course-title"></span>', `<span class="learn-widget__course-title" id="course-title">${asText(session.courseTitle)}</span>`)
    .replace('<span class="learn-widget__module-title" id="module-title"></span>', `<span class="learn-widget__module-title" id="module-title">${asText(session.moduleTitle)}</span>`)
    .replace('<span class="learn-widget__lesson-count" id="current-lesson"></span>', `<span class="learn-widget__lesson-count" id="current-lesson">${currentLesson === null || totalLessons === null ? '' : `${currentLesson} / ${totalLessons}`}</span>`)
    .replace('<span class="learn-widget__lives-refresh" id="lives-refresh"></span>', `<span class="learn-widget__lives-refresh" id="lives-refresh">${session.livesRefresh ? `Обновится через: ${asText(session.livesRefresh)}` : ''}</span>`)
    .replace('<span class="learn-widget__hearts" id="lives" aria-label="Жизни"></span>', `<span class="learn-widget__hearts" id="lives" aria-label="Жизни">${hearts(session.lives, session.maxLives)}</span>`);

  return `<style>${widgetStyles}</style>${markup}`;
}
