import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MessageType, MessageChannel } from '../../types'

export default function ReplyToTicket() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/tickets/${id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          content,
          type: MessageType.PUBLIC_REPLY,
          channel: MessageChannel.WEB,
        }),
      })

      if (response.ok) {
        navigate(`/tickets/${id}`)
      } else {
        throw new Error('Error al enviar respuesta')
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6">Responder Ticket</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tu Respuesta
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={8}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Escribe tu respuesta aquí..."
          ></textarea>
        </div>

        <div className="flex justify-between pt-4 border-t">
          <button
            type="button"
            onClick={() => navigate(`/tickets/${id}`)}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
          >
            {loading ? 'Enviando...' : 'Enviar Respuesta'}
          </button>
        </div>
      </form>
    </div>
  )
}
