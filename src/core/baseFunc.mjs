  // Функция для живого обновления текста
  export const updateStatus = async (ctx, newLine) => {
    try {
      // Добавляем новую строку в лог и держим последние 5 строк, чтобы сообщение не было бесконечным
      const lines = statusText.split('\n');
      lines.push(newLine);
      statusText = lines.slice(-10).join('\n'); // Храним историю последних логов
      
      await ctx(loading.chat.id, loading.message_id, statusText, {
        parse_mode: 'HTML'
      });
    } catch (e) {
      // Игнорируем ошибки "message is not modified" от Telegram
    }
  };