import { Progress } from '~/components/ui/progress'
import { useMessages } from '~/hooks/use-messages'
import { useUpdateStage } from '~/hooks/use-update-stage'

const UpdateProgress = () => {
  const { stage, percent } = useUpdateStage()
  const m = useMessages()

  const label = m.settings.updateStages[stage]

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span>{label}</span>
        {percent !== null && <span className="tabular-nums">{percent}%</span>}
      </div>
      {percent !== null && <Progress value={percent} aria-label={label} />}
    </div>
  )
}

export default UpdateProgress
