import { Utils } from 'electrobun/main'
import fs from 'node:fs/promises'
import path from 'node:path'

import { logger } from '../../logger'

type UserFile = { fileName: string; name: string }

type UserFileImport = { added: UserFile[]; rejected: string[] }

const getFolder = (folderName: string) =>
  path.join(Utils.paths.userData, folderName)

export const startsWith = (bytes: Uint8Array, prefix: number[]) =>
  prefix.every((byte, index) => bytes[index] === byte)

/**
 * Writes `bytes` to `userData/<folderName>` as `<8 hex>.<extension>` and returns
 * the file name. VTube Studio accepts it for an image, since it wants 8-32
 * letters, digits or hyphens with the extension.
 */
export const writeUserFile = async (
  folderName: string,
  extension: string,
  bytes: Uint8Array
) => {
  const folder = getFolder(folderName)
  const fileName = `${crypto.randomUUID().slice(0, 8)}.${extension}`

  await fs.mkdir(folder, { recursive: true })
  await fs.writeFile(path.join(folder, fileName), bytes)

  return fileName
}

/**
 * Copies the files the user picks into `userData/<folderName>` with
 * `writeUserFile`. `check` returns a file's extension, or throws why the app
 * can't use it.
 */
export const importUserFiles = async (
  folderName: string,
  kind: string,
  check: (bytes: Uint8Array) => string
): Promise<UserFileImport> => {
  const paths = await Utils.openFileDialog({
    // No filter, because on Windows, Electrobun makes one filter per extension
    // and shows only the first, which hides the other types. `check` rejects
    // unusable files instead.
    allowedFileTypes: '*',
    canChooseFiles: true,
    canChooseDirectory: false,
    allowsMultipleSelection: true,
  })

  const result: UserFileImport = { added: [], rejected: [] }

  for (const sourcePath of paths.filter(Boolean)) {
    const name = path.basename(sourcePath)

    try {
      const bytes = new Uint8Array(await fs.readFile(sourcePath))
      const fileName = await writeUserFile(folderName, check(bytes), bytes)

      result.added.push({ fileName, name })
    } catch (error) {
      result.rejected.push(
        `${name}: ${error instanceof Error ? error.message : 'unknown error'}`
      )
    }
  }

  for (const reason of result.rejected) {
    logger.warn(`[VTS] ${kind} not added, ${reason}`)
  }

  return result
}

export const readUserFile = async (folderName: string, fileName: string) => {
  const bytes = await fs.readFile(path.join(getFolder(folderName), fileName))

  return bytes.toString('base64')
}

export const pruneUserFiles = async (folderName: string, keep: UserFile[]) => {
  const folder = getFolder(folderName)
  const kept = new Set(keep.map(file => file.fileName))
  let fileNames: string[]

  try {
    fileNames = await fs.readdir(folder)
  } catch {
    // The folder doesn't exist until the user imports a file
    return
  }

  await Promise.all(
    fileNames
      .filter(fileName => !kept.has(fileName))
      .map(fileName => fs.rm(path.join(folder, fileName), { force: true }))
  )
}
