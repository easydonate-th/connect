import {
  DownloadIcon,
  ExternalLinkIcon,
  FolderOpenIcon,
  RefreshCwIcon,
  SettingsIcon,
} from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { Spinner } from '~/components/ui/spinner'
import { useAppUpdate } from '~/hooks/use-app-update'
import { log } from '~/libs/logs'
import { openDataFolder, openExternal } from '~/libs/rpc'

const showDataFolder = async () => {
  try {
    await openDataFolder()
  } catch (error) {
    const description = error instanceof Error ? error.message : undefined
    toast.error('Failed to open data folder', { description })
    log.error(`Failed to open data folder: ${description ?? 'unknown error'}`)
  }
}

const Settings = () => {
  const { version, update, isChecking, isInstalling, check, install } =
    useAppUpdate()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SettingsIcon className="text-muted-foreground size-4" />
          Settings
        </CardTitle>
        <CardDescription>App version, updates and data</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium">Version</span>
          <span className="text-muted-foreground tabular-nums">
            {version || 'Unknown'}
          </span>
          {update?.updateAvailable && (
            <Badge variant="secondary">{update.latestVersion} available</Badge>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={showDataFolder}>
            <FolderOpenIcon />
            Data folder
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              openExternal('https://github.com/easydonate-th/connect')
            }
          >
            <ExternalLinkIcon />
            GitHub
          </Button>
          {update?.updateAvailable ? (
            <Button disabled={isInstalling} onClick={install}>
              {isInstalling ? <Spinner /> : <DownloadIcon />}
              Update and restart
            </Button>
          ) : (
            <Button variant="outline" disabled={isChecking} onClick={check}>
              {isChecking ? <Spinner /> : <RefreshCwIcon />}
              Check for updates
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default Settings
