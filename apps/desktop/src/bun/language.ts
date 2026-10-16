import { Utils } from 'electrobun/main'
import fs from 'node:fs'
import path from 'node:path'

import { isLanguage, MESSAGES } from '../shared/i18n'
import type { Language } from '../shared/i18n'
import { logger } from './logger'

// Kept out of config.json, so a stale webview `saveConfig` can't overwrite a
// language the user switched to since
const getLanguagePath = () => path.join(Utils.paths.userData, 'language.json')

const readLanguageFile = (): Language => {
  const languagePath = getLanguagePath()

  if (!fs.existsSync(languagePath)) {
    return 'en'
  }

  try {
    const { language } = JSON.parse(fs.readFileSync(languagePath, 'utf-8'))

    return isLanguage(language) ? language : 'en'
  } catch (error) {
    logger.warn(
      `Failed to read ${languagePath}, using English`,
      error instanceof Error ? error : undefined
    )

    return 'en'
  }
}

let currentLanguage: Language | undefined

export const getLanguage = () => {
  currentLanguage ??= readLanguageFile()

  return currentLanguage
}

export const getMessages = () => MESSAGES[getLanguage()]

export const saveLanguage = (language: Language) => {
  const languagePath = getLanguagePath()
  const tempPath = `${languagePath}.tmp`

  fs.mkdirSync(path.dirname(languagePath), { recursive: true })
  fs.writeFileSync(tempPath, JSON.stringify({ language }, null, 2))
  fs.renameSync(tempPath, languagePath)
  currentLanguage = language

  return language
}
