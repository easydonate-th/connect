import { useEffect } from 'react'
import { set, useForm, useFormContext } from 'react-hook-form'
import type { FieldErrors, Resolver, UseFormReturn } from 'react-hook-form'
import { toast } from 'sonner'

import { log } from '~/libs/logs'
import { getConfig, saveConfig } from '~/libs/rpc'

import {
  Config,
  ConfigSchema,
  createDefaultConfig,
  validateConfig,
} from '../../shared/config'

// A main process built before a field existed leaves it out, which would show
// an empty, invalid input instead of the field's default
const loadInitialConfig = async (): Promise<Config> => {
  try {
    return ConfigSchema.parse(await getConfig())
  } catch (error) {
    log.warn(
      `Failed to load settings, using defaults: ${error instanceof Error ? error.message : 'unknown error'}`
    )

    return createDefaultConfig()
  }
}

/**
 * Saves `config` and returns the stored value. On failure, it shows a toast
 * and returns `null`.
 */
const persistConfig = async (config: Config): Promise<Config | null> => {
  try {
    return ConfigSchema.parse(await saveConfig(config))
  } catch (error) {
    const description = error instanceof Error ? error.message : undefined
    toast.error('Failed to save settings', { description })
    log.error(`Failed to save settings: ${description ?? 'unknown error'}`)

    return null
  }
}

/**
 * Starts loading once at startup, so `use` gets the same promise on every
 * render.
 */
export const initialConfigPromise = loadInitialConfig()

const resolveConfig: Resolver<Config> = values => {
  const messages = Object.entries(validateConfig(values))

  if (messages.length === 0) {
    return { values, errors: {} }
  }

  const errors: FieldErrors<Config> = {}

  for (const [path, message] of messages) {
    set(errors, path, { type: 'validate', message })
  }

  return { values: {}, errors }
}

const createSave = (
  {
    handleSubmit,
    reset,
  }: Pick<UseFormReturn<Config>, 'handleSubmit' | 'reset'>,
  onSaved?: () => void
) =>
  handleSubmit(async values => {
    const stored = await persistConfig(values)

    if (stored) {
      reset(stored)
      log.info('Settings saved')
      onSaved?.()
    }
  })

/**
 * The config form, starting from the stored `config`. `save` sends it to the
 * main process, which sorts the rules and prunes picks no longer in the tabs.
 * `save` then resets the form to the config the main process stored.
 */
export const useConfigForm = (config: Config) => {
  const form = useForm<Config>({
    defaultValues: config,
    resolver: resolveConfig,
  })

  const { subscribe, trigger } = form

  // RHF revalidates only the field that changed, but many checks span fields,
  // such as an output's switch and its device or items, or Min THB across
  // throw rules. So every change revalidates the whole config.
  useEffect(() => {
    trigger()

    return subscribe({
      formState: { values: true },
      callback: () => {
        trigger()
      },
    })
  }, [subscribe, trigger])

  const save = createSave(form)

  return { form, save }
}

/**
 * `save` of the provided config form, for Save buttons outside `App`. It calls
 * `onSaved` once the main process has stored the config.
 */
export const useConfigSave = (onSaved?: () => void) =>
  createSave(useFormContext<Config>(), onSaved)
