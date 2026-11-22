/**
 * @callback OnStatusUpdate
 * @param {string} message
 * @returns {Promise<void>}
 */



/** No-op status callback for services that do not have a Telegram status UI yet. */
export async function noopStatusUpdate(_message) {}

