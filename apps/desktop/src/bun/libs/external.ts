import { Utils } from 'electrobun/main'

export const openExternal = (url: string) => {
  if (!Utils.openExternal(url)) {
    throw new Error(`Could not open ${url}`)
  }

  return url
}
