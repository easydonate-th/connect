import { Utils } from 'electrobun/main'
import fs from 'node:fs'
import path from 'node:path'

import { Config, ConfigSchema, createDefaultConfig } from '../shared/config'
import { logger } from './logger'

const getConfigPath = () => path.join(Utils.paths.userData, 'config.json')

const readConfigFile = (): Config => {
  const configPath = getConfigPath()

  if (!fs.existsSync(configPath)) {
    return createDefaultConfig()
  }

  try {
    return ConfigSchema.parse(JSON.parse(fs.readFileSync(configPath, 'utf-8')))
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

export const getConfig = (): Config => {
  currentConfig ??= readConfigFile()

  return currentConfig
}

export const saveConfig = (config: Config): Config => {
  currentConfig = ConfigSchema.parse(config)
  writeConfigFile(currentConfig)

  return currentConfig
}
