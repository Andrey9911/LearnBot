export const ONBOARDING_STATES = Object.freeze({
  IDLE: 'onboarding.idle',
  CHOOSING_DIRECTION: 'onboarding.choosing_direction',
  TRACK_BLOCKCHAIN_SELECTED: 'onboarding.track.blockchain_selected',
  TRACK_TRADING_SELECTED: 'onboarding.track.trading_selected',
  LOCKED_BUSINESS_SELECTED: 'onboarding.locked.business_selected',
  LOCKED_IT_SELECTED: 'onboarding.locked.it_selected',
  DIAGNOSTIC_NEWCOMER_SELECTED: 'onboarding.diagnostic.newcomer_selected',
  DIAGNOSTIC_BASIC_SELECTED: 'onboarding.diagnostic.basic_selected',
  DIAGNOSTIC_CONFIDENT_SELECTED: 'onboarding.diagnostic.confident_selected',
  CALIBRATION_ANSWER_RECEIVED: 'onboarding.calibration.answer_received',
  CALIBRATION_EVALUATED: 'onboarding.calibration.evaluated',
});

export const TEXT_ANSWER_STATES = Object.freeze([
  ONBOARDING_STATES.DIAGNOSTIC_NEWCOMER_SELECTED,
  ONBOARDING_STATES.DIAGNOSTIC_BASIC_SELECTED,
  ONBOARDING_STATES.DIAGNOSTIC_CONFIDENT_SELECTED,
]);

