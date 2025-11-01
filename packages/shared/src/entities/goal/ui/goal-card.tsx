import { Badge } from '@onsaero-shared/shared/ui/badge'
import { Button } from '@onsaero-shared/shared/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@onsaero-shared/shared/ui/card'
import { CheckCircle2, Circle, Trash2 } from 'lucide-react'
import type { GoalWithDetails } from '../model/goal.model'

interface GoalCardProps {
  goal: GoalWithDetails
  onDelete?: (goalId: string) => void
  onUpdateProgress?: (
    objectiveId: string,
    keyResultId: string,
    value: number,
  ) => void
}

const statusColors = {
  active: 'bg-blue-500',
  completed: 'bg-green-500',
  archived: 'bg-gray-500',
}

const statusLabels = {
  active: 'Active',
  completed: 'Completed',
  archived: 'Archived',
}

const krStatusColors = {
  not_started: 'text-gray-400',
  in_progress: 'text-blue-500',
  completed: 'text-green-500',
}

export const GoalCard = ({ goal, onDelete }: GoalCardProps) => {
  const progress = calculateGoalProgress(goal)

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-xl">{goal.title}</CardTitle>
              <Badge variant="outline" className={statusColors[goal.status]}>
                {statusLabels[goal.status]}
              </Badge>
            </div>
            {goal.description && (
              <CardDescription className="mt-2">
                {goal.description}
              </CardDescription>
            )}
            {(goal.start_date || goal.end_date) && (
              <div className="mt-2 text-muted-foreground text-sm">
                {goal.start_date && (
                  <span>{new Date(goal.start_date).toLocaleDateString()}</span>
                )}
                {goal.start_date && goal.end_date && <span> - </span>}
                {goal.end_date && (
                  <span>{new Date(goal.end_date).toLocaleDateString()}</span>
                )}
              </div>
            )}
          </div>
          {onDelete && (
            <Button variant="ghost" size="sm" onClick={() => onDelete(goal.id)}>
              <Trash2 className="size-4 text-destructive" />
            </Button>
          )}
        </div>

        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {goal.objectives.map((objective) => {
          const objProgress = calculateObjectiveProgress(objective)
          return (
            <div key={objective.id} className="space-y-2 rounded-lg border p-3">
              <div className="flex items-start justify-between">
                <h4 className="font-semibold text-sm">{objective.title}</h4>
                <span className="text-muted-foreground text-xs">
                  {objProgress}%
                </span>
              </div>

              {objective.description && (
                <p className="text-muted-foreground text-xs">
                  {objective.description}
                </p>
              )}

              <div className="space-y-1.5">
                {objective.key_results.map((kr) => {
                  const krProgress = calculateKeyResultProgress(kr)
                  return (
                    <div
                      key={kr.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      {kr.status === 'completed' ? (
                        <CheckCircle2
                          className={`size-4 ${krStatusColors[kr.status]}`}
                        />
                      ) : (
                        <Circle
                          className={`size-4 ${krStatusColors[kr.status]}`}
                        />
                      )}
                      <span className="flex-1 text-xs">{kr.title}</span>
                      {kr.target_value !== null && (
                        <span className="text-muted-foreground text-xs">
                          {kr.current_value || 0}
                          {kr.unit && ` ${kr.unit}`} / {kr.target_value}
                          {kr.unit && ` ${kr.unit}`}
                          <span className="ml-1">({krProgress}%)</span>
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

const calculateKeyResultProgress = (
  keyResult: GoalWithDetails['objectives'][0]['key_results'][0],
): number => {
  if (keyResult.status === 'completed') return 100
  if (keyResult.target_value === null || keyResult.target_value === 0) return 0

  const current = keyResult.current_value || 0
  return Math.min(Math.round((current / keyResult.target_value) * 100), 100)
}

const calculateObjectiveProgress = (
  objective: GoalWithDetails['objectives'][0],
): number => {
  if (objective.key_results.length === 0) return 0

  const totalProgress = objective.key_results.reduce(
    (sum, kr) => sum + calculateKeyResultProgress(kr),
    0,
  )

  return Math.round(totalProgress / objective.key_results.length)
}

const calculateGoalProgress = (goal: GoalWithDetails): number => {
  if (goal.objectives.length === 0) return 0

  const totalProgress = goal.objectives.reduce(
    (sum, obj) => sum + calculateObjectiveProgress(obj),
    0,
  )

  return Math.round(totalProgress / goal.objectives.length)
}
