import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Briefcase, Filter, Plus, Search, Eye, Pencil, Calendar, MapPin, DollarSign, User, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import api from '../../services/api'

// Only allow these values for status and assigned_hr
const ALLOWED_STATUSES = ['open', 'allocated', 'closed', 'submit', '']
const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
}

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
}

const AdminJobs = () => {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    status: '',
    opening_date_from: '',
    opening_date_to: '',
    assigned_hr: ''
  })
  const [search, setSearch] = useState('')
  const [appliedFilters, setAppliedFilters] = useState({
    status: '',
    opening_date_from: '',
    opening_date_to: '',
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
      !filtersObj.opening_date_from ||
      /^\d{4}-\d{2}-\d{2}$/.test(filtersObj.opening_date_from)
    ) {
      valid.opening_date_from = filtersObj.opening_date_from
    }
    if (
      !filtersObj.opening_date_to ||
      /^\d{4}-\d{2}-\d{2}$/.test(filtersObj.opening_date_to)
    ) {
      valid.opening_date_to = filtersObj.opening_date_to
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
      if (validFilters.opening_date_from) params.append('opening_date_from', validFilters.opening_date_from)
      if (validFilters.opening_date_to) params.append('opening_date_to', validFilters.opening_date_to)
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
      filters.opening_date_from !== '' ||
      filters.opening_date_to !== '' ||
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
      filters.opening_date_from !== appliedFilters.opening_date_from ||
      filters.opening_date_to !== appliedFilters.opening_date_to ||
      filters.assigned_hr !== appliedFilters.assigned_hr ||
      search !== appliedSearch
    )
  }

  // Returns true if filters or search are not empty
  const isClearAllEnabled = () => {
    return (
      filters.status !== '' ||
      filters.opening_date_from !== '' ||
      filters.opening_date_to !== '' ||
      filters.assigned_hr !== '' ||
      search !== '' ||
      appliedFilters.status !== '' ||
      appliedFilters.opening_date_from !== '' ||
      appliedFilters.opening_date_to !== '' ||
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
      opening_date_from: filters.opening_date_from,
      opening_date_to: filters.opening_date_to,
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
      opening_date_from: '',
      opening_date_to: '',
      assigned_hr: ''
    })
    setAppliedSearch('')
    setAppliedFilters({
      status: '',
      opening_date_from: '',
      opening_date_to: '',
      assigned_hr: ''
    })
    fetchJobs()
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return 'badge-success'
      case 'allocated':
        return 'badge-info'
      case 'closed':
        return 'badge-secondary'
      case 'submit':
        return 'badge-warning'
      default:
        return 'badge-secondary'
    }
  }

  const clearFilters = () => {
    setFilters({
      status: '',
      opening_date_from: '',
      opening_date_to: '',
      assigned_hr: ''
    })
    setSearch('')
    setAppliedFilters({
      status: '',
      opening_date_from: '',
      opening_date_to: '',
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
    // Opening date from
    if (
      appliedFilters.opening_date_from &&
      job.opening_date &&
      new Date(job.opening_date) < new Date(appliedFilters.opening_date_from)
    ) {
      return false
    }
    // Opening date to
    if (
      appliedFilters.opening_date_to &&
      job.opening_date &&
      new Date(job.opening_date) > new Date(appliedFilters.opening_date_to)
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
          <h1 className="text-4xl font-bold gradient-text mb-2">Jobs Management</h1>
          <p className="text-slate-600 text-lg">View and manage all job openings</p>
        </div>
        <button
          onClick={() => navigate('/admin/add-job')}
          className="btn-primary"
        >
          <Plus className="h-5 w-5" />
          <span>Add Job</span>
        </button>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.1 }}
        className="card p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Filter className="h-5 w-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-slate-900">Search & Filters</h3>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-ghost"
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>

        {/* Search Bar */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by title, description, location..."
              className="input-field pl-12"
            />
          </div>
          <button
            onClick={handleSearch}
            className="btn-primary px-6"
            disabled={!isSearchButtonEnabled()}
            style={!isSearchButtonEnabled() ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
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
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => {
                      const value = e.target.value
                      if (ALLOWED_STATUSES.includes(value)) {
                        setFilters({ ...filters, status: value })
                      }
                    }}
                    className="select-field"
                  >
                    <option value="">All Status</option>
                    <option value="open">Open</option>
                    <option value="allocated">Allocated</option>
                    <option value="closed">Closed</option>
                    <option value="submit">Submit</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Opening Date From</label>
                  <input
                    type="date"
                    value={filters.opening_date_from}
                    onChange={(e) => {
                      const value = e.target.value
                      if (!value || /^\d{4}-\d{2}-\d{2}$/.test(value)) {
                        setFilters({ ...filters, opening_date_from: value })
                      }
                    }}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Opening Date To</label>
                  <input
                    type="date"
                    value={filters.opening_date_to}
                    onChange={(e) => {
                      const value = e.target.value
                      if (!value || /^\d{4}-\d{2}-\d{2}$/.test(value)) {
                        setFilters({ ...filters, opening_date_to: value })
                      }
                    }}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Assigned HR</label>
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
                    className="select-field"
                  >
                    <option value="">All HR</option>
                    {hrUsers.map(user => (
                      <option key={user.id} value={user.id}>{user.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <button
                  onClick={handleApplyFilters}
                  className="btn-primary"
                  disabled={!isApplyFiltersEnabled()}
                  style={!isApplyFiltersEnabled() ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                >
                  Apply Filters
                </button>
                <button
                  onClick={handleClearAll}
                  className="btn-secondary"
                  disabled={!isClearAllEnabled()}
                  style={!isClearAllEnabled() ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                >
                  Clear All
                </button>
                <span className="text-sm text-slate-500">
                  {filteredJobs.length} jobs found
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Jobs Table */}
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.2 }}
        className="card p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-slate-900">All Jobs</h3>
          <span className="text-sm text-slate-500">{filteredJobs.length} jobs found</span>
        </div>
        
        {filteredJobs.length === 0 ? (
          <div className="text-center py-12">
            <Briefcase className="mx-auto h-16 w-16 text-slate-300 mb-4" />
            <p className="text-lg text-slate-500 mb-2">No jobs found</p>
            <p className="text-sm text-slate-400">Try adjusting your search criteria or add a new job.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-modern">
              <thead>
                <tr>
                  <th>Job ID</th>
                  <th>Title</th>
                  <th>Location</th>
                  <th>CTC</th>
                  <th>Assigned To</th>
                  <th>Status</th>
                  <th>Opening Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map((job, index) => (
                  <motion.tr
                    key={job.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.05 * index }}
                    className="hover:bg-slate-50/50 transition-colors duration-200"
                  >
                    <td className="font-medium text-slate-900">
                      {job.job_id || 'N/A'}
                    </td>
                    <td>
                      <div className="max-w-xs">
                        <div className="font-medium text-slate-900">{job.title}</div>
                        <div className="text-xs text-slate-500 truncate" title={job.description}>
                          {job.description}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        <span>{job.location || 'Remote'}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold text-slate-400">₹</span>
                        <span>{job.salary_package || 'Not specified'}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-slate-400" />
                        <span>{job.assigned_hr_name || 'Unassigned'}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${getStatusColor(job.status)}`}>
                        {job.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <span>
                          {job.opening_date ? new Date(job.opening_date).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewJob(job)}
                          className="p-2 rounded-lg text-primary-600 hover:bg-primary-50 hover:text-primary-700 transition-colors duration-200"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEditJob(job)}
                          className="p-2 rounded-lg text-success-600 hover:bg-success-50 hover:text-success-700 transition-colors duration-200"
                          title="Edit Job"
                        >
                          <Pencil className="h-4 w-4" />
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
              className="bg-white/95 backdrop-blur-md rounded-3xl shadow-large p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-slate-900">Job Details</h3>
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
                    <span className={`badge ${getStatusColor(viewJob.status)}`}>
                      {viewJob.status}
                    </span>
                  } />
                  <Detail label="Title" value={viewJob.title} />
                  <Detail label="Location" value={viewJob.location} />
                  <Detail label="CTC" value={viewJob.salary_package} />
                  <Detail label="Assigned To" value={viewJob.assigned_hr_name || 'Unassigned'} />
                  <Detail label="Opening Date" value={viewJob.opening_date ? new Date(viewJob.opening_date).toLocaleDateString() : 'N/A'} />
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
              className="bg-white/95 backdrop-blur-md rounded-3xl shadow-large p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-slate-900">Edit Job</h3>
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
    assigned_hr: job.assigned_hr || ''
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
          <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="select-field"
          >
            <option value="open">Open</option>
            <option value="allocated">Allocated</option>
            <option value="closed">Closed</option>
            <option value="submit">Submit</option>
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