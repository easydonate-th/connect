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
import { useMessages } from '~/hooks/use-messages'
import type { ConnectionStatus } from '~/hooks/use-widget-socket'
import { getSocketUrl } from '~/libs/utils'

import type { Config } from '../../shared/config'
import type { Donation } from '../../shared/donation'
import type { Messages } from '../../shared/i18n'

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  timeStyle: 'medium',
})

const amountFormatter = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'THB',
  maximumFractionDigits: 2,
})

const describeLastDonation = (
  donation: Donation | null,
  m: Messages['widget']
) => {
  if (!donation) {
    return m.noDonations
  }

  return m.lastDonation({
    name: donation.donatorName || m.anonymous,
    amount: amountFormatter.format(donation.amount),
    time: timeFormatter.format(donation.timestamp),
  })
}

type WidgetConnectionProps = {
  status: ConnectionStatus
  socketUrl: string | null
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
  const m = useMessages()

  const { control } = useFormContext<Config>()
  const { field: widgetUrl } = useController({ control, name: 'widgetUrl' })

  const { field: autoConnect } = useController({
    control,
    name: 'autoConnect',
  })

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
          {m.widget.title}
        </CardTitle>
        <CardDescription>{m.widget.description}</CardDescription>
        <CardAction>
          <ConnectionBadge status={status} />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <form noValidate onSubmit={handleSubmit}>
          <Field data-invalid={isUrlInvalid}>
            <FieldLabel htmlFor="widget-url">{m.widget.widgetUrl}</FieldLabel>
            <div className="flex gap-2">
              <Input
                {...widgetUrl}
                id="widget-url"
                type="url"
                inputMode="url"
                autoComplete="off"
                spellCheck={false}
                placeholder={m.widget.widgetUrlPlaceholder}
                aria-invalid={isUrlInvalid}
                aria-describedby="widget-url-hint"
              />
              <Button
                type="submit"
                variant={isActive ? 'outline' : 'default'}
                className="min-w-28"
              >
                {isActive ? <UnplugIcon /> : <PlugIcon />}
                {isActive ? m.widget.disconnect : m.widget.connect}
              </Button>
            </div>
            {isUrlInvalid ? (
              <FieldError id="widget-url-hint">
                {m.widget.invalidUrl}
              </FieldError>
            ) : (
              <FieldDescription id="widget-url-hint">
                {describeLastDonation(lastDonation, m.widget)}
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
                {m.widget.autoConnect}
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
