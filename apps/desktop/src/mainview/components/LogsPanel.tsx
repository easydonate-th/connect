import { CopyIcon, Trash2Icon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '~/components/ui/button'
import { Label } from '~/components/ui/label'
import { Switch } from '~/components/ui/switch'
import { useLogs } from '~/hooks/use-logs'
import { clearLogs, LogLine, mergeLogLines } from '~/libs/logs'
import { cn } from '~/libs/utils'

const LEVEL_STYLES: Record<LogLine['level'], string> = {
  info: 'text-sky-400',
  warn: 'text-amber-400',
  error: 'text-red-400',
  raw: 'text-violet-400',
}

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
})

const formatLine = ({ timestamp, level, message }: LogLine) =>
  `${timeFormatter.format(timestamp)} ${level.toUpperCase().padEnd(5)} ${message}`

const copyLogs = async (lines: LogLine[]) => {
  try {
    await navigator.clipboard.writeText(lines.map(formatLine).join('\n'))
    toast.success('Logs copied')
  } catch {
    toast.error('Failed to copy logs')
  }
}

const TOOLBAR_BUTTON_CLASS =
  'text-zinc-400 hover:bg-white/10 hover:text-zinc-100 dark:hover:bg-white/10'

const LogsPanel = () => {
  const { events, rawFrames } = useLogs()
  const [showRaw, setShowRaw] = useState(false)
  const lines = showRaw ? mergeLogLines(events, rawFrames) : events
  const panelRef = useRef<HTMLElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Bring the panel into view when it opens
  useEffect(() => {
    panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [])

  // Keep the newest line visible
  useEffect(() => {
    const element = scrollRef.current
    if (element && lines.length > 0) {
      element.scrollTop = element.scrollHeight
    }
  }, [lines])

  return (
    <section
      ref={panelRef}
      id="logs-panel"
      aria-label="Logs"
      className="overflow-hidden rounded-xl bg-zinc-950 text-zinc-100 shadow-sm ring-1 ring-zinc-900"
    >
      <div className="flex items-center justify-between border-b border-white/10 py-1.5 pr-2 pl-4">
        <div className="flex items-center gap-2">
          <Switch
            id="raw-log"
            size="sm"
            checked={showRaw}
            onCheckedChange={setShowRaw}
            className="data-checked:bg-violet-500 data-unchecked:bg-zinc-700"
          />
          <Label
            htmlFor="raw-log"
            className="font-mono text-xs font-normal text-zinc-400"
          >
            Raw log
          </Label>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="xs"
            className={TOOLBAR_BUTTON_CLASS}
            disabled={lines.length === 0}
            onClick={() => copyLogs(lines)}
          >
            <CopyIcon />
            Copy
          </Button>
          <Button
            variant="ghost"
            size="xs"
            className={TOOLBAR_BUTTON_CLASS}
            disabled={events.length === 0 && rawFrames.length === 0}
            onClick={clearLogs}
          >
            <Trash2Icon />
            Clear
          </Button>
        </div>
      </div>
      <div
        ref={scrollRef}
        role="log"
        aria-live="polite"
        className="h-64 overflow-y-auto px-4 py-3 font-mono text-xs leading-relaxed"
      >
        {lines.length === 0 ? (
          <p className="text-zinc-500">No logs yet.</p>
        ) : (
          <ol>
            {lines.map(line => (
              <li key={line.id} className="break-all whitespace-pre-wrap">
                <span className="text-zinc-500">
                  {timeFormatter.format(line.timestamp)}
                </span>{' '}
                <span className={cn('font-semibold', LEVEL_STYLES[line.level])}>
                  {line.level.toUpperCase().padEnd(5)}
                </span>{' '}
                {line.message}
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  )
}

export default LogsPanel
