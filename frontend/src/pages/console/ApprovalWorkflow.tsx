import { useState, useEffect } from 'react'
import { CostApproval, ApprovalStatus } from '../../types'
import { apiClient } from '../../services/api'
import LoadingSpinner from '../../components/LoadingSpinner'
import ErrorMessage from '../../components/ErrorMessage'

export default function ApprovalWorkflow() {
  const [approvals, setApprovals] = useState<CostApproval[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [filter, setFilter] = useState<ApprovalStatus | 'ALL'>('PENDING')

  useEffect(() => {
    fetchApprovals()
  }, [filter])

  const fetchApprovals = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await apiClient.getApprovals(
        filter === 'ALL' ? undefined : filter
      )
      setApprovals(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar aprobaciones'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (approvalId: string) => {
    try {
      setError('')
      await apiClient.updateApproval(approvalId, {
        status: ApprovalStatus.APPROVED,
      })
      fetchApprovals()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al aprobar'
      setError(message)
    }
  }

  const handleReject = async (approvalId: string, reason: string) => {
    try {
      setError('')
      await apiClient.updateApproval(approvalId, {
        status: ApprovalStatus.REJECTED,
        rejection_reason: reason,
      })
      fetchApprovals()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al rechazar'
      setError(message)
    }
  }

  if (loading) {
    return <LoadingSpinner text="Cargando aprobaciones..." />
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Aprobaciones de Costos</h2>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as ApprovalStatus | 'ALL')}
          className="px-4 py-2 bg-gray-800 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="PENDING" className="bg-gray-800">
            Pendientes
          </option>
          <option value={ApprovalStatus.APPROVED} className="bg-gray-800">
            Aprobadas
          </option>
          <option value={ApprovalStatus.REJECTED} className="bg-gray-800">
            Rechazadas
          </option>
          <option value="ALL" className="bg-gray-800">
            Todas
          </option>
        </select>
      </div>

      {error && (
        <ErrorMessage
          message={error}
          onDismiss={() => setError('')}
          type="error"
        />
      )}

      {approvals.length === 0 ? (
        <div className="text-center py-12 bg-gray-800 rounded-lg text-gray-400">
          <p>No hay aprobaciones</p>
        </div>
      ) : (
        <div className="space-y-4">
          {approvals.map((approval) => (
            <ApprovalCard
              key={approval.id}
              approval={approval}
              onApprove={handleApprove}
              onReject={handleReject}
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
}

function ApprovalCard({
  approval,
  onApprove,
  onReject,
}: ApprovalCardProps) {
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const getStatusColor = (status: ApprovalStatus) => {
    const colors: Record<ApprovalStatus, string> = {
      [ApprovalStatus.PENDING]: 'bg-yellow-900 text-yellow-300 border border-yellow-700',
      [ApprovalStatus.APPROVED]: 'bg-green-900 text-green-300 border border-green-700',
      [ApprovalStatus.REJECTED]: 'bg-red-900 text-red-300 border border-red-700',
    }
    return colors[status]
  }

  const handleRejectSubmit = async () => {
    setSubmitting(true)
    try {
      onReject(approval.id, rejectionReason)
      setShowRejectForm(false)
      setRejectionReason('')
    } finally {
      setSubmitting(false)
    }
  }

  const handleApproveClick = async () => {
    setSubmitting(true)
    try {
      onApprove(approval.id)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-gray-800 rounded-lg shadow p-6 border-l-4 border-blue-600">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-white">
            #{approval.ticket_id}
          </h3>
          <p className="text-gray-400 text-sm">{approval.concept}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
          approval.status
        )}`}>
          {approval.status}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
        <div>
          <p className="text-gray-400">Monto</p>
          <p className="font-semibold text-white mt-1">
            {approval.currency} {approval.amount.toLocaleString('es-ES')}
          </p>
        </div>
        <div>
          <p className="text-gray-400">Solicitado por</p>
          <p className="font-semibold text-white mt-1">{approval.requested_by}</p>
        </div>
        <div>
          <p className="text-gray-400">Fecha</p>
          <p className="font-semibold text-white mt-1">
            {new Date(approval.requested_at).toLocaleDateString('es-ES')}
          </p>
        </div>
        <div>
          <p className="text-gray-400">Descripción</p>
          <p className="font-semibold text-white mt-1 line-clamp-2">
            {approval.description}
          </p>
        </div>
      </div>

      {approval.status === ApprovalStatus.PENDING && (
        <div className="pt-4 border-t border-gray-700 space-y-3">
          {!showRejectForm ? (
            <div className="flex gap-2">
              <button
                onClick={handleApproveClick}
                disabled={submitting}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-500 text-white font-semibold py-2 px-4 rounded-lg transition"
              >
                ✓ Aprobar
              </button>
              <button
                onClick={() => setShowRejectForm(true)}
                disabled={submitting}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-500 text-white font-semibold py-2 px-4 rounded-lg transition"
              >
                ✕ Rechazar
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                placeholder="Motivo del rechazo..."
                disabled={submitting}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-red-500 disabled:opacity-50"
              ></textarea>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowRejectForm(false)}
                  disabled={submitting}
                  className="flex-1 border border-gray-600 text-gray-300 font-semibold py-2 px-4 rounded-lg hover:bg-gray-700 transition disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleRejectSubmit}
                  disabled={submitting || !rejectionReason.trim()}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-500 text-white font-semibold py-2 px-4 rounded-lg transition"
                >
                  {submitting ? 'Procesando...' : 'Confirmar Rechazo'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {approval.status === ApprovalStatus.APPROVED && (
        <div className="mt-4 p-3 bg-green-900 border border-green-700 rounded-lg">
          <p className="text-sm text-green-300">
            ✓ Aprobado
            {approval.approved_at && (
              <> el {new Date(approval.approved_at).toLocaleDateString('es-ES')}</>
            )}
          </p>
        </div>
      )}

      {approval.status === ApprovalStatus.REJECTED && approval.rejection_reason && (
        <div className="mt-4 p-3 bg-red-900 border border-red-700 rounded-lg">
          <p className="text-sm text-red-300">
            <strong>Rechazado:</strong> {approval.rejection_reason}
          </p>
        </div>
      )}
    </div>
  )
}
