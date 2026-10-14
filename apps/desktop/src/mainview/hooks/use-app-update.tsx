import { useEffect, useRef, useState } from 'react'
import { useFormContext, useFormState } from 'react-hook-form'
import { toast } from 'sonner'

import UpdateProgress from '~/components/UpdateProgress'
import { log } from '~/libs/logs'
import {
  checkForUpdate,
  getAppVersion,
  installUpdate,
  openExternal,
} from '~/libs/rpc'
import { resetUpdateStage } from '~/libs/update-stage'

import type { Config } from '../../shared/config'
import type { UpdateCheck } from '../../shared/rpc'

const RELEASES_URL = 'https://github.com/easydonate-th/connect/releases/latest'

export const useAppUpdate = () => {
  const [version, setVersion] = useState<string | null>(null)
  const [update, setUpdate] = useState<UpdateCheck | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)

  const { control } = useFormContext<Config>()
  const { isDirty } = useFormState({ control })
  // The check's toast calls install later, after the draft may have changed
  const isDirtyRef = useRef(isDirty)

  const install = async () => {
    // Restarting would drop the draft without asking
    if (isDirtyRef.current) {
      toast.warning('Save your changes first', {
        description: 'Updating restarts the app, which discards them.',
      })
      return
    }

    setIsInstalling(true)
    resetUpdateStage()
    const toastId = toast.loading('Installing update', {
      description: <UpdateProgress />,
    })

    try {
      const newVersion = await installUpdate()
      toast.loading(`Restarting into version ${newVersion}`, {
        id: toastId,
        description: undefined,
      })
    } catch (error) {
      const description = error instanceof Error ? error.message : undefined
      toast.error('Failed to install update', {
        id: toastId,
        description,
        action: {
          label: 'Download',
          onClick: () => openExternal(RELEASES_URL),
        },
      })
      log.error(`Failed to install update: ${description ?? 'unknown error'}`)
      setIsInstalling(false)
    }
  }

  const check = async () => {
    setIsChecking(true)

    try {
      const result = await checkForUpdate()

      if (result.updateAvailable) {
        toast.info(`Version ${result.latestVersion} is available`, {
          description: `You have version ${result.currentVersion}.`,
          action: { label: 'Update', onClick: install },
        })
      } else {
        toast.success('You’re up to date', {
          description: `Version ${result.currentVersion} is the latest.`,
        })
      }

      setUpdate(result)
    } catch (error) {
      const description = error instanceof Error ? error.message : undefined
      toast.error('Failed to check for updates', { description })
      log.error(
        `Failed to check for updates: ${description ?? 'unknown error'}`
      )
      setUpdate(null)
    }

    setIsChecking(false)
  }

  useEffect(() => {
    isDirtyRef.current = isDirty
  }, [isDirty])

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

  return { version, update, isChecking, isInstalling, check, install }
}
