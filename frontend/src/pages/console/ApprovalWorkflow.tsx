import { useState, useEffect } from 'react'
import { CostApproval, ApprovalStatus } from '../../types'

export default function ApprovalWorkflow() {
  const [approvals, setApprovals] = useState<CostApproval[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<ApprovalStatus | 'ALL'>('PENDING')

  useEffect(() => {
    fetchApprovals()
  }, [filter])

  const fetchApprovals = async () => {
    try {
      let url = '/api/approvals'
      if (filter !== 'ALL') {
        url += `?status=${filter}`
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setApprovals(data)
      }
    } catch (err) {
      console.error('Error fetching approvals:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (approvalId: string) => {
    try {
      const response = await fetch(`/api/approvals/${approvalId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({ status: ApprovalStatus.APPROVED }),
      })

      if (response.ok) {
        fetchApprovals()
      }
    } catch (err) {
      console.error('Error approving:', err)
    }
  }

  const handleReject = async (approvalId: string, reason: string) => {
    try {
      const response = await fetch(`/api/approvals/${approvalId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          status: ApprovalStatus.REJECTED,
          rejection_reason: reason,
        }),
      })

      if (response.ok) {
        fetchApprovals()
      }
    } catch (err) {
      console.error('Error rejecting:', err)
    }
  }

  const getStatusColor = (status: ApprovalStatus) => {
    const colors: Record<ApprovalStatus, string> = {
      [ApprovalStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
      [ApprovalStatus.APPROVED]: 'bg-green-100 text-green-800',
      [ApprovalStatus.REJECTED]: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return <div className="text-center py-8">Cargando...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Aprobaciones de Costos</h2>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as ApprovalStatus | 'ALL')}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="PENDING">Pendientes</option>
          <option value={ApprovalStatus.APPROVED}>Aprobadas</option>
          <option value={ApprovalStatus.REJECTED}>Rechazadas</option>
          <option value="ALL">Todas</option>
        </select>
      </div>

      {approvals.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg">
          <p className="text-gray-500">No hay aprobaciones</p>
        </div>
      ) : (
        <div className="space-y-4">
          {approvals.map((approval) => (
            <ApprovalCard
              key={approval.id}
              approval={approval}
              onApprove={handleApprove}
              onReject={handleReject}
              getStatusColor={getStatusColor}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface ApprovalCardProps {
  approval: CostApproval
  onApprove: (id: string) => void
  onReject: (id: string, reason: string) => void
  getStatusColor: (status: ApprovalStatus) => string
}

function ApprovalCard({
  approval,
  onApprove,
  onReject,
  getStatusColor,
}: ApprovalCardProps) {
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)

  const handleRejectSubmit = () => {
    onReject(approval.id, rejectionReason)
    setShowRejectForm(false)
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-semibold text-lg">
            Ticket: {approval.ticket_id}
          </h3>
          <p className="text-gray-600">{approval.concept}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(approval.status)}`}>
          {approval.status}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600">Monto</p>
          <p className="font-semibold">
            {approval.currency} {approval.amount}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Solicitado por</p>
          <p className="font-semibold text-sm">{approval.requested_by}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Fecha Solicitada</p>
          <p className="font-semibold text-sm">
            {new Date(approval.requested_at).toLocaleDateString('es-ES')}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Descripción</p>
          <p className="font-semibold text-sm line-clamp-2">
            {approval.description}
          </p>
        </div>
      </div>

      {approval.status === ApprovalStatus.PENDING && (
        <div className="pt-4 border-t space-y-3">
          {!showRejectForm ? (
            <div className="flex gap-2">
              <button
                onClick={() => onApprove(approval.id)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition"
              >
                Aprobar
              </button>
              <button
                onClick={() => setShowRejectForm(true)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition"
              >
                Rechazar
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                placeholder="Motivo del rechazo..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              ></textarea>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowRejectForm(false)}
                  className="flex-1 border border-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleRejectSubmit}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                >
                  Confirmar Rechazo
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {approval.status === ApprovalStatus.REJECTED && approval.rejection_reason && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">
            <strong>Motivo del rechazo:</strong> {approval.rejection_reason}
          </p>
        </div>
      )}
    </div>
  )
}
