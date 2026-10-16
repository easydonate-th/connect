import { en } from './index'
import type { Messages } from './index'

type ErrorMessages = Messages['app']['errors']

export type ErrorKey = keyof ErrorMessages

type ParamsOf<T> = T extends (...args: infer A) => string ? A : never

type ErrorRef = { key: string; params: unknown[] }

// Electrobun sends only an error's message across RPC, so the message carries
// the key and parameters for the webview to render in the user's language
const PREFIX = 'i18n:'

/**
 * An error the user sees, such as in a toast. `describeError` renders it in a
 * language, so the toast can show Thai while the log stays English.
 */
export class TranslatableError<K extends ErrorKey = ErrorKey> extends Error {
  constructor(key: K, ...params: ParamsOf<ErrorMessages[K]>) {
    const ref: ErrorRef = { key, params }

    super(`${PREFIX}${JSON.stringify(ref)}`)
    this.name = 'TranslatableError'
  }
}

const parseErrorRef = (message: string): ErrorRef | null => {
  if (!message.startsWith(PREFIX)) {
    return null
  }

  try {
    // SAFETY: the checks below reject anything `TranslatableError` didn't make
    const ref = JSON.parse(message.slice(PREFIX.length)) as ErrorRef

    return Object.hasOwn(en.app.errors, ref.key) && Array.isArray(ref.params)
      ? ref
      : null
  } catch {
    return null
  }
}

/**
 * Renders an error message, or the message of a `TranslatableError` from either
 * process, in `messages`' language. Other messages, such as an OS error or one
 * from VTube Studio, come back as they are.
 */
export const describeMessage = (message: string, messages: Messages = en) => {
  const ref = parseErrorRef(message)

  if (!ref) {
    return message
  }

  // SAFETY: `parseErrorRef` checked the key, and the params came from
  // `TranslatableError`, whose signature matches the message's
  const format = messages.app.errors[ref.key as ErrorKey] as (
    ...params: unknown[]
  ) => string

  return format(...ref.params)
}

/** `describeMessage` of an `Error`, or `undefined` for anything else */
// oxlint-disable-next-line anti-slop/no-unknown-parameters -- takes what `catch` gives, and parses it
export const describeError = (error: unknown, messages: Messages = en) =>
  error instanceof Error ? describeMessage(error.message, messages) : undefined
