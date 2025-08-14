import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Briefcase,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  XCircle as XCircleIcon,
  Plus,
  Eye,
  Calendar,
  MapPin,
  User,
  TrendingUp,
  Award
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

  useEffect(() => {
    fetchDashboardData()
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



  // Stats config
  const stats = [
    {
      name: 'Total Jobs',
      value: dashboardData?.total_jobs || 0,
      icon: Briefcase,
      color: 'from-primary-500 to-primary-600'
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
      color: 'from-slate-500 to-gray-600'
    },
    {
      name: 'Submitted Jobs',
      value: dashboardData?.submitted_jobs || 0,
      icon: TrendingUp,
      color: 'from-purple-500 to-indigo-500'
    },
    {
      name: 'Applied',
      value: dashboardData?.applied_candidates || 0,
      icon: Users,
      color: 'from-blue-500 to-indigo-500'
    },
    {
      name: 'Screen Reject',
      value: dashboardData?.screen_reject_candidates || 0,
      icon: XCircle,
      color: 'from-red-500 to-rose-600'
    },
    {
      name: 'Interview Select',
      value: dashboardData?.interview_selected_candidates || 0,
      icon: CheckCircle,
      color: 'from-green-500 to-emerald-600'
    },
    {
      name: 'Interview Reject',
      value: dashboardData?.interview_reject_candidates || 0,
      icon: XCircleIcon,
      color: 'from-orange-500 to-red-500'
    },
    {
      name: 'No Show for Joining',
      value: dashboardData?.no_show_for_joining_candidates || 0,
      icon: XCircle,
      color: 'from-purple-500 to-pink-500'
    },
    {
      name: 'Placed',
      value: dashboardData?.placed_candidates || 0,
      icon: Award,
      color: 'from-yellow-500 to-amber-600'
    },
  ]

  // Chart data
  const jobStatusData = {
    labels: ['Open', 'Closed', 'Submitted'],
    datasets: [
      {
        data: [
          dashboardData?.open_jobs || 0,
          dashboardData?.closed_jobs || 0,
          dashboardData?.submitted_jobs || 0,
        ],
        backgroundColor: function(context) {
          const chart = context.chart;
          const {ctx, chartArea} = chart;
          if (!chartArea) {
            return null;
          }
          
          const index = context.dataIndex;
          const colors = [
            // Open - Orange gradient (more vibrant)
            () => {
              const gradient = ctx.createLinearGradient(0, 0, 0, chartArea.height);
              gradient.addColorStop(0, '#f88013');
              gradient.addColorStop(0.5, '#ea580c');
              gradient.addColorStop(1, '#c2410c');
              return gradient;
            },
            // Closed - Gray gradient (light gray to dark blue-gray)
            () => {
              const gradient = ctx.createLinearGradient(0, 0, 0, chartArea.height);
              gradient.addColorStop(0, '#d1d5db'); // light gray
              gradient.addColorStop(0.5, '#9ca3af'); // medium gray
              gradient.addColorStop(1, '#4b5563'); // dark blue-gray like the logo
              return gradient;
            },
            // Submitted - Purple gradient (more vibrant)
            () => {
              const gradient = ctx.createLinearGradient(0, 0, 0, chartArea.height);
              gradient.addColorStop(0, '#a78bfa'); // lighter lavender
              gradient.addColorStop(0.5, '#8b5cf6'); // medium purple
              gradient.addColorStop(1, '#7c3aed'); // deep purple
              return gradient;
            }
          ];
          
          return colors[index] ? colors[index]() : '#6b7280';
        },
      },
    ],
  }

  const candidateStatusData = {
    labels: ['Applied', 'Screen Reject', 'Interview Select', 'Interview Reject', 'No Show for Joining', 'Placed'],
    datasets: [
      {
        label: 'Candidates',
        data: [
          dashboardData?.applied_candidates || 0,
          dashboardData?.screen_reject_candidates || 0,
          dashboardData?.interview_selected_candidates || 0,
          dashboardData?.interview_reject_candidates || 0,
          dashboardData?.no_show_for_joining_candidates || 0,
          dashboardData?.placed_candidates || 0,
        ],
        backgroundColor: function(context) {
          const chart = context.chart;
          const {ctx, chartArea} = chart;
          if (!chartArea) {
            return null;
          }
          
          const index = context.dataIndex;
          const colors = [
            // Applied - Blue gradient
            () => {
              const gradient = ctx.createLinearGradient(0, 0, 0, chartArea.height);
              gradient.addColorStop(0, '#93c5fd');
              gradient.addColorStop(0.5, '#3b82f6');
              gradient.addColorStop(1, '#1d4ed8');
              return gradient;
            },
            // Screen Reject - Red gradient
            () => {
              const gradient = ctx.createLinearGradient(0, 0, 0, chartArea.height);
              gradient.addColorStop(0, '#fca5a5');
              gradient.addColorStop(0.5, '#f87171');
              gradient.addColorStop(1, '#ef4444');
              return gradient;
            },
            // Interview Select - Green gradient
            () => {
              const gradient = ctx.createLinearGradient(0, 0, 0, chartArea.height);
              gradient.addColorStop(0, '#86efac');
              gradient.addColorStop(0.5, '#4ade80');
              gradient.addColorStop(1, '#22c55e');
              return gradient;
            },
            // Interview Reject - Orange gradient
            () => {
              const gradient = ctx.createLinearGradient(0, 0, 0, chartArea.height);
              gradient.addColorStop(0, '#fdba74');
              gradient.addColorStop(0.5, '#fb923c');
              gradient.addColorStop(1, '#f97316');
              return gradient;
            },
            // No Show for Joining - Purple gradient
            () => {
              const gradient = ctx.createLinearGradient(0, 0, 0, chartArea.height);
              gradient.addColorStop(0, '#c4b5fd');
              gradient.addColorStop(0.5, '#a78bfa');
              gradient.addColorStop(1, '#8b5cf6');
              return gradient;
            },
            // Placed - Yellow gradient
            () => {
              const gradient = ctx.createLinearGradient(0, 0, 0, chartArea.height);
              gradient.addColorStop(0, '#fde047');
              gradient.addColorStop(0.5, '#facc15');
              gradient.addColorStop(1, '#eab308');
              return gradient;
            }
          ];
          
          return colors[index] ? colors[index]() : '#6b7280';
        },
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
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
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
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
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
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-800">Job Status Distribution</h3>
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
                }}
              />
            </div>
          </div>
        </motion.div>

        {/* Candidate Status Chart */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-800">Candidate Status</h3>
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
                    duration: 600,
                    easing: 'easeOutQuart',
                  },
                }}
              />
            </div>
          </div>
        </motion.div>
      </div>


    </div>
  )
}

export default HRDashboard