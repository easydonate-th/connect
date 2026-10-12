import { Progress } from '~/components/ui/progress'
import { useUpdateStage } from '~/hooks/use-update-stage'

/** The install toast's description: the updater's stage and its progress. */
const UpdateProgress = () => {
  const { label, percent } = useUpdateStage()

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
