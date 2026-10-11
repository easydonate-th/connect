import { CheckIcon, PackageIcon } from 'lucide-react'
import { useId } from 'react'
import type { ReactNode } from 'react'

import { Button } from '~/components/ui/button'
import { Checkbox } from '~/components/ui/checkbox'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import ImageThumbnail from '~/components/VTS/ImageThumbnail'

import type { VTSCustomImage, VTSThrowRule } from '../../../shared/config'

const toggle = (values: string[], value: string, isChecked: boolean) =>
  isChecked ? [...values, value] : values.filter(selected => selected !== value)

type PickerSectionProps = {
  title: string
  emptyText: string
  isEmpty: boolean
  children: ReactNode
}

const PickerSection = ({
  title,
  emptyText,
  isEmpty,
  children,
}: PickerSectionProps) => {
  const titleId = useId()

  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-2">
      <h3 id={titleId} className="text-sm font-medium">
        {title}
      </h3>
      {isEmpty ? (
        <p className="text-muted-foreground rounded-md border px-3 py-2 text-sm">
          {emptyText}
        </p>
      ) : (
        children
      )}
    </section>
  )
}

type RuleItemsDialogProps = {
  rule: VTSThrowRule
  selectedItems: string[]
  customImages: VTSCustomImage[]
  onChange: (patch: Partial<VTSThrowRule>) => void
  onClose: () => void
}

const RuleItemsDialog = ({
  rule,
  selectedItems,
  customImages,
  onChange,
  onClose,
}: RuleItemsDialogProps) => (
  <Dialog open onOpenChange={onClose}>
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>
          Custom items for {Number.isNaN(rule.minAmount) ? '?' : rule.minAmount}{' '}
          THB
        </DialogTitle>
        <DialogDescription>
          Each throw of this rule picks one of these at random.
        </DialogDescription>
      </DialogHeader>
      <div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto">
        <PickerSection
          title="VTube Studio"
          emptyText="Select items in the VTube Studio tab first."
          isEmpty={selectedItems.length === 0}
        >
          <ul className="flex flex-col rounded-md border">
            {selectedItems.map(item => (
              <li key={item} className="border-b last:border-b-0">
                <label className="hover:bg-muted flex cursor-pointer items-center gap-2 px-3 py-2 text-sm transition-colors">
                  <Checkbox
                    checked={rule.items.includes(item)}
                    onCheckedChange={isChecked =>
                      onChange({
                        items: toggle(rule.items, item, isChecked === true),
                      })
                    }
                  />
                  <PackageIcon className="text-muted-foreground size-4 shrink-0" />
                  <span className="truncate">{item}</span>
                </label>
              </li>
            ))}
          </ul>
        </PickerSection>
        <PickerSection
          title="Your images"
          emptyText="Add images in the Your images tab first."
          isEmpty={customImages.length === 0}
        >
          <ul className="grid grid-cols-4 gap-2">
            {customImages.map(image => (
              <li key={image.fileName}>
                <label className="hover:bg-muted has-data-checked:border-primary has-data-checked:bg-muted relative flex cursor-pointer flex-col items-center gap-1.5 rounded-md border p-2 text-xs transition-colors">
                  <Checkbox
                    checked={rule.images.includes(image.fileName)}
                    onCheckedChange={isChecked =>
                      onChange({
                        images: toggle(
                          rule.images,
                          image.fileName,
                          isChecked === true
                        ),
                      })
                    }
                    className="bg-background absolute top-1.5 left-1.5"
                  />
                  <ImageThumbnail image={image} className="size-16" />
                  <span className="w-full truncate text-center">
                    {image.name}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </PickerSection>
      </div>
      <DialogFooter className="items-center">
        <p className="text-muted-foreground mr-auto text-sm">
          {rule.items.length + rule.images.length} picked
        </p>
        <DialogClose asChild>
          <Button type="button">
            <CheckIcon />
            Done
          </Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)

export default RuleItemsDialog
