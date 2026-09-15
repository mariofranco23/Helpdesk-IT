import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Ticket, Message } from '../../types'

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)

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
        <h3 className="text-lg font-semibold mb-4">Descripción</h3>
        <p className="text-gray-700">{ticket.description}</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Conversación</h3>
        <div className="space-y-4 mb-6">
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

        <button
          onClick={() => navigate(`/tickets/${id}/responder`)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
        >
          Agregar Respuesta
        </button>
      </div>
    </div>
  )
}
