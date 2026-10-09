import { use, useState } from 'react'
import { toast } from 'sonner'

import { log } from '~/libs/logs'
import { getConfig, saveConfig } from '~/libs/rpc'

import {
  Config,
  createDefaultConfig,
  isValidConfig,
  MIDIConfig,
  OSCConfig,
} from '../../shared/config'

const loadInitialConfig = async (): Promise<Config> => {
  try {
    return await getConfig()
  } catch (error) {
    log.warn(
      `Failed to load settings, using defaults: ${error instanceof Error ? error.message : 'unknown error'}`
    )
    return createDefaultConfig()
  }
}

/** Saves `config`, returning the stored value or `null` after a toast. */
const persistConfig = async (config: Config): Promise<Config | null> => {
  try {
    return await saveConfig(config)
  } catch (error) {
    const description = error instanceof Error ? error.message : undefined
    toast.error('Failed to save settings', { description })
    log.error(`Failed to save settings: ${description ?? 'unknown error'}`)
    return null
  }
}

// Started once at startup and shared across renders so `use` can suspend on it
const initialConfigPromise = loadInitialConfig()

const isSameConfig = (a: Config, b: Config) =>
  JSON.stringify(a) === JSON.stringify(b)

/**
 * Holds an editable draft of the config. Suspends until the stored config
 * has loaded from the main process.
 */
export const useConfig = () => {
  const initialConfig = use(initialConfigPromise)

  const [savedConfig, setSavedConfig] = useState(initialConfig)
  const [config, setConfig] = useState(initialConfig)
  const [isSaving, setIsSaving] = useState(false)

  const setWidgetUrl = (widgetUrl: string) =>
    setConfig(current => ({ ...current, widgetUrl }))

  const setAutoConnect = (autoConnect: boolean) =>
    setConfig(current => ({ ...current, autoConnect }))

  const updateOSC = (patch: Partial<OSCConfig>) =>
    setConfig(current => ({
      ...current,
      vrc: { ...current.vrc, osc: { ...current.vrc.osc, ...patch } },
    }))

  const updateMIDI = (patch: Partial<MIDIConfig>) =>
    setConfig(current => ({
      ...current,
      vrc: { ...current.vrc, midi: { ...current.vrc.midi, ...patch } },
    }))

  const save = async () => {
    setIsSaving(true)
    const stored = await persistConfig(config)
    setIsSaving(false)

    if (stored) {
      setSavedConfig(stored)
      setConfig(stored)
      toast.success('Settings saved')
      log.info('Settings saved')
    }
  }

  return {
    config,
    savedConfig,
    isDirty: !isSameConfig(config, savedConfig),
    isValid: isValidConfig(config),
    isSaving,
    setWidgetUrl,
    setAutoConnect,
    updateOSC,
    updateMIDI,
    save,
  }
}
