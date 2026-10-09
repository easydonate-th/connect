import { dlopen, FFIType, ptr } from 'bun:ffi'

import { logger } from './logger'

const VARIABLE = 'WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS'

const BROWSER_ARGUMENTS = [
  // Electrobun's own arguments, copied from its libNativeWrapper.dll because
  // the variable replaces them; recheck on Electrobun upgrades
  '--disable-features=msWebOOUI,msPdfOOUI,msSmartScreenProtection',
  '--allow-insecure-localhost',
  '--disable-web-security',
  // Software rendering in the browser process cuts WebView2 memory by ~45 MB
  '--disable-gpu',
  '--in-process-gpu',
].join(' ')

const toWideString = (text: string) => Buffer.from(`${text}\0`, 'utf16le')

/**
 * Sets the WebView2 browser arguments. WebView2 reads them from the C runtime
 * environment, which `process.env` writes don't reach, so they are set with
 * `_wputenv_s`. Call before any webview is created. Windows only.
 */
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
