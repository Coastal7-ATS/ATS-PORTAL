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
  DollarSign
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
  const [recentJobs, setRecentJobs] = useState([])
  const { refreshData, lastUpdate } = useRealTime()
  const navigate = useNavigate()

  useEffect(() => {
    fetchDashboardData()
    fetchRecentJobs()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/admin/dashboard')
      setDashboardData(response.data)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRecentJobs = async () => {
    try {
      const response = await api.get('/admin/jobs?limit=5')
      setRecentJobs(response.data.slice(0, 5))
    } catch (error) {
      console.error('Error fetching recent jobs:', error)
    }
  }

  // Format lastUpdate date properly
  const formatLastUpdate = (date) => {
    try {
      if (!date) return 'Just now'
      if (typeof date === 'string') return date
      if (date instanceof Date) {
        return date.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      }
      return 'Just now'
    } catch (error) {
      console.error('Error formatting date:', error)
      return 'Just now'
    }
  }

  // Navigation handler for Job Status Chart
  const handleJobsChartClick = () => {
    navigate('/admin/jobs')
  }

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

  const jobStatusData = {
    labels: ['Open', 'Allocated', 'Closed', 'Submitted'],
    datasets: [
      {
        data: [
          Number(dashboardData?.open_jobs) || 0,
          Number(dashboardData?.allocated_jobs) || 0,
          Number(dashboardData?.closed_jobs) || 0,
          Number(dashboardData?.submitted_jobs) || 0,
        ],
        backgroundColor: [
          '#3B82F6',
          '#10B981',
          '#6B7280',
          '#8B5CF6',
        ],
        borderWidth: 2,
        borderColor: '#fff',
      },
    ],
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
      name: 'Allocated Jobs',
      value: Number(dashboardData?.allocated_jobs) || 0,
      icon: TrendingUp,
      color: 'from-success-500 to-emerald-500'
    },
    {
      name: 'Closed Jobs',
      value: Number(dashboardData?.closed_jobs) || 0,
      icon: XCircle,
      color: 'from-slate-500 to-gray-600'
    },
    {
      name: 'Total Candidates',
      value: Number(dashboardData?.total_candidates) || 0,
      icon: Users,
      color: 'from-purple-500 to-indigo-500'
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
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-slate-500">Last updated</p>
            <p className="text-sm font-medium text-slate-700">{formatLastUpdate(lastUpdate)}</p>
          </div>
          <button className="btn-primary">
            <Plus className="h-4 w-4" />
            Add Job
          </button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
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

      {/* Job Status Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="max-w-2xl mx-auto"
      >
        <div 
          className="card p-6 cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
          onClick={handleJobsChartClick}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-900">Job Status Distribution</h3>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
              <span>Current Month</span>
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

      {/* Recent Jobs Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
      >
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-900">Recent Jobs</h3>
            <button 
              className="btn-ghost text-sm"
              onClick={() => navigate('/admin/jobs')}
            >
              View All
            </button>
          </div>
          
          <div className="space-y-4">
            {recentJobs.length === 0 ? (
              <div className="text-center py-8">
                <Briefcase className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                <p className="text-slate-500">No recent jobs</p>
              </div>
            ) : (
              recentJobs.map((job, index) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
                  className="p-4 bg-slate-50/50 rounded-xl hover:bg-slate-100/50 transition-colors duration-200 cursor-pointer"
                  onClick={() => navigate(`/admin/jobs/${job.id}`)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-slate-900 text-sm">{job.title}</h4>
                    <span className={`badge ${
                      job.status === 'open' ? 'badge-success' :
                      job.status === 'allocated' ? 'badge-info' :
                      job.status === 'closed' ? 'badge-secondary' :
                      'badge-warning'
                    }`}>
                      {job.status}
                    </span>
                  </div>
                  
                  <div className="space-y-1 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3" />
                      <span>{job.location || 'Remote'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-3 w-3" />
                      <span>{job.ctc || 'Not specified'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(job.opening_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default AdminDashboard