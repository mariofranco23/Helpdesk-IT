import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Ticket, TicketStatus, TicketPriority } from '../../types'

export default function TicketList() {
  const navigate = useNavigate()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    status: 'OPEN' as TicketStatus | 'ALL',
    priority: 'ALL' as TicketPriority | 'ALL',
    search: '',
  })

  useEffect(() => {
    fetchTickets()
  }, [filters])

  const fetchTickets = async () => {
    try {
      let url = '/api/tickets?assigned_to=null'

      if (filters.status !== 'ALL') {
        url += `&status=${filters.status}`
      }
      if (filters.priority !== 'ALL') {
        url += `&priority=${filters.priority}`
      }
      if (filters.search) {
        url += `&search=${encodeURIComponent(filters.search)}`
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setTickets(data)
      }
    } catch (err) {
      console.error('Error fetching tickets:', err)
    } finally {
      setLoading(false)
    }
  }

  const getPriorityColor = (priority: TicketPriority) => {
    const colors: Record<TicketPriority, string> = {
      [TicketPriority.LOW]: 'bg-blue-100 text-blue-800',
      [TicketPriority.MEDIUM]: 'bg-yellow-100 text-yellow-800',
      [TicketPriority.HIGH]: 'bg-orange-100 text-orange-800',
      [TicketPriority.CRITICAL]: 'bg-red-100 text-red-800',
    }
    return colors[priority] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return <div className="text-center py-8">Cargando...</div>
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Tickets Disponibles</h2>

      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Buscar tickets..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={filters.status}
            onChange={(e) =>
              setFilters({
                ...filters,
                status: e.target.value as TicketStatus | 'ALL',
              })
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Todos los Estados</option>
            <option value={TicketStatus.NEW}>Nuevo</option>
            <option value={TicketStatus.OPEN}>Abierto</option>
            <option value={TicketStatus.IN_PROCESS}>En Proceso</option>
            <option value={TicketStatus.WAITING_CLIENT}>Esperando Cliente</option>
          </select>
          <select
            value={filters.priority}
            onChange={(e) =>
              setFilters({
                ...filters,
                priority: e.target.value as TicketPriority | 'ALL',
              })
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Todas las Prioridades</option>
            <option value={TicketPriority.LOW}>Baja</option>
            <option value={TicketPriority.MEDIUM}>Media</option>
            <option value={TicketPriority.HIGH}>Alta</option>
            <option value={TicketPriority.CRITICAL}>Crítica</option>
          </select>
        </div>
      </div>

      {tickets.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg">
          <p className="text-gray-500">No hay tickets disponibles</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              onClick={() => navigate(`/tickets/${ticket.id}`)}
              className="bg-white rounded-lg shadow p-4 hover:shadow-md cursor-pointer transition border-l-4 border-blue-600"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{ticket.title}</h3>
                  <p className="text-sm text-gray-600">ID: {ticket.public_id}</p>
                </div>
                <div className="flex gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(ticket.priority)}`}>
                    {ticket.priority}
                  </span>
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                {ticket.description}
              </p>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Requester: {ticket.requester_id}</span>
                <span>
                  Categoría: {ticket.category}
                </span>
                <span>
                  Creado:{' '}
                  {new Date(ticket.created_at).toLocaleDateString('es-ES')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
