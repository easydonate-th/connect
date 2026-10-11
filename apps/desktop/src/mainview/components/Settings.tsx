import {
  DownloadIcon,
  ExternalLinkIcon,
  RefreshCwIcon,
  SettingsIcon,
} from 'lucide-react'

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
import { openExternal } from '~/libs/rpc'

const Settings = () => {
  const { version, update, isChecking, check } = useAppUpdate()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SettingsIcon className="text-muted-foreground size-4" />
          Settings
        </CardTitle>
        <CardDescription>App version and updates</CardDescription>
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
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() =>
              openExternal(
                'https://github.com/easydonate-th/connect/releases/latest'
              )
            }
          >
            <ExternalLinkIcon />
            GitHub
          </Button>
          {update?.updateAvailable ? (
            <Button onClick={() => openExternal(update.releaseUrl)}>
              <DownloadIcon />
              Download update
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
