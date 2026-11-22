# Course Profile and Lesson Progress Design

## Goal

After calibration, present the learner's English result in a readable Telegram message and provide a course submenu that shows profile statistics, module progress, and only the lessons currently available to the learner.

## Scope

This iteration stores progress in the existing grammY session. It adds no database or payment integration. The selected track remains part of the session and determines lesson content, but the course profile does not display the track.

## Calibration Result

The final calibration message replaces the current plain verdict output. It contains:

```text
Уровень английского: [■■□□□□□□□□] A1
English Score: 15/100

Вердикт:
> Use capital 'I', add a verb...
```

Telegram HTML renders the verdict with `<blockquote>`. Every model-provided value is HTML-escaped before insertion. The score is clamped to `0..100` for presentation, and the ten-cell bar fills according to score in ten-point increments.

The result has two inline buttons:

- `▶️ Начать урок` opens the current lesson entry point.
- `☰ Выйти в меню` edits the result message into the course profile submenu.

## Course Profile Submenu

The submenu edits the existing Telegram message and displays:

```text
Уровень английского: A1 · English Score: 15/100
Жизни: ❤️❤️❤️ 3/3

Прогресс модуля 1
[■■□□□□□□□□] 0/5 уроков
```

The first line intentionally omits the selected direction. Module progress uses a horizontal ten-cell bar based on completed lessons divided by the number of lessons in that module.

The inline keyboard contains:

- completed lessons as `✅ Урок N: [Название]`;
- exactly one current lesson as `▶️ Урок N: [Название]`;
- no buttons for later lessons until the current lesson is completed;
- `🔒 Модуль 2 (Скоро)` for the next unavailable module;
- `🔄 Сменить направление`, which returns to the existing direction selector;
- `⭐️ Убрать лимит жизней`, which currently answers with a monetization placeholder.

## Course Catalog

A separate domain module defines static course data by track. Each track contains module metadata and ordered lesson descriptors. This iteration provides enough descriptors to render module 1 and keeps module 2 locked as a future placeholder.

The catalog is read-only. User-specific state stores only progress, so a future persistence layer can save identifiers and counters without copying the catalog into each profile.

## Session State

The initial session gains:

- `lives: 3`;
- `maxLives: 3`;
- `currentModuleIndex: 0`;
- `currentLessonIndex: 0`;
- `completedLessonIds: []`.

Calibration updates the English score and CEFR level without resetting course progress. Selecting a new direction resets module and lesson progress because lessons belong to a track.

## Lesson Availability and Completion

At the start, only lesson 1 exists in the keyboard. Selecting it opens the lesson view by editing the same message. The lesson view has a temporary `✅ Завершить урок` action because full lesson exercises are outside this iteration.

Completing the current lesson performs one atomic session transition:

1. add the current lesson ID to `completedLessonIds` once;
2. advance `currentLessonIndex` when another lesson exists;
3. render the profile again;
4. show the completed lesson with `✅` and reveal the next lesson with `▶️`.

Repeated completion callbacks are idempotent and cannot skip lessons. When the last configured lesson is completed, the module shows full progress and no new lesson button is created.

## Telegram Interaction Rules

Callbacks use stable string identifiers. Dynamic lesson callbacks include only a validated lesson ID from the catalog. Every callback query is answered before editing or replying.

Menu navigation uses `ctx.editMessageText` so the result, profile, and lesson view occupy one message. Telegram `message is not modified` errors are ignored only at the UI boundary.

The LLM service continues returning structured verdict data and remains independent from grammY UI components.

## Error Handling

Unknown lesson IDs, lessons from another track, and lessons beyond the current unlocked index do not change session state. The bot answers those callbacks with a short unavailable-lesson notice.

If the session lacks a valid selected track, course actions return the user to the direction selector.

## Verification

Automated tests cover:

- score and module progress bar boundaries;
- HTML escaping in the verdict blockquote;
- calibration result text and keyboard;
- initial profile with only lesson 1 available;
- completion revealing exactly the next lesson;
- repeated completion remaining idempotent;
- direction change resetting lesson progress;
- locked module and monetization placeholder callbacks.

