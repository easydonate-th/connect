import { LinkIcon, PlugIcon, UnplugIcon } from 'lucide-react'
import type { SubmitEvent } from 'react'
import { useController, useFormContext } from 'react-hook-form'

import ConnectionBadge from '~/components/ConnectionBadge'
import TestDonationButton from '~/components/TestDonationButton'
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
import type { ConnectionStatus } from '~/hooks/use-widget-socket'
import { getSocketUrl } from '~/libs/utils'

import type { Config } from '../../shared/config'
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
  status: ConnectionStatus
  /** The socket URL in use, `null` while disconnected */
  socketUrl: string | null
  /** The widget URL that last failed to connect */
  invalidUrl: string | null
  lastDonation: Donation | null
  onConnect: (widgetUrl: string) => void
  onDisconnect: () => void
  onSendTest: () => void
}

const WidgetConnection = ({
  status,
  socketUrl,
  invalidUrl,
  lastDonation,
  onConnect,
  onDisconnect,
  onSendTest,
}: WidgetConnectionProps) => {
  const { control } = useFormContext<Config>()
  const { field: widgetUrl } = useController({ control, name: 'widgetUrl' })
  const { field: autoConnect } = useController({
    control,
    name: 'autoConnect',
  })

  // True when the socket is using the URL in the field
  const isActive =
    socketUrl !== null && socketUrl === getSocketUrl(widgetUrl.value)
  const isUrlInvalid = invalidUrl === widgetUrl.value

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isActive) {
      onDisconnect()
    } else {
      onConnect(widgetUrl.value)
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
                {...widgetUrl}
                id="widget-url"
                type="url"
                inputMode="url"
                autoComplete="off"
                spellCheck={false}
                placeholder="https://widgets.easydonate.app?w=alert…"
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
              <FieldError id="widget-url-hint">Invalid widget URL</FieldError>
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
              checked={autoConnect.value}
              onCheckedChange={isChecked => autoConnect.onChange(isChecked)}
            />
            <FieldContent>
              <FieldLabel htmlFor="auto-connect" className="cursor-pointer">
                Auto connect
              </FieldLabel>
            </FieldContent>
          </Field>
          <TestDonationButton
            canSend={socketUrl === null}
            onSend={onSendTest}
          />
        </div>
      </CardContent>
    </Card>
  )
}

export default WidgetConnection
