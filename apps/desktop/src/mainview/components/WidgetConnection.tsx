import { LinkIcon, PlugIcon, SendIcon, UnplugIcon } from 'lucide-react'
import type { SubmitEvent } from 'react'

import ConnectionBadge from '~/components/ConnectionBadge'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import {
  Field,
  FieldDescription,
  FieldContent,
  FieldError,
  FieldLabel,
} from '~/components/ui/field'
import { Input } from '~/components/ui/input'
import { Switch } from '~/components/ui/switch'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '~/components/ui/tooltip'
import type { ConnectionStatus } from '~/hooks/use-widget-socket'

import type { Donation } from '../../shared/donation'

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  timeStyle: 'medium',
})

const amountFormatter = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'THB',
  maximumFractionDigits: 2,
})

const describeLastDonation = (donation: Donation | null) => {
  if (!donation) {
    return 'No donations received yet.'
  }

  const name = donation.donatorName || 'Anonymous'
  const amount = amountFormatter.format(donation.amount)
  const time = timeFormatter.format(donation.timestamp)

  return `Last donation: ${name} · ${amount} at ${time}`
}

type WidgetConnectionProps = {
  widgetUrl: string
  onWidgetUrlChange: (widgetUrl: string) => void
  autoConnect: boolean
  onAutoConnectChange: (autoConnect: boolean) => void
  status: ConnectionStatus
  /** True when the current URL is the one the socket is using */
  isActive: boolean
  isUrlInvalid: boolean
  lastDonation: Donation | null
  onConnect: () => void
  onDisconnect: () => void
  /** False while the socket is connected or connecting */
  canSendTest: boolean
  onSendTest: () => void
}

const WidgetConnection = ({
  widgetUrl,
  onWidgetUrlChange,
  autoConnect,
  onAutoConnectChange,
  status,
  isActive,
  isUrlInvalid,
  lastDonation,
  onConnect,
  onDisconnect,
  canSendTest,
  onSendTest,
}: WidgetConnectionProps) => {
  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isActive) {
      onDisconnect()
    } else {
      onConnect()
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LinkIcon className="text-muted-foreground size-4" />
          Alert widget
        </CardTitle>
        <CardDescription>
          Paste your EasyDonate alert widget URL
        </CardDescription>
        <CardAction>
          <ConnectionBadge status={status} />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form noValidate onSubmit={handleSubmit}>
          <Field data-invalid={isUrlInvalid}>
            <FieldLabel htmlFor="widget-url">Widget URL</FieldLabel>
            <div className="flex gap-2">
              <Input
                id="widget-url"
                type="url"
                inputMode="url"
                autoComplete="off"
                spellCheck={false}
                placeholder="https://easydonate.app/alert?..."
                value={widgetUrl}
                onChange={event => onWidgetUrlChange(event.currentTarget.value)}
                aria-invalid={isUrlInvalid}
                aria-describedby="widget-url-hint"
              />
              <Button
                type="submit"
                variant={isActive ? 'outline' : 'default'}
                className="min-w-28"
              >
                {isActive ? <UnplugIcon /> : <PlugIcon />}
                {isActive ? 'Disconnect' : 'Connect'}
              </Button>
            </div>
            {isUrlInvalid ? (
              <FieldError id="widget-url-hint">
                Invalid widget URL. Copy the full URL including its query
                string.
              </FieldError>
            ) : (
              <FieldDescription id="widget-url-hint">
                {describeLastDonation(lastDonation)}
              </FieldDescription>
            )}
          </Field>
        </form>
        <div className="flex items-center justify-between gap-4">
          <Field orientation="horizontal" className="w-auto">
            <Switch
              id="auto-connect"
              checked={autoConnect}
              onCheckedChange={onAutoConnectChange}
            />
            <FieldContent>
              <FieldLabel htmlFor="auto-connect">Auto connect</FieldLabel>
            </FieldContent>
          </Field>
          <Tooltip>
            <TooltipTrigger asChild>
              {/* Disabled buttons get no pointer events, so the wrapper
                  carries the hover and focus for the tooltip */}
              <span tabIndex={canSendTest ? undefined : 0}>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!canSendTest}
                  onClick={onSendTest}
                >
                  <SendIcon />
                  Send test donation
                </Button>
              </span>
            </TooltipTrigger>
            {!canSendTest && (
              <TooltipContent>
                Disconnect the widget before sending a test donation.
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </CardContent>
    </Card>
  )
}

export default WidgetConnection
