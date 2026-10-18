import type { LogEntry, LogLevel } from '../../shared/log'

export type LogLine = Omit<LogEntry, 'level'> & {
  id: number
  /** `raw` lines hold an incoming socket frame */
  level: LogLevel | 'raw'
}

export type LogsSnapshot = {
  events: LogLine[]
  rawFrames: LogLine[]
}

const MAX_LOG_LINES = 500

// Raw frames get their own cap so they never push regular events out of the
// history.
let snapshot: LogsSnapshot = { events: [], rawFrames: [] }
let nextId = 0
const listeners = new Set<() => void>()
let forward: ((entry: LogEntry) => void) | undefined

const append = (lines: LogLine[], line: Omit<LogLine, 'id'>) => {
  nextId += 1

  return [...lines.slice(1 - MAX_LOG_LINES), { ...line, id: nextId }]
}

const notify = () => {
  for (const listener of listeners) {
    listener()
  }
}

export const addLog = (entry: LogEntry) => {
  snapshot = { ...snapshot, events: append(snapshot.events, entry) }
  notify()
}

/** Takes a frame that the main process already prepared for the raw log */
export const addRawLog = (message: string) => {
  snapshot = {
    ...snapshot,
    rawFrames: append(snapshot.rawFrames, {
      timestamp: Date.now(),
      level: 'raw',
      message,
    }),
  }
  notify()
}

export const clearLogs = () => {
  snapshot = { events: [], rawFrames: [] }
  notify()
}

export const subscribeLogs = (listener: () => void) => {
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}

export const getLogs = () => snapshot

/** Merges two id-sorted line lists into one, in arrival order. */
export const mergeLogLines = (a: LogLine[], b: LogLine[]) => {
  const merged: LogLine[] = []
  let indexA = 0
  let indexB = 0

  while (indexA < a.length || indexB < b.length) {
    const lineA = a[indexA]
    const lineB = b[indexB]

    if (lineA && (!lineB || lineA.id < lineB.id)) {
      merged.push(lineA)
      indexA += 1
    } else if (lineB) {
      merged.push(lineB)
      indexB += 1
    }
  }

  return merged
}

/**
 * Sends the webview's own lines to the main process, which writes them to the
 * session's log file. `libs/rpc.ts` sets it, since importing it here would
 * make an import cycle.
 */
export const setLogForwarder = (next: (entry: LogEntry) => void) => {
  forward = next
}

const write = (level: LogLevel, message: string) => {
  const entry: LogEntry = { timestamp: Date.now(), level, message }

  addLog(entry)

  try {
    forward?.(entry)
  } catch {
    //
  }
}

/** Webview-side logger; main-process entries arrive over RPC. */
export const log = {
  info: (message: string) => write('info', message),
  warn: (message: string) => write('warn', message),
  error: (message: string) => write('error', message),
}
