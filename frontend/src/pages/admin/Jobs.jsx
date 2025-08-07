import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Briefcase, Plus, Eye, Pencil, Calendar, MapPin, DollarSign, User, Search, Filter, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import api from '../../services/api'

const ALLOWED_STATUSES = ["open", "closed", "submitted", "allocated", "demand closed"]

const cardVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
}

const modalVariants = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, scale: 0.98, transition: { duration: 0.15 } }
}

const AdminJobs = () => {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewJob, setViewJob] = useState(null)
  const [editJob, setEditJob] = useState(null)
  const [hrUsers, setHrUsers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    status: '',
    assigned_hr: '',
    start_date: '',
    end_date: ''
  })
  const [showFilters, setShowFilters] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    let isMounted = true
    const fetchAll = async () => {
      setLoading(true)
      try {
        await Promise.all([fetchJobs(), fetchHrUsers()])
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    fetchAll()
    return () => { isMounted = false }
    // eslint-disable-next-line
  }, [])

  const fetchHrUsers = async () => {
    try {
      const response = await api.get('/admin/users')
      setHrUsers(response.data)
    } catch (error) {
      console.error('Error fetching HR users:', error)
    }
  }

  const handleViewJob = (job) => setViewJob(job)
  const handleEditJob = (job) => setEditJob(job)

  const handleUpdateJob = async (jobId, updates) => {
    try {
      await api.put(`/admin/jobs/${jobId}`, updates)
      toast.success('Job updated successfully')
      setEditJob(null)
      fetchJobs()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update job')
    }
  }

  const fetchJobs = async (searchParams = {}) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      
      // Add search parameter
      if (searchParams.search) {
        params.append('search', searchParams.search)
      }
      
      // Add filter parameters
      if (searchParams.status) {
        params.append('status', searchParams.status)
      }
      if (searchParams.assigned_hr) {
        params.append('assigned_hr', searchParams.assigned_hr)
      }
      if (searchParams.start_date) {
        params.append('start_date', searchParams.start_date)
      }
      if (searchParams.end_date) {
        params.append('end_date', searchParams.end_date)
      }
      

      
      const response = await api.get(`/admin/jobs?${params.toString()}`)
      setJobs(response.data)
    } catch (error) {
      console.error('Error fetching jobs:', error)
      setJobs([])
    } finally {
      setLoading(false)
    }
  }

  const getJobStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'open':
        return 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300'
      case 'allocated':
        return 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-300'
      case 'closed':
        return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-300'
      case 'submitted':
        return 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border border-purple-300'
      case 'demand closed':
        return 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 border border-red-300'
      default:
        return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-300'
    }
  }

  const handleSearch = () => {
    const searchParams = {
      search: searchTerm,
      ...filters
    }
    fetchJobs(searchParams)
  }

  const handleApplyFilters = () => {
    const searchParams = {
      search: searchTerm,
      ...filters
    }
    fetchJobs(searchParams)
  }

  const handleResetFilters = () => {
    setSearchTerm('')
    setFilters({
      status: '',
      assigned_hr: '',
      start_date: '',
      end_date: ''
    })
    fetchJobs({})
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }





  if (loading) {
    // Only show loading spinner for a short time (max 2s)
    return (
      <TimeoutSpinner timeout={2000} />
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Jobs</h1>
          <p className="text-gray-600">Manage your job openings</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <Briefcase className="h-4 w-4" />
            <span>Active Positions</span>
          </div>
          <button
            onClick={() => navigate('/admin/add-job')}
            className="btn-primary"
          >
            <Plus className="h-5 w-5" />
            <span>Add Job</span>
          </button>
        </div>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.1 }}
        className="bg-white/90 backdrop-blur-sm shadow-soft border border-white/40 rounded-xl p-6"
      >
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900">Search & Filters</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors duration-200 ${
                showFilters 
                  ? 'bg-blue-50 border-blue-200 text-blue-700' 
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">Filters</span>
            </button>
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors duration-200"
            >
              <X className="h-4 w-4" />
              <span className="text-sm font-medium">Reset</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex flex-col lg:flex-row gap-4 mb-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search jobs by title, description, job ID, CSA ID, location, or salary..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
              />
            </div>
          </div>
          <button
            onClick={handleSearch}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
          >
            Search
          </button>
        </div>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="border-t border-gray-200 pt-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Statuses</option>
                    <option value="open">Open</option>
                    <option value="allocated">Allocated</option>
                    <option value="closed">Closed</option>
                    <option value="submitted">Submitted</option>
                    <option value="demand closed">Demand Closed</option>
                  </select>
                </div>

                {/* HR Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Assigned HR</label>
                  <select
                    value={filters.assigned_hr}
                    onChange={(e) => handleFilterChange('assigned_hr', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All HR</option>
                    {hrUsers.map(user => (
                      <option key={user.id} value={user.id}>{user.name}</option>
                    ))}
                  </select>
                </div>

                {/* Start Date Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                  <input
                    type="date"
                    value={filters.start_date}
                    onChange={(e) => handleFilterChange('start_date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* End Date Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                  <input
                    type="date"
                    value={filters.end_date}
                    onChange={(e) => handleFilterChange('end_date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex justify-end mt-4">
                <button
                  onClick={handleApplyFilters}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium"
                >
                  Apply Filters
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Results Count */}
      <div className="flex items-center justify-end mb-4">
        <span className="text-sm text-gray-600">
          {jobs.length} jobs found
        </span>
      </div>

      {/* Jobs Table */}
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.2 }}
        className="bg-white/90 backdrop-blur-sm shadow-soft border border-white/40 rounded-xl"
      >
        {/* Table Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Job Openings</h3>
              <p className="text-sm text-gray-600 mt-1">Manage and track all job positions</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <Briefcase className="h-4 w-4" />
              <span>{jobs.length} Total Positions</span>
            </div>
          </div>
        </div>
        
        {jobs.length === 0 ? (
          <div className="text-center py-12">
            <Briefcase className="mx-auto h-16 w-16 text-gray-300 mb-4" />
            <p className="text-lg text-gray-500 mb-2">No jobs found</p>
            <p className="text-sm text-gray-400">Try adjusting your search criteria or add a new job.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-50 to-blue-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Job Details</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Location & Package</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Timeline</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">CSA ID</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Assigned HR</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {jobs.map((job, index) => (
                  <motion.tr
                    key={job.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: 0.02 * index }}
                    className="hover:bg-blue-50/50 transition-colors duration-200"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold text-gray-900 text-sm">{job.title}</div>
                        <div className="text-xs text-gray-500 truncate max-w-xs" title={job.description}>
                          ID: {job.job_id || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-400 truncate max-w-xs" title={job.description}>
                          {job.description}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm text-gray-700">
                          <MapPin className="h-3 w-3 text-gray-400" />
                          <span>{job.location || 'Remote'}</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-700">
                          <DollarSign className="h-3 w-3 text-gray-400" />
                          <span>{job.salary_package || 'Not specified'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          <span>Start: {job.start_date ? new Date(job.start_date).toLocaleDateString() : 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          <span>End: {job.end_date ? new Date(job.end_date).toLocaleDateString() : 'N/A'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {job.csa_id || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-700">{job.assigned_hr_name || 'Unassigned'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getJobStatusColor(job.status)}`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleViewJob(job)}
                          className="p-1 hover:bg-blue-50 rounded transition-colors duration-200"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4 text-blue-600" />
                        </button>
                        <button
                          onClick={() => handleEditJob(job)}
                          className="p-1 hover:bg-green-50 rounded transition-colors duration-200"
                          title="Edit Job"
                        >
                          <Pencil className="h-4 w-4 text-green-600" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* View Job Modal */}
      <AnimatePresence>
        {viewJob && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1 }
            }}
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-white rounded-xl shadow-large p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Job Details</h3>
                <button
                  onClick={() => setViewJob(null)}
                  className="p-2 rounded-xl hover:bg-slate-100 transition-colors duration-200"
                  aria-label="Close"
                >
                  <X className="h-6 w-6 text-slate-500" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Detail label="Job ID" value={viewJob.job_id} />
                  <Detail label="Status" value={
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getJobStatusColor(viewJob.status)}`}>
                      {viewJob.status}
                    </span>
                  } />
                  <Detail label="Title" value={viewJob.title} />
                  <Detail label="Location" value={viewJob.location} />
                  <Detail label="CSA ID" value={viewJob.csa_id} />
                  <Detail label="CTC" value={viewJob.salary_package} />
                  <Detail label="Start Date" value={viewJob.start_date ? new Date(viewJob.start_date).toLocaleDateString() : 'N/A'} />
                  <Detail label="End Date" value={viewJob.end_date ? new Date(viewJob.end_date).toLocaleDateString() : 'N/A'} />
                  <Detail label="Assigned To" value={viewJob.assigned_hr_name || 'Unassigned'} />
                  <Detail label="Source" value={viewJob.source_company} />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                  <div className="bg-slate-50/50 rounded-xl p-4 text-sm text-slate-900">
                    {viewJob.description}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Job Modal */}
      <AnimatePresence>
        {editJob && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1 }
            }}
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-white rounded-xl shadow-large p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Edit Job</h3>
                <button
                  onClick={() => setEditJob(null)}
                  className="p-2 rounded-xl hover:bg-slate-100 transition-colors duration-200"
                  aria-label="Close"
                >
                  <X className="h-6 w-6 text-slate-500" />
                </button>
              </div>
              
              <EditJobForm
                job={editJob}
                hrUsers={hrUsers}
                onUpdate={handleUpdateJob}
                onCancel={() => setEditJob(null)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Helper component for displaying label-value pairs
const Detail = ({ label, value }) => (
  <div>
    <label className="block text-sm font-semibold text-slate-700 mb-2">{label}</label>
    <div className="text-sm text-slate-900">{value}</div>
  </div>
)

const EditJobForm = ({ job, hrUsers, onUpdate, onCancel }) => {
  const [formData, setFormData] = useState({
    title: job.title || '',
    description: job.description || '',
    location: job.location || '',
    salary_package: job.salary_package || '',
    status: job.status || 'open',
    assigned_hr: job.assigned_hr || '',
    start_date: job.start_date || '',
    end_date: job.end_date || '',
    csa_id: job.csa_id || ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onUpdate(job.job_id, formData)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    // Only allow allowed status and assigned_hr
    if (name === 'status' && !ALLOWED_STATUSES.includes(value)) return
    if (name === 'assigned_hr' && value !== '' && !hrUsers.some(u => String(u.id) === String(value))) return
    setFormData({
      ...formData,
      [name]: value
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Job Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="input-field"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Location</label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            className="input-field"
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">CTC</label>
          <input
            type="text"
            name="salary_package"
            value={formData.salary_package}
            onChange={handleChange}
            className="input-field"
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">CSA ID</label>
          <input
            type="text"
            name="csa_id"
            value={formData.csa_id}
            onChange={handleChange}
            className="input-field"
            placeholder="Enter CSA ID"
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Start Date</label>
          <input
            type="date"
            name="start_date"
            value={formData.start_date}
            onChange={handleChange}
            className="input-field"
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">End Date</label>
          <input
            type="date"
            name="end_date"
            value={formData.end_date}
            onChange={handleChange}
            className="input-field"
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="select-field"
          >
            <option value="open">Open</option>
            <option value="closed">Closed</option>
            <option value="submitted">Submitted</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Assigned HR</label>
          <select
            name="assigned_hr"
            value={formData.assigned_hr}
            onChange={handleChange}
            className="select-field"
          >
            <option value="">Unassigned</option>
            {hrUsers.map(user => (
              <option key={user.id} value={user.id}>{user.name}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={4}
          className="input-field"
        />
      </div>
      
      <div className="flex items-center gap-4 pt-4">
        <button type="submit" className="btn-primary">
          Update Job
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  )
}

// Spinner with timeout fallback to avoid loading too long
const TimeoutSpinner = ({ timeout = 2000 }) => {
  const [show, setShow] = useState(true)
  React.useEffect(() => {
    const timer = setTimeout(() => setShow(false), timeout)
    return () => clearTimeout(timer)
  }, [timeout])
  if (!show) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400">No jobs found or failed to load.</div>
      </div>
    )
  }
  return (
    <div className="flex items-center justify-center h-64">
      <div className="spinner h-12 w-12"></div>
    </div>
  )
}

export default AdminJobs