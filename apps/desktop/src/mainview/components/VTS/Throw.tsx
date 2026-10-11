import { cn } from 'cn'
import {
  ImagePlusIcon,
  PlugZapIcon,
  RefreshCwIcon,
  TargetIcon,
  XIcon,
} from 'lucide-react'

import OutputCard from '~/components/OutputCard'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Checkbox } from '~/components/ui/checkbox'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '~/components/ui/field'
import { Input } from '~/components/ui/input'
import { Spinner } from '~/components/ui/spinner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { AlignedField, RangeField } from '~/components/VTS/fields'
import ImageThumbnail from '~/components/VTS/ImageThumbnail'
import ThrowRules from '~/components/VTS/ThrowRules'
import { useVTSConnectionTest } from '~/hooks/use-vts-connection-test'
import { useVTSImageImport } from '~/hooks/use-vts-image-import'
import { useVTSItems } from '~/hooks/use-vts-items'

import {
  isValidHost,
  isValidPort,
  isValidVTSItems,
  isValidVTSThrowValue,
  PORT_RANGE,
  VTS_THROW_RANGES,
  VTSThrowConfig,
  VTSThrowRangeKey,
} from '../../../shared/config'

const MOTION_FIELDS: {
  field: VTSThrowRangeKey
  label: string
  step: number
}[] = [
  { field: 'size', label: 'Size', step: 0.01 },
  { field: 'flightTime', label: 'Flight (s)', step: 0.05 },
  { field: 'spin', label: 'Spin (°)', step: 15 },
  { field: 'fadeTime', label: 'Fade (s)', step: 0.1 },
  { field: 'hitForce', label: 'Hit force', step: 0.25 },
]

type ThrowProps = {
  value: VTSThrowConfig
  onChange: (patch: Partial<VTSThrowConfig>) => void
  canSendTest: boolean
  onSendTest: () => void
}

