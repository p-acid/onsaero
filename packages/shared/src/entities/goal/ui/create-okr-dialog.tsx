import { Button } from '@onsaero-shared/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@onsaero-shared/shared/ui/dialog'
import { Input } from '@onsaero-shared/shared/ui/input'
import { Label } from '@onsaero-shared/shared/ui/label'
import { Textarea } from '@onsaero-shared/shared/ui/textarea'
import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { CreateOKR } from '../model/goal.dto'

interface CreateOKRDialogProps {
  onCreateOKR: (okrData: CreateOKR) => Promise<void>
  isCreating?: boolean
}

interface KeyResultInput {
  id: string
  title: string
  target_value?: number
  unit?: string
}

interface ObjectiveInput {
  id: string
  title: string
  description?: string
  key_results: KeyResultInput[]
}

export const CreateOKRDialog = ({
  onCreateOKR,
  isCreating = false,
}: CreateOKRDialogProps) => {
  const [open, setOpen] = useState(false)
  const [goalTitle, setGoalTitle] = useState('')
  const [goalDescription, setGoalDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [objectives, setObjectives] = useState<ObjectiveInput[]>([
    {
      id: crypto.randomUUID(),
      title: '',
      description: '',
      key_results: [{ id: crypto.randomUUID(), title: '', unit: '' }],
    },
  ])

  const handleAddObjective = () => {
    setObjectives([
      ...objectives,
      {
        id: crypto.randomUUID(),
        title: '',
        description: '',
        key_results: [{ id: crypto.randomUUID(), title: '', unit: '' }],
      },
    ])
  }

  const handleRemoveObjective = (objectiveId: string) => {
    if (objectives.length > 1) {
      setObjectives(objectives.filter((obj) => obj.id !== objectiveId))
    }
  }

  const handleObjectiveChange = (
    objectiveId: string,
    field: 'title' | 'description',
    value: string,
  ) => {
    setObjectives(
      objectives.map((obj) =>
        obj.id === objectiveId ? { ...obj, [field]: value } : obj,
      ),
    )
  }

  const handleAddKeyResult = (objectiveId: string) => {
    setObjectives(
      objectives.map((obj) =>
        obj.id === objectiveId
          ? {
              ...obj,
              key_results: [
                ...obj.key_results,
                { id: crypto.randomUUID(), title: '', unit: '' },
              ],
            }
          : obj,
      ),
    )
  }

  const handleRemoveKeyResult = (objectiveId: string, keyResultId: string) => {
    setObjectives(
      objectives.map((obj) =>
        obj.id === objectiveId
          ? {
              ...obj,
              key_results: obj.key_results.filter(
                (kr) => kr.id !== keyResultId,
              ),
            }
          : obj,
      ),
    )
  }

  const handleKeyResultChange = (
    objectiveId: string,
    keyResultId: string,
    field: 'title' | 'target_value' | 'unit',
    value: string | number,
  ) => {
    setObjectives(
      objectives.map((obj) =>
        obj.id === objectiveId
          ? {
              ...obj,
              key_results: obj.key_results.map((kr) =>
                kr.id === keyResultId ? { ...kr, [field]: value } : kr,
              ),
            }
          : obj,
      ),
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const okrData: CreateOKR = {
      goal: {
        user_id: '', // Will be set by the mutation
        title: goalTitle,
        description: goalDescription || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      },
      objectives: objectives
        .filter((obj) => obj.title.trim())
        .map((obj) => ({
          title: obj.title,
          description: obj.description || undefined,
          key_results: obj.key_results
            .filter((kr) => kr.title.trim())
            .map((kr) => ({
              title: kr.title,
              target_value: kr.target_value,
              unit: kr.unit,
            })),
        })),
    }

    await onCreateOKR(okrData)
    handleReset()
    setOpen(false)
  }

  const handleReset = () => {
    setGoalTitle('')
    setGoalDescription('')
    setStartDate('')
    setEndDate('')
    setObjectives([
      {
        id: crypto.randomUUID(),
        title: '',
        description: '',
        key_results: [{ id: crypto.randomUUID(), title: '', unit: '' }],
      },
    ])
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 size-4" />
          Create OKR
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Create New OKR</DialogTitle>
          <DialogDescription>
            Set objectives and key results to track your goals effectively.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Goal Section */}
          <div className="space-y-4 rounded-lg border p-4">
            <h3 className="font-semibold">Goal</h3>
            <div className="space-y-2">
              <Label htmlFor="goal-title">Title *</Label>
              <Input
                id="goal-title"
                value={goalTitle}
                onChange={(e) => setGoalTitle(e.target.value)}
                placeholder="e.g., Improve product quality"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal-description">Description</Label>
              <Textarea
                id="goal-description"
                value={goalDescription}
                onChange={(e) => setGoalDescription(e.target.value)}
                placeholder="Describe your goal..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Objectives Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Objectives</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddObjective}
              >
                <Plus className="mr-2 size-4" />
                Add Objective
              </Button>
            </div>

            {objectives.map((objective, objIndex) => (
              <div
                key={objective.id}
                className="space-y-3 rounded-lg border p-4"
              >
                <div className="flex items-start justify-between">
                  <Label>Objective {objIndex + 1}</Label>
                  {objectives.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveObjective(objective.id)}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  )}
                </div>

                <Input
                  value={objective.title}
                  onChange={(e) =>
                    handleObjectiveChange(objective.id, 'title', e.target.value)
                  }
                  placeholder="e.g., Reduce bug count"
                  required
                />

                <Textarea
                  value={objective.description}
                  onChange={(e) =>
                    handleObjectiveChange(
                      objective.id,
                      'description',
                      e.target.value,
                    )
                  }
                  placeholder="Description (optional)"
                  rows={2}
                />

                {/* Key Results */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Key Results</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAddKeyResult(objective.id)}
                    >
                      <Plus className="mr-1 size-3" />
                      Add KR
                    </Button>
                  </div>

                  {objective.key_results.map((kr, krIndex) => (
                    <div key={kr.id} className="flex gap-2">
                      <div className="flex-1">
                        <Input
                          value={kr.title}
                          onChange={(e) =>
                            handleKeyResultChange(
                              objective.id,
                              kr.id,
                              'title',
                              e.target.value,
                            )
                          }
                          placeholder={`Key Result ${krIndex + 1}`}
                          required
                        />
                      </div>
                      <Input
                        type="number"
                        value={kr.target_value || ''}
                        onChange={(e) =>
                          handleKeyResultChange(
                            objective.id,
                            kr.id,
                            'target_value',
                            Number(e.target.value),
                          )
                        }
                        placeholder="Target"
                        className="w-24"
                      />
                      <Input
                        value={kr.unit || ''}
                        onChange={(e) =>
                          handleKeyResultChange(
                            objective.id,
                            kr.id,
                            'unit',
                            e.target.value,
                          )
                        }
                        placeholder="Unit"
                        className="w-20"
                      />
                      {objective.key_results.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleRemoveKeyResult(objective.id, kr.id)
                          }
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating || !goalTitle.trim()}>
              {isCreating ? 'Creating...' : 'Create OKR'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
