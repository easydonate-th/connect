import { Badge } from '~/components/ui/badge'
import { useMessages } from '~/hooks/use-messages'
import type { ConnectionStatus } from '~/hooks/use-widget-socket'
import { cn } from '~/libs/utils'

const STATUS_STYLES: Record<ConnectionStatus, { dot: string; pulse: boolean }> =
  {
    idle: { dot: 'bg-muted-foreground', pulse: false },
    connecting: { dot: 'bg-amber-500', pulse: true },
    connected: { dot: 'bg-emerald-500', pulse: false },
    reconnecting: { dot: 'bg-red-500', pulse: true },
  }

type ConnectionBadgeProps = {
  status: ConnectionStatus
}

const ConnectionBadge = ({ status }: ConnectionBadgeProps) => {
  const m = useMessages()

  const { dot, pulse } = STATUS_STYLES[status]

  return (
    <Badge variant="outline" asChild>
      <output aria-live="polite">
        <span
          aria-hidden
          className={cn('size-1.5 rounded-full', dot, pulse && 'animate-pulse')}
        />
        {m.widget.status[status]}
      </output>
    </Badge>
  )
}

export default ConnectionBadge
