const SOCKET_BASE_URL = 'wss://socket.easydonate.app/ezdn'

/**
 * Derives the EasyDonate socket URL from an alert widget URL by reusing its
 * query string. Returns `null` when the widget URL is not usable.
 */
export const toSocketUrl = (widgetUrl: string): string | null => {
  let url: URL
  try {
    url = new URL(widgetUrl.trim())
  } catch {
    return null
  }

  const isHttp = url.protocol === 'https:' || url.protocol === 'http:'
  if (!isHttp || url.search === '') {
    return null
  }

  return `${SOCKET_BASE_URL}${url.search}&ex=easyconnect`
}
