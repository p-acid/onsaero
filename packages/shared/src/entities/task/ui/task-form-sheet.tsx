import { zodResolver } from '@hookform/resolvers/zod'
import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Textarea,
} from '@onsaero-shared/shared/ui'
import type { ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { TaskDatePicker } from './task-date-picker'
import { TaskPrioritySelect } from './task-priority-select'
import { TaskStatusSelect } from './task-status-select'

const taskFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title is too long'),
  description: z.string().max(1000, 'Description is too long').optional(),
  status: z
    .enum(['pending', 'in_progress', 'completed'] as const)
    .nullable()
    .optional(),
  priority: z
    .enum(['row', 'medium', 'high', 'urgent'] as const)
    .nullable()
    .optional(),
  started_at: z.string().nullable().optional(),
  due_date: z.string().nullable().optional(),
})

export type TaskFormValues = z.infer<typeof taskFormSchema>

export interface TaskFormSheetProps {
  title: string
  description: string
  submitText: string
  onSubmit: (data: TaskFormValues, onSuccess: () => void) => Promise<void>
  open: boolean
  onOpenChange: (open: boolean) => void
  trigger?: ReactNode
  defaultValues?: Partial<TaskFormValues>
  isSubmitting?: boolean
}

export const TaskFormSheet = ({
  title,
  description,
  submitText,
  onSubmit,
  open,
  onOpenChange,
  trigger,
  defaultValues,
  isSubmitting = false,
}: TaskFormSheetProps) => {
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: defaultValues?.title || '',
      description: defaultValues?.description || '',
      status: defaultValues?.status || null,
      priority: defaultValues?.priority || null,
      started_at: defaultValues?.started_at || null,
      due_date: defaultValues?.due_date || null,
    },
    mode: 'onChange',
  })

  const handleSubmit = async (data: TaskFormValues) => {
    const onSuccess = () => {
      form.reset()
      onOpenChange(false)
    }

    try {
      await onSubmit(data, onSuccess)
    } catch (error) {
      console.error('Failed to submit task:', error)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {trigger}
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex flex-1 flex-col gap-4 p-4"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="Task title..."
                      disabled={isSubmitting}
                      autoFocus
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      className="h-40 resize-none"
                      placeholder="Add a description..."
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field: { value, onChange, disabled } }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    <TaskStatusSelect
                      value={value}
                      onChange={(value) => onChange(value)}
                      disabled={disabled || isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field: { value, onChange, disabled } }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <FormControl>
                    <TaskPrioritySelect
                      value={value}
                      onChange={(value) => onChange(value)}
                      disabled={disabled || isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="started_at"
              render={({ field: { value, onChange, disabled } }) => (
                <FormItem>
                  <FormLabel>Started At</FormLabel>
                  <FormControl>
                    <TaskDatePicker
                      value={value}
                      onChange={(value) => onChange(value)}
                      disabled={disabled || isSubmitting}
                      placeholder="Select date"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="due_date"
              render={({ field: { value, onChange, disabled } }) => (
                <FormItem>
                  <FormLabel>Due Date</FormLabel>
                  <FormControl>
                    <TaskDatePicker
                      value={value}
                      onChange={(value) => onChange(value)}
                      disabled={disabled || isSubmitting}
                      placeholder="Select date"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <SheetFooter className="mt-auto">
              <Button type="submit" disabled={isSubmitting}>
                {submitText}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
