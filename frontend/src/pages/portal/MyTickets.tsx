import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Ticket, TicketStatus } from '../../types'

export default function MyTickets() {
  const navigate = useNavigate()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<TicketStatus | 'ALL'>('ALL')

  useEffect(() => {
    fetchTickets()
  }, [filter])

  const fetchTickets = async () => {
    try {
      const url =
        filter === 'ALL'
          ? '/api/tickets'
          : `/api/tickets?status=${filter}`

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

  const getStatusColor = (status: TicketStatus) => {
    const colors: Record<TicketStatus, string> = {
      [TicketStatus.NEW]: 'bg-blue-100 text-blue-800',
      [TicketStatus.OPEN]: 'bg-yellow-100 text-yellow-800',
      [TicketStatus.IN_PROCESS]: 'bg-purple-100 text-purple-800',
      [TicketStatus.WAITING_CLIENT]: 'bg-orange-100 text-orange-800',
      [TicketStatus.WAITING_APPROVAL]: 'bg-indigo-100 text-indigo-800',
      [TicketStatus.WAITING_THIRD_PARTY]: 'bg-pink-100 text-pink-800',
      [TicketStatus.RESOLVED]: 'bg-green-100 text-green-800',
      [TicketStatus.CLOSED]: 'bg-gray-100 text-gray-800',
      [TicketStatus.CANCELLED]: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return <div className="text-center py-8">Cargando...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Mis Tickets</h2>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as TicketStatus | 'ALL')}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="ALL">Todos</option>
          <option value={TicketStatus.NEW}>Nuevo</option>
          <option value={TicketStatus.OPEN}>Abierto</option>
          <option value={TicketStatus.IN_PROCESS}>En Proceso</option>
          <option value={TicketStatus.WAITING_CLIENT}>Esperando Cliente</option>
          <option value={TicketStatus.RESOLVED}>Resuelto</option>
          <option value={TicketStatus.CLOSED}>Cerrado</option>
        </select>
      </div>

      {tickets.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg">
          <p className="text-gray-500">No hay tickets disponibles</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              onClick={() => navigate(`/tickets/${ticket.id}`)}
              className="bg-white rounded-lg shadow p-4 hover:shadow-md cursor-pointer transition"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-lg">{ticket.title}</h3>
                  <p className="text-sm text-gray-600">ID: {ticket.public_id}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                    ticket.status
                  )}`}
                >
                  {ticket.status}
                </span>
              </div>
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                {ticket.description}
              </p>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Categoría: {ticket.category}</span>
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
