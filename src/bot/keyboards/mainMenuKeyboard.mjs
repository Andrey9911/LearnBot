import { Keyboard,  InlineKeyboard } from 'grammy';

export const MAIN_MENU_TEXT = 'Главное меню';

export const mainMenuKeyboard = new InlineKeyboard()
  .text(MAIN_MENU_TEXT)
  // .persistent();
