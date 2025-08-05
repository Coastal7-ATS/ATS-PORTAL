import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Briefcase, 
  Users, 
  TrendingUp,
  Clock,
  XCircle,
  Plus,
  Calendar,
  MapPin,
  DollarSign,
  Filter,
  UserCheck
} from 'lucide-react'
import { Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js'
import api from '../../services/api'
import { useRealTime } from '../../contexts/RealTimeContext'
import { AnimatedDashboardCard } from '../../components/Layout'
import { useNavigate } from 'react-router-dom'

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
)

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [hrContribution, setHrContribution] = useState([])
  const [hrUsers, setHrUsers] = useState([])
  const [filters, setFilters] = useState({
    reportType: '',
    hrId: '',
    customStartDate: '',
    customEndDate: ''
  })
  const { refreshData, lastUpdate } = useRealTime()
  const navigate = useNavigate()

  useEffect(() => {
    fetchDashboardData()
    fetchHrUsers()
  }, [filters])

  useEffect(() => {
    fetchHrContribution()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      if (filters.reportType) {
        params.append('report_type', filters.reportType)
      }
      if (filters.hrId) {
        params.append('hr_id', filters.hrId)
      }
      if (filters.reportType === 'custom') {
        if (filters.customStartDate) {
          params.append('custom_start_date', filters.customStartDate)
        }
        if (filters.customEndDate) {
          params.append('custom_end_date', filters.customEndDate)
        }
      }
      
      const response = await api.get(`/admin/dashboard?${params.toString()}`)
      setDashboardData(response.data)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchHrContribution = async () => {
    try {
      const response = await api.get('/admin/hr-contribution')
      console.log('HR Contribution data:', response.data)
      setHrContribution(response.data)
    } catch (error) {
      console.error('Error fetching HR contribution data:', error)
    }
  }

  const fetchHrUsers = async () => {
    try {
      const response = await api.get('/admin/hr-users')
      setHrUsers(response.data)
    } catch (error) {
      console.error('Error fetching HR users:', error)
    }
  }

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }))
  }

  const clearFilters = () => {
    setFilters({
      reportType: '',
      hrId: '',
      customStartDate: '',
      customEndDate: ''
    })
  }

  const formatLastUpdate = (date) => {
    if (!date) return 'Never'
    const now = new Date()
    const updateTime = new Date(date)
    const diffInMinutes = Math.floor((now - updateTime) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`
    return `${Math.floor(diffInMinutes / 1440)} days ago`
  }

  const handleJobsChartClick = () => {
    navigate('/admin/jobs')
  }

  const handleHrContributionClick = () => {
    navigate('/admin/jobs')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  // Chart data for job status distribution
  const jobStatusData = {
    labels: ['Open', 'Closed', 'Submitted', 'Demand Closed'],
    datasets: [
      {
        data: [
          Number(dashboardData?.open_jobs) || 0,
          Number(dashboardData?.closed_jobs) || 0,
          Number(dashboardData?.submitted_jobs) || 0,
          Number(dashboardData?.demand_closed_jobs) || 0,
        ],
        backgroundColor: [
          '#f59e0b', // amber-500
          '#6b7280', // gray-500
          '#8b5cf6', // violet-500
          '#ef4444', // red-500
        ],
        borderColor: [
          '#d97706', // amber-600
          '#4b5563', // gray-600
          '#7c3aed', // violet-600
          '#dc2626', // red-600
        ],
        borderWidth: 2,
      },
    ],
  }

  // Chart data for HR contribution
  console.log('HR Contribution for chart:', hrContribution)
  const labels = hrContribution?.map(hr => hr.hr_name) || []
  const data = hrContribution?.map(hr => hr.submitted_jobs_count) || []
  const hrContributionData = {
    labels: labels,
    datasets: [
      {
        data: data,
        backgroundColor: [
          '#3b82f6', // blue-500
          '#10b981', // emerald-500
          '#f59e0b', // amber-500
          '#ef4444', // red-500
          '#8b5cf6', // violet-500
          '#06b6d4', // cyan-500
          '#84cc16', // lime-500
          '#f97316', // orange-500
          '#ec4899', // pink-500
          '#6366f1', // indigo-500
        ],
        borderColor: [
          '#2563eb', // blue-600
          '#059669', // emerald-600
          '#d97706', // amber-600
          '#dc2626', // red-600
          '#7c3aed', // violet-600
          '#0891b2', // cyan-600
          '#65a30d', // lime-600
          '#ea580c', // orange-600
          '#db2777', // pink-600
          '#4f46e5', // indigo-600
        ],
        borderWidth: 2,
      },
    ],
  }

  // Add fallback for empty HR contribution data
  const hasHrContributionData = hrContribution && hrContribution.length > 0
  const hasNonZeroData = data && data.some(value => value > 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner h-12 w-12"></div>
      </div>
    )
  }

  // Safety check for dashboard data
  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="spinner h-12 w-12 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading dashboard data...</p>
        </div>
      </div>
    )
  }

  const stats = [
    {
      name: 'Total Jobs',
      value: Number(dashboardData?.total_jobs) || 0,
      icon: Briefcase,
      color: 'from-blue-500 to-blue-600'
    },
    {
      name: 'Open Jobs',
      value: Number(dashboardData?.open_jobs) || 0,
      icon: Clock,
      color: 'from-warning-500 to-orange-500'
    },
    {
      name: 'Closed Jobs',
      value: Number(dashboardData?.closed_jobs) || 0,
      icon: XCircle,
      color: 'from-slate-500 to-gray-600'
    },
    {
      name: 'Submitted Jobs',
      value: Number(dashboardData?.submitted_jobs) || 0,
      icon: TrendingUp,
      color: 'from-purple-500 to-indigo-500'
    },
    {
      name: 'Demand Closed',
      value: Number(dashboardData?.demand_closed_jobs) || 0,
      icon: XCircle,
      color: 'from-red-500 to-pink-500'
    },
    {
      name: 'Total Candidates',
      value: Number(dashboardData?.total_candidates) || 0,
      icon: Users,
      color: 'from-green-500 to-emerald-500'
    },
  ]
  
  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-bold gradient-text mb-2">Admin Dashboard</h1>
          <p className="text-slate-600 text-lg">Overview of recruitment activities and analytics</p>
        </div>
      </motion.div>

      {/* Filters Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="card p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-slate-600" />
          <h3 className="text-lg font-semibold text-slate-900">Dashboard Filters</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Report Type Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Report Type
            </label>
            <select
              value={filters.reportType}
              onChange={(e) => handleFilterChange('reportType', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Time</option>
              <option value="weekly">Weekly (Last 7 days)</option>
              <option value="monthly">Monthly (Last 30 days)</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* HR Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              HR Management
            </label>
            <select
              value={filters.hrId}
              onChange={(e) => handleFilterChange('hrId', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All HR</option>
              {hrUsers.map((hr) => (
                <option key={hr.id} value={hr.id}>
                  {hr.name}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Start Date */}
          {filters.reportType === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={filters.customStartDate}
                onChange={(e) => handleFilterChange('customStartDate', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          )}

          {/* Custom End Date */}
          {filters.reportType === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={filters.customEndDate}
                onChange={(e) => handleFilterChange('customEndDate', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          )}
        </div>

        {/* Filter Actions */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            {filters.reportType && (
              <span className="badge badge-primary">
                {filters.reportType === 'weekly' ? 'Weekly Report' :
                 filters.reportType === 'monthly' ? 'Monthly Report' :
                 filters.reportType === 'custom' ? 'Custom Range' : ''}
              </span>
            )}
            {filters.hrId && (
              <span className="badge badge-secondary">
                {hrUsers.find(hr => hr.id === filters.hrId)?.name || 'HR Selected'}
              </span>
            )}
          </div>
          
          <button
            onClick={clearFilters}
            className="btn-ghost text-sm text-slate-600 hover:text-slate-800"
          >
            Clear Filters
          </button>
        </div>
      </motion.div>

      {/* HR Performance Section */}
      {dashboardData.hr_performance && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="card p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200"
        >
          <div className="flex items-center gap-2 mb-4">
            <UserCheck className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-slate-900">
              HR Performance: {dashboardData.hr_performance.hr_name}
            </h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {dashboardData.hr_performance.total_assigned_jobs}
              </div>
              <div className="text-sm text-slate-600">Total Assigned Jobs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {dashboardData.hr_performance.open_jobs}
              </div>
              <div className="text-sm text-slate-600">Open Jobs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {dashboardData.hr_performance.total_candidates}
              </div>
              <div className="text-sm text-slate-600">Total Candidates</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">
                {dashboardData.hr_performance.selected_candidates}
              </div>
              <div className="text-sm text-slate-600">Selected Candidates</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
          >
            <AnimatedDashboardCard
              color={stat.color}
              icon={stat.icon}
              value={stat.value}
              label={stat.name}
            />
          </motion.div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Job Status Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div 
            className="card p-6 cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
            onClick={handleJobsChartClick}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900">Job Status Distribution</h3>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
                <span>
                  {filters.reportType === 'weekly' ? 'Last 7 Days' :
                   filters.reportType === 'monthly' ? 'Last 30 Days' :
                   filters.reportType === 'custom' ? 'Custom Range' :
                   'Current Month'}
                </span>
              </div>
            </div>
            <div className="h-72">
              <Doughnut
                data={jobStatusData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: {
                          size: 12,
                          family: 'Inter'
                        }
                      },
                    },
                  },
                  elements: {
                    arc: {
                      borderWidth: 3,
                      borderColor: '#fff'
                    }
                  }
                }}
              />
            </div>
            <div className="mt-4 text-center">
              <p className="text-sm text-slate-500">Click to view all jobs</p>
            </div>
          </div>
        </motion.div>

                 {/* HR Contribution Chart */}
         <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.5, delay: 0.5 }}
         >
           <div 
             className="card p-6 cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
             onClick={handleHrContributionClick}
           >
             <div className="flex items-center justify-between mb-6">
               <h3 className="text-xl font-bold text-slate-900">HR Contribution</h3>
               <div className="flex items-center gap-2 text-sm text-slate-500">
                 <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                 <span>All Time</span>
               </div>
             </div>
             <div className="h-72">
               {hasHrContributionData && hasNonZeroData ? (
                 <Doughnut
                   data={hrContributionData}
                   options={{
                     responsive: true,
                     maintainAspectRatio: false,
                     plugins: {
                       legend: {
                         position: 'bottom',
                         labels: {
                           usePointStyle: true,
                           padding: 20,
                           font: {
                             size: 12,
                             family: 'Inter'
                           }
                         }
                       },
                     },
                     elements: {
                       arc: {
                         borderWidth: 3,
                         borderColor: '#fff'
                       }
                     }
                   }}
                 />
               ) : (
                 <div className="flex items-center justify-center h-full">
                   <div className="text-center">
                     <Users className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                     <p className="text-slate-500">
                       {!hasHrContributionData ? 'No HR contribution data available' : 'No submitted jobs found'}
                     </p>
                   </div>
                 </div>
               )}
             </div>
             <div className="mt-4 text-center">
               <p className="text-sm text-slate-500">Click to view all jobs</p>
             </div>
           </div>
         </motion.div>
      </div>
    </div>
  )
}

export default AdminDashboard