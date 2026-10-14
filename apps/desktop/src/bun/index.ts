import { ApplicationMenu, BrowserWindow, Updater, Utils } from 'electrobun/main'

import { allowAutoplay } from './autoplay'
import { setWindowIcon } from './icon'
import { setUpdateStageSink } from './libs/update'
import { setHitSoundSink } from './libs/vts/hit-sound'
import { setLogSink } from './logger'
import { createAppRPC } from './rpc'
import { acquireSingleInstance } from './single-instance'

const channel = await Updater.localInfo.channel()

const getMainViewUrl = async () => {
  if (channel === 'dev') {
    try {
      const DEV_SERVER_URL = `http://localhost:5173`

      await fetch(DEV_SERVER_URL, { method: 'HEAD' })
      console.log(`Using the Vite dev server at ${DEV_SERVER_URL} for HMR`)
      return DEV_SERVER_URL
    } catch {
      console.log(
        "The Vite dev server is not running. Run 'bun run hmr' for HMR."
      )
    }
  }

  return 'views://mainview/index.html'
}

const main = async () => {
  const url = await getMainViewUrl()

  allowAutoplay()

  const mainWindow = new BrowserWindow({
    title: 'EasyDonate Connect',
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
  setUpdateStageSink(stage => mainWindow.webview.rpc?.send.updateStage(stage))
  setHitSoundSink(sound => mainWindow.webview.rpc?.send.hitSound(sound))
}

if (acquireSingleInstance(`app.ezdn.connect-${channel}`)) {
  await main()
} else {
  await Utils.showMessageBox({
    type: 'info',
    title: 'EasyDonate Connect',
    message: 'Application is already running',
  })
  Utils.quit()
}
