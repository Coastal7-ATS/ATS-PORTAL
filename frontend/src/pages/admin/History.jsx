import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Search,
  Calendar,
  MapPin,
  User,
  FileText,
  Clock
} from 'lucide-react'
import { toast } from 'react-toastify'
import api from '../../services/api'
import ModernTable from '../../components/ModernTable'
import Pagination from '../../components/Pagination'
import LoadingSpinner from '../../components/LoadingSpinner'

const fadeInUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
}

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4 } }
}

const AdminHistory = () => {
  const navigate = useNavigate()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalJobs, setTotalJobs] = useState(0)
  const [limit] = useState(25)

  useEffect(() => {
    fetchJobHistory()
  }, [currentPage, searchTerm])

  const fetchJobHistory = async () => {
    try {
      setLoading(true)
      const response = await api.get('/admin/job-history', {
        params: {
          page: currentPage,
          limit: limit,
          search: searchTerm || undefined
        }
      })
      
      console.log('Job history response:', response.data)
      console.log('Jobs data:', response.data.jobs)
      
      if (response.data.jobs && response.data.jobs.length > 0) {
        console.log('First job object:', response.data.jobs[0])
        console.log('First job keys:', Object.keys(response.data.jobs[0]))
      }
      
      setJobs(response.data.jobs || [])
      setTotalPages(response.data.pagination?.total_pages || 1)
      setTotalJobs(response.data.pagination?.total_jobs || 0)
    } catch (error) {
      console.error('Error fetching job history:', error)
      toast.error('Failed to fetch job history')
      setJobs([])
      setTotalPages(1)
      setTotalJobs(0)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchJobHistory()
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return 'Invalid Date'
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      'demand closed': 'bg-red-100 text-red-800',
      'closed': 'bg-gray-100 text-gray-800',
      'submitted': 'bg-blue-100 text-blue-800',
      'allocated': 'bg-yellow-100 text-yellow-800',
      'open': 'bg-green-100 text-green-800'
    }
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusConfig[status] || 'bg-gray-100 text-gray-800'}`}>
        {status || 'Unknown'}
      </span>
    )
  }

  const columns = [
    {
      header: 'Job ID',
      accessor: 'job_id',
      cell: (job) => (
        <div className="font-mono text-sm text-gray-900">
          {job?.job_id || 'N/A'}
        </div>
      )
    },
    {
      header: 'Title',
      accessor: 'title',
      cell: (job) => (
        <div className="max-w-xs">
          <div className="font-medium text-gray-900 truncate" title={job?.title || ''}>
            {job?.title || 'N/A'}
          </div>
          <div className="text-sm text-gray-500 truncate" title={job?.description || ''}>
            {job?.description || 'N/A'}
          </div>
        </div>
      )
    },
    {
      header: 'Location',
      accessor: 'location',
      cell: (job) => (
        <div className="flex items-center text-sm text-gray-600">
          <MapPin className="h-4 w-4 mr-1" />
          {job?.location || 'N/A'}
        </div>
      )
    },
    {
      header: 'CSA ID',
      accessor: 'csa_id',
      cell: (job) => (
        <div className="font-mono text-sm text-gray-900">
          {job?.csa_id || 'N/A'}
        </div>
      )
    },
    {
      header: 'Package',
      accessor: 'salary_package',
      cell: (job) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900">
            {job?.salary_package || 'N/A'}
          </div>
          {job?.expected_package && (
            <div className="text-xs text-gray-500">
              Expected: {job.expected_package}
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Dates',
      accessor: 'dates',
      cell: (job) => (
        <div className="text-sm text-gray-600">
          <div className="flex items-center mb-1">
            <Calendar className="h-3 w-3 mr-1" />
            <span>Start: {formatDate(job?.start_date)}</span>
          </div>
          <div className="flex items-center">
            <Calendar className="h-3 w-3 mr-1" />
            <span>End: {formatDate(job?.end_date)}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Assigned HR',
      accessor: 'assigned_hr',
      cell: (job) => (
        <div className="flex items-center text-sm text-gray-600">
          <User className="h-4 w-4 mr-1" />
          {job?.assigned_hr_name || 'Unassigned'}
        </div>
      )
    },
    {
      header: 'Moved to History',
      accessor: 'moved_to_history_date',
      cell: (job) => (
        <div className="text-sm text-gray-600">
          <div className="flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            {formatDate(job?.moved_to_history_date)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {job?.moved_to_history_reason === 'end_date_passed_no_candidates' 
              ? 'End date passed, no candidates' 
              : job?.moved_to_history_reason || 'N/A'}
          </div>
        </div>
      )
    }
  ]

  // Convert columns to headers format for ModernTable
  const headers = columns.map(column => ({
    label: column.header,
    key: column.accessor,
    render: column.cell,
    className: column.header === 'Dates' 
      ? "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px] w-[200px]"
      : "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",
    cellClassName: column.header === 'Dates'
      ? "px-4 py-3 text-sm text-gray-900 min-w-[200px] w-[200px]"
      : "px-4 py-3 text-sm text-gray-900"
  }))

  if (loading && jobs.length === 0) {
    return <LoadingSpinner />
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className="min-h-screen bg-gray-50 py-8 px-2 md:px-8"
    >
      {/* Header */}
      <motion.div
        variants={fadeInUp}
        className="flex items-center gap-4 mb-6"
      >
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors duration-200"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </button>
        <div>
          <h1 className="gradient-text text-3xl font-bold">Job History</h1>
          <p className="text-slate-500 mt-1">
            View jobs that have been moved to history due to expiration
          </p>
        </div>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        variants={fadeInUp}
        className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-100"
      >
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search jobs by title, description, job ID, CSA ID, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          <button
            type="submit"
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200"
          >
            Search
          </button>
        </form>
      </motion.div>

      {/* Jobs Table */}
      <motion.div
        variants={fadeInUp}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
      >
        {jobs && jobs.length > 0 && headers ? (
          <>
            <ModernTable
              data={jobs}
              headers={headers}
              loading={loading}
              emptyMessage="No jobs found in history"
            />
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="border-t border-gray-200 p-4">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  totalItems={totalJobs}
                  itemsPerPage={limit}
                />
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs in history</h3>
            <p className="text-gray-500">
              {searchTerm ? 'No jobs match your search criteria.' : 'Jobs will appear here once they are moved to history due to expiration.'}
            </p>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

export default AdminHistory
