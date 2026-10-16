import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { useFormContext, useFormState } from 'react-hook-form'
import { toast } from 'sonner'

import UpdateProgress from '~/components/UpdateProgress'
import { useMessages } from '~/hooks/use-messages'
import { getMessages } from '~/libs/i18n'
import { log } from '~/libs/logs'
import {
  checkForUpdate,
  getAppVersion,
  installUpdate,
  openExternal,
} from '~/libs/rpc'
import { resetUpdateStage } from '~/libs/update-stage'

import type { Config } from '../../shared/config'
import type { Messages } from '../../shared/i18n'
import { describeError } from '../../shared/i18n/error'
import type { UpdateCheck } from '../../shared/rpc'

const RELEASES_URL = 'https://github.com/easydonate-th/connect/releases/latest'

type ToastTextProps = { text: (messages: Messages) => string }

/** Text of a toast that stays up, read on render so it follows the language */
const ToastText = ({ text }: ToastTextProps) => text(useMessages())

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
      toast.warning(getMessages().settings.saveFirst, {
        description: getMessages().settings.saveFirstDescription,
      })

      return
    }

    setIsInstalling(true)
    resetUpdateStage()

    const toastId = toast.loading(
      <ToastText text={m => m.settings.installing} />,
      { description: <UpdateProgress /> }
    )

    try {
      const newVersion = await installUpdate()
      toast.loading(
        <ToastText
          text={m => m.settings.restarting({ version: newVersion })}
        />,
        { id: toastId, description: undefined }
      )
    } catch (error) {
      toast.error(getMessages().settings.installFailed, {
        id: toastId,
        description: describeError(error, getMessages()),
        action: {
          label: getMessages().settings.download,
          onClick: () => openExternal(RELEASES_URL),
        },
      })
      log.error(
        `Failed to install update: ${describeError(error) ?? 'unknown error'}`
      )
      setIsInstalling(false)
    }
  }

  const showUpdateAvailable = (result: UpdateCheck) => {
    const m = getMessages()

    toast.info(m.settings.updateAvailable({ version: result.latestVersion }), {
      description: m.settings.currentVersion({
        version: result.currentVersion,
      }),
      action: { label: m.settings.update, onClick: install },
    })
  }

  const check = async () => {
    setIsChecking(true)

    try {
      const result = await checkForUpdate()

      if (result.updateAvailable) {
        showUpdateAvailable(result)
      } else {
        toast.success(getMessages().settings.upToDate, {
          description: getMessages().settings.isLatest({
            version: result.currentVersion,
          }),
        })
      }

      setUpdate(result)
    } catch (error) {
      toast.error(getMessages().settings.checkFailed, {
        description: describeError(error, getMessages()),
      })
      log.error(
        `Failed to check for updates: ${describeError(error) ?? 'unknown error'}`
      )
      setUpdate(null)
    }

    setIsChecking(false)
  }

  const handleLaunchCheck = useEffectEvent((result: UpdateCheck) => {
    if (result.updateAvailable) {
      showUpdateAvailable(result)
    }

    setUpdate(result)
  })

  useEffect(() => {
    isDirtyRef.current = isDirty
  }, [isDirty])

  useEffect(() => {
    const loadVersion = async () => {
      try {
        setVersion(await getAppVersion())
      } catch (error) {
        log.error(
          `Failed to read the app version: ${describeError(error) ?? 'unknown error'}`
        )
      }
    }

    loadVersion()
  }, [])

  useEffect(() => {
    let isCancelled = false

    const checkOnLaunch = async () => {
      setIsChecking(true)

      try {
        const result = await checkForUpdate()

        if (!isCancelled) {
          handleLaunchCheck(result)
        }
      } catch (error) {
        if (isCancelled) {
          return
        }

        log.warn(
          `Failed to check for updates on launch: ${describeError(error) ?? 'unknown error'}`
        )
      }

      setIsChecking(false)
    }

    checkOnLaunch()

    return () => {
      isCancelled = true
    }
  }, [])

  return { version, update, isChecking, isInstalling, check, install }
}
