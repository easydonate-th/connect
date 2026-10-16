import { BoxIcon, Gamepad2Icon, VideoIcon } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { use } from 'react'
import type { ReactNode } from 'react'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '~/components/ui/accordion'
import { Badge } from '~/components/ui/badge'
import { Card, CardHeader, CardTitle } from '~/components/ui/card'
import MIDI from '~/components/VRC/MIDI'
import OSC from '~/components/VRC/OSC'
import Throw from '~/components/VTS/Throw'
import { useMessages } from '~/hooks/use-messages'
import { platformPromise } from '~/libs/platform'

import { isOutputSupported } from '../../shared/platform'

type CategoryLabelProps = {
  icon: LucideIcon
  name: string
  children?: ReactNode
}

const CategoryLabel = ({ icon: Icon, name, children }: CategoryLabelProps) => (
  <span className="flex items-center gap-2">
    <Icon className="text-muted-foreground size-4" />
    {name}
    {children}
  </span>
)

type IntegrationsProps = {
  canSendTest: boolean
  onSendTest: () => void
}

const Integrations = ({ canSendTest, onSendTest }: IntegrationsProps) => {
  const platform = use(platformPromise)
  const m = useMessages()

  // An unknown platform shows every output, and the main process still skips
  // the ones it can't run
  const isMIDISupported =
    platform === null || isOutputSupported('midi', platform)

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="border-b py-4">
        <CardTitle>{m.app.integrations.title}</CardTitle>
      </CardHeader>
      <Accordion type="multiple">
        <AccordionItem value="vrchat">
          <AccordionTrigger className="hover:bg-muted items-center rounded-none px-4 py-4 hover:no-underline">
            <CategoryLabel icon={Gamepad2Icon} name="VRChat" />
          </AccordionTrigger>
          <AccordionContent className="flex h-auto flex-col gap-6 px-4 pt-px pb-6">
            <OSC />
            <MIDI isSupported={isMIDISupported} />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="vtube-studio">
          <AccordionTrigger className="hover:bg-muted items-center rounded-none px-4 py-4 hover:no-underline">
            <CategoryLabel icon={VideoIcon} name="VTube Studio" />
          </AccordionTrigger>
          <AccordionContent className="flex h-auto flex-col gap-6 px-4 pt-px pb-6">
            <Throw canSendTest={canSendTest} onSendTest={onSendTest} />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="warudo" disabled>
          <AccordionTrigger className="hover:bg-muted items-center rounded-none px-4 py-4 hover:no-underline">
            <CategoryLabel icon={BoxIcon} name="Warudo">
              <Badge variant="secondary">{m.warudo.comingSoon}</Badge>
            </CategoryLabel>
          </AccordionTrigger>
        </AccordionItem>
      </Accordion>
    </Card>
  )
}

export default Integrations
