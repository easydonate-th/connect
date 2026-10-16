import { toast } from 'sonner'

import { log } from '~/libs/logs'
import { getLanguage as loadLanguage, setLanguage } from '~/libs/rpc'

import { MESSAGES } from '../../shared/i18n'
import type { Language } from '../../shared/i18n'
import { describeError } from '../../shared/i18n/error'

let language: Language = 'en'
const listeners = new Set<() => void>()

const applyLanguage = (next: Language) => {
  language = next
  document.documentElement.lang = next

  for (const listener of listeners) {
    listener()
  }
}

export const subscribeLanguage = (listener: () => void) => {
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}

export const getLanguage = () => language

/** The current language's text, for code outside React such as toasts */
export const getMessages = () => MESSAGES[language]

export const changeLanguage = async (next: Language) => {
  applyLanguage(next)

  try {
    await setLanguage(next)
  } catch (error) {
    toast.error(getMessages().settings.languageSaveFailed, {
      description: describeError(error, getMessages()),
    })
    log.error(
      `Failed to save the language: ${describeError(error) ?? 'unknown error'}`
    )
  }
}

const initLanguage = async () => {
  try {
    applyLanguage(await loadLanguage())
  } catch (error) {
    log.warn(
      `Failed to load the language, using English: ${describeError(error) ?? 'unknown error'}`
    )
  }
}

/**
 * Starts loading once at startup, so `use` gets the same promise on every
 * render and the first render is already in the stored language.
 */
export const languagePromise = initLanguage()
