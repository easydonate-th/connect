import { Badge } from '~/components/ui/badge'
import type { ConnectionStatus } from '~/hooks/use-widget-socket'
import { cn } from '~/lib/utils'

const STATUS_STYLES: Record<
  ConnectionStatus,
  { label: string; dot: string; pulse: boolean }
> = {
  idle: { label: 'Not connected', dot: 'bg-muted-foreground', pulse: false },
  connecting: { label: 'Connecting', dot: 'bg-amber-500', pulse: true },
  connected: { label: 'Connected', dot: 'bg-emerald-500', pulse: false },
  reconnecting: { label: 'Reconnecting', dot: 'bg-red-500', pulse: true },
}

type ConnectionBadgeProps = {
  status: ConnectionStatus
}

const ConnectionBadge = ({ status }: ConnectionBadgeProps) => {
  const { label, dot, pulse } = STATUS_STYLES[status]

  return (
    <Badge variant="outline" asChild>
      <output aria-live="polite">
        <span
          aria-hidden
          className={cn('size-1.5 rounded-full', dot, pulse && 'animate-pulse')}
        />
        {label}
      </output>
    </Badge>
  )
}

export default ConnectionBadge
