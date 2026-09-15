import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

import CreateTicket from './CreateTicket'
import MyTickets from './MyTickets'
import TicketDetail from './TicketDetail'
import ReplyToTicket from './ReplyToTicket'

export default function PortalLayout() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-8">
              <h1 className="text-2xl font-bold text-blue-600">Portal IT</h1>
              <div className="flex gap-4">
                <Link
                  to="/"
                  className="text-gray-700 hover:text-blue-600 font-medium"
                >
                  Mis Tickets
                </Link>
                <Link
                  to="/crear"
                  className="text-gray-700 hover:text-blue-600 font-medium"
                >
                  Nuevo Ticket
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-700">{user?.email}</span>
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
          <Route path="/" element={<MyTickets />} />
          <Route path="/crear" element={<CreateTicket />} />
          <Route path="/tickets/:id" element={<TicketDetail />} />
          <Route path="/tickets/:id/responder" element={<ReplyToTicket />} />
        </Routes>
      </main>
    </div>
  )
}
