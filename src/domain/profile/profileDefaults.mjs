/**
 * @typedef {object} InitialProfile
 * @property {number} english_score
 * @property {string} cefr_level
 * @property {number} lives
 * @property {boolean} is_pro
 * @property {number} streak_days
 * @property {string|null} last_active_at
 * @property {string|null} created_at
 */

/** @type {Readonly<InitialProfile>} */
export const INITIAL_PROFILE = Object.freeze({
  english_score: 0,
  cefr_level: 'A1',
  lives: 3,
  is_pro: false,
  streak_days: 0,
  last_active_at: null,
  created_at: null,
});

