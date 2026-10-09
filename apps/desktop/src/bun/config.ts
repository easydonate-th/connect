import { Utils } from 'electrobun/main'
import fs from 'node:fs'
import path from 'node:path'

import { Config, createDefaultConfig, normalizeConfig } from '../shared/config'
import { logger } from './logger'

const CONFIG_FILE_NAME = 'config.json'

const getConfigPath = () => path.join(Utils.paths.userData, CONFIG_FILE_NAME)

const readConfigFile = (): Config => {
  const configPath = getConfigPath()

  if (!fs.existsSync(configPath)) {
    return createDefaultConfig()
  }

  try {
    return normalizeConfig(JSON.parse(fs.readFileSync(configPath, 'utf-8')))
  } catch (error) {
    logger.warn(
      `Failed to read ${configPath}, using defaults`,
      error instanceof Error ? error : undefined
    )
    return createDefaultConfig()
  }
}

const writeConfigFile = (config: Config) => {
  const configPath = getConfigPath()
  const tempPath = `${configPath}.tmp`

  fs.mkdirSync(path.dirname(configPath), { recursive: true })
  // Write then rename so a crash mid-write never leaves a truncated config
  fs.writeFileSync(tempPath, JSON.stringify(config, null, 2))
  fs.renameSync(tempPath, configPath)
}

let currentConfig: Config | undefined

/** Returns the in-memory config, loading it from disk on first access. */
export const getConfig = (): Config => {
  currentConfig ??= readConfigFile()

  return currentConfig
}

/** Validates, persists and caches `config`, returning the stored value. */
export const saveConfig = (config: Config): Config => {
  const normalized = normalizeConfig(config)

  writeConfigFile(normalized)
  currentConfig = normalized

  return normalized
}
