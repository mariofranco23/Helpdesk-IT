import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Ticket, Message, TicketStatus } from '../../types'

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [replyContent, setReplyContent] = useState('')
  const [newStatus, setNewStatus] = useState<TicketStatus | ''>('')

  useEffect(() => {
    fetchTicketDetails()
  }, [id])

  const fetchTicketDetails = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const ticketResponse = await fetch(`/api/tickets/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const messagesResponse = await fetch(`/api/tickets/${id}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (ticketResponse.ok) {
        const ticketData = await ticketResponse.json()
        setTicket(ticketData)
        setNewStatus(ticketData.status)
      }

      if (messagesResponse.ok) {
        const messagesData = await messagesResponse.json()
        setMessages(messagesData)
      }
    } catch (err) {
      console.error('Error fetching ticket details:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAssignToMe = async () => {
    try {
      const response = await fetch(`/api/tickets/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({ assigned_to: 'me' }),
      })

      if (response.ok) {
        fetchTicketDetails()
      }
    } catch (err) {
      console.error('Error assigning ticket:', err)
    }
  }

  const handleStatusChange = async () => {
    try {
      const response = await fetch(`/api/tickets/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        fetchTicketDetails()
      }
    } catch (err) {
      console.error('Error updating status:', err)
    }
  }

  const handleAddMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch(`/api/tickets/${id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          content: replyContent,
          type: 'PUBLIC_REPLY',
          channel: 'WEB',
        }),
      })

      if (response.ok) {
        setReplyContent('')
        fetchTicketDetails()
      }
    } catch (err) {
      console.error('Error adding message:', err)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Cargando...</div>
  }

  if (!ticket) {
    return <div className="text-center py-8">Ticket no encontrado</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold">{ticket.title}</h2>
          <p className="text-gray-600">ID: {ticket.public_id}</p>
        </div>
        <button
          onClick={() => navigate('/tickets')}
          className="text-gray-600 hover:text-gray-900"
        >
          ← Volver
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4">
          <p className="text-sm text-gray-600">Estado</p>
          <p className="font-semibold">{ticket.status}</p>
        </div>
        <div className="bg-white rounded-lg p-4">
          <p className="text-sm text-gray-600">Prioridad</p>
          <p className="font-semibold">{ticket.priority}</p>
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
        <h3 className="text-lg font-semibold mb-4">Acciones</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cambiar Estado
            </label>
            <div className="flex gap-2">
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as TicketStatus)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value={TicketStatus.NEW}>Nuevo</option>
                <option value={TicketStatus.OPEN}>Abierto</option>
                <option value={TicketStatus.IN_PROCESS}>En Proceso</option>
                <option value={TicketStatus.WAITING_CLIENT}>
                  Esperando Cliente
                </option>
                <option value={TicketStatus.WAITING_APPROVAL}>
                  Esperando Aprobación
                </option>
                <option value={TicketStatus.RESOLVED}>Resuelto</option>
                <option value={TicketStatus.CLOSED}>Cerrado</option>
              </select>
              <button
                onClick={handleStatusChange}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
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

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Descripción</h3>
        <p className="text-gray-700">{ticket.description}</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Conversación</h3>
        <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
          {messages.length === 0 ? (
            <p className="text-gray-500">No hay mensajes</p>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className="bg-gray-50 rounded-lg p-4 border border-gray-200"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium text-gray-900">
                    {msg.author_id}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(msg.created_at).toLocaleString('es-ES')}
                  </span>
                </div>
                <p className="text-gray-700">{msg.content}</p>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleAddMessage} className="space-y-4 pt-4 border-t">
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            required
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Escribir respuesta..."
          ></textarea>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
          >
            Enviar Respuesta
          </button>
        </form>
      </div>
    </div>
  )
}
