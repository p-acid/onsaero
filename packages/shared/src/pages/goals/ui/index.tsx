import {
  GoalCard,
  useDeleteGoalMutation,
  useGoalsQuery,
  useGoalWithDetailsQuery,
} from '@onsaero-shared/entities/goal'
import { PAGE_ROUTES } from '@onsaero-shared/shared/config'
import { useAuthContext } from '@onsaero-shared/shared/context'
import { Button } from '@onsaero-shared/shared/ui/button'
import { useNavigate } from 'react-router'

const GoalWithDetails = ({
  goalId,
  onDelete,
}: {
  goalId: string
  onDelete: (goalId: string) => void
}) => {
  const { data: goalDetails, isLoading } = useGoalWithDetailsQuery(goalId)

  if (isLoading) {
    return (
      <div className="rounded-lg border p-8 text-center">
        <p className="text-muted-foreground text-sm">Loading goal details...</p>
      </div>
    )
  }

  if (!goalDetails) {
    return null
  }

  return <GoalCard goal={goalDetails} onDelete={onDelete} />
}

export const GoalsPage = () => {
  const user = useAuthContext((state) => state.user)
  const navigate = useNavigate()
  const { data: goals = [], isLoading } = useGoalsQuery(user?.id)
  const deleteGoalMutation = useDeleteGoalMutation()

  const handleCreateGoal = () => {
    navigate(PAGE_ROUTES.CREATE_GOAL)
  }

  const handleDeleteGoal = (goalId: string) => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      deleteGoalMutation.mutate(goalId)
    }
  }

  if (!user) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Please sign in to view goals.</p>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between px-5 pt-5">
        <div>
          <h1 className="font-bold text-foreground text-xl">Goals</h1>
          <p className="text-muted-foreground text-sm">
            Track your objectives and key results
          </p>
        </div>
        <Button onClick={handleCreateGoal}>목표 생성</Button>
      </div>

      {isLoading ? (
        <div className="py-8 text-center">
          <p className="text-muted-foreground">Loading goals...</p>
        </div>
      ) : goals.length === 0 ? (
        <div className="mx-4 rounded-lg border py-12 text-center">
          <p className="text-muted-foreground">
            No goals yet. Create your first goal above!
          </p>
        </div>
      ) : (
        <div className="space-y-4 px-5 pb-5">
          {goals.map((goal) => (
            <GoalWithDetails
              key={goal.id}
              goalId={goal.id}
              onDelete={handleDeleteGoal}
            />
          ))}
        </div>
      )}
    </div>
  )
}
