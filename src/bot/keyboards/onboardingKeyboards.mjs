import { InlineKeyboard } from 'grammy';

import { ONBOARDING_CALLBACKS } from '../callbacks/onboardingCallbacks.mjs';

export const directionKeyboard = new InlineKeyboard()
  .text('📈 Блокчейн и смарт-контракты', ONBOARDING_CALLBACKS.TRACK_BLOCKCHAIN)
  .row()
  .text('💻 Крипта и трейдинг', ONBOARDING_CALLBACKS.TRACK_TRADING)
  .row()
  .text('🔒 Business English (Скоро)', ONBOARDING_CALLBACKS.LOCKED_BUSINESS)
  .row()
  .text('🔒 IT & Product (Скоро)', ONBOARDING_CALLBACKS.LOCKED_IT)
  .row()
  .text('Главное меню', ONBOARDING_CALLBACKS.MAIN_MENU);

export const diagnosticKeyboard = new InlineKeyboard()
  .text('Начинаю с нуля', ONBOARDING_CALLBACKS.DIAGNOSTIC_NEWCOMER)
  .row()
  .text('Знаю основы', ONBOARDING_CALLBACKS.DIAGNOSTIC_BASIC)
  .row()
  .text('Уверенно читаю', ONBOARDING_CALLBACKS.DIAGNOSTIC_CONFIDENT);

