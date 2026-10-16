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
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Label } from '~/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { Spinner } from '~/components/ui/spinner'
import { useAppUpdate } from '~/hooks/use-app-update'
import { useLanguage, useMessages } from '~/hooks/use-messages'
import { changeLanguage, getMessages } from '~/libs/i18n'
import { log } from '~/libs/logs'
import { openDataFolder, openExternal } from '~/libs/rpc'

import { isLanguage, LANGUAGE_NAMES, LANGUAGES } from '../../shared/i18n'
import { describeError } from '../../shared/i18n/error'

const showDataFolder = async () => {
  try {
    await openDataFolder()
  } catch (error) {
    toast.error(getMessages().settings.dataFolderFailed, {
      description: describeError(error, getMessages()),
    })
    log.error(
      `Failed to open data folder: ${describeError(error) ?? 'unknown error'}`
    )
  }
}

const Settings = () => {
  const language = useLanguage()
  const m = useMessages()

  const { version, update, isChecking, isInstalling, check, install } =
    useAppUpdate()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SettingsIcon className="text-muted-foreground size-4" />
          {m.settings.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Label htmlFor="language">{m.settings.language}</Label>
          <Select
            value={language}
            onValueChange={next => {
              if (isLanguage(next)) {
                changeLanguage(next)
              }
            }}
          >
            <SelectTrigger id="language" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              {LANGUAGES.map(option => (
                <SelectItem key={option} value={option} lang={option}>
                  {LANGUAGE_NAMES[option]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">{m.settings.version}</span>
            <span className="text-muted-foreground tabular-nums">
              {version || m.settings.unknownVersion}
            </span>
            {update?.updateAvailable && (
              <Badge variant="secondary">
                {m.settings.versionBadge({ version: update.latestVersion })}
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={showDataFolder}>
              <FolderOpenIcon />
              {m.settings.dataFolder}
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
                {m.settings.updateAndRestart}
              </Button>
            ) : (
              <Button variant="outline" disabled={isChecking} onClick={check}>
                {isChecking ? <Spinner /> : <RefreshCwIcon />}
                {m.settings.checkForUpdates}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default Settings
