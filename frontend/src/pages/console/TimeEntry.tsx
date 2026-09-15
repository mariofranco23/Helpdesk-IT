import { useState, useEffect } from 'react'
import { TimeEntry } from '../../types'
import { apiClient } from '../../services/api'
import { validate, validators } from '../../utils/validation'
import LoadingSpinner from '../../components/LoadingSpinner'
import ErrorMessage from '../../components/ErrorMessage'

export default function TimeEntryPage() {
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string>('')
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState({
    ticket_id: '',
    duration_minutes: '',
    work_type: 'SUPPORT',
    description: '',
    work_date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    fetchTimeEntries()
  }, [])

  const fetchTimeEntries = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await apiClient.getTimeEntries()
      setEntries(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar registros'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setFormErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const validationSchema = {
      ticket_id: [validators.required('Ticket ID')],
      duration_minutes: [
        validators.required('Duración'),
        validators.minNumber('Duración', 1),
        validators.maxNumber('Duración', 480),
      ],
      description: [validators.required('Descripción')],
    }

    const errors = validate(formData, validationSchema)
    if (errors.length > 0) {
      const errorMap = errors.reduce(
        (acc, err) => ({ ...acc, [err.field]: err.message }),
        {}
      )
      setFormErrors(errorMap)
      return
    }

    try {
      setSubmitting(true)
      await apiClient.createTimeEntry({
        ...formData,
        duration_minutes: parseInt(formData.duration_minutes),
      })

      setFormData({
        ticket_id: '',
        duration_minutes: '',
        work_type: 'SUPPORT',
        description: '',
        work_date: new Date().toISOString().split('T')[0],
      })
      setFormErrors({})
      setShowForm(false)
      fetchTimeEntries()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al crear registro'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <LoadingSpinner text="Cargando registros de tiempo..." />
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Registro de Tiempo</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition font-medium"
        >
          {showForm ? '✕ Cancelar' : '+ Nuevo Registro'}
        </button>
      </div>

      {error && (
        <ErrorMessage
          message={error}
          onDismiss={() => setError('')}
          type="error"
        />
      )}

      {showForm && (
        <div className="bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Registrar Tiempo</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Ticket ID *
              </label>
              <input
                type="text"
                name="ticket_id"
                value={formData.ticket_id}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 ${
                  formErrors.ticket_id ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="ID del ticket"
              />
              {formErrors.ticket_id && (
                <p className="text-red-400 text-sm mt-1">{formErrors.ticket_id}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Duración (minutos) *
                </label>
                <input
                  type="number"
                  name="duration_minutes"
                  value={formData.duration_minutes}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 ${
                    formErrors.duration_minutes ? 'border-red-500' : 'border-gray-600'
                  }`}
                  placeholder="60"
                />
                {formErrors.duration_minutes && (
                  <p className="text-red-400 text-sm mt-1">
                    {formErrors.duration_minutes}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Fecha
                </label>
                <input
                  type="date"
                  name="work_date"
                  value={formData.work_date}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Tipo de Trabajo
              </label>
              <select
                name="work_type"
                value={formData.work_type}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="SUPPORT">Soporte</option>
                <option value="MAINTENANCE">Mantenimiento</option>
                <option value="DEVELOPMENT">Desarrollo</option>
                <option value="TESTING">Testing</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Descripción *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className={`w-full px-4 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 ${
                  formErrors.description ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="Describe el trabajo realizado"
              />
              {formErrors.description && (
                <p className="text-red-400 text-sm mt-1">{formErrors.description}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-500 text-white font-semibold py-2 px-4 rounded-lg transition"
            >
              {submitting ? 'Guardando...' : 'Guardar Registro'}
            </button>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {entries.length === 0 ? (
          <div className="text-center py-12 bg-gray-800 rounded-lg text-gray-400">
            <p>No hay registros de tiempo</p>
          </div>
        ) : (
          entries.map((entry) => (
            <div
              key={entry.id}
              className="bg-gray-800 rounded-lg shadow p-4 hover:shadow-md transition border-l-4 border-blue-600"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-white">
                    Ticket: {entry.ticket_id}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {entry.work_type} • {entry.duration_minutes} min
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-sm text-gray-500">
                    {new Date(entry.work_date).toLocaleDateString('es-ES')}
                  </span>
                  <p className={`text-xs mt-1 ${
                    entry.billing_status === 'BILLABLE'
                      ? 'text-green-400'
                      : 'text-gray-500'
                  }`}>
                    {entry.billing_status}
                  </p>
                </div>
              </div>
              <p className="text-gray-300 text-sm">{entry.description}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
