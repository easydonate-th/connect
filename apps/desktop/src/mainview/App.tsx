import { FolderOpenIcon, SaveIcon, TerminalIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import Integrations from '~/components/Integrations'
import LogsPanel from '~/components/LogsPanel'
import { Button } from '~/components/ui/button'
import { Spinner } from '~/components/ui/spinner'
import WidgetConnection from '~/components/WidgetConnection'
import { useConfig } from '~/hooks/use-config'
import { useUnsavedChangesToast } from '~/hooks/use-unsaved-changes-toast'
import { useWidgetSocket } from '~/hooks/use-widget-socket'
import { log } from '~/libs/logs'
import { openDataFolder, sendDonation } from '~/libs/rpc'
import { cn, getSocketUrl } from '~/libs/utils'

import { Donation } from '../shared/donation'

const showDataFolder = async () => {
  try {
    await openDataFolder()
  } catch (error) {
    const description = error instanceof Error ? error.message : undefined
    toast.error('Failed to open data folder', { description })
    log.error(`Failed to open data folder: ${description ?? 'unknown error'}`)
  }
}

const App = () => {
  const {
    config,
    isDirty,
    isValid,
    isSaving,
    savedConfig,
    setWidgetUrl,
    setAutoConnect,
    updateOSC,
    updateMIDI,
    updateVTSThrow,
    save,
  } = useConfig()

  useUnsavedChangesToast({ isDirty, isValid, isSaving, onSave: save })

  const [socketUrl, setSocketUrl] = useState(() =>
    savedConfig.autoConnect ? getSocketUrl(savedConfig.widgetUrl) : null
  )
  const [isUrlInvalid, setIsUrlInvalid] = useState(false)
  const [lastDonation, setLastDonation] = useState<Donation | null>(null)
  const [isLogsOpen, setIsLogsOpen] = useState(false)

  const handleDonation = (donation: Donation) => {
    log.info(
      `Donation ${donation.referenceNo}: ${donation.donatorName || 'Anonymous'} donated ${donation.amount} THB`
    )
    setLastDonation(donation)
    sendDonation(donation)
  }

  const status = useWidgetSocket(socketUrl, handleDonation)

  const handleSendTest = () => {
    const timestamp = Date.now()

    handleDonation({
      referenceNo: `TEST-${timestamp}`,
      donatorName: 'Test Donor',
      message: 'This is a test donation',
      amount: 100,
      timestamp,
    })
  }

  const handleWidgetUrlChange = (widgetUrl: string) => {
    setWidgetUrl(widgetUrl)
    setIsUrlInvalid(false)
  }

  const handleConnect = () => {
    const nextSocketUrl = getSocketUrl(config.widgetUrl)

    setIsUrlInvalid(nextSocketUrl === null)
    setSocketUrl(nextSocketUrl)

    if (nextSocketUrl) {
      log.info('Connecting to alert widget')
    } else {
      log.warn('Invalid alert widget URL')
    }
  }

  const handleDisconnect = () => {
    setSocketUrl(null)
    log.info('Disconnected from alert widget')
  }

  return (
    <div className="bg-background min-h-screen">
      <main
        className={cn(
          'container mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10',
          // Keeps the bottom row clear of the unsaved changes toast
          isDirty && 'pb-32'
        )}
      >
        <header className="flex flex-col gap-1 text-center">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            EasyDonate Connect
          </h1>
          <p className="text-muted-foreground text-sm">
            Forward donations to your destination
          </p>
        </header>
        <WidgetConnection
          widgetUrl={config.widgetUrl}
          onWidgetUrlChange={handleWidgetUrlChange}
          autoConnect={config.autoConnect}
          onAutoConnectChange={setAutoConnect}
          status={status}
          isActive={
            socketUrl !== null && socketUrl === getSocketUrl(config.widgetUrl)
          }
          isUrlInvalid={isUrlInvalid}
          lastDonation={lastDonation}
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
          canSendTest={socketUrl === null}
          onSendTest={handleSendTest}
        />
        <Integrations
          vrc={config.vrc}
          onOSCChange={updateOSC}
          onMIDIChange={updateMIDI}
          vts={config.vts}
          onVTSThrowChange={updateVTSThrow}
          canSendTest={socketUrl === null}
          onSendTest={handleSendTest}
        />
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="lg"
            className="h-11 px-4"
            aria-expanded={isLogsOpen}
            aria-controls="logs-panel"
            onClick={() => setIsLogsOpen(open => !open)}
          >
            <TerminalIcon />
            {isLogsOpen ? 'Hide logs' : 'Logs'}
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="h-11 px-4"
            onClick={showDataFolder}
          >
            <FolderOpenIcon />
            Data folder
          </Button>
          <div className="ml-auto flex items-center gap-3">
            <Button
              size="lg"
              className="h-11 min-w-40 px-6 text-base [&_svg:not([class*='size-'])]:size-5"
              disabled={!isDirty || !isValid || isSaving}
              onClick={save}
            >
              {isSaving ? <Spinner /> : <SaveIcon />}
              Save
            </Button>
          </div>
        </div>
        {isLogsOpen && <LogsPanel />}
      </main>
    </div>
  )
}

export default App
