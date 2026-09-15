import { TicketPriority } from '../types'

interface PriorityBadgeProps {
  priority: TicketPriority
  size?: 'sm' | 'md' | 'lg'
}

export default function PriorityBadge({ priority, size = 'md' }: PriorityBadgeProps) {
  const colors: Record<TicketPriority, { bg: string; text: string }> = {
    [TicketPriority.LOW]: { bg: 'bg-blue-100', text: 'text-blue-800' },
    [TicketPriority.MEDIUM]: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
    [TicketPriority.HIGH]: { bg: 'bg-orange-100', text: 'text-orange-800' },
    [TicketPriority.CRITICAL]: { bg: 'bg-red-100', text: 'text-red-800' },
  }

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 rounded-full text-sm',
    lg: 'px-4 py-2 rounded-lg text-base',
  }

  const { bg, text } = colors[priority]

  return (
    <span className={`font-medium rounded-full ${sizeClasses[size]} ${bg} ${text}`}>
      {priority}
    </span>
  )
}
