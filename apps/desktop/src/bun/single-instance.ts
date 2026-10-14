import { dlopen, FFIType, ptr } from 'bun:ffi'
import { Utils } from 'electrobun/main'
import fs from 'node:fs'
import path from 'node:path'

const SYNCHRONIZE = 0x00_10_00_00
const LOCK_EX_NB = 6

const toWideString = (text: string) => Buffer.from(`${text}\0`, 'utf16le')

const acquireMutex = (name: string) => {
  const kernel32 = dlopen('kernel32.dll', {
    OpenMutexW: {
      args: [FFIType.u32, FFIType.bool, FFIType.ptr],
      returns: FFIType.ptr,
    },
    CreateMutexW: {
      args: [FFIType.ptr, FFIType.bool, FFIType.ptr],
      returns: FFIType.ptr,
    },
    CloseHandle: { args: [FFIType.ptr], returns: FFIType.bool },
  }).symbols

  const mutexName = toWideString(`Local\\${name}`)
  const exist = kernel32.OpenMutexW(SYNCHRONIZE, false, ptr(mutexName))

  if (exist) {
    kernel32.CloseHandle(exist)

    return false
  }

  kernel32.CreateMutexW(null, false, ptr(mutexName))

  return true
}

let lockFile: number | undefined

const acquireFileLock = (name: string) => {
  let libc

  try {
    libc = dlopen(process.platform === 'darwin' ? 'libc.dylib' : 'libc.so.6', {
      flock: { args: [FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    }).symbols
  } catch {
    return true
  }

  fs.mkdirSync(Utils.paths.userData, { recursive: true })
  lockFile = fs.openSync(path.join(Utils.paths.userData, `${name}.lock`), 'w')

  return libc.flock(lockFile, LOCK_EX_NB) === 0
}

export const acquireSingleInstance = (name: string) =>
  process.platform === 'win32' ? acquireMutex(name) : acquireFileLock(name)
