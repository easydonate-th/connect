import { SaveIcon, TerminalIcon } from 'lucide-react'
import { use, useState } from 'react'
import { FormProvider } from 'react-hook-form'

import Integrations from '~/components/Integrations'
import LogsPanel from '~/components/LogsPanel'
import Settings from '~/components/Settings'
import { Button } from '~/components/ui/button'
import { Spinner } from '~/components/ui/spinner'
import WidgetConnection from '~/components/WidgetConnection'
import { initialConfigPromise, useConfigForm } from '~/hooks/use-config-form'
import { useUnsavedChangesToast } from '~/hooks/use-unsaved-changes-toast'
import { useWidgetConnection } from '~/hooks/use-widget-connection'
import { openExternal } from '~/libs/rpc'
import { cn } from '~/libs/utils'

const App = () => {
  const initialConfig = use(initialConfigPromise)

  const [isLogsOpen, setIsLogsOpen] = useState(false)

  const {
    status,
    socketUrl,
    invalidUrl,
    lastDonation,
    connect,
    disconnect,
    sendTestDonation,
  } = useWidgetConnection(initialConfig)

  const { form, save } = useConfigForm(initialConfig)

  const { isDirty, isValid, isSubmitting } = form.formState

  // Tests what the form shows, saved or not
  const handleSendTest = () => sendTestDonation(form.getValues())

  useUnsavedChangesToast({
    isDirty,
    isValid,
    isSaving: isSubmitting,
    onSave: save,
  })

  return (
    <FormProvider {...form}>
      <div className="bg-background min-h-screen">
        <main
          className={cn(
            'container mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10',
            { 'pb-32': isDirty }
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
            status={status}
            socketUrl={socketUrl}
            invalidUrl={invalidUrl}
            lastDonation={lastDonation}
            onConnect={connect}
            onDisconnect={disconnect}
            onSendTest={handleSendTest}
          />
          <Integrations
            canSendTest={socketUrl === null}
            onSendTest={handleSendTest}
          />
          <Settings />
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
            <div className="ml-auto flex items-center gap-3">
              <Button
                size="lg"
                className="h-11 min-w-40 px-6 text-base [&_svg:not([class*='size-'])]:size-5"
                disabled={!isDirty || !isValid || isSubmitting}
                onClick={save}
              >
                {isSubmitting ? <Spinner /> : <SaveIcon />}
                Save
              </Button>
            </div>
          </div>
          {isLogsOpen && <LogsPanel />}
          <footer className="text-muted-foreground text-center text-xs">
            Hit sounds from{' '}
            <Button
              variant="link"
              className="h-auto p-0 text-xs"
              onClick={() =>
                openExternal('https://kenney.nl/assets/impact-sounds')
              }
            >
              Impact Sounds by Kenney
            </Button>
            , CC0
          </footer>
        </main>
      </div>
    </FormProvider>
  )
}

export default App
