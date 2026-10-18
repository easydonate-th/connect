import { Updater } from 'electrobun/main'
import type { UpdateStatusType } from 'electrobun/main'

import { describeError, TranslatableError } from '../../shared/i18n/error'
import type { UpdateCheck, UpdateStage } from '../../shared/rpc'
import { writeInstallerLog } from '../log-file'
import { logger } from '../logger'

type UpdateStageSink = (stage: UpdateStage) => void

// Only the full bundle download reports a percent; a patch downloads without
// one.
const STAGES: Partial<Record<UpdateStatusType, UpdateStage['stage']>> = {
  'download-starting': 'starting',
  'fetching-patch': 'downloadingPatch',
  'patch-found': 'downloadingPatch',
  'downloading-patch': 'downloadingPatch',
  'applying-patch': 'applyingPatch',
  'patch-applied': 'applyingPatch',
  'extracting-version': 'applyingPatch',
  'patch-chain-complete': 'applyingPatch',
  'patch-not-found': 'downloadingUpdate',
  'downloading-full-bundle': 'downloadingUpdate',
  'download-progress': 'downloadingUpdate',
  // Progress stops at 99 until the bundle is unpacked
  decompressing: 'preparingUpdate',
  'download-complete': 'preparingUpdate',
  applying: 'preparingUpdate',
}

const PROGRESS_LOG_STEP = 10

let stageSink: UpdateStageSink | undefined
let loggedProgressStep = -1

export const setUpdateStageSink = (next: UpdateStageSink) => {
  stageSink = next
}

// The updater has one status callback; progress fires once per percent
Updater.onStatusChange(entry => {
  if (entry.status === 'download-progress') {
    const progress = entry.details?.progress ?? 0
    const step = Math.floor(progress / PROGRESS_LOG_STEP)

    if (step > loggedProgressStep) {
      loggedProgressStep = step
      writeInstallerLog('info', `${entry.message} ${progress}%`)
    }
  } else {
    const level = entry.status === 'error' ? 'error' : 'info'

    loggedProgressStep = -1
    logger[level](`[Update] ${entry.message}`)
    writeInstallerLog(level, entry.message)
  }

  const stage = STAGES[entry.status]

  if (stage) {
    try {
      stageSink?.({ stage, percent: entry.details?.progress ?? null })
    } catch {
      //
    }
  }
})

export const getAppVersion = () => Updater.localInfo.version()

// The next launch is the only sign that the native helper installed an update
export const logLaunch = async () => {
  const { version, channel, hash } = await Updater.getLocalInfo()
  const message = `EasyDonate Connect ${version} (${channel}, ${hash}) started on ${process.platform} ${process.arch}`

  logger.info(message)
  writeInstallerLog('info', message)
}

export const checkForUpdate = async (): Promise<UpdateCheck> => {
  const [currentVersion, latest] = await Promise.all([
    getAppVersion(),
    Updater.checkForUpdate(),
  ])

  if (latest.error) {
    throw new Error(latest.error.replace(/^Failed to check for updates: /u, ''))
  }

  // The updater compares bundle hashes, which a rebuild of the same version
  // can change, so only a newer version counts as an update
  const updateAvailable =
    latest.updateAvailable &&
    Bun.semver.order(latest.version, currentVersion) > 0

  return {
    currentVersion,
    latestVersion: latest.version || currentVersion,
    updateAvailable,
  }
}

// Resolves once the relaunch starts; the app quits shortly after
const startUpdate = async () => {
  await Updater.downloadUpdate()

  const downloaded = Updater.updateInfo()

  if (!downloaded.updateReady) {
    throw downloaded.error
      ? new Error(downloaded.error)
      : new TranslatableError('updateNotDownloaded')
  }

  // applyUpdate reports failure through its status, not by throwing
  await Updater.applyUpdate()

  const last = Updater.getStatusHistory().at(-1)

  if (last?.status !== 'launching-new-version') {
    const message = Updater.updateInfo().error || last?.message

    throw message
      ? new Error(message)
      : new TranslatableError('updateNotStarted')
  }

  return downloaded.version
}

export const installUpdate = async () => {
  try {
    return await startUpdate()
  } catch (error) {
    writeInstallerLog(
      'error',
      `Failed to install update: ${describeError(error) ?? 'unknown error'}`
    )

    throw error
  }
}
