import { cn } from 'cn'
import { Loader2Icon } from 'lucide-react'

import { useMessages } from '~/hooks/use-messages'

function Spinner({ className, ...props }: React.ComponentProps<'svg'>) {
  const m = useMessages()

  return (
    <Loader2Icon
      data-slot="spinner"
      role="status"
      aria-label={m.app.loading}
      className={cn('size-4 animate-spin', className)}
      {...props}
    />
  )
}

export { Spinner }
