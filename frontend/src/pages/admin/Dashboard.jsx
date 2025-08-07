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
  UserCheck,
  Download,
  FileText
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
  const [hrReportType, setHrReportType] = useState('all') // 'all' or 'individual'
  const [selectedHrForReport, setSelectedHrForReport] = useState('')
  const [downloadingReport, setDownloadingReport] = useState(false)
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

  const downloadHrReport = async () => {
    try {
      setDownloadingReport(true)
      
      const params = new URLSearchParams()
      
      // Add date filters
      if (filters.reportType) {
        params.append('report_type', filters.reportType)
      }
      if (filters.reportType === 'custom') {
        if (filters.customStartDate) {
          params.append('custom_start_date', filters.customStartDate)
        }
        if (filters.customEndDate) {
          params.append('custom_end_date', filters.customEndDate)
        }
      }
      
      // Add HR filter
      if (hrReportType === 'individual' && selectedHrForReport) {
        params.append('hr_id', selectedHrForReport)
      }
      
      const response = await api.get(`/admin/hr-report?${params.toString()}`, {
        responseType: 'blob'
      })
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      
      // Generate filename
      const timestamp = new Date().toISOString().slice(0, 10)
      const hrName = hrReportType === 'individual' && selectedHrForReport 
        ? hrUsers.find(hr => hr.id === selectedHrForReport)?.name?.replace(/\s+/g, '_') || 'HR'
        : 'All_HR'
      
      link.setAttribute('download', `HR_Report_${hrName}_${timestamp}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      
    } catch (error) {
      console.error('Error downloading HR report:', error)
      alert('Failed to download HR report. Please try again.')
    } finally {
      setDownloadingReport(false)
    }
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
            },
            // Demand Closed - Red gradient (more vibrant)
            () => {
              const gradient = ctx.createLinearGradient(0, 0, 0, chartArea.height);
              gradient.addColorStop(0, '#ef4555');
              gradient.addColorStop(0.5, '#dc2626');
              gradient.addColorStop(1, '#b91c1c');
              return gradient;
            }
          ];
          
          return colors[index] ? colors[index]() : '#6b7280';
        },
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
        backgroundColor: function(context) {
          const chart = context.chart;
          const {ctx, chartArea} = chart;
          if (!chartArea) {
            return null;
          }
          
          const index = context.dataIndex;
          const colors = [
            // Blue gradient
            () => {
              const gradient = ctx.createLinearGradient(0, 0, 0, chartArea.height);
              gradient.addColorStop(0, '#93c5fd');
              gradient.addColorStop(1, '#3b82f6');
              return gradient;
            },
            // Green gradient
            () => {
              const gradient = ctx.createLinearGradient(0, 0, 0, chartArea.height);
              gradient.addColorStop(0, '#86efac');
              gradient.addColorStop(1, '#10b981');
              return gradient;
            },
            // Yellow gradient
            () => {
              const gradient = ctx.createLinearGradient(0, 0, 0, chartArea.height);
              gradient.addColorStop(0, '#fde047');
              gradient.addColorStop(1, '#eab308');
              return gradient;
            },
            // Red gradient
            () => {
              const gradient = ctx.createLinearGradient(0, 0, 0, chartArea.height);
              gradient.addColorStop(0, '#fca5a5');
              gradient.addColorStop(1, '#ef4444');
              return gradient;
            },
            // Purple gradient
            () => {
              const gradient = ctx.createLinearGradient(0, 0, 0, chartArea.height);
              gradient.addColorStop(0, '#c4b5fd');
              gradient.addColorStop(1, '#8b5cf6');
              return gradient;
            },
            // Cyan gradient
            () => {
              const gradient = ctx.createLinearGradient(0, 0, 0, chartArea.height);
              gradient.addColorStop(0, '#67e8f9');
              gradient.addColorStop(1, '#06b6d4');
              return gradient;
            },
            // Lime gradient
            () => {
              const gradient = ctx.createLinearGradient(0, 0, 0, chartArea.height);
              gradient.addColorStop(0, '#bef264');
              gradient.addColorStop(1, '#84cc16');
              return gradient;
            },
            // Orange gradient
            () => {
              const gradient = ctx.createLinearGradient(0, 0, 0, chartArea.height);
              gradient.addColorStop(0, '#fdba74');
              gradient.addColorStop(1, '#f97316');
              return gradient;
            },
            // Pink gradient
            () => {
              const gradient = ctx.createLinearGradient(0, 0, 0, chartArea.height);
              gradient.addColorStop(0, '#f9a8d4');
              gradient.addColorStop(1, '#ec4899');
              return gradient;
            },
            // Indigo gradient
            () => {
              const gradient = ctx.createLinearGradient(0, 0, 0, chartArea.height);
              gradient.addColorStop(0, '#a5b4fc');
              gradient.addColorStop(1, '#6366f1');
              return gradient;
            }
          ];
          
          return colors[index] ? colors[index]() : '#6b7280';
        },
        borderColor: [
          '#7dd3fc', // pastel blue border
          '#4ade80', // pastel green border
          '#facc15', // pastel yellow border
          '#f87171', // pastel red border
          '#a78bfa', // pastel purple border
          '#22d3ee', // pastel cyan border
          '#a3e635', // pastel lime border
          '#fb923c', // pastel orange border
          '#f472b6', // pastel pink border
          '#818cf8', // pastel indigo border
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
      color: 'from-primary-500 to-primary-600'
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
      color: 'from-success-500 to-emerald-500'
    },
  ]
  
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
          <h1 className="text-4xl font-bold gradient-text mb-2">Admin Dashboard</h1>
          <p className="text-slate-600 text-lg">Overview of recruitment activities and analytics</p>
        </div>
      </motion.div>

             {/* Filters Section */}
       <motion.div
         initial={{ opacity: 0, y: 10 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.3, delay: 0.1 }}
         className="p-4 bg-white/30 backdrop-blur-sm rounded-xl border border-white/20"
       >
         {/* Header */}
         <div className="flex items-center gap-3 mb-4">
           <div className="p-1.5 bg-pastel-blue/30 rounded-lg">
             <Filter className="h-4 w-4 text-primary-600" />
           </div>
           <span className="text-sm font-semibold text-slate-700">Filters</span>
         </div>

         {/* Filters Grid */}
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3 mb-4">
           {/* Report Type Filter */}
           <div className="flex flex-col gap-1">
             <label className="text-xs font-medium text-slate-600">Report Type</label>
             <div className="relative">
               <select
                 value={filters.reportType}
                 onChange={(e) => handleFilterChange('reportType', e.target.value)}
                 className="w-full px-3 py-2 pr-8 text-sm bg-white/80 border border-white/50 rounded-lg focus:ring-1 focus:ring-primary-500/50 focus:border-primary-500 transition-all duration-200 appearance-none cursor-pointer"
               >
                 <option value="">All Time</option>
                 <option value="weekly">Weekly</option>
                 <option value="monthly">Monthly</option>
                 <option value="custom">Custom</option>
               </select>
               <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                 <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                 </svg>
               </div>
             </div>
           </div>

           {/* HR Filter */}
           <div className="flex flex-col gap-1">
             <label className="text-xs font-medium text-slate-600">HR</label>
             <div className="relative">
               <select
                 value={filters.hrId}
                 onChange={(e) => handleFilterChange('hrId', e.target.value)}
                 className="w-full px-3 py-2 pr-8 text-sm bg-white/80 border border-white/50 rounded-lg focus:ring-1 focus:ring-primary-500/50 focus:border-primary-500 transition-all duration-200 appearance-none cursor-pointer"
               >
                 <option value="">All HR</option>
                 {hrUsers.map((hr) => (
                   <option key={hr.id} value={hr.id}>
                     {hr.name}
                   </option>
                 ))}
               </select>
               <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                 <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                 </svg>
               </div>
             </div>
           </div>

           {/* Custom Date Range - From */}
           {filters.reportType === 'custom' && (
             <div className="flex flex-col gap-1">
               <label className="text-xs font-medium text-slate-600">From Date</label>
               <input
                 type="date"
                 value={filters.customStartDate}
                 onChange={(e) => handleFilterChange('customStartDate', e.target.value)}
                 className="w-full px-3 py-2 text-sm bg-white/80 border border-white/50 rounded-lg focus:ring-1 focus:ring-primary-500/50 focus:border-primary-500 transition-all duration-200"
               />
             </div>
           )}

           {/* Custom Date Range - To */}
           {filters.reportType === 'custom' && (
             <div className="flex flex-col gap-1">
               <label className="text-xs font-medium text-slate-600">To Date</label>
               <input
                 type="date"
                 value={filters.customEndDate}
                 onChange={(e) => handleFilterChange('customEndDate', e.target.value)}
                 className="w-full px-3 py-2 text-sm bg-white/80 border border-white/50 rounded-lg focus:ring-1 focus:ring-primary-500/50 focus:border-primary-500 transition-all duration-200"
               />
             </div>
           )}
         </div>

         {/* Active Filters & Clear Button */}
         <div className="flex flex-wrap items-center gap-2">
           <div className="flex flex-wrap items-center gap-2">
             {filters.reportType && (
               <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-pastel-blue/20 text-primary-700">
                 {filters.reportType === 'weekly' ? 'Weekly' :
                  filters.reportType === 'monthly' ? 'Monthly' :
                  filters.reportType === 'custom' ? 'Custom' : ''}
               </span>
             )}
             {filters.hrId && (
               <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-pastel-green/20 text-success-700">
                 {hrUsers.find(hr => hr.id === filters.hrId)?.name || 'HR'}
               </span>
             )}
           </div>
           
           {(filters.reportType || filters.hrId) && (
             <button
               onClick={clearFilters}
               className="inline-flex items-center px-3 py-1 text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-white/50 rounded-md transition-all duration-200"
             >
               <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
               </svg>
               Clear
             </button>
           )}
         </div>
       </motion.div>

      {/* HR Performance Section */}
      {dashboardData.hr_performance && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="card p-6 bg-gradient-to-r from-pastel-blue to-pastel-cyan border border-primary-200"
        >
          <div className="flex items-center gap-2 mb-4">
            <UserCheck className="h-5 w-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-slate-800">
              HR Performance: {dashboardData.hr_performance.hr_name}
            </h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">
                {dashboardData.hr_performance.total_assigned_jobs}
              </div>
              <div className="text-sm text-slate-600">Total Assigned Jobs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-success-600">
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
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
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
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <div 
            className="card p-6 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.01]"
            onClick={handleJobsChartClick}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-800">Job Status Distribution</h3>
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
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.3, delay: 0.5 }}
         >
           <div 
             className="card p-6 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.01]"
             onClick={handleHrContributionClick}
           >
             <div className="flex items-center justify-between mb-6">
               <h3 className="text-xl font-bold text-slate-800">HR Contribution</h3>
               <div className="flex items-center gap-2 text-sm text-slate-500">
                 <div className="w-3 h-3 bg-success-500 rounded-full"></div>
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

        {/* HR Report Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.6 }}
        >
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-800">HR Performance Report</h3>
                <p className="text-sm text-slate-600 mt-1">Download detailed HR performance reports</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <FileText className="h-4 w-4" />
                <span>Excel Report</span>
              </div>
            </div>

            <div className="space-y-4">
              {/* Report Type Selection */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-slate-700">Report Type:</label>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="hrReportType"
                        value="all"
                        checked={hrReportType === 'all'}
                        onChange={(e) => setHrReportType(e.target.value)}
                        className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                      />
                      <span className="text-sm text-slate-700">All HR</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="hrReportType"
                        value="individual"
                        checked={hrReportType === 'individual'}
                        onChange={(e) => setHrReportType(e.target.value)}
                        className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                      />
                      <span className="text-sm text-slate-700">Individual HR</span>
                    </label>
                  </div>
                </div>

                {/* HR Selection for Individual Report */}
                {hrReportType === 'individual' && (
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-slate-700">Select HR:</label>
                    <select
                      value={selectedHrForReport}
                      onChange={(e) => setSelectedHrForReport(e.target.value)}
                      className="px-3 py-1.5 text-sm bg-white/80 border border-white/50 rounded-lg focus:ring-1 focus:ring-primary-500/50 focus:border-primary-500 transition-all duration-200"
                    >
                      <option value="">Choose HR</option>
                      {hrUsers.map((hr) => (
                        <option key={hr.id} value={hr.id}>
                          {hr.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Report Info */}
              <div className="bg-slate-50/50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <FileText className="h-4 w-4 text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-slate-800 mb-1">Report Includes:</h4>
                    <ul className="text-xs text-slate-600 space-y-1">
                      <li>• HR Name and Email</li>
                      <li>• Total Jobs Allocated (Open, Closed, Submitted, Demand Closed)</li>
                      <li>• Total Candidates Added</li>
                      <li>• Selected Candidates Count</li>
                      <li>• Selected Candidates with Job Titles</li>
                      {filters.reportType && (
                        <li>• Date Range: {filters.reportType === 'weekly' ? 'Last 7 days' : 
                                           filters.reportType === 'monthly' ? 'Last 30 days' : 
                                           filters.reportType === 'custom' ? 'Custom range' : 'All time'}</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Download Button */}
              <div className="flex items-center justify-between pt-2">
                <div className="text-xs text-slate-500">
                  {hrReportType === 'all' ? 'Will generate report for all HR users' : 
                   selectedHrForReport ? `Will generate report for ${hrUsers.find(hr => hr.id === selectedHrForReport)?.name}` : 
                   'Please select an HR user'}
                </div>
                <button
                  onClick={downloadHrReport}
                  disabled={downloadingReport || (hrReportType === 'individual' && !selectedHrForReport)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    downloadingReport || (hrReportType === 'individual' && !selectedHrForReport)
                      ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                      : 'bg-primary-600 text-white hover:bg-primary-700 shadow-lg hover:shadow-xl'
                  }`}
                >
                  {downloadingReport ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      <span>Download Report</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default AdminDashboard