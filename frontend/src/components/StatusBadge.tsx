import { TicketStatus } from '../types'

interface StatusBadgeProps {
  status: TicketStatus
  size?: 'sm' | 'md' | 'lg'
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const colors: Record<TicketStatus, { bg: string; text: string }> = {
    [TicketStatus.NEW]: { bg: 'bg-blue-100', text: 'text-blue-800' },
    [TicketStatus.OPEN]: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
    [TicketStatus.IN_PROCESS]: { bg: 'bg-purple-100', text: 'text-purple-800' },
    [TicketStatus.WAITING_CLIENT]: { bg: 'bg-orange-100', text: 'text-orange-800' },
    [TicketStatus.WAITING_APPROVAL]: { bg: 'bg-indigo-100', text: 'text-indigo-800' },
    [TicketStatus.WAITING_THIRD_PARTY]: { bg: 'bg-pink-100', text: 'text-pink-800' },
    [TicketStatus.RESOLVED]: { bg: 'bg-green-100', text: 'text-green-800' },
    [TicketStatus.CLOSED]: { bg: 'bg-gray-100', text: 'text-gray-800' },
    [TicketStatus.CANCELLED]: { bg: 'bg-red-100', text: 'text-red-800' },
  }

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 rounded-full text-sm',
    lg: 'px-4 py-2 rounded-lg text-base',
  }

  const { bg, text } = colors[status]

  return (
    <span className={`font-medium rounded-full ${sizeClasses[size]} ${bg} ${text}`}>
      {status}
    </span>
  )
}
