import { useState, useEffect } from 'react'

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

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Cargando...</div>
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Dashboard</h2>

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
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Actividad Reciente</h3>
          <div className="text-center text-gray-500 py-8">
            Sin actividades recientes
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Tareas Pendientes</h3>
          <div className="text-center text-gray-500 py-8">
            Sin tareas pendientes
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
    blue: 'bg-blue-100 text-blue-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    purple: 'bg-purple-100 text-purple-800',
    orange: 'bg-orange-100 text-orange-800',
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
  }

  return (
    <div className={`${colors[color]} rounded-lg p-6 text-center`}>
      <p className="text-sm font-medium opacity-75">{title}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  )
}
