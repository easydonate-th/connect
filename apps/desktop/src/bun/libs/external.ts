import { Utils } from 'electrobun/main'

import { REPOSITORY_URL } from '../../shared/repository'

/** Opens a page of the app's GitHub repository in the default browser. */
export const openExternal = (url: string) => {
  // Keeps the webview from launching arbitrary URLs and protocol handlers
  if (url !== REPOSITORY_URL && !url.startsWith(`${REPOSITORY_URL}/`)) {
    throw new Error(`Refused to open ${url}`)
  }

  if (!Utils.openExternal(url)) {
    throw new Error(`Could not open ${url}`)
  }

  return url
}
