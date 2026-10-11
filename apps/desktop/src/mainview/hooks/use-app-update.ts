import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { openLink } from '~/libs/links'
import { log } from '~/libs/logs'
import { checkForUpdate, getAppVersion } from '~/libs/rpc'

import type { UpdateCheck } from '../../shared/rpc'

const runCheck = async () => {
  try {
    const update = await checkForUpdate()

    if (update.updateAvailable) {
      toast.info(`Version ${update.latestVersion} is available`, {
        description: `You have version ${update.currentVersion}.`,
        action: {
          label: 'Download',
          onClick: () => openLink(update.releaseUrl),
        },
      })
    } else {
      toast.success('You’re up to date', {
        description: `Version ${update.currentVersion} is the latest.`,
      })
    }

    return update
  } catch (error) {
    const description = error instanceof Error ? error.message : undefined
    toast.error('Failed to check for updates', { description })
    log.error(`Failed to check for updates: ${description ?? 'unknown error'}`)
    return null
  }
}

/** The app version, read on mount, and the result of the last `check()`. */
export const useAppUpdate = () => {
  const [version, setVersion] = useState<string | null>(null)
  const [update, setUpdate] = useState<UpdateCheck | null>(null)
  const [isChecking, setIsChecking] = useState(false)

  useEffect(() => {
    const loadVersion = async () => {
      try {
        setVersion(await getAppVersion())
      } catch (error) {
        log.error(
          `Failed to read the app version: ${error instanceof Error ? error.message : 'unknown error'}`
        )
      }
    }

    loadVersion()
  }, [])

  const check = async () => {
    setIsChecking(true)
    setUpdate(await runCheck())
    setIsChecking(false)
  }

  return { version, update, isChecking, check }
}
