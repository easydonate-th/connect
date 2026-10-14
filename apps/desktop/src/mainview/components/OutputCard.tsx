import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useController, useFormContext } from 'react-hook-form'

import { Badge } from '~/components/ui/badge'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { Switch } from '~/components/ui/switch'

import type { Config } from '../../shared/config'

type OutputCardProps = {
  id: string
  name: 'vrc.osc.enabled' | 'vrc.midi.enabled' | 'vts.throw.enabled'
  icon: LucideIcon
  title: string
  description: string
  /** `false` replaces the switch and the fields with a badge */
  isSupported?: boolean
  children: ReactNode
}

const OutputCard = ({
  id,
  name,
  icon: Icon,
  title,
  description,
  isSupported = true,
  children,
}: OutputCardProps) => {
  const { control } = useFormContext<Config>()
  const { field: enabled } = useController({ control, name })

  const titleId = `${id}-title`

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle id={titleId} className="flex items-center gap-2">
          <Icon className="text-muted-foreground size-4" />
          {title}
          {!isSupported && (
            <Badge variant="secondary">Platform not supported</Badge>
          )}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
        {isSupported && (
          <CardAction>
            <Switch
              checked={enabled.value}
              onCheckedChange={isChecked => enabled.onChange(isChecked)}
              aria-labelledby={titleId}
            />
          </CardAction>
        )}
      </CardHeader>
      {isSupported && (
        <CardContent>
          <fieldset
            disabled={!enabled.value}
            aria-labelledby={titleId}
            className="transition-opacity disabled:opacity-60"
          >
            {children}
          </fieldset>
        </CardContent>
      )}
    </Card>
  )
}

export default OutputCard
