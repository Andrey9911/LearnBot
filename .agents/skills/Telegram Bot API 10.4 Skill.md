---
name: telegram-bot-api-10-4
description: Справочник и правила реализации функций Telegram Bot API 10.4 (релиз от 9 ноября 2026). Используй при разработке, обновлении или ревью Telegram-ботов с HTML-виджетами, TON-кошельками, эфемерными ответами на callback-запросы, цитированием RichMessage, темами шаринга чатов, подарками или переименованием AreaPosition.
metadata:
  api_version: "10.4"
  release_date: "2026-11-09"
  source: "https://core.telegram.org/bots/api-changelog#november-9-2026"
---

# Telegram Bot API 10.4 (November 9, 2026)

Используй эти инструкции при генерации кода, проектировании архитектуры или миграции Telegram-ботов под **Bot API 10.4**.

## Критические ограничения и Breaking Changes

Перед написанием кода всегда проверяй следующие ограничения и изменения совместимости:

1. **Переименование класса (Breaking Change):**
   - `StoryAreaPosition` переименован в `AreaPosition` (теперь используется также для позиционирования стикеров на карточках TON-кошельков). Заменяй все старые ссылки при обновлении моделей/типов.
2. **Ограничения HTML-виджетов в production:**
   - Метод `sendWidget` в production-среде работает **только в приватных чатах**.
   - Отправленные виджеты автоматически получают защиту контента (`protected content`) и **не могут быть пересланы**.
   - Классы `InputWidgetMessageContent` и `InputSharedWidgetMessageContent` добавлены в схему, но в production-среде **пока нельзя** отправлять виджеты в ответ на inline-запросы.
   - Сообщения с виджетами **нельзя копировать** через `copyMessage` и `copyMessages`.
3. **Эфемерные ответы на CallbackQuery:**
   - Недоступны в чатах личных сообщений каналов (channel direct messages chats).

---

## 1. HTML-виджеты (Widgets)

### Отправка и отображение
- **Класс:** `Widget`.
- **Поля:** `widget` добавлено в `Message` и `ExternalReplyInfo`.
- **Методы отправки:**
  - `sendWidget` — отправка сообщения с HTML-виджетом.
  - `sendSharedWidget` — повторная отправка общего (shared) виджета, созданного ботом.
- **Права доступа:** право `can_send_other_messages` в `ChatPermissions` и `ChatMemberRestricted` теперь также разрешает отправку виджетов.
- **Inline-режим (задел на будущее):** `InputWidgetMessageContent`, `InputSharedWidgetMessageContent`.

### Обработка запросов от виджетов и обновление данных
- **Входящие обновления (`Update`):**
  - `widget_query` (`WidgetQuery`) — запросы от виджетов из сообщений, отправленных ботом или через бота.
  - `shared_widget_query` (`SharedWidgetQuery`) — запросы от пересланных сообщений с общими виджетами.
- **Типы запросов от виджетов:**
  - `WidgetQueryType` (базовый тип), `WidgetQueryTypeData`, `WidgetQueryTypeSignData`, `WidgetQueryTypeSentTransaction`, `WidgetQueryWallet`.
  - Запрос может содержать произвольные данные + карточку TON-кошелька пользователя, данные с подписью TON-кошелька или уведомление об отправленной TON-транзакции.
- **Методы ответа и редактирования:**
  - `answerWidgetQuery` — ответ на запрос от виджета.
  - `editMessageWidgetData` — изменение данных виджета в конкретном сообщении.
  - `editSharedWidgetData` — изменение публичных данных общего виджета.

---

## 2. Эфемерные сообщения (Ephemeral Messages)

Бот может отправлять эфемерные ответы на `CallbackQuery` в любых чатах (кроме личных сообщений каналов), передавая `callback_query_id` **без** `receiver_user_id` в параметре `ephemeral_message_parameters`.