const Throw = ({ value, onChange, canSendTest, onSendTest }: ThrowProps) => {
  const { items: scannedItems, isScanning, scan } = useVTSItems()
  const { isImporting, importImages } = useVTSImageImport()
  const { isTesting, test } = useVTSConnectionTest()
  const isHostInvalid = !isValidHost(value.host)
  const isPortInvalid = !isValidPort(value.port)
  const isItemsUnset = !isValidVTSItems(value)
  // Only a scan can tell that a selected item is gone, so until then the
  // selected items are all that's listed
  const missingItems =
    scannedItems === null
      ? []
      : value.items.filter(item => !scannedItems.includes(item))
  const itemOptions =
    scannedItems === null ? value.items : [...scannedItems, ...missingItems]

  // Rules can only pick selected items
  const toggleItem = (item: string, isChecked: boolean) =>
    onChange(
      isChecked
        ? { items: [...value.items, item] }
        : {
            items: value.items.filter(selected => selected !== item),
            rules: value.rules.map(rule => ({
              ...rule,
              items: rule.items.filter(selected => selected !== item),
            })),
          }
    )

  const handleAddImages = async () => {
    const added = await importImages()

    if (added.length > 0) {
      onChange({ customImages: [...value.customImages, ...added] })
    }
  }

  const removeImage = (fileName: string) =>
    onChange({
      customImages: value.customImages.filter(
        image => image.fileName !== fileName
      ),
      rules: value.rules.map(rule => ({
        ...rule,
        images: rule.images.filter(selected => selected !== fileName),
      })),
    })

  return (
    <OutputCard
      id="vts-throw"
      icon={TargetIcon}
      title="Throw item"
      description="Throw items at your model in VTube Studio."
      enabled={value.enabled}
      onEnabledChange={enabled => onChange({ enabled })}
    >
      <FieldGroup className="gap-4">
        <div className="grid grid-cols-[1fr_8rem_auto] gap-4">
          <Field data-invalid={isHostInvalid}>
            <FieldLabel htmlFor="vts-host">Host</FieldLabel>
            <Input
              id="vts-host"
              autoComplete="off"
              spellCheck={false}
              placeholder="127.0.0.1"
              value={value.host}
              onChange={event => onChange({ host: event.currentTarget.value })}
              aria-invalid={isHostInvalid}
            />
            {isHostInvalid ? (
              <FieldError>Host is required.</FieldError>
            ) : (
              <FieldDescription>
                Turn on “Allow Plugin API access” in VTube Studio.
              </FieldDescription>
            )}
          </Field>
          <Field data-invalid={isPortInvalid}>
            <FieldLabel htmlFor="vts-port">Port</FieldLabel>
            <Input
              id="vts-port"
              type="number"
              min={PORT_RANGE.min}
              max={PORT_RANGE.max}
              placeholder="8001"
              value={Number.isNaN(value.port) ? '' : value.port}
              onChange={event =>
                onChange({ port: event.currentTarget.valueAsNumber })
              }
              aria-invalid={isPortInvalid}
            />
            {isPortInvalid && (
              <FieldError>
                {PORT_RANGE.min}-{PORT_RANGE.max}
              </FieldError>
            )}
          </Field>
          <AlignedField>
            <Button
              type="button"
              variant="outline"
              onClick={() => test(value)}
              disabled={isTesting || isHostInvalid || isPortInvalid}
            >
              {isTesting ? <Spinner /> : <PlugZapIcon />}
              Test connection
            </Button>
          </AlignedField>
        </div>
        <Field data-invalid={missingItems.length > 0 || isItemsUnset}>
          <FieldLabel id="vts-items-label">Items</FieldLabel>
          <Tabs
            defaultValue={
              value.items.length === 0 && value.customImages.length > 0
                ? 'images'
                : 'vts'
            }
            aria-labelledby="vts-items-label"
          >
            <TabsList>
              <TabsTrigger value="vts">
                VTube Studio
                <Badge variant="secondary">{value.items.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="images">
                Your images
                <Badge variant="secondary">{value.customImages.length}</Badge>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="vts" className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <p className="text-muted-foreground mr-auto text-sm">
                  {scannedItems === null
                    ? "Items in VTube Studio's Items folder."
                    : `${value.items.length} of ${scannedItems.length} selected`}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => scan(value)}
                  disabled={isScanning || isHostInvalid || isPortInvalid}
                >
                  <RefreshCwIcon className={cn(isScanning && 'animate-spin')} />
                  Scan
                </Button>
              </div>
              <ul className="flex h-56 flex-col overflow-y-auto rounded-md border">
                {itemOptions.map(item => (
                  <li key={item} className="border-b last:border-b-0">
                    <label className="hover:bg-muted flex cursor-pointer items-center gap-2 px-3 py-2 text-sm transition-colors">
                      <Checkbox
                        checked={value.items.includes(item)}
                        onCheckedChange={isChecked =>
                          toggleItem(item, isChecked === true)
                        }
                      />
                      <span className="truncate">{item}</span>
                      {missingItems.includes(item) && (
                        <span className="text-destructive shrink-0">
                          (not found)
                        </span>
                      )}
                    </label>
                  </li>
                ))}
                {itemOptions.length === 0 && (
                  <li className="text-muted-foreground px-3 py-2 text-sm">
                    {scannedItems === null
                      ? 'Scan to list your VTube Studio items.'
                      : "VTube Studio's Items folder is empty."}
                  </li>
                )}
              </ul>
            </TabsContent>
            <TabsContent value="images" className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <p className="text-muted-foreground mr-auto text-sm">
                  PNG, JPG or GIF, 64-2048 px a side, under 5 MB.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddImages}
                  disabled={isImporting}
                >
                  <ImagePlusIcon />
                  Add images
                </Button>
              </div>
              <ul className="flex h-56 flex-col overflow-y-auto rounded-md border">
                {value.customImages.map(image => (
                  <li
                    key={image.fileName}
                    className="flex items-center gap-2 border-b py-1 pr-1 pl-3 text-sm last:border-b-0"
                  >
                    <ImageThumbnail image={image} />
                    <span className="truncate">{image.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="ml-auto"
                      onClick={() => removeImage(image.fileName)}
                      aria-label={`Remove ${image.name}`}
                    >
                      <XIcon />
                    </Button>
                  </li>
                ))}
                {value.customImages.length === 0 && (
                  <li className="text-muted-foreground px-3 py-2 text-sm">
                    No images added yet.
                  </li>
                )}
              </ul>
            </TabsContent>
          </Tabs>
          {missingItems.length > 0 ? (
            <FieldError>Some items are not in VTube Studio.</FieldError>
          ) : isItemsUnset ? (
            <FieldError>Select or add at least one item.</FieldError>
          ) : (
            <FieldDescription>
              {isScanning
                ? 'Allow the plugin in VTube Studio if it asks.'
                : 'Rules throw from both tabs, or with Custom image, only what you choose. VTube Studio asks to allow your images the first time one is thrown.'}
            </FieldDescription>
          )}
        </Field>
        <div className="grid grid-cols-5 gap-4">
          {MOTION_FIELDS.map(({ field, label, step }) => (
            <RangeField
              key={field}
              id={`vts-${field}`}
              label={label}
              value={value[field]}
              range={VTS_THROW_RANGES[field]}
              step={step}
              isOutOfRange={!isValidVTSThrowValue(field, value[field])}
              onChange={number => onChange({ [field]: number })}
            />
          ))}
        </div>
        <ThrowRules
          enabled={value.enabled}
          rules={value.rules}
          selectedItems={value.items}
          customImages={value.customImages}
          onChange={rules => onChange({ rules })}
          canSendTest={canSendTest}
          onSendTest={onSendTest}
        />
      </FieldGroup>
    </OutputCard>
  )
}

export default Throw
