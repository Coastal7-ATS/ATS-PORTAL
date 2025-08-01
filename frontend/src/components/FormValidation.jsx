import React from 'react'
import { toast } from 'react-toastify'

// Validation rules
export const validationRules = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Please enter a valid email address'
  },
  password: {
    required: true,
    minLength: 6,
    message: 'Password must be at least 6 characters long'
  },
  name: {
    required: true,
    minLength: 2,
    message: 'Name must be at least 2 characters long'
  },
  phone: {
    required: true,
    pattern: /^[\+]?[1-9][\d]{0,15}$/,
    message: 'Please enter a valid phone number'
  },
  required: {
    required: true,
    message: 'This field is required'
  }
}

// Validation function
export const validateField = (value, rules) => {
  if (rules.required && (!value || value.trim() === '')) {
    return rules.message || 'This field is required'
  }

  if (rules.minLength && value && value.length < rules.minLength) {
    return rules.message || `Minimum length is ${rules.minLength} characters`
  }

  if (rules.pattern && value && !rules.pattern.test(value)) {
    return rules.message || 'Invalid format'
  }

  return null
}

// Form validation hook
export const useFormValidation = (initialValues = {}) => {
  const [values, setValues] = React.useState(initialValues)
  const [errors, setErrors] = React.useState({})
  const [touched, setTouched] = React.useState({})

  const handleChange = (name, value) => {
    setValues(prev => ({ ...prev, [name]: value }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const handleBlur = (name) => {
    setTouched(prev => ({ ...prev, [name]: true }))
  }

  const validateForm = (validationSchema) => {
    const newErrors = {}
    let isValid = true

    Object.keys(validationSchema).forEach(field => {
      const value = values[field]
      const rules = validationSchema[field]
      const error = validateField(value, rules)
      
      if (error) {
        newErrors[field] = error
        isValid = false
      }
    })

    setErrors(newErrors)
    return isValid
  }

  const handleSubmit = (onSubmit, validationSchema) => {
    if (validateForm(validationSchema)) {
      onSubmit(values)
    } else {
      toast.error('Please fix the errors in the form')
    }
  }

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateForm,
    handleSubmit,
    setValues,
    setErrors
  }
}

// Input component with validation
export const ValidatedInput = ({ 
  name, 
  label, 
  type = 'text', 
  rules, 
  value, 
  onChange, 
  onBlur, 
  error, 
  touched,
  ...props 
}) => {
  const showError = error && touched

  return (
    <div className="mb-4">
      <label className="block text-sm font-semibold text-slate-700 mb-1">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        onBlur={() => onBlur(name)}
        className={`input-field ${showError ? 'border-danger-500 focus:ring-danger-500' : ''}`}
        {...props}
      />
      {showError && (
        <p className="mt-1 text-sm text-danger-600">{error}</p>
      )}
    </div>
  )
}

// Select component with validation
export const ValidatedSelect = ({ 
  name, 
  label, 
  options, 
  value, 
  onChange, 
  onBlur, 
  error, 
  touched,
  ...props 
}) => {
  const showError = error && touched

  return (
    <div className="mb-4">
      <label className="block text-sm font-semibold text-slate-700 mb-1">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        onBlur={() => onBlur(name)}
        className={`select-field ${showError ? 'border-danger-500 focus:ring-danger-500' : ''}`}
        {...props}
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {showError && (
        <p className="mt-1 text-sm text-danger-600">{error}</p>
      )}
    </div>
  )
}

// Textarea component with validation
export const ValidatedTextarea = ({ 
  name, 
  label, 
  value, 
  onChange, 
  onBlur, 
  error, 
  touched,
  rows = 3,
  ...props 
}) => {
  const showError = error && touched

  return (
    <div className="mb-4">
      <label className="block text-sm font-semibold text-slate-700 mb-1">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        onBlur={() => onBlur(name)}
        rows={rows}
        className={`input-field ${showError ? 'border-danger-500 focus:ring-danger-500' : ''}`}
        {...props}
      />
      {showError && (
        <p className="mt-1 text-sm text-danger-600">{error}</p>
      )}
    </div>
  )
} 