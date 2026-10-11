import { dlopen, FFIType, ptr } from 'bun:ffi'

import { logger } from './logger'

const VARIABLE = 'WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS'

const BROWSER_ARGUMENTS = [
  '--disable-features=msWebOOUI,msPdfOOUI,msSmartScreenProtection',
  '--allow-insecure-localhost',
  '--disable-web-security',
  '--disable-gpu',
  '--in-process-gpu',
  '--force-prefers-no-reduced-motion',
].join(' ')

const toWideString = (text: string) => Buffer.from(`${text}\0`, 'utf16le')

export const setWebView2Arguments = () => {
  if (process.platform !== 'win32') {
    return
  }

  const { _wputenv_s: putenv } = dlopen('ucrtbase.dll', {
    _wputenv_s: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
  }).symbols

  const result = putenv(
    ptr(toWideString(VARIABLE)),
    ptr(toWideString(BROWSER_ARGUMENTS))
  )
  if (result !== 0) {
    logger.warn(`Failed to set ${VARIABLE} (errno ${result})`)
  }
}
