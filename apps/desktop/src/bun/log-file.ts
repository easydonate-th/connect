import { Utils } from 'electrobun/main'
import fs from 'node:fs'
import path from 'node:path'

import type { LogEntry, LogLevel } from '../shared/log'

const KEPT_SESSIONS = 3
const SESSION_FILE = /^app-.+\.log$/u
const INSTALLER_LOG = 'installer.log'
const MAX_INSTALLER_LOG_BYTES = 1024 * 1024

let sessionFile: string | undefined

// On Windows, userLogs is the folder that also holds config.json and the app
export const getLogsFolder = () => path.join(Utils.paths.userLogs, 'logs')

const formatLine = ({ timestamp, level, message }: LogEntry) =>
  `${new Date(timestamp).toISOString()} ${level.toUpperCase().padEnd(5)} ${message}\n`

const append = (file: string, entry: LogEntry) => {
  try {
    fs.appendFileSync(file, formatLine(entry))
  } catch {
    // A full disk or a deleted folder must not stop the app logging to the UI
  }
}

export const writeAppLog = (entry: LogEntry) => {
  if (sessionFile) {
    append(sessionFile, entry)
  }
}

/**
 * Appends to `installer.log`, which outlives the sessions, so it shows what
 * an update did across the restart it makes.
 */
export const writeInstallerLog = (level: LogLevel, message: string) => {
  const folder = getLogsFolder()

  try {
    fs.mkdirSync(folder, { recursive: true })
  } catch {
    return
  }

  append(path.join(folder, INSTALLER_LOG), {
    timestamp: Date.now(),
    level,
    message,
  })
}

const pruneSessions = (folder: string) => {
  const sessions = fs
    .readdirSync(folder)
    .filter(name => SESSION_FILE.test(name))
    .toSorted()

  for (const name of sessions.slice(0, -KEPT_SESSIONS)) {
    fs.rmSync(path.join(folder, name), { force: true })
  }
}

const trimInstallerLog = (folder: string) => {
  const file = path.join(folder, INSTALLER_LOG)
  const size = fs.statSync(file, { throwIfNoEntry: false })?.size ?? 0

  if (size <= MAX_INSTALLER_LOG_BYTES) {
    return
  }

  const tail = fs
    .readFileSync(file, 'utf-8')
    .slice(-MAX_INSTALLER_LOG_BYTES / 2)

  fs.writeFileSync(file, tail.slice(tail.indexOf('\n') + 1))
}

const describeCrash = (crash: Error) => crash.stack ?? crash.message

/**
 * Opens this session's log file and deletes all but the last three. Call it
 * only once this process holds the single-instance lock, so that a second
 * launch never takes the place of a session.
 */
export const startLogFiles = () => {
  const folder = getLogsFolder()
  // ISO time sorts by name, and Windows file names cannot hold a colon
  const name = `app-${new Date().toISOString().replaceAll(':', '-')}.log`

  // Electrobun's own listener exits the process, so this one goes first
  process.prependListener('uncaughtException', exception =>
    writeAppLog({
      timestamp: Date.now(),
      level: 'error',
      message: `Uncaught exception: ${describeCrash(exception)}`,
    })
  )
  process.on('unhandledRejection', reason =>
    writeAppLog({
      timestamp: Date.now(),
      level: 'error',
      message: `Unhandled rejection: ${reason instanceof Error ? describeCrash(reason) : String(reason)}`,
    })
  )

  fs.mkdirSync(folder, { recursive: true })
  fs.writeFileSync(path.join(folder, name), '')
  sessionFile = path.join(folder, name)
  pruneSessions(folder)
  trimInstallerLog(folder)
}
