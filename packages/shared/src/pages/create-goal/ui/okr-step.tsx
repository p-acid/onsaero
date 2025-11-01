import { useState } from 'react'
import type { OKRData } from '../../../entities/goal'
import { useCreateGoalStore } from '../../../shared/store/create-goal-store'
import { Button } from '../../../shared/ui/button'
import { Input } from '../../../shared/ui/input'
import { Label } from '../../../shared/ui/label'
import { Textarea } from '../../../shared/ui/textarea'

export const OKRStep = () => {
  const { formData, setOKRData, prevStep } = useCreateGoalStore()

  const [objective, setObjective] = useState(formData.okrData?.objective || '')
  const [keyResults, setKeyResults] = useState<OKRData['keyResults']>(
    formData.okrData?.keyResults || [
      { id: crypto.randomUUID(), title: '', description: '' },
      { id: crypto.randomUUID(), title: '', description: '' },
      { id: crypto.randomUUID(), title: '', description: '' },
    ],
  )

  const handleAddKeyResult = () => {
    setKeyResults([
      ...keyResults,
      { id: crypto.randomUUID(), title: '', description: '' },
    ])
  }

  const handleRemoveKeyResult = (id: string) => {
    if (keyResults.length > 1) {
      setKeyResults(keyResults.filter((kr) => kr.id !== id))
    }
  }

  const handleKeyResultChange = (
    id: string,
    field: 'title' | 'description',
    value: string,
  ) => {
    setKeyResults(
      keyResults.map((kr) => (kr.id === id ? { ...kr, [field]: value } : kr)),
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const okrData: OKRData = {
      objective,
      keyResults: keyResults.filter((kr) => kr.title.trim() !== ''),
    }

    setOKRData(okrData)

    // TODO: 실제 API 호출로 목표 생성
    console.log('OKR Data:', okrData)
  }

  const isValid =
    objective.trim() !== '' && keyResults.some((kr) => kr.title.trim() !== '')

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8">
      <div className="space-y-2">
        <h1 className="font-bold text-3xl">OKR 목표 작성</h1>
        <p className="text-muted-foreground">
          목표(Objective)와 핵심 결과(Key Results)를 입력해주세요
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="objective" className="font-semibold text-base">
              목표 (Objective)
            </Label>
            <Input
              id="objective"
              placeholder="예: 제품의 사용자 경험을 획기적으로 개선한다"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              className="text-base"
              required
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="font-semibold text-base">
              핵심 결과 (Key Results)
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddKeyResult}
            >
              + 핵심 결과 추가
            </Button>
          </div>

          <div className="space-y-4">
            {keyResults.map((kr, index) => (
              <div key={kr.id} className="space-y-3 rounded-lg border p-4">
                <div className="flex items-start justify-between gap-4">
                  <Label htmlFor={`kr-title-${kr.id}`} className="mt-2">
                    KR {index + 1}
                  </Label>
                  {keyResults.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveKeyResult(kr.id)}
                    >
                      삭제
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <Input
                    id={`kr-title-${kr.id}`}
                    placeholder="예: 사용자 만족도 점수를 4.5점으로 향상"
                    value={kr.title}
                    onChange={(e) =>
                      handleKeyResultChange(kr.id, 'title', e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Textarea
                    id={`kr-description-${kr.id}`}
                    placeholder="세부 설명 (선택사항)"
                    value={kr.description || ''}
                    onChange={(e) =>
                      handleKeyResultChange(
                        kr.id,
                        'description',
                        e.target.value,
                      )
                    }
                    rows={2}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={prevStep} size="lg">
            이전
          </Button>
          <Button type="submit" disabled={!isValid} size="lg">
            목표 생성
          </Button>
        </div>
      </form>
    </div>
  )
}
