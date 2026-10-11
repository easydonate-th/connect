import { dlopen, FFIType, ptr } from 'bun:ffi'

const SYNCHRONIZE = 0x00_10_00_00

const toWideString = (text: string) => Buffer.from(`${text}\0`, 'utf16le')

export const acquireSingleInstance = (name: string) => {
  if (process.platform !== 'win32') {
    return true
  }

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
