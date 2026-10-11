import { Updater } from 'electrobun/main'

import type { UpdateCheck } from '../../shared/rpc'
import { logger } from '../logger'

const DESKTOP_VERSION_PATTERN =
  /EasyDonate Connect \(desktop app\): (?<version>\S+)/u

type Release = { html_url: string; body: string | null }

export const getAppVersion = () => Updater.localInfo.version()

export const checkForUpdate = async (): Promise<UpdateCheck> => {
  const response = await fetch(
    `https://api.github.com/repos/easydonate-th/connect/releases/latest`,
    {
      headers: { Accept: 'application/vnd.github+json' },
      signal: AbortSignal.timeout(8000),
    }
  )

  if (!response.ok) {
    throw new Error(
      `GitHub responded with ${response.status} ${response.statusText}`
    )
  }

  // SAFETY: GitHub's release endpoint documents these fields
  const release = (await response.json()) as Release
  const latestVersion = release.body?.match(DESKTOP_VERSION_PATTERN)?.groups
    ?.version

  if (!latestVersion) {
    throw new Error('The latest release does not list a desktop app version')
  }

  const currentVersion = await getAppVersion()
  const updateAvailable = Bun.semver.order(latestVersion, currentVersion) > 0

  logger.info(
    `[Update] Current version ${currentVersion}, latest release ${latestVersion}`
  )

  return {
    currentVersion,
    latestVersion,
    updateAvailable,
    releaseUrl: release.html_url,
  }
}
