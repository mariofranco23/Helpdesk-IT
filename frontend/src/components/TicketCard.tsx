import { Ticket } from '../types'
import StatusBadge from './StatusBadge'
import PriorityBadge from './PriorityBadge'

interface TicketCardProps {
  ticket: Ticket
  onClick: (id: string) => void
  showAssignee?: boolean
}

export default function TicketCard({
  ticket,
  onClick,
  showAssignee = false,
}: TicketCardProps) {
  return (
    <div
      onClick={() => onClick(ticket.id)}
      className="bg-white rounded-lg shadow hover:shadow-md cursor-pointer transition border-l-4 border-blue-600 p-4"
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">
            {ticket.title}
          </h3>
          <p className="text-sm text-gray-500">#{ticket.public_id}</p>
        </div>
        <div className="flex gap-2 ml-4">
          <PriorityBadge priority={ticket.priority} size="sm" />
          <StatusBadge status={ticket.status} size="sm" />
        </div>
      </div>

      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
        {ticket.description}
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-500 mb-2">
        <div>
          <span className="font-medium text-gray-600">Categoría:</span>{' '}
          {ticket.category}
        </div>
        <div>
          <span className="font-medium text-gray-600">Creado:</span>{' '}
          {new Date(ticket.created_at).toLocaleDateString('es-ES')}
        </div>
        {showAssignee && (
          <div>
            <span className="font-medium text-gray-600">Asignado:</span>{' '}
            {ticket.assigned_to || 'Sin asignar'}
          </div>
        )}
        {ticket.resolved_at && (
          <div>
            <span className="font-medium text-gray-600">Resuelto:</span>{' '}
            {new Date(ticket.resolved_at).toLocaleDateString('es-ES')}
          </div>
        )}
      </div>

      {ticket.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {ticket.tags.map((tag) => (
            <span
              key={tag}
              className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
