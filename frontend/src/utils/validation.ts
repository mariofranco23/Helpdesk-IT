export interface ValidationError {
  field: string
  message: string
}

export interface ValidationSchema {
  [field: string]: ((value: any) => ValidationError | null)[]
}

export function validate(
  data: Record<string, any>,
  schema: ValidationSchema
): ValidationError[] {
  const errors: ValidationError[] = []

  for (const field in schema) {
    const validators = schema[field]
    const value = data[field]

    for (const validator of validators) {
      const error = validator(value)
      if (error) {
        errors.push(error)
        break
      }
    }
  }

  return errors
}

// Common validators
export const validators = {
  required: (fieldName: string) => (value: any) => {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return { field: fieldName, message: `${fieldName} es requerido` }
    }
    return null
  },

  email: (fieldName: string) => (value: any) => {
    if (!value) return null
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) {
      return { field: fieldName, message: `${fieldName} debe ser un email válido` }
    }
    return null
  },

  minLength: (fieldName: string, length: number) => (value: any) => {
    if (!value) return null
    if (value.length < length) {
      return {
        field: fieldName,
        message: `${fieldName} debe tener al menos ${length} caracteres`,
      }
    }
    return null
  },

  maxLength: (fieldName: string, length: number) => (value: any) => {
    if (!value) return null
    if (value.length > length) {
      return {
        field: fieldName,
        message: `${fieldName} no puede exceder ${length} caracteres`,
      }
    }
    return null
  },

  minNumber: (fieldName: string, min: number) => (value: any) => {
    if (value === null || value === undefined || value === '') return null
    const num = Number(value)
    if (isNaN(num) || num < min) {
      return {
        field: fieldName,
        message: `${fieldName} debe ser mayor o igual a ${min}`,
      }
    }
    return null
  },

  maxNumber: (fieldName: string, max: number) => (value: any) => {
    if (value === null || value === undefined || value === '') return null
    const num = Number(value)
    if (isNaN(num) || num > max) {
      return {
        field: fieldName,
        message: `${fieldName} debe ser menor o igual a ${max}`,
      }
    }
    return null
  },

  pattern: (fieldName: string, pattern: RegExp, message: string) => (
    value: any
  ) => {
    if (!value) return null
    if (!pattern.test(value)) {
      return { field: fieldName, message }
    }
    return null
  },
}
