import type { GoalTemplate } from '../../../entities/goal'
import { useCreateGoalStore } from '../../../shared/store/create-goal-store'
import { Button } from '../../../shared/ui/button'
import { Label } from '../../../shared/ui/label'
import { RadioGroup, RadioGroupItem } from '../../../shared/ui/radio-group'

export const TemplateStep = () => {
  const { formData, setTemplate, nextStep } = useCreateGoalStore()

  const handleTemplateChange = (value: string) => {
    setTemplate(value as GoalTemplate)
  }

  const handleNext = () => {
    if (formData.template) {
      nextStep()
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8">
      <div className="space-y-2">
        <h1 className="font-bold text-3xl">목표 템플릿 선택</h1>
        <p className="text-muted-foreground">
          목표 설정에 사용할 템플릿을 선택해주세요
        </p>
      </div>

      <RadioGroup
        value={formData.template || ''}
        onValueChange={handleTemplateChange}
        className="space-y-4"
      >
        <div className="flex items-start space-x-3 rounded-lg border p-4 transition-colors hover:bg-accent">
          <RadioGroupItem value="OKR" id="okr" className="mt-1" />
          <div className="flex-1 space-y-1">
            <Label
              htmlFor="okr"
              className="cursor-pointer font-semibold text-base"
            >
              OKR (Objectives and Key Results)
            </Label>
            <p className="text-muted-foreground text-sm">
              목표(Objective)와 핵심 결과(Key Results)를 설정하여 명확한 성과
              지표를 관리합니다
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-3 rounded-lg border p-4 transition-colors hover:bg-accent">
          <RadioGroupItem value="Mandart" id="mandart" className="mt-1" />
          <div className="flex-1 space-y-1">
            <Label
              htmlFor="mandart"
              className="cursor-pointer font-semibold text-base"
            >
              만다라트 (Mandart)
            </Label>
            <p className="text-muted-foreground text-sm">
              중심 목표를 기준으로 8개의 세부 목표와 각각의 실행 과제를
              체계적으로 관리합니다
            </p>
          </div>
        </div>
      </RadioGroup>

      <div className="flex justify-end">
        <Button onClick={handleNext} disabled={!formData.template} size="lg">
          다음
        </Button>
      </div>
    </div>
  )
}
