import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Ticket, TicketStatus, TicketPriority } from '../../types'
import { apiClient } from '../../services/api'
import TicketCard from '../../components/TicketCard'
import LoadingSpinner from '../../components/LoadingSpinner'
import ErrorMessage from '../../components/ErrorMessage'

export default function TicketList() {
  const navigate = useNavigate()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [filters, setFilters] = useState({
    status: TicketStatus.OPEN as TicketStatus | 'ALL',
    priority: 'ALL' as TicketPriority | 'ALL',
    search: '',
  })

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const data = await apiClient.getTickets({
        status: filters.status === 'ALL' ? undefined : filters.status,
        priority: filters.priority === 'ALL' ? undefined : filters.priority,
        search: filters.search || undefined,
        assigned_to: undefined,
      })
      setTickets(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar tickets'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  const handleFilterChange = (
    key: keyof typeof filters,
    value: string
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  if (loading) {
    return <LoadingSpinner text="Cargando tickets..." />
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Tickets Disponibles</h2>
        <span className="text-sm text-gray-600">
          {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="bg-gray-800 rounded-lg shadow p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Buscar por título..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={filters.status}
            onChange={(e) =>
              handleFilterChange('status', e.target.value)
            }
            className="px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL" className="bg-gray-700">
              Todos los Estados
            </option>
            <option value={TicketStatus.NEW} className="bg-gray-700">
              Nuevo
            </option>
            <option value={TicketStatus.OPEN} className="bg-gray-700">
              Abierto
            </option>
            <option value={TicketStatus.IN_PROCESS} className="bg-gray-700">
              En Proceso
            </option>
            <option value={TicketStatus.WAITING_CLIENT} className="bg-gray-700">
              Esperando Cliente
            </option>
          </select>
          <select
            value={filters.priority}
            onChange={(e) =>
              handleFilterChange('priority', e.target.value)
            }
            className="px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL" className="bg-gray-700">
              Todas las Prioridades
            </option>
            <option value={TicketPriority.LOW} className="bg-gray-700">
              Baja
            </option>
            <option value={TicketPriority.MEDIUM} className="bg-gray-700">
              Media
            </option>
            <option value={TicketPriority.HIGH} className="bg-gray-700">
              Alta
            </option>
            <option value={TicketPriority.CRITICAL} className="bg-gray-700">
              Crítica
            </option>
          </select>
        </div>
      </div>

      {error && (
        <ErrorMessage
          message={error}
          onDismiss={() => setError('')}
          type="error"
        />
      )}

      {tickets.length === 0 ? (
        <div className="text-center py-12 bg-gray-800 rounded-lg text-gray-400">
          <p>No hay tickets disponibles con los filtros seleccionados</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              onClick={(id) => navigate(`/tickets/${id}`)}
              showAssignee={true}
            />
          ))}
        </div>
      )}
    </div>
  )
}
