import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'
import api from '../services/api'

const RealTimeContext = createContext()

export const useRealTime = () => {
  const context = useContext(RealTimeContext)
  if (!context) {
    throw new Error('useRealTime must be used within a RealTimeProvider')
  }
  return context
}

export const RealTimeProvider = ({ children }) => {
  const { user } = useAuth()
  const [dashboardData, setDashboardData] = useState(null)
  const [jobs, setJobs] = useState([])
  const [candidates, setCandidates] = useState([])
  const [lastUpdate, setLastUpdate] = useState(null)
  const [isPolling, setIsPolling] = useState(false)
  const [isActive, setIsActive] = useState(true)

  // Polling interval in milliseconds - much longer to reduce requests
  const POLLING_INTERVAL = 300000 // 5 minutes

  const fetchDashboardData = useCallback(async () => {
    if (!user || !isActive) return

    try {
      const endpoint = user.role === 'admin' ? '/admin/dashboard' : '/hr/dashboard'
      const response = await api.get(endpoint)
      setDashboardData(response.data)
      setLastUpdate(new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }))
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      // Don't show error toast for dashboard data fetch
    }
  }, [user, isActive])

  const fetchJobs = useCallback(async () => {
    if (!user || !isActive) return

    try {
      const endpoint = user.role === 'admin' ? '/admin/jobs' : '/hr/jobs'
      const response = await api.get(endpoint)
      setJobs(response.data)
    } catch (error) {
      console.error('Error fetching jobs:', error)
      // Don't show error toast for jobs fetch
    }
  }, [user, isActive])

  const fetchCandidates = useCallback(async () => {
    if (!user || user.role !== 'admin' || !isActive) return

    try {
      const response = await api.get('/admin/candidates')
      setCandidates(response.data)
    } catch (error) {
      console.error('Error fetching candidates:', error)
      // Don't show error toast for candidates fetch
    }
  }, [user, isActive])

  // Start polling
  const startPolling = useCallback(() => {
    if (isPolling || !isActive) return

    setIsPolling(true)
    
    // Initial fetch
    fetchDashboardData()
    fetchJobs()
    fetchCandidates()

    // Set up polling interval
    const interval = setInterval(() => {
      if (isActive) {
        fetchDashboardData()
        fetchJobs()
        fetchCandidates()
      }
    }, POLLING_INTERVAL)

    return () => {
      clearInterval(interval)
      setIsPolling(false)
    }
  }, [fetchDashboardData, fetchJobs, fetchCandidates, isPolling, isActive])

  // Stop polling
  const stopPolling = useCallback(() => {
    setIsPolling(false)
    setIsActive(false)
  }, [])

  // Manual refresh
  const refreshData = useCallback(async () => {
    if (!isActive) return
    await Promise.all([
      fetchDashboardData(),
      fetchJobs(),
      fetchCandidates()
    ])
  }, [fetchDashboardData, fetchJobs, fetchCandidates, isActive])

  // Only fetch data when user is authenticated, but don't start automatic polling
  useEffect(() => {
    if (user) {
      setIsActive(true)
      // Only do initial fetch, don't start polling
      fetchDashboardData()
      fetchJobs()
      fetchCandidates()
    } else {
      stopPolling()
      setDashboardData(null)
      setJobs([])
      setCandidates([])
    }
  }, [user, fetchDashboardData, fetchJobs, fetchCandidates, stopPolling])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling()
    }
  }, [stopPolling])

  // Handle page visibility changes - only for manual refresh
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsActive(false)
        stopPolling()
      } else {
        setIsActive(true)
        // Don't automatically start polling when page becomes visible
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [stopPolling])

  const value = {
    dashboardData,
    jobs,
    candidates,
    lastUpdate,
    isPolling,
    isActive,
    refreshData,
    startPolling,
    stopPolling
  }

  return (
    <RealTimeContext.Provider value={value}>
      {children}
    </RealTimeContext.Provider>
  )
} 