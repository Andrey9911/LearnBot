/** Creates a bounded status log attached to one Telegram message. */
export function createStatusUpdater(ctx, loadingMessage, initialLine) {
  let lines = initialLine ? [initialLine] : [];

  return async (newLine) => {
    lines = [...lines, escapeHtml(newLine)].slice(-10);
    try {
      await ctx.api.editMessageText(
        loadingMessage.chat.id,
        loadingMessage.message_id,
        lines.join('\n'),
        { parse_mode: 'HTML' },
      );
    } catch {
      // Status updates must not interrupt the main operation.
    }
  };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
