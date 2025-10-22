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

type TaskPriority = Database['public']['Enums']['task_priority']

export interface TaskPrioritySelectProps {
  value: TaskPriority | null
  onChange: (priority: TaskPriority | null) => void
  disabled?: boolean
  variant?: 'default' | 'table-cell'
}

const PRIORITY_OPTIONS: {
  value: TaskPriority
  label: string
  color: string
}[] = [
  { value: 'row', label: 'Low', color: 'text-gray-500' },
  { value: 'medium', label: 'Medium', color: 'text-blue-500' },
  { value: 'high', label: 'High', color: 'text-orange-500' },
  { value: 'urgent', label: 'Urgent', color: 'text-red-500' },
]

export const TaskPrioritySelect = ({
  value,
  onChange,
  disabled = false,
  variant = 'default',
}: TaskPrioritySelectProps) => {
  const [open, setOpen] = useState(false)

  const selectedOption = PRIORITY_OPTIONS.find((opt) => opt.value === value)
  const displayLabel = selectedOption?.label || 'None'
  const displayColor = selectedOption?.color || 'text-muted-foreground'

  const handleSelect = (priority: TaskPriority) => {
    onChange(priority)
    setOpen(false)
  }

  if (variant === 'table-cell') {
    return (
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              'inline-flex items-center gap-1 rounded-sm px-2 py-1 font-medium text-sm transition-colors hover:bg-muted',
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
          {PRIORITY_OPTIONS.map((option) => (
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
        {PRIORITY_OPTIONS.map((option) => (
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
