import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Ticket, Message } from '../../types'
import { apiClient } from '../../services/api'
import LoadingSpinner from '../../components/LoadingSpinner'
import StatusBadge from '../../components/StatusBadge'
import PriorityBadge from '../../components/PriorityBadge'
import MessageThread from '../../components/MessageThread'
import ErrorMessage from '../../components/ErrorMessage'

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    fetchTicketDetails()
  }, [id])

  const fetchTicketDetails = async () => {
    try {
      setLoading(true)
      setError('')
      if (!id) throw new Error('ID de ticket no válido')

      const [ticketData, messagesData] = await Promise.all([
        apiClient.getTicket(id),
        apiClient.getMessages(id),
      ])

      setTicket(ticketData)
      setMessages(messagesData)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar ticket'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <LoadingSpinner text="Cargando ticket..." />
  }

  if (error) {
    return (
      <ErrorMessage
        message={error}
        onDismiss={() => setError('')}
        type="error"
      />
    )
  }

  if (!ticket) {
    return <ErrorMessage message="Ticket no encontrado" type="error" />
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold">{ticket.title}</h2>
          <p className="text-gray-600">ID: {ticket.public_id}</p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="text-gray-600 hover:text-gray-900"
        >
          ← Volver
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4">
          <p className="text-sm text-gray-600">Estado</p>
          <StatusBadge status={ticket.status} />
        </div>
        <div className="bg-white rounded-lg p-4">
          <p className="text-sm text-gray-600">Prioridad</p>
          <PriorityBadge priority={ticket.priority} />
        </div>
        <div className="bg-white rounded-lg p-4">
          <p className="text-sm text-gray-600">Categoría</p>
          <p className="font-semibold">{ticket.category}</p>
        </div>
        <div className="bg-white rounded-lg p-4">
          <p className="text-sm text-gray-600">Asignado a</p>
          <p className="font-semibold">{ticket.assigned_to || 'Sin asignar'}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Descripción</h3>
        <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Conversación</h3>
        <MessageThread messages={messages} />

        <button
          onClick={() => navigate(`/responder`)}
          className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
        >
          Agregar Respuesta
        </button>
      </div>
    </div>
  )
}
