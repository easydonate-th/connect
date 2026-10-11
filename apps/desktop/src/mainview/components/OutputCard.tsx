import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useController, useFormContext } from 'react-hook-form'

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
  /** The output's `enabled` field, which the card's switch toggles */
  name: 'vrc.osc.enabled' | 'vrc.midi.enabled' | 'vts.throw.enabled'
  icon: LucideIcon
  title: string
  description: string
  children: ReactNode
}

const OutputCard = ({
  id,
  name,
  icon: Icon,
  title,
  description,
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
        </CardTitle>
        <CardDescription>{description}</CardDescription>
        <CardAction>
          <Switch
            checked={enabled.value}
            onCheckedChange={isChecked => enabled.onChange(isChecked)}
            aria-labelledby={titleId}
          />
        </CardAction>
      </CardHeader>
      <CardContent>
        <fieldset
          disabled={!enabled.value}
          aria-labelledby={titleId}
          className="transition-opacity disabled:opacity-60"
        >
          {children}
        </fieldset>
      </CardContent>
    </Card>
  )
}

export default OutputCard
