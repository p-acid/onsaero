import { useEffect } from 'react'
import { useCreateGoalStore } from '../../../shared/store/create-goal-store'
import { MandartStep } from './mandart-step'
import { OKRStep } from './okr-step'
import { TemplateStep } from './template-step'

export const CreateGoalPage = () => {
  const { currentStep, formData, reset } = useCreateGoalStore()

  useEffect(() => {
    // 컴포넌트 언마운트 시 상태 초기화
    return () => {
      reset()
    }
  }, [reset])

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <TemplateStep />
      case 1:
        if (formData.template === 'OKR') {
          return <OKRStep />
        }
        if (formData.template === 'Mandart') {
          return <MandartStep />
        }
        return null
      default:
        return null
    }
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <div className="flex items-center gap-2">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full ${
              currentStep >= 0
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            1
          </div>
          <div className="h-0.5 w-12 bg-muted" />
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full ${
              currentStep >= 1
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            2
          </div>
        </div>
        <div className="mt-2 flex gap-2">
          <span className="font-medium text-sm">템플릿 선택</span>
          <span className="w-12" />
          <span className="font-medium text-sm">목표 작성</span>
        </div>
      </div>

      {renderStep()}
    </div>
  )
}
