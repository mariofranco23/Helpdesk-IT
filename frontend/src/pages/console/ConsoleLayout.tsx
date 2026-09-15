import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

import Dashboard from './Dashboard'
import TicketList from './TicketList'
import TicketDetail from './TicketDetail'
import TimeEntry from './TimeEntry'
import ApprovalWorkflow from './ApprovalWorkflow'

export default function ConsoleLayout() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-gray-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-8">
              <h1 className="text-2xl font-bold">Consola IT</h1>
              <div className="flex gap-4">
                <Link
                  to="/"
                  className="hover:text-blue-400 font-medium transition"
                >
                  Dashboard
                </Link>
                <Link
                  to="/tickets"
                  className="hover:text-blue-400 font-medium transition"
                >
                  Tickets
                </Link>
                <Link
                  to="/time-entries"
                  className="hover:text-blue-400 font-medium transition"
                >
                  Tiempo
                </Link>
                <Link
                  to="/approvals"
                  className="hover:text-blue-400 font-medium transition"
                >
                  Aprobaciones
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm">{user?.email}</p>
                <p className="text-xs text-gray-400">{user?.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tickets" element={<TicketList />} />
          <Route path="/tickets/:id" element={<TicketDetail />} />
          <Route path="/time-entries" element={<TimeEntry />} />
          <Route path="/approvals" element={<ApprovalWorkflow />} />
        </Routes>
      </main>
    </div>
  )
}
