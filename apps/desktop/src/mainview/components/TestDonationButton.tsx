import { SendIcon } from 'lucide-react'
import type { ComponentProps } from 'react'

import { Button } from '~/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '~/components/ui/tooltip'

type TestDonationButtonProps = {
  /** False while the socket is connected or connecting */
  canSend: boolean
  onSend: () => void
  size?: ComponentProps<typeof Button>['size']
}

const TestDonationButton = ({
  canSend,
  onSend,
  size,
}: TestDonationButtonProps) => (
  <Tooltip>
    <TooltipTrigger asChild>
      {/* Disabled buttons get no pointer events, so the wrapper receives the
          hover and focus events for the tooltip */}
      <span tabIndex={canSend ? undefined : 0}>
        <Button
          type="button"
          variant="outline"
          size={size}
          disabled={!canSend}
          onClick={onSend}
        >
          <SendIcon />
          Send test donation
        </Button>
      </span>
    </TooltipTrigger>
    {!canSend && (
      <TooltipContent>
        Disconnect the widget to send a test donation
      </TooltipContent>
    )}
  </Tooltip>
)

export default TestDonationButton
