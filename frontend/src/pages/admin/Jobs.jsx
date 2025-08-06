import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Briefcase, Filter, Plus, Search, Eye, Pencil, Calendar, MapPin, DollarSign, User, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import api from '../../services/api'

// Only allow these values for status and assigned_hr
const ALLOWED_STATUSES = ['open', 'allocated', 'closed', 'submitted', '']
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
  const [filters, setFilters] = useState({
    status: '',
    start_date: '',
    end_date: '',
    assigned_hr: ''
  })
  const [search, setSearch] = useState('')
  const [appliedFilters, setAppliedFilters] = useState({
    status: '',
    start_date: '',
    end_date: '',
    assigned_hr: ''
  })
  const [appliedSearch, setAppliedSearch] = useState('')
  const [viewJob, setViewJob] = useState(null)
  const [editJob, setEditJob] = useState(null)
  const [hrUsers, setHrUsers] = useState([])
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

  // Only allow valid filter values to be sent to backend
  const getValidFilters = (filtersObj) => {
    const valid = {}
    // Only allow status from allowed list
    if (ALLOWED_STATUSES.includes(filtersObj.status)) valid.status = filtersObj.status
    // Only allow valid date strings (YYYY-MM-DD or empty)
    if (
      !filtersObj.start_date ||
      /^\d{4}-\d{2}-\d{2}$/.test(filtersObj.start_date)
    ) {
      valid.start_date = filtersObj.start_date
    }
    if (
      !filtersObj.end_date ||
      /^\d{4}-\d{2}-\d{2}$/.test(filtersObj.end_date)
    ) {
      valid.end_date = filtersObj.end_date
    }
    // Only allow assigned_hr if it's in hrUsers or empty
    if (
      filtersObj.assigned_hr === '' ||
      hrUsers.some(u => String(u.id) === String(filtersObj.assigned_hr))
    ) {
      valid.assigned_hr = filtersObj.assigned_hr
    }
    return valid
  }

  const fetchJobs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      const validFilters = getValidFilters(appliedFilters)
      if (validFilters.status) params.append('status', validFilters.status)
      if (validFilters.start_date) params.append('start_date', validFilters.start_date)
      if (validFilters.end_date) params.append('end_date', validFilters.end_date)
      if (validFilters.assigned_hr) params.append('assigned_hr', validFilters.assigned_hr)
      // Only send allowed filters, never send search to backend
      const response = await api.get(`/admin/jobs?${params.toString()}`)
      setJobs(response.data)
    } catch (error) {
      console.error('Error fetching jobs:', error)
      setJobs([])
    } finally {
      setLoading(false)
    }
  }

  // --- Button logic for Search and Filter ---

  // Returns true if at least one filter is set
  const isAnyFilterActive = () => {
    return (
      filters.status !== '' ||
      filters.start_date !== '' ||
      filters.end_date !== '' ||
      filters.assigned_hr !== ''
    )
  }

  // Returns true if search input is not empty
  const isSearchActive = () => {
    return search.trim() !== ''
  }

  // Returns true if filters or search have changed from applied state
  const isApplyFiltersEnabled = () => {
    // Only compare allowed filter fields
    return (
      filters.status !== appliedFilters.status ||
      filters.start_date !== appliedFilters.start_date ||
      filters.end_date !== appliedFilters.end_date ||
      filters.assigned_hr !== appliedFilters.assigned_hr ||
      search !== appliedSearch
    )
  }

  // Returns true if filters or search are not empty
  const isClearAllEnabled = () => {
    return (
      filters.status !== '' ||
      filters.start_date !== '' ||
      filters.end_date !== '' ||
      filters.assigned_hr !== '' ||
      search !== '' ||
      appliedFilters.status !== '' ||
      appliedFilters.start_date !== '' ||
      appliedFilters.end_date !== '' ||
      appliedFilters.assigned_hr !== '' ||
      appliedSearch !== ''
    )
  }

  // Returns true if search input is not empty and not already applied
  const isSearchButtonEnabled = () => {
    return search.trim() !== '' && search !== appliedSearch
  }

  const handleApplyFilters = () => {
    if (!isApplyFiltersEnabled()) return
    // Only apply allowed filters
    setAppliedFilters({
      status: filters.status,
      start_date: filters.start_date,
      end_date: filters.end_date,
      assigned_hr: filters.assigned_hr
    })
    setAppliedSearch(search)
    fetchJobs()
  }

  const handleSearch = () => {
    if (!isSearchButtonEnabled()) return
    setAppliedSearch(search)
    // Search is handled client-side, no need to fetch from backend
  }

  const handleClearAll = () => {
    if (!isClearAllEnabled()) return
    setSearch('')
    setFilters({
      status: '',
      start_date: '',
      end_date: '',
      assigned_hr: ''
    })
    setAppliedSearch('')
    setAppliedFilters({
      status: '',
      start_date: '',
      end_date: '',
      assigned_hr: ''
    })
    fetchJobs()
    // Refresh the entire page
    window.location.reload()
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

  const clearFilters = () => {
    setFilters({
      status: '',
      start_date: '',
      end_date: '',
      assigned_hr: ''
    })
    setSearch('')
    setAppliedFilters({
      status: '',
      start_date: '',
      end_date: '',
      assigned_hr: ''
    })
    setAppliedSearch('')
    fetchJobs()
  }

  // Client-side filtering for search, but only after filter conditions are matched
  const filteredJobs = jobs.filter(job => {
    // Only jobs that match the applied filter conditions
    // Status
    if (
      appliedFilters.status &&
      job.status !== appliedFilters.status
    ) {
      return false
    }
    // Start date
    if (
      appliedFilters.start_date &&
      job.start_date &&
      new Date(job.start_date).toDateString() !== new Date(appliedFilters.start_date).toDateString()
    ) {
      return false
    }
    // End date
    if (
      appliedFilters.end_date &&
      job.end_date &&
      new Date(job.end_date).toDateString() !== new Date(appliedFilters.end_date).toDateString()
    ) {
      return false
    }
    // Assigned HR
    if (
      appliedFilters.assigned_hr &&
      String(job.assigned_hr) !== String(appliedFilters.assigned_hr)
    ) {
      return false
    }
    // Now apply search (if any)
    if (appliedSearch) {
      const searchLower = appliedSearch.toLowerCase()
      return (
        (job.title && job.title.toLowerCase().includes(searchLower)) ||
        (job.description && job.description.toLowerCase().includes(searchLower)) ||
        (job.location && job.location.toLowerCase().includes(searchLower)) ||
        (job.job_id && job.job_id.toString().includes(searchLower)) ||
        (job.assigned_hr_name && job.assigned_hr_name.toLowerCase().includes(searchLower))
      )
    }
    return true
  })

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
        className="bg-white/30 backdrop-blur-sm rounded-xl border border-white/20 p-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Search - spans 2 columns */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search jobs..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filters.status}
              onChange={(e) => {
                const value = e.target.value
                setFilters({ ...filters, status: value })
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="">All Status</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
              <option value="submitted">Submitted</option>
              <option value="demand closed">Demand Closed</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => {
                const value = e.target.value
                if (!value || /^\d{4}-\d{2}-\d{2}$/.test(value)) {
                  setFilters({ ...filters, start_date: value })
                }
              }}
              placeholder="Start Date"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>

          {/* End Date */}
          <div>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => {
                const value = e.target.value
                if (!value || /^\d{4}-\d{2}-\d{2}$/.test(value)) {
                  setFilters({ ...filters, end_date: value })
                }
              }}
              placeholder="End Date"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>

          {/* HR Filter */}
          <div>
            <select
              value={filters.assigned_hr}
              onChange={(e) => {
                const value = e.target.value
                if (
                  value === '' ||
                  hrUsers.some(u => String(u.id) === String(value))
                ) {
                  setFilters({ ...filters, assigned_hr: value })
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="">All HR</option>
              {hrUsers.map(user => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleApplyFilters}
              className="btn-primary px-4"
              disabled={!isApplyFiltersEnabled()}
              style={!isApplyFiltersEnabled() ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
            >
              Apply
            </button>
            <button
              onClick={handleClearAll}
              className="btn-secondary px-4"
              disabled={!isClearAllEnabled()}
              style={!isClearAllEnabled() ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
            >
              Clear
            </button>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-end mt-4">
          <span className="text-sm text-gray-600">
            {filteredJobs.length} results
          </span>
        </div>

        {/* Active Filters */}
        {(appliedFilters.status || appliedFilters.assigned_hr || appliedFilters.start_date || appliedFilters.end_date || appliedSearch) && (
          <div className="flex flex-wrap gap-2 mt-4">
            {appliedFilters.status && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Status: {appliedFilters.status}
                <button onClick={() => setAppliedFilters({...appliedFilters, status: ''})} className="hover:text-blue-600">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {appliedFilters.start_date && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Start: {appliedFilters.start_date}
                <button onClick={() => setAppliedFilters({...appliedFilters, start_date: ''})} className="hover:text-yellow-600">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {appliedFilters.end_date && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                End: {appliedFilters.end_date}
                <button onClick={() => setAppliedFilters({...appliedFilters, end_date: ''})} className="hover:text-orange-600">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {appliedFilters.assigned_hr && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                HR: {hrUsers.find(u => String(u.id) === String(appliedFilters.assigned_hr))?.name}
                <button onClick={() => setAppliedFilters({...appliedFilters, assigned_hr: ''})} className="hover:text-green-600">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {appliedSearch && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Search: {appliedSearch}
                <button onClick={() => setAppliedSearch('')} className="hover:text-purple-600">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </motion.div>

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
              <span>{filteredJobs.length} Total Positions</span>
            </div>
          </div>
        </div>
        
        {filteredJobs.length === 0 ? (
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
                {filteredJobs.map((job, index) => (
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