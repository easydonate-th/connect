import { dlopen, FFIType, ptr } from 'bun:ffi'

const SYNCHRONIZE = 0x00_10_00_00

const toWideString = (text: string) => Buffer.from(`${text}\0`, 'utf16le')

/**
 * Returns false when another instance already holds the mutex `name`. Two
 * instances would each connect to the widget and forward every donation
 * twice. Checks with `OpenMutexW` instead of `CreateMutexW` plus
 * `GetLastError`, since the runtime can overwrite the last error between FFI
 * calls. Windows only.
 */
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

  // Local\ scopes the mutex to the signed-in Windows session
  const mutexName = toWideString(`Local\\${name}`)
  const existing = kernel32.OpenMutexW(SYNCHRONIZE, false, ptr(mutexName))
  if (existing) {
    kernel32.CloseHandle(existing)
    return false
  }

  // The handle is never closed, so the mutex lives until the process exits
  kernel32.CreateMutexW(null, false, ptr(mutexName))
  return true
}
