export type ConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'reconnecting'

export type WidgetState = {
  status: ConnectionStatus
  socketUrl: string | null
}

// An http(s) URL with a non-empty query string, captured without the hash
const WIDGET_URL_REGEX =
  /^https?:\/\/[^\s/?#]+[^\s?#]*(?<search>\?[^\s#]+)(?:#\S*)?$/iu

export const getSocketUrl = (widgetUrl: string): string | null => {
  const search = WIDGET_URL_REGEX.exec(widgetUrl.trim())?.groups?.search

  if (search === undefined) {
    return null
  }

  return `wss://socket.easydonate.app/ezdn${search}&ex=easyconnect`
}
