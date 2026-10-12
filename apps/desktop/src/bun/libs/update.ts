import { Updater } from 'electrobun/main'
import type { UpdateStatusType } from 'electrobun/main'

import type { UpdateCheck, UpdateStage } from '../../shared/rpc'
import { logger } from '../logger'

type UpdateStageSink = (stage: UpdateStage) => void

// The webview's toast title already says this
const CHECK_ERROR_PREFIX = /^Failed to check for updates: /u

// The statuses of a download and install. Only the full bundle download
// reports a percent; a patch downloads without one.
const STAGE_LABELS: Partial<Record<UpdateStatusType, string>> = {
  'download-starting': 'Starting download',
  'fetching-patch': 'Downloading patch',
  'patch-found': 'Downloading patch',
  'downloading-patch': 'Downloading patch',
  'applying-patch': 'Applying patch',
  'patch-applied': 'Applying patch',
  'extracting-version': 'Applying patch',
  'patch-chain-complete': 'Applying patch',
  'patch-not-found': 'Downloading update',
  'downloading-full-bundle': 'Downloading update',
  'download-progress': 'Downloading update',
  // Progress stops at 99 until the bundle is unpacked
  decompressing: 'Preparing update',
  'download-complete': 'Preparing update',
  applying: 'Preparing update',
}

let stageSink: UpdateStageSink | undefined

export const setUpdateStageSink = (next: UpdateStageSink) => {
  stageSink = next
}

// The updater has one status callback; progress fires once per percent
Updater.onStatusChange(entry => {
  if (entry.status !== 'download-progress') {
    logger.info(`[Update] ${entry.message}`)
  }

  const label = STAGE_LABELS[entry.status]

  if (label) {
    try {
      stageSink?.({ label, percent: entry.details?.progress ?? null })
    } catch {
      //
    }
  }
})

export const getAppVersion = () => Updater.localInfo.version()

export const checkForUpdate = async (): Promise<UpdateCheck> => {
  const [currentVersion, latest] = await Promise.all([
    getAppVersion(),
    Updater.checkForUpdate(),
  ])

  if (latest.error) {
    throw new Error(latest.error.replace(CHECK_ERROR_PREFIX, ''))
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

/**
 * Downloads the update the last check found, then quits and relaunches into
 * it. Resolves with the new version once the relaunch starts; the app quits
 * shortly after.
 */
export const installUpdate = async () => {
  await Updater.downloadUpdate()

  const downloaded = Updater.updateInfo()

  if (!downloaded.updateReady) {
    throw new Error(downloaded.error || 'The update was not downloaded')
  }

  // applyUpdate reports failure through its status, not by throwing
  await Updater.applyUpdate()

  const last = Updater.getStatusHistory().at(-1)

  if (last?.status !== 'launching-new-version') {
    throw new Error(
      Updater.updateInfo().error || last?.message || 'The update did not start'
    )
  }

  return downloaded.version
}
