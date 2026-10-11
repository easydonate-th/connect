import { ApplicationMenu, BrowserWindow, Updater, Utils } from 'electrobun/main'

import { setWindowIcon } from './icon'
import { setLogSink } from './logger'
import { createAppRPC } from './rpc'
import { acquireSingleInstance } from './single-instance'
import { setWebView2Arguments } from './webview2'

const APP_NAME = 'EasyDonate Connect'

const channel = await Updater.localInfo.channel()

const getMainViewUrl = async () => {
  if (channel === 'dev') {
    try {
      const DEV_SERVER_URL = `http://localhost:5173`

      await fetch(DEV_SERVER_URL, { method: 'HEAD' })
      console.log(`HMR enabled: Using Vite dev server at ${DEV_SERVER_URL}`)
      return DEV_SERVER_URL
    } catch {
      console.log(
        "Vite dev server not running. Run 'bun run hmr' for HMR support."
      )
    }
  }

  return 'views://mainview/index.html'
}

const startApp = async () => {
  setWebView2Arguments()

  const url = await getMainViewUrl()

  const mainWindow = new BrowserWindow({
    title: APP_NAME,
    url,
    rpc: createAppRPC(),
    // Serves `userData` as `appdata://`, for thumbnails of the user's images
    allowedProtocols: { appData: true },
    frame: { width: 800, height: 720, x: 200, y: 200 },
  })

  setWindowIcon(mainWindow)

  ApplicationMenu.setApplicationMenu([
    {
      label: 'App',
      submenu: [{ role: 'quit' }],
    },
    {
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
}

if (acquireSingleInstance(`app.ezdn.connect-${channel}`)) {
  await startApp()
} else {
  await Utils.showMessageBox({
    type: 'info',
    title: APP_NAME,
    message: `${APP_NAME} is already running.`,
  })
  Utils.quit()
}
