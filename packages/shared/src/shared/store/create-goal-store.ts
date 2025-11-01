import { create } from 'zustand'
import type { CreateGoalFormData } from '../../entities/goal'

interface CreateGoalStore {
  currentStep: number
  formData: CreateGoalFormData
  setCurrentStep: (step: number) => void
  setTemplate: (template: CreateGoalFormData['template']) => void
  setOKRData: (data: CreateGoalFormData['okrData']) => void
  setMandartData: (data: CreateGoalFormData['mandartData']) => void
  reset: () => void
  nextStep: () => void
  prevStep: () => void
}

const initialFormData: CreateGoalFormData = {
  template: null,
  okrData: undefined,
  mandartData: undefined,
}

export const useCreateGoalStore = create<CreateGoalStore>((set) => ({
  currentStep: 0,
  formData: initialFormData,
  setCurrentStep: (step) => set({ currentStep: step }),
  setTemplate: (template) =>
    set((state) => ({
      formData: { ...state.formData, template },
    })),
  setOKRData: (okrData) =>
    set((state) => ({
      formData: { ...state.formData, okrData },
    })),
  setMandartData: (mandartData) =>
    set((state) => ({
      formData: { ...state.formData, mandartData },
    })),
  reset: () => set({ currentStep: 0, formData: initialFormData }),
  nextStep: () => set((state) => ({ currentStep: state.currentStep + 1 })),
  prevStep: () =>
    set((state) => ({
      currentStep: Math.max(0, state.currentStep - 1),
    })),
}))
