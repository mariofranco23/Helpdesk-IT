import { Message, MessageType } from '../types'

interface MessageThreadProps {
  messages: Message[]
  currentUserId?: string
}

export default function MessageThread({
  messages,
  currentUserId,
}: MessageThreadProps) {
  if (messages.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No hay mensajes en esta conversación
      </div>
    )
  }

  const getMessageTypeLabel = (type: MessageType) => {
    const labels: Record<MessageType, string> = {
      [MessageType.PUBLIC_REPLY]: 'Respuesta Pública',
      [MessageType.INTERNAL_NOTE]: 'Nota Interna',
      [MessageType.TIME_ENTRY]: 'Entrada de Tiempo',
      [MessageType.STATUS_CHANGE]: 'Cambio de Estado',
      [MessageType.ASSIGNMENT]: 'Asignación',
      [MessageType.APPROVAL]: 'Aprobación',
    }
    return labels[type]
  }

  const getMessageTypeColor = (type: MessageType) => {
    const colors: Record<MessageType, string> = {
      [MessageType.PUBLIC_REPLY]: 'bg-blue-50 border-blue-200',
      [MessageType.INTERNAL_NOTE]: 'bg-yellow-50 border-yellow-200',
      [MessageType.TIME_ENTRY]: 'bg-purple-50 border-purple-200',
      [MessageType.STATUS_CHANGE]: 'bg-green-50 border-green-200',
      [MessageType.ASSIGNMENT]: 'bg-indigo-50 border-indigo-200',
      [MessageType.APPROVAL]: 'bg-orange-50 border-orange-200',
    }
    return colors[type]
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`rounded-lg p-4 border-l-4 ${getMessageTypeColor(
            message.type
          )}`}
        >
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="font-medium text-gray-900">{message.author_id}</p>
              <p className="text-xs text-gray-600">
                {getMessageTypeLabel(message.type)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">
                {new Date(message.created_at).toLocaleString('es-ES')}
              </p>
              {message.is_internal && (
                <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded mt-1">
                  Interno
                </span>
              )}
            </div>
          </div>

          <p className="text-gray-700 whitespace-pre-wrap">{message.content}</p>

          {message.delivery_attempts > 0 && (
            <p className="text-xs text-gray-500 mt-2">
              Intentos de entrega: {message.delivery_attempts}
              {message.last_attempt_at &&
                ` (Último: ${new Date(message.last_attempt_at).toLocaleString(
                  'es-ES'
                )})`}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
