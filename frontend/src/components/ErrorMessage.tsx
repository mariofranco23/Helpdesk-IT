interface ErrorMessageProps {
  message: string
  onDismiss?: () => void
  type?: 'error' | 'warning' | 'info'
}

export default function ErrorMessage({
  message,
  onDismiss,
  type = 'error',
}: ErrorMessageProps) {
  const styles = {
    error: 'bg-red-50 text-red-800 border-red-200',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    info: 'bg-blue-50 text-blue-800 border-blue-200',
  }

  const icons = {
    error: '⚠️',
    warning: '⚡',
    info: 'ℹ️',
  }

  return (
    <div className={`rounded-lg border p-4 ${styles[type]} flex items-start gap-3`}>
      <span className="text-xl flex-shrink-0">{icons[type]}</span>
      <div className="flex-1">
        <p className="font-medium">{message}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-xl flex-shrink-0 hover:opacity-70 transition"
        >
          ✕
        </button>
      )}
    </div>
  )
}
