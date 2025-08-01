import axios from 'axios'
import { toast } from 'react-toastify'

const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // Increased timeout to 15 seconds
})

// Add token to requests if available
const token = localStorage.getItem('token')
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    console.error('Request error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor with enhanced error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Response error:', error)
    
    // Handle different types of errors
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response
      
      switch (status) {
        case 401:
          // Only redirect if not already on login page and not during auth check
          if (window.location.pathname !== '/login' && !error.config?.url?.includes('/auth/me')) {
            localStorage.removeItem('token')
            window.location.href = '/login'
            toast.error('Session expired. Please login again.')
          }
          break
        case 403:
          toast.error('Access denied. You do not have permission for this action.')
          break
        case 404:
          // Don't show toast for 404 errors during auth check
          if (!error.config?.url?.includes('/auth/me')) {
            toast.error('Resource not found.')
          }
          break
        case 422:
          toast.error('Invalid data provided. Please check your input.')
          break
        case 500:
          toast.error('Server error. Please try again later.')
          break
        default:
          // Don't show toast for auth-related errors
          if (!error.config?.url?.includes('/auth/me')) {
            toast.error(data?.detail || 'An error occurred. Please try again.')
          }
      }
    } else if (error.request) {
      // Network error - only show toast if not during auth check
      if (!error.config?.url?.includes('/auth/me')) {
        toast.error('Network error. Please check your connection and try again.')
      }
    } else {
      // Other errors - only show toast if not during auth check
      if (!error.config?.url?.includes('/auth/me')) {
        toast.error('An unexpected error occurred. Please try again.')
      }
    }
    
    return Promise.reject(error)
  }
)

// Enhanced retry logic for failed requests
const retryRequest = async (config, retries = 2) => {
  try {
    return await api(config)
  } catch (error) {
    if (retries > 0 && (error.response?.status >= 500 || !error.response)) {
      await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second
      return retryRequest(config, retries - 1)
    }
    throw error
  }
}

// Enhanced API methods with retry logic
export const apiWithRetry = {
  get: (url, config = {}) => retryRequest({ ...config, method: 'get', url }),
  post: (url, data, config = {}) => retryRequest({ ...config, method: 'post', url, data }),
  put: (url, data, config = {}) => retryRequest({ ...config, method: 'put', url, data }),
  delete: (url, config = {}) => retryRequest({ ...config, method: 'delete', url }),
}

export default api 