export type LogLevel = 'info' | 'warn' | 'error'

export type LogEntry = {
  /** Unix epoch milliseconds */
  timestamp: number
  level: LogLevel
  message: string
}
