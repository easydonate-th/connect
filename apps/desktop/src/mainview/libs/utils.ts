export { cn } from 'cn'

export const getSocketUrl = (widgetUrl: string): string | null => {
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

  return `wss://socket.easydonate.app/ezdn${url.search}&ex=easyconnect`
}
