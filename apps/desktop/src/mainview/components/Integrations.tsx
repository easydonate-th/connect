import { BoxIcon, Gamepad2Icon, VideoIcon } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
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

import type { Config, MIDIConfig, OSCConfig } from '../../shared/config'

const TRIGGER_CLASS = 'items-center rounded-none px-4 py-4 hover:no-underline'

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
  vrc: Config['vrc']
  onOSCChange: (patch: Partial<OSCConfig>) => void
  onMIDIChange: (patch: Partial<MIDIConfig>) => void
}

const Integrations = ({
  vrc,
  onOSCChange,
  onMIDIChange,
}: IntegrationsProps) => {
  return (
    <Card className="gap-0 py-0">
      <CardHeader className="border-b py-4">
        <CardTitle>Integrations</CardTitle>
      </CardHeader>
      <Accordion type="multiple">
        <AccordionItem value="vrchat">
          <AccordionTrigger className={TRIGGER_CLASS}>
            <CategoryLabel icon={Gamepad2Icon} name="VRChat" />
          </AccordionTrigger>
          <AccordionContent className="flex flex-col gap-4 px-4 pb-4">
            <OSC value={vrc.osc} onChange={onOSCChange} />
            <MIDI value={vrc.midi} onChange={onMIDIChange} />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="warudo" disabled>
          <AccordionTrigger className={TRIGGER_CLASS}>
            <CategoryLabel icon={BoxIcon} name="Warudo">
              <Badge variant="secondary">Coming soon</Badge>
            </CategoryLabel>
          </AccordionTrigger>
        </AccordionItem>
        <AccordionItem value="vtube-studio" disabled>
          <AccordionTrigger className={TRIGGER_CLASS}>
            <CategoryLabel icon={VideoIcon} name="VTube Studio">
              <Badge variant="secondary">Coming soon</Badge>
            </CategoryLabel>
          </AccordionTrigger>
        </AccordionItem>
      </Accordion>
    </Card>
  )
}

export default Integrations
