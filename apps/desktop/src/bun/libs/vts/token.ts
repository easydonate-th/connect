import { Utils } from 'electrobun/main'
import fs from 'node:fs'
import path from 'node:path'

import { logger } from '../../logger'

/**
 * The plugin token VTube Studio hands out once the user allows the plugin.
 * Kept out of `config.json`: the webview saves its whole draft there, which
 * would overwrite a token obtained after the draft was loaded.
 */
const TOKEN_FILE_NAME = 'vts-token.json'

const getTokenPath = () => path.join(Utils.paths.userData, TOKEN_FILE_NAME)

let currentToken: string | undefined

export const readToken = (): string | undefined => {
  if (currentToken !== undefined) {
    return currentToken
  }

  const tokenPath = getTokenPath()

  if (!fs.existsSync(tokenPath)) {
    return
  }

  try {
    // SAFETY: only `writeToken` writes this file
    const { authenticationToken } = JSON.parse(
      fs.readFileSync(tokenPath, 'utf-8')
    ) as { authenticationToken: string }
    currentToken = authenticationToken
  } catch (error) {
    logger.warn(
      `Failed to read ${tokenPath}`,
      error instanceof Error ? error : undefined
    )
  }

  return currentToken
}

export const writeToken = (authenticationToken: string) => {
  const tokenPath = getTokenPath()
  const tempPath = `${tokenPath}.tmp`

  fs.mkdirSync(path.dirname(tokenPath), { recursive: true })
  // Write then rename so a crash mid-write never leaves a truncated file
  fs.writeFileSync(tempPath, JSON.stringify({ authenticationToken }))
  fs.renameSync(tempPath, tokenPath)
  currentToken = authenticationToken
}
