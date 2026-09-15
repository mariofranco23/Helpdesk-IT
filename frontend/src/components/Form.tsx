import { ReactNode, useState, FormEvent } from 'react'
import { ValidationSchema, validate, ValidationError } from '../utils/validation'
import ErrorMessage from './ErrorMessage'

interface FormProps {
  onSubmit: (data: Record<string, any>) => Promise<void> | void
  validationSchema?: ValidationSchema
  children: ReactNode
  loading?: boolean
  onError?: (error: string) => void
}

export default function Form({
  onSubmit,
  validationSchema,
  children,
  loading = false,
  onError,
}: FormProps) {
  const [errors, setErrors] = useState<ValidationError[]>([])
  const [serverError, setServerError] = useState<string>('')

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setServerError('')

    const formData = new FormData(e.currentTarget)
    const data: Record<string, any> = {}

    formData.forEach((value, key) => {
      data[key] = value
    })

    if (validationSchema) {
      const validationErrors = validate(data, validationSchema)
      if (validationErrors.length > 0) {
        setErrors(validationErrors)
        return
      }
    }

    setErrors([])

    try {
      await onSubmit(data)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido'
      setServerError(message)
      onError?.(message)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {serverError && (
        <ErrorMessage
          message={serverError}
          onDismiss={() => setServerError('')}
          type="error"
        />
      )}

      {errors.length > 0 && (
        <div className="space-y-2">
          {errors.map((error) => (
            <ErrorMessage
              key={error.field}
              message={error.message}
              type="error"
            />
          ))}
        </div>
      )}

      {children}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2 px-4 rounded-lg transition"
      >
        {loading ? 'Procesando...' : 'Enviar'}
      </button>
    </form>
  )
}
