import { ApplicationMenu, BrowserWindow, Updater } from 'electrobun/main'

import { setLogSink } from './logger'
import { createAppRPC } from './rpc'

const getMainViewUrl = async () => {
  const channel = await Updater.localInfo.channel()

  if (channel === 'dev') {
    try {
      const DEV_SERVER_URL = `http://localhost:5173`

      await fetch(DEV_SERVER_URL, { method: 'HEAD' })
      console.log(`HMR enabled: Using Vite dev server at ${DEV_SERVER_URL}`)
      return DEV_SERVER_URL
    } catch {
      console.log(
        "Vite dev server not running. Run 'hutch run dev:hmr' for HMR support."
      )
    }
  }

  return 'views://mainview/index.html'
}

const url = await getMainViewUrl()

const mainWindow = new BrowserWindow({
  title: 'EasyDonate Connect',
  url,
  rpc: createAppRPC(),
  frame: { width: 800, height: 720, x: 200, y: 200 },
})

ApplicationMenu.setApplicationMenu([
  {
    label: 'App',
    submenu: [{ role: 'quit' }],
  },
  {
    // Needed on macOS for copy/paste shortcuts to work in inputs
    label: 'Edit',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      { role: 'selectAll' },
    ],
  },
])

setLogSink(entry => mainWindow.webview.rpc?.send.log(entry))

console.log(`${mainWindow.title} app started!`)
