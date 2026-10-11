export type LogLevel = 'info' | 'warn' | 'error'

export type LogEntry = {
  timestamp: number
  level: LogLevel
  message: string
}
