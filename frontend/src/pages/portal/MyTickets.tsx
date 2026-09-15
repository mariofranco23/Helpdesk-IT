import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Ticket, TicketStatus } from '../../types'
import { apiClient } from '../../services/api'
import TicketCard from '../../components/TicketCard'
import LoadingSpinner from '../../components/LoadingSpinner'
import ErrorMessage from '../../components/ErrorMessage'

export default function MyTickets() {
  const navigate = useNavigate()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [filter, setFilter] = useState<TicketStatus | 'ALL'>('ALL')

  useEffect(() => {
    fetchTickets()
  }, [filter])

  const fetchTickets = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await apiClient.getTickets({
        status: filter === 'ALL' ? undefined : filter,
      })
      setTickets(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar tickets'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <LoadingSpinner text="Cargando tickets..." />
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

      {error && (
        <ErrorMessage
          message={error}
          onDismiss={() => setError('')}
          type="error"
        />
      )}

      {tickets.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg">
          <p className="text-gray-500">No hay tickets disponibles</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              onClick={(id) => navigate(`/tickets/${id}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
