import { ApplicationMenu, BrowserWindow, Updater, Utils } from 'electrobun/main'

import { allowAutoplay } from './autoplay'
import { setWindowIcon } from './icon'
import { getMessages } from './language'
import { logLaunch, setUpdateStageSink } from './libs/update'
import { setHitSoundSink } from './libs/vts/hit-sound'
import { setWidgetSink } from './libs/widget/socket'
import { startLogFiles } from './log-file'
import { logger, setLogSink } from './logger'
import { acquireSingleInstance } from './mutex'
import { createAppRPC } from './rpc'

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

const setMenu = () => {
  const { menu } = getMessages().app

  ApplicationMenu.setApplicationMenu([
    {
      label: menu.app,
      submenu: [{ role: 'quit', label: menu.quit }],
    },
    {
      label: menu.edit,
      submenu: [
        { role: 'undo', label: menu.undo },
        { role: 'redo', label: menu.redo },
        { type: 'separator' },
        { role: 'cut', label: menu.cut },
        { role: 'copy', label: menu.copy },
        { role: 'paste', label: menu.paste },
        { role: 'selectAll', label: menu.selectAll },
      ],
    },
  ])
}

const main = async () => {
  try {
    startLogFiles()
  } catch (error) {
    logger.warn(
      'Failed to open the log files',
      error instanceof Error ? error : undefined
    )
  }

  await logLaunch()

  const url = await getMainViewUrl()

  allowAutoplay()

  const mainWindow = new BrowserWindow({
    title: 'EasyDonate Connect',
    url,
    rpc: createAppRPC({ onLanguageChange: setMenu }),
    allowedProtocols: { appData: true },
    frame: { width: 800, height: 720, x: 200, y: 200 },
  })

  setWindowIcon(mainWindow)

  setMenu()

  setLogSink(entry => mainWindow.webview.rpc?.send.log(entry))
  setUpdateStageSink(stage => mainWindow.webview.rpc?.send.updateStage(stage))
  setHitSoundSink(sound => mainWindow.webview.rpc?.send.hitSound(sound))
  setWidgetSink({
    state: state => mainWindow.webview.rpc?.send.widgetState(state),
    rawFrame: frame => mainWindow.webview.rpc?.send.rawFrame(frame),
    donation: donation => mainWindow.webview.rpc?.send.donation(donation),
  })
}

if (acquireSingleInstance(`app.ezdn.connect-${channel}`)) {
  await main()
} else {
  await Utils.showMessageBox({
    type: 'info',
    title: 'EasyDonate Connect',
    message: getMessages().app.alreadyRunning,
  })
  Utils.quit()
}
