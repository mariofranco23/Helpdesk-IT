import { useState, useEffect } from 'react'
import { apiClient } from '../../services/api'
import LoadingSpinner from '../../components/LoadingSpinner'
import ErrorMessage from '../../components/ErrorMessage'

interface DashboardStats {
  total_tickets: number
  open_tickets: number
  in_process_tickets: number
  awaiting_approval: number
  resolved_today: number
  avg_resolution_time: number
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await apiClient.getDashboardStats()
      setStats(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar estadísticas'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <LoadingSpinner text="Cargando dashboard..." />
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-white">Dashboard</h2>
        <button
          onClick={fetchDashboardStats}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
        >
          Actualizar
        </button>
      </div>

      {error && (
        <ErrorMessage
          message={error}
          onDismiss={() => setError('')}
          type="error"
        />
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard
          title="Total de Tickets"
          value={stats?.total_tickets || 0}
          color="blue"
        />
        <StatCard
          title="Tickets Abiertos"
          value={stats?.open_tickets || 0}
          color="yellow"
        />
        <StatCard
          title="En Proceso"
          value={stats?.in_process_tickets || 0}
          color="purple"
        />
        <StatCard
          title="Esperando Aprobación"
          value={stats?.awaiting_approval || 0}
          color="orange"
        />
        <StatCard
          title="Resueltos Hoy"
          value={stats?.resolved_today || 0}
          color="green"
        />
        <StatCard
          title="Tiempo Promedio (hrs)"
          value={Math.round(stats?.avg_resolution_time || 0)}
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            📊 Resumen de Estados
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Nuevos</span>
              <span className="text-xl font-bold text-blue-400">
                {stats?.total_tickets || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">En Proceso</span>
              <span className="text-xl font-bold text-purple-400">
                {stats?.in_process_tickets || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Resueltos</span>
              <span className="text-xl font-bold text-green-400">
                {stats?.resolved_today || 0}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            ⚡ Métricas de Rendimiento
          </h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-gray-300">Eficiencia</span>
                <span className="text-sm text-gray-400">
                  {stats?.resolved_today || 0}/{stats?.total_tickets || 0}
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{
                    width: `${
                      stats?.total_tickets
                        ? (stats.resolved_today / stats.total_tickets) * 100
                        : 0
                    }%`,
                  }}
                ></div>
              </div>
            </div>
            <div className="flex justify-between items-center text-gray-300 text-sm">
              <span>Tiempo Promedio de Resolución</span>
              <span className="text-lg font-bold text-blue-400">
                {stats?.avg_resolution_time?.toFixed(1) || '0.0'} hrs
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface StatCardProps {
  title: string
  value: number
  color: string
}

function StatCard({ title, value, color }: StatCardProps) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-900 text-blue-300 border border-blue-700',
    yellow: 'bg-yellow-900 text-yellow-300 border border-yellow-700',
    purple: 'bg-purple-900 text-purple-300 border border-purple-700',
    orange: 'bg-orange-900 text-orange-300 border border-orange-700',
    green: 'bg-green-900 text-green-300 border border-green-700',
    red: 'bg-red-900 text-red-300 border border-red-700',
  }

  return (
    <div className={`${colors[color]} rounded-lg p-6 text-center`}>
      <p className="text-sm font-medium opacity-75">{title}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  )
}
