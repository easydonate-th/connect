import { Utils } from 'electrobun/main'
import fs from 'node:fs'

export const openDataFolder = () => {
  const folder = Utils.paths.userData
  fs.mkdirSync(folder, { recursive: true })

  if (!Utils.openPath(folder)) {
    throw new Error(`Could not open ${folder}`)
  }

  return folder
}
