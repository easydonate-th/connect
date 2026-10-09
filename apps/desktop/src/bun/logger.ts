import type { LogEntry, LogLevel } from '../shared/log'

type LogSink = (entry: LogEntry) => void

let sink: LogSink | undefined

/** Sets where log entries go besides the console (the webview Logs panel). */
export const setLogSink = (next: LogSink) => {
  sink = next
}

const write = (level: LogLevel, message: string) => {
  const entry: LogEntry = { timestamp: Date.now(), level, message }

  if (level === 'info') {
    console.log(message)
  } else {
    console[level](message)
  }

  try {
    sink?.(entry)
  } catch {
    // The webview may not be connected yet; the console still has the entry
  }
}

const withCause = (message: string, cause?: Error) =>
  cause ? `${message}: ${cause.message}` : message

export const logger = {
  info: (message: string) => write('info', message),
  warn: (message: string, cause?: Error) =>
    write('warn', withCause(message, cause)),
  error: (message: string, cause?: Error) =>
    write('error', withCause(message, cause)),
}
