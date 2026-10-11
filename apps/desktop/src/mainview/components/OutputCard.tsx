import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { Switch } from '~/components/ui/switch'

type OutputCardProps = {
  id: string
  icon: LucideIcon
  title: string
  description: string
  enabled: boolean
  onEnabledChange: (enabled: boolean) => void
  children: ReactNode
}

const OutputCard = ({
  id,
  icon: Icon,
  title,
  description,
  enabled,
  onEnabledChange,
  children,
}: OutputCardProps) => {
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
            checked={enabled}
            onCheckedChange={onEnabledChange}
            aria-labelledby={titleId}
          />
        </CardAction>
      </CardHeader>
      <CardContent>
        <fieldset
          disabled={!enabled}
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