- **Изменения в сигнатурах:**
  - Поле `receiver_user_id` в `EphemeralMessageParameters` стало **опциональным**.
  - Параметр `chat_id` стал **опциональным** в методах: `sendMessage`, `sendRichMessage`, `sendAnimation`, `sendAudio`, `sendContact`, `sendDocument`, `sendLivePhoto`, `sendLocation`, `sendPhoto`, `sendSticker`, `sendVenue`, `sendVideo`, `sendVideoNote`, `sendVoice`.

---

## 3. Цитирование RichMessage

- `TextQuote.rich_texts` — новое поле для цитат, выбранных из `RichMessage`.
- `ReplyParameters.quote_rich_texts` — новое поле, позволяющее боту цитировать фрагменты `RichMessage` при ответе.

---

## 4. TON Wallet

- **Профиль/Чат (`ChatFullInfo`):** добавлено поле `ton_wallet_card` и классы `TonWalletCard`, `TonWalletCardSticker`, `TonNft`, `TonNftAttribute`.
- **Сервисные сообщения (`Message`):** добавлено поле `ton_wallet_transfer` (`TonWalletTransfer`) для уведомлений о переводах через TON-кошелёк.
- **Позиционирование:** используется переименованный класс `AreaPosition` (ранее `StoryAreaPosition`).

---

## 5. Темы экрана шаринга чата (Chat Share Themes)

- **В `ChatFullInfo`:** добавлено поле `share_theme` и классы `ChatShareTheme`, `ChatShareThemeEmoji`, `ChatShareThemeUniqueGift`.
- **Типы эмодзи:** `EmojiType`, `EmojiTypeEmoji`, `EmojiTypeCustomEmoji`.
- **Фоны (Backdrops):** классы `ChatShareThemeBackdrop`, `ChatShareThemeBackdrops` и метод `getChatShareThemeBackdrops`.

---

## 6. Подарки (Gifts)

- `getUniqueGift` — получение информации об уникальном подарке по его имени.
- `deleteBusinessAccountGift` — удаление обычных подарков управляемого бизнес-аккаунта **без** начисления Telegram Stars за них.

---

## 7. Прочие улучшения (General)

- **Вторичные юзернеймы ботов:** владельцы с Telegram Premium могут назначать до 2 своим ботам вторичные юзернеймы с окончаниями `agent`, `ai`, `app`, `game` или `gay`. Их можно предлагать через `KeyboardButtonRequestManagedBot.suggested_username`.
- **Новые сущности текста:**
  - `RichTextTonAddress` — адрес блокчейна TON внутри `RichMessage`.
  - `MessageEntity`: добавлены типы `ton_address` (TON-адрес) и `bank_card_number` (номер банковской карты).
- **Форматирование описаний верификации:** в методы `verifyUser` и `verifyChat` добавлены параметры `custom_description_parse_mode` и `custom_description_entities`.
- **Отмена оплаты за сообщения:** класс `PaidMessagesWaived` и поле `Message.paid_messages_waived` для сервисных сообщений об использовании ссылки, позволяющей писать без оплаты Telegram Stars.
- **Ссылки на топики в личке с ботом:** поддерживается формат `https://t.me/<bot_username>/<message_thread_id>`. Ссылка открывает топик только для того пользователя, в приватном чате с которым этот топик существует.

---

## Чеклист для агента при реализации

- При использовании `sendWidget` проверяй тип чата (`chat.type == "private"`) и не пытайся вызывать `copyMessage`/`copyMessages` для виджетов.
- При ответе эфемерным сообщением на `CallbackQuery` достаточно передать `ephemeral_message_parameters: { callback_query_id }` — `chat_id` и `receiver_user_id` можно опустить.
- При обновлении существующих библиотек/схем замени `StoryAreaPosition` на `AreaPosition`.
- При парсинге `MessageEntity` учитывай новые типы `ton_address` и `bank_card_number`.