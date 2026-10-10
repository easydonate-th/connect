import { dlopen, FFIType, ptr } from 'bun:ffi'
import type { BrowserWindow } from 'electrobun/main'
import { PATHS } from 'electrobun/main'
import path from 'node:path'

import { logger } from './logger'

const IMAGE_ICON = 1
const LR_LOADFROMFILE = 0x10
const WM_SETICON = 0x80
const ICON_SMALL = 0
const ICON_BIG = 1

const toWideString = (text: string) => Buffer.from(`${text}\0`, 'utf16le')

/**
 * Sets the window's title bar and taskbar icon to `Resources/app.ico`, which
 * Hutch copies from `build.win.icon`. Hutch embeds that icon in the exes, but
 * Electrobun registers its window class without one and never sends
 * `WM_SETICON`, so the window shows the default icon. Windows only.
 */
export const setWindowIcon = (window: BrowserWindow) => {
  if (process.platform !== 'win32') {
    return
  }

  const user32 = dlopen('user32.dll', {
    IsWindow: { args: [FFIType.ptr], returns: FFIType.bool },
    LoadImageW: {
      args: [
        FFIType.ptr,
        FFIType.ptr,
        FFIType.u32,
        FFIType.i32,
        FFIType.i32,
        FFIType.u32,
      ],
      returns: FFIType.ptr,
    },
    GetSystemMetrics: { args: [FFIType.i32], returns: FFIType.i32 },
    SendMessageW: {
      args: [FFIType.ptr, FFIType.u32, FFIType.u64, FFIType.ptr],
      returns: FFIType.ptr,
    },
  }).symbols

  const hwnd = window.ptr
  if (!hwnd || !user32.IsWindow(hwnd)) {
    logger.warn('Failed to set window icon: no window handle')
    return
  }

  const iconPath = ptr(
    toWideString(path.join(PATHS.RESOURCES_FOLDER, 'app.ico'))
  )
  // SM_CXICON/SM_CYICON (11/12) and SM_CXSMICON/SM_CYSMICON (49/50)
  const sizes = [
    [ICON_BIG, 11, 12],
    [ICON_SMALL, 49, 50],
  ] as const

  for (const [kind, cx, cy] of sizes) {
    const icon = user32.LoadImageW(
      null,
      iconPath,
      IMAGE_ICON,
      user32.GetSystemMetrics(cx),
      user32.GetSystemMetrics(cy),
      LR_LOADFROMFILE
    )
    if (!icon) {
      logger.warn('Failed to load Resources/app.ico')
      return
    }
    user32.SendMessageW(hwnd, WM_SETICON, kind, icon)
  }
}
