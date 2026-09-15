import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { Role } from './types'

import Login from './pages/Login'
import PortalLayout from './pages/portal/PortalLayout'
import ConsoleLayout from './pages/console/ConsoleLayout'

export default function App() {
  const { isAuthenticated, user } = useAuthStore()

  return (
    <BrowserRouter>
      <Routes>
        {!isAuthenticated ? (
          <>
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        ) : (
          <>
            {user?.role === Role.EXTERNAL_REQUESTER ? (
              <Route path="/*" element={<PortalLayout />} />
            ) : (
              <Route path="/*" element={<ConsoleLayout />} />
            )}
          </>
        )}
      </Routes>
    </BrowserRouter>
  )
}
