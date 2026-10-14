import { dlopen, FFIType, ptr } from 'bun:ffi'

const ARGUMENTS_VARIABLE = 'WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS'
const AUTOPLAY_ARGUMENT = '--autoplay-policy=no-user-gesture-required'

const toWideString = (text: string) => Buffer.from(`${text}\0`, 'utf16le')

/**
 * Lets the webview play hit sounds before the user clicks it, which an auto
 * connect never needs. WebView2 keeps sound off until a click, but appends
 * this variable to the arguments Electrobun passes when it creates the
 * webview, which it does in this process, so call this before opening a
 * window. macOS and Linux webviews play sound without a click.
 */
export const allowAutoplay = () => {
  if (process.platform !== 'win32') {
    return
  }

  const kernel32 = dlopen('kernel32.dll', {
    SetEnvironmentVariableW: {
      args: [FFIType.ptr, FFIType.ptr],
      returns: FFIType.bool,
    },
  }).symbols

  const current = process.env[ARGUMENTS_VARIABLE]
  const value = current ? `${current} ${AUTOPLAY_ARGUMENT}` : AUTOPLAY_ARGUMENT

  // Through Win32 rather than `process.env`, which may not reach native code
  kernel32.SetEnvironmentVariableW(
    ptr(toWideString(ARGUMENTS_VARIABLE)),
    ptr(toWideString(value))
  )
}
