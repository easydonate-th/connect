import { Utils } from 'electrobun/main'
import fs from 'node:fs'

export const openDataFolder = () => {
  const folder = Utils.paths.userData

  // A fresh install has no data folder yet
  fs.mkdirSync(folder, { recursive: true })

  if (!Utils.openPath(folder)) {
    throw new Error(`Could not open ${folder}`)
  }

  return folder
}
