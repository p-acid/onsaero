import { cn } from '@onsaero-shared/shared/lib'
import type { Database } from '@onsaero-shared/shared/types'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@onsaero-shared/shared/ui'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

type TaskStatus = Database['public']['Enums']['task_status']

export interface TaskStatusSelectProps {
  value: TaskStatus | null
  onChange: (status: TaskStatus) => void
  disabled?: boolean
  variant?: 'default' | 'table-cell'
}

const STATUS_OPTIONS: { value: TaskStatus; label: string; color: string }[] = [
  { value: 'pending', label: 'Pending', color: 'text-gray-500' },
  { value: 'in_progress', label: 'In Progress', color: 'text-blue-500' },
  { value: 'completed', label: 'Completed', color: 'text-green-500' },
]

export const TaskStatusSelect = ({
  value,
  onChange,
  disabled = false,
  variant = 'default',
}: TaskStatusSelectProps) => {
  const [open, setOpen] = useState(false)

  const selectedOption = STATUS_OPTIONS.find((opt) => opt.value === value)
  const displayLabel = selectedOption?.label || 'Select status'
  const displayColor = selectedOption?.color || 'text-muted-foreground'

  const handleSelect = (status: TaskStatus) => {
    onChange(status)
    setOpen(false)
  }

  if (variant === 'table-cell') {
    return (
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              'inline-flex w-full items-center gap-1 rounded-sm px-2 py-1 font-medium text-sm transition-colors hover:bg-muted',
              displayColor,
              disabled && 'cursor-not-allowed opacity-50',
            )}
            disabled={disabled}
          >
            {displayLabel}
            <ChevronDown className="h-3 w-3 opacity-50" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {STATUS_OPTIONS.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onSelect={() => handleSelect(option.value)}
              className={cn('gap-2', option.color)}
            >
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between"
          disabled={disabled}
        >
          <span className={displayColor}>{displayLabel}</span>
          <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-full">
        {STATUS_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onSelect={() => handleSelect(option.value)}
            className={cn('gap-2', option.color)}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
