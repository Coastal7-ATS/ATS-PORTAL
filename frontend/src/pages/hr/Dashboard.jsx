import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Briefcase,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  Eye,
  Calendar,
  MapPin,
  DollarSign,
  User
} from 'lucide-react'
import { Doughnut, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'
import api from '../../services/api'
import { AnimatedDashboardCard } from '../../components/Layout'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

const HRDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [recentJobs, setRecentJobs] = useState([])

  useEffect(() => {
    fetchDashboardData()
    fetchRecentJobs()
    // eslint-disable-next-line
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/hr/dashboard')
      setDashboardData(response.data)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRecentJobs = async () => {
    try {
      const response = await api.get('/hr/jobs?limit=5')
      setRecentJobs(response.data.slice(0, 5))
    } catch (error) {
      console.error('Error fetching recent jobs:', error)
    }
  }

  // Stats config
  const stats = [
    {
      name: 'Total Jobs',
      value: dashboardData?.total_jobs || 0,
      icon: Briefcase,
      color: 'from-blue-500 to-blue-600'
    },
    {
      name: 'Open Jobs',
      value: dashboardData?.open_jobs || 0,
      icon: Clock,
      color: 'from-warning-500 to-orange-500'
    },
    {
      name: 'Closed Jobs',
      value: dashboardData?.closed_jobs || 0,
      icon: XCircle,
      color: 'from-slate-500 to-gray-600',
    },
    {
      name: 'Total Candidates',
      value: dashboardData?.total_candidates || 0,
      icon: Users,
      color: 'from-purple-500 to-indigo-500',
    },
    {
      name: 'Selected Candidates',
      value: dashboardData?.selected_candidates || 0,
      icon: CheckCircle,
      color: 'from-success-500 to-emerald-500',
    },
  ]

  // Chart data
  const jobStatusData = {
    labels: ['Open', 'Allocated', 'Closed', 'Submitted'],
    datasets: [
      {
        data: [
          dashboardData?.open_jobs || 0,
          dashboardData?.allocated_jobs || 0,
          dashboardData?.closed_jobs || 0,
          dashboardData?.submitted_jobs || 0,
        ],
        backgroundColor: [
          '#F59E0B',
          '#10B981',
          '#6B7280',
          '#8B5CF6',
        ],
        borderWidth: 2,
        borderColor: '#fff',
      },
    ],
  }

  const candidateStatusData = {
    labels: ['Selected', 'Rejected', 'Applied'],
    datasets: [
      {
        label: 'Candidates',
        data: [
          dashboardData?.selected_candidates || 0,
          dashboardData?.rejected_candidates || 0,
          (dashboardData?.total_candidates || 0) - (dashboardData?.selected_candidates || 0) - (dashboardData?.rejected_candidates || 0),
        ],
        backgroundColor: [
          '#10B981',
          '#EF4444',
          '#F59E0B',
        ],
        borderRadius: 6,
      },
    ],
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner h-12 w-12"></div>
      </div>
    )
  }

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
          <h1 className="text-4xl font-bold gradient-text mb-2">HR Dashboard</h1>
          <p className="text-slate-600 text-lg">Overview of your assigned jobs and candidates</p>
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
              trend={stat.trend}
              trendValue={stat.trendValue}
            />
          </motion.div>
        ))}
      </div>

      {/* Charts Row: Job Status and Candidate Status side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Job Status Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900">Job Status Distribution</h3>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <div className="w-3 h-3 bg-warning-500 rounded-full"></div>
                <span>Your Jobs</span>
              </div>
            </div>
            <div className="h-80">
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
          </div>
        </motion.div>

        {/* Candidate Status Chart */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900">Candidate Status</h3>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <div className="w-3 h-3 bg-success-500 rounded-full"></div>
                <span>This Month</span>
              </div>
            </div>
            <div className="h-80">
              <Bar
                data={candidateStatusData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    },
                    tooltip: {
                      enabled: true,
                    },
                  },
                  scales: {
                    x: {
                      grid: {
                        display: false,
                      },
                      ticks: {
                        color: '#6B7280',
                        font: { size: 14, family: 'Inter' },
                      },
                    },
                    y: {
                      beginAtZero: true,
                      grid: {
                        color: '#F3F4F6',
                      },
                      ticks: {
                        color: '#6B7280',
                        font: { size: 14, family: 'Inter' },
                        stepSize: 1,
                      },
                    },
                  },
                  animation: {
                    duration: 900,
                    easing: 'easeOutQuart',
                  },
                }}
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent Jobs below the charts */}
      <div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <div className="card p-6 mt-2">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900">Recent Jobs</h3>
              {/* Removed View All button as per instruction */}
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
                    transition={{ duration: 0.3, delay: 0.8 + index * 0.1 }}
                    className="p-4 bg-slate-50/50 rounded-xl hover:bg-slate-100/50 transition-colors duration-200"
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
    </div>
  )
}

export default HRDashboard