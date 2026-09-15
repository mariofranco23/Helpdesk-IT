import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Ticket, Message, TicketStatus, MessageType, MessageChannel } from '../../types'
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
  const [replyContent, setReplyContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [newStatus, setNewStatus] = useState<TicketStatus | ''>('')

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
      setNewStatus(ticketData.status)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar ticket'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleAssignToMe = async () => {
    if (!id || !ticket) return
    try {
      setError('')
      await apiClient.updateTicket(id, { assigned_to: 'me' })
      fetchTicketDetails()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al asignar'
      setError(message)
    }
  }

  const handleStatusChange = async () => {
    if (!id || !newStatus) return
    try {
      setError('')
      await apiClient.updateTicket(id, { status: newStatus })
      fetchTicketDetails()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al actualizar estado'
      setError(message)
    }
  }

  const handleAddMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return

    try {
      setSubmitting(true)
      setError('')
      await apiClient.addMessage(id, {
        content: replyContent,
        type: MessageType.PUBLIC_REPLY,
        channel: MessageChannel.WEB,
      })
      setReplyContent('')
      fetchTicketDetails()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al enviar respuesta'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <LoadingSpinner text="Cargando ticket..." />
  }

  if (error && !ticket) {
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
          <h2 className="text-3xl font-bold text-white">{ticket.title}</h2>
          <p className="text-gray-400">ID: {ticket.public_id}</p>
        </div>
        <button
          onClick={() => navigate('/tickets')}
          className="text-gray-400 hover:text-white transition"
        >
          ← Volver
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Estado</p>
          <div className="mt-2">
            <StatusBadge status={ticket.status} size="sm" />
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Prioridad</p>
          <div className="mt-2">
            <PriorityBadge priority={ticket.priority} size="sm" />
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Categoría</p>
          <p className="font-semibold text-white mt-2">{ticket.category}</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Asignado a</p>
          <p className="font-semibold text-white mt-2">
            {ticket.assigned_to || 'Sin asignar'}
          </p>
        </div>
      </div>

      {error && (
        <ErrorMessage
          message={error}
          onDismiss={() => setError('')}
          type="error"
        />
      )}

      <div className="bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Acciones</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Cambiar Estado
            </label>
            <div className="flex gap-2">
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as TicketStatus)}
                className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value={TicketStatus.NEW}>Nuevo</option>
                <option value={TicketStatus.OPEN}>Abierto</option>
                <option value={TicketStatus.IN_PROCESS}>En Proceso</option>
                <option value={TicketStatus.WAITING_CLIENT}>Esperando Cliente</option>
                <option value={TicketStatus.WAITING_APPROVAL}>Esperando Aprobación</option>
                <option value={TicketStatus.RESOLVED}>Resuelto</option>
                <option value={TicketStatus.CLOSED}>Cerrado</option>
              </select>
              <button
                onClick={handleStatusChange}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition font-medium"
              >
                Actualizar
              </button>
            </div>
          </div>

          {!ticket.assigned_to && (
            <button
              onClick={handleAssignToMe}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition"
            >
              Asignar a Mí
            </button>
          )}
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Descripción</h3>
        <p className="text-gray-300 whitespace-pre-wrap">{ticket.description}</p>
      </div>

      <div className="bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Conversación</h3>
        <div className="mb-6 max-h-96 overflow-y-auto">
          <MessageThread messages={messages} />
        </div>

        <form onSubmit={handleAddMessage} className="space-y-4 pt-4 border-t border-gray-700">
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            required
            rows={4}
            disabled={submitting}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg placeholder-gray-400 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            placeholder="Escribir respuesta..."
          ></textarea>
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2 px-4 rounded-lg transition"
          >
            {submitting ? 'Enviando...' : 'Enviar Respuesta'}
          </button>
        </form>
      </div>
    </div>
  )
}
