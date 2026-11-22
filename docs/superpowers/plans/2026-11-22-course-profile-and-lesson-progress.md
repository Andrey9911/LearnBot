# Course Profile and Lesson Progress Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Format calibration results and add a session-backed course menu that exposes lessons in order, unlocking one lesson after each completion.

**Architecture:** Keep static course and lesson descriptors in a domain catalog and user progress in the existing grammY session. Keep Telegram callbacks and message edits in a dedicated course composer, with small presentation helpers for the calibration result and profile.

**Tech Stack:** Node.js ES Modules, grammY `Composer` and `InlineKeyboard`, built-in `node:test`.

**Spec:** `docs/superpowers/specs/2026-11-22-course-profile-and-lesson-progress-design.md`

## Global Constraints

- Course progress remains in the existing in-memory session.
- The profile shows English level and score on one line, lives below, then a horizontal module progress bar.
- Only the current lesson is available until it is completed.
- The course profile omits the selected direction.
- Telegram UI code stays in bot handlers; the LLM service keeps its structured result contract.
- Callback completion must be idempotent and must not unlock lessons out of order.

---

## File Structure

- `src/domain/course/courseCatalog.mjs`: static tracks, module metadata, lesson descriptors, and lookup helpers.
- `src/domain/course/courseProgress.mjs`: progress initialization, current lesson lookup, and idempotent completion transition.
- `src/bot/views/courseMessages.mjs`: HTML escaping, score/progress bars, calibration result and profile rendering.
- `src/bot/keyboards/courseKeyboards.mjs`: result, profile and lesson inline keyboards.
- `src/bot/callbacks/courseCallbacks.mjs`: stable callback identifiers and lesson callback parsing.
- `src/bot/handlers/courseComposer.mjs`: menu, lesson, completion, track-change, locked-module, and premium callbacks.
- `src/bot/handlers/calibrationComposer.mjs`: render the verdict and attach result actions.
- `src/bot/middlewares/sessionMiddleware.mjs`: initialize life and lesson progress state.
- `src/bot/handlers/onboardingComposer.mjs`: reset course progress when changing track.
- `src/bot/createBot.mjs`: register the course composer.
- `test/courseMessages.test.mjs`: presentation behavior tests.
- `test/courseProgress.test.mjs`: progression and unlock behavior tests.
- `test/courseComposer.test.mjs`: callback-to-UI flow tests.
- `test/calibrationComposer.test.mjs`: calibration output contract test.

### Task 1: Add Failing Tests for Course Presentation and Progression

**Files:**
- Create: `test/courseMessages.test.mjs`
- Create: `test/courseProgress.test.mjs`
- Modify: `test/calibrationComposer.test.mjs`

- [x] Add literal-output tests for score bar boundaries, safe HTML escaping, profile ordering, and the required lives display.
- [x] Add behavior tests proving a fresh track exposes lesson 1 only, completion exposes lesson 2, duplicate completion does not advance, and final lesson completion does not invent another lesson.
- [x] Update the calibration test to assert the result keyboard and formatted text options.
- [x] Run the new tests before implementation and confirm missing-module failures.

### Task 2: Implement Course Catalog and Progress Rules

**Files:**
- Create: `src/domain/course/courseCatalog.mjs`
- Create: `src/domain/course/courseProgress.mjs`
- Modify: `src/bot/middlewares/sessionMiddleware.mjs`
- Modify: `src/bot/handlers/onboardingComposer.mjs`

- [x] Add ordered lessons for each active track and a locked second-module descriptor.
- [x] Add helpers to resolve the current lesson and complete exactly that lesson once.
- [x] Initialize lives to 3/3 and progress to module 1, lesson 1, with no completed lesson IDs.
- [x] Reset lesson progress when a new track is selected.
- [x] Run `node --test --test-isolation=none test/courseProgress.test.mjs`; all progression cases pass.

### Task 3: Implement Calibration Result and Profile Rendering

**Files:**
- Create: `src/bot/views/courseMessages.mjs`
- Create: `test/courseMessages.test.mjs`
- Modify: `src/bot/handlers/calibrationComposer.mjs`

- [x] Render score out of 100, a ten-cell score bar, CEFR level, and escaped verdict inside Telegram HTML `<blockquote>`.
- [x] Render profile as level plus score, lives, then horizontal module progress and completed count; omit direction.
- [x] Attach inline buttons for starting the lesson or opening the profile.
- [x] Run `node --test --test-isolation=none test/courseMessages.test.mjs test/calibrationComposer.test.mjs`; all presentation cases pass.

### Task 4: Implement Course Menu Callback Flow

**Files:**
- Create: `src/bot/callbacks/courseCallbacks.mjs`
- Create: `src/bot/keyboards/courseKeyboards.mjs`
- Create: `src/bot/handlers/courseComposer.mjs`
- Modify: `src/bot/createBot.mjs`
- Create: `test/courseComposer.test.mjs`

- [x] Add callbacks to open profile, open the current lesson, complete the current lesson, change track, show the locked module, and show the premium placeholder.
- [x] Generate lesson buttons only for completed lessons and the current lesson.
- [x] Validate callback lesson IDs against the selected track and unlocked index before changing state.
- [x] Edit the same Telegram message for profile and lesson navigation; answer every callback query.
- [x] Return to the direction selector when no active track is selected.
- [x] Run `node --test --test-isolation=none test/courseComposer.test.mjs`; all callback cases pass.

### Task 5: Verify the Complete Test Suite

**Files:**
- No additional files.

- [x] Run the course, calibration, and progression tests with `node --test --test-isolation=none`; all 15 tests pass.
- [x] Run `npm run check` and syntax checks for all new course modules.
- [x] Review the changed handlers and verify later lessons appear only after completion.

The complete pre-existing suite still has unrelated failures in `test/aiService.test.mjs` (its one-argument call does not match the existing context-first service signature) and the main-menu widget start test (the start handler currently has its widget send commented out). These paths were not changed by this implementation.

