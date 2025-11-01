export type GoalTemplate = 'OKR' | 'Mandart'

export interface OKRData {
  objective: string
  keyResults: Array<{
    id: string
    title: string
    description?: string
  }>
}

export interface MandalaCell {
  id: string
  title: string
  description?: string
}

export interface MandartData {
  centerGoal: string
  subGoals: Array<{
    id: string
    title: string
    tasks?: Array<{
      id: string
      title: string
    }>
  }>
  // 9x9 Mandala Chart 데이터 (중앙 3x3 + 외부 8개 3x3)
  mandalaGrid?: {
    center: MandalaCell[][] // 3x3 중앙 그리드
    outer: {
      topLeft: MandalaCell[][] // 3x3
      top: MandalaCell[][] // 3x3
      topRight: MandalaCell[][] // 3x3
      left: MandalaCell[][] // 3x3
      right: MandalaCell[][] // 3x3
      bottomLeft: MandalaCell[][] // 3x3
      bottom: MandalaCell[][] // 3x3
      bottomRight: MandalaCell[][] // 3x3
    }
  }
}

export interface CreateGoalFormData {
  template: GoalTemplate | null
  okrData?: OKRData
  mandartData?: MandartData
}
