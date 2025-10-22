import { cn } from '@onsaero-shared/shared/lib'
import {
  Button,
  Calendar,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@onsaero-shared/shared/ui'
import { CalendarIcon } from 'lucide-react'
import { useState } from 'react'

export interface TaskDatePickerProps {
  value: string | null
  onChange: (date: string | null) => void
  disabled?: boolean
  variant?: 'default' | 'table-cell'
  placeholder?: string
}

export const TaskDatePicker = ({
  value,
  onChange,
  disabled = false,
  variant = 'default',
  placeholder = 'Select date',
}: TaskDatePickerProps) => {
  const [open, setOpen] = useState(false)

  const selectedDate = value ? new Date(value) : undefined

  const formatDate = (dateString: string | null) => {
    if (!dateString) return placeholder

    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onChange(date.toISOString())
    } else {
      onChange(null)
    }
    setOpen(false)
  }

  if (variant === 'table-cell') {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              'inline-flex items-center gap-1 rounded-sm px-2 py-1 text-sm transition-colors hover:bg-muted',
              !value && 'text-muted-foreground',
              disabled && 'cursor-not-allowed opacity-50',
            )}
            disabled={disabled}
          >
            <CalendarIcon className="h-3 w-3" />
            {formatDate(value)}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
          />
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal',
            !value && 'text-muted-foreground',
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {formatDate(value)}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
