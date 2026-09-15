import { useState, useEffect } from 'react'
import { TimeEntry } from '../../types'

export default function TimeEntryPage() {
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
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
      const response = await fetch('/api/time-entries', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setEntries(data)
      }
    } catch (err) {
      console.error('Error fetching time entries:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch('/api/time-entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          ...formData,
          duration_minutes: parseInt(formData.duration_minutes),
        }),
      })

      if (response.ok) {
        setFormData({
          ticket_id: '',
          duration_minutes: '',
          work_type: 'SUPPORT',
          description: '',
          work_date: new Date().toISOString().split('T')[0],
        })
        setShowForm(false)
        fetchTimeEntries()
      }
    } catch (err) {
      console.error('Error creating time entry:', err)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Cargando...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Registro de Tiempo</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
        >
          {showForm ? 'Cancelar' : 'Nuevo Registro'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Registrar Tiempo</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ticket ID
              </label>
              <input
                type="text"
                name="ticket_id"
                value={formData.ticket_id}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="ID del ticket"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duración (minutos)
                </label>
                <input
                  type="number"
                  name="duration_minutes"
                  value={formData.duration_minutes}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="60"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha
                </label>
                <input
                  type="date"
                  name="work_date"
                  value={formData.work_date}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Trabajo
              </label>
              <select
                name="work_type"
                value={formData.work_type}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="SUPPORT">Soporte</option>
                <option value="MAINTENANCE">Mantenimiento</option>
                <option value="DEVELOPMENT">Desarrollo</option>
                <option value="TESTING">Testing</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Describe el trabajo realizado"
              ></textarea>
            </div>

            <button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition"
            >
              Guardar Registro
            </button>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {entries.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-500">No hay registros de tiempo</p>
          </div>
        ) : (
          entries.map((entry) => (
            <div
              key={entry.id}
              className="bg-white rounded-lg shadow p-4 hover:shadow-md transition"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold">Ticket: {entry.ticket_id}</h3>
                  <p className="text-sm text-gray-600">
                    {entry.work_type} - {entry.duration_minutes} minutos
                  </p>
                </div>
                <span className="text-sm text-gray-500">
                  {new Date(entry.work_date).toLocaleDateString('es-ES')}
                </span>
              </div>
              <p className="text-gray-700 text-sm">{entry.description}</p>
              <p className="text-xs text-gray-500 mt-2">
                Estado: {entry.billing_status}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
