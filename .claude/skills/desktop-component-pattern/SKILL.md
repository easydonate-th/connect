---
name: desktop-component-pattern
description: Layout and form conventions for React components in apps/desktop/src/mainview. Use when writing, editing or reviewing a component there.
---

# Desktop component pattern

Every component in `apps/desktop/src/mainview/components/` (except the generated `components/ui/`) and `App.tsx` is laid out like this:

```tsx
const ComponentA = ({ id }: ComponentAProps) => {
  const titleId = useId()
  const { events } = useLogs()

  const [isOpen, setIsOpen] = useState(false)
  const listRef = useRef<HTMLUListElement>(null)

  const { devices, isScanning, scan } = useMIDIDevices()

  const { control } = useFormContext<Config>()
  const { field: deviceName } = useController({ control, name: 'vrc.midi.deviceName' })

  const isDeviceFound = devices.includes(deviceName.value)

  const handleScan = () => { ... }

  useEffect(() => { ... }, [isDeviceFound])

  return <></>
}

export default ComponentA
```

## Sections

In this order, one blank line between sections. Do not label them with comments.

1. **Hooks**: hooks that don't depend on anything below: `use(promise)`, `useId`, `useLogs`.
2. **State**: `useState` and `useRef`.
3. **Data fetching and mutation**: hooks that load or send data over RPC or the socket: `useMIDIDevices`, `useVTSItems`, `useVTSImageImport`, `useVTSConnectionTest`, `useAppUpdate`, `useWidgetConnection`.
4. **Form**: `useConfigForm`, `useFormContext`, `useController`, `useFieldArray`, `useWatch`, `useFormState`.
5. **Derived values, then handlers**: plain `const`s computed from the above, then event handlers.
6. **Effects**: `useEffect`, and hooks that only run side effects, such as `useUnsavedChangesToast`. They come after the derived values because an effect's dependency array is evaluated during render.
7. **`return`** with the JSX.

Leave out sections a component doesn't need. A component with no hooks or values keeps the concise body `=> (...)`.

If a hook needs state or a handler from the component body (so it can't sit in its section), move them into a custom hook in `hooks/`. For example, `useWidgetConnection` owns the socket URL and the donation handler that `useWidgetSocket` needs. Hooks in `hooks/` don't follow this layout.

## File shape

- Imports, module-level constants and helpers, the `<Name>Props` type, the component, then `export default <Name>` at the bottom.
- Components are arrow functions (`react/function-component-definition`).
- Comments explain why, not which section a line is in.

## Config form

The config is one react-hook-form form (`hooks/use-config-form.ts`), provided with `FormProvider` in `App.tsx`. Components read and write it through the form context, never through `value`/`onChange` props.

- Get `control`, `getValues` and `setValue` from `useFormContext<Config>()`, so field names are type-checked against `Config`.
- **Text inputs**: `useController`, then spread its field: `<Input {...host} id="osc-host" />`.
- **Radix controls and array values** (Switch, Select, Checkbox lists): `useController`, passing the value through an arrow (`onCheckedChange={isChecked => enabled.onChange(isChecked)}`), since `react/jsx-handler-names` rejects `enabled.onChange`.
- **Numbers**: `NumberField` (`components/NumberField.tsx`), which turns an empty input into `NaN` and back.
- **Output card switches**: pass the `enabled` field's name to `OutputCard`.
- **Reading values to render**: `useWatch`, not `getValues` or `watch`.
- **Writing from a handler**: `setValue(name, value, { shouldDirty: true })`. Without `shouldDirty`, the unsaved changes toast and Save button go stale. Validation reruns on every change by itself, so `shouldValidate` isn't needed.
- **Throw rules**: `useFieldArray` with `keyName: 'key'` (the default `'id'` would shadow `rule.id`). Key rows by `field.key`, read live values with `useWatch` (`fields` is a snapshot), and change one rule's value by its path (`vts.throw.rules.${index}.items`), not by replacing the array, which remounts every row.

## Errors

- Never compute whether config is valid inside a component. Add the rule and its message to `validateConfig` in `src/shared/config.ts`, keyed by the field's RHF path (rules by index: `vts.throw.rules.0.minAmount`). The form's resolver turns it into `formState.errors`, and Save is disabled while any error is present.
- Render a field's error as `<FieldError>{error?.message}</FieldError>`. `FieldError` renders nothing when it has no content. Get `error` from `useController`'s `fieldState` or from `useFormState({ control, name })`.
- Mark the field with `data-invalid` on `Field` and `aria-invalid` on the control.
- Errors that don't come from the config, such as a missing MIDI device after a scan or an invalid widget URL on Connect, stay in component state and don't block Save.
