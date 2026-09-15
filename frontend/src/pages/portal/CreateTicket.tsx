import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../../services/api'
import { TicketPriority } from '../../types'
import ErrorMessage from '../../components/ErrorMessage'
import LoadingSpinner from '../../components/LoadingSpinner'

export default function CreateTicket() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    priority: TicketPriority.MEDIUM,
  })

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleNextStep = () => {
    if (step === 1) {
      if (!formData.title.trim()) {
        setError('El asunto es requerido')
        return
      }
      if (!formData.category) {
        setError('La categoría es requerida')
        return
      }
    }
    if (step === 2) {
      if (!formData.description.trim()) {
        setError('La descripción es requerida')
        return
      }
    }
    setError('')
    setStep(step + 1)
  }

  const handlePrevStep = () => {
    setError('')
    setStep(step - 1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await apiClient.createTicket(formData)
      navigate(`/tickets/${response.id}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al crear ticket'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <LoadingSpinner fullScreen text="Creando ticket..." />
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Crear Nuevo Ticket</h2>

      <div className="mb-8">
        <div className="flex justify-between items-center">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`flex-1 h-2 rounded-full mx-1 ${
                s <= step ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            ></div>
          ))}
        </div>
        <div className="flex justify-between mt-4 text-sm text-gray-600">
          <span>Información Básica</span>
          <span>Detalles</span>
          <span>Confirmación</span>
        </div>
      </div>

      {error && (
        <ErrorMessage
          message={error}
          onDismiss={() => setError('')}
          type="error"
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Asunto *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Describe el problema brevemente"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoría *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecciona una categoría</option>
                <option value="HARDWARE">Hardware</option>
                <option value="SOFTWARE">Software</option>
                <option value="NETWORK">Red</option>
                <option value="EMAIL">Correo</option>
                <option value="OTHER">Otro</option>
              </select>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción Detallada *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Describe el problema con el máximo detalle posible"
              ></textarea>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prioridad
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value={TicketPriority.LOW}>Baja</option>
                <option value={TicketPriority.MEDIUM}>Media</option>
                <option value={TicketPriority.HIGH}>Alta</option>
                <option value={TicketPriority.CRITICAL}>Crítica</option>
              </select>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900">Resumen del Ticket</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Asunto</p>
                <p className="font-medium">{formData.title}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Categoría</p>
                <p className="font-medium">{formData.category}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Prioridad</p>
                <p className="font-medium">{formData.priority}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600">Descripción</p>
              <p className="font-medium text-sm whitespace-pre-wrap">
                {formData.description}
              </p>
            </div>
          </div>
        )}

        <div className="flex justify-between pt-6 border-t">
          <button
            type="button"
            onClick={handlePrevStep}
            disabled={step === 1}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition"
          >
            Anterior
          </button>
          {step < 3 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Siguiente
            </button>
          ) : (
            <button
              type="submit"
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              Crear Ticket
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
