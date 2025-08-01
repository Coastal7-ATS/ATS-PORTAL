import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Briefcase, Filter, Eye, Edit, Plus, Search, MapPin, Calendar, Users, FileText, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { toast } from 'react-toastify'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import CandidateViewModal from '../../components/CandidateViewModal'

// Animation variants for consistent animations
const pageVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      type: 'spring',
      stiffness: 100
    }
  })
}

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    transition: { 
      type: 'spring', 
      stiffness: 300, 
      damping: 30 
    } 
  },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
}

const HRJobs = () => {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ status: '' })
  const [search, setSearch] = useState('')
  const [appliedFilters, setAppliedFilters] = useState({ status: '' })
  const [appliedSearch, setAppliedSearch] = useState('')
  const [selectedJob, setSelectedJob] = useState(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showAddCandidateModal, setShowAddCandidateModal] = useState(false)
  const [showUpdateStatusModal, setShowUpdateStatusModal] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [showCandidateViewModal, setShowCandidateViewModal] = useState(false)
  const [candidateForm, setCandidateForm] = useState({
    name: '', email: '', phone: '', pan_number: '', current_location: '', hometown: '',
    total_experience: '', relevant_experience: '',
    education_x_institute: '', education_x_start_date: '', education_x_end_date: '', education_x_percentage: '',
    education_xii_institute: '', education_xii_start_date: '', education_xii_end_date: '', education_xii_percentage: '',
    education_degree_name: '', education_degree_institute: '', education_degree_start_date: '', education_degree_end_date: '', education_degree_percentage: '',
    education_x: '', education_xii: '', education_degree: '', education_percentage: '', education_duration: '',
    experience_entries: [], certifications: '', publications: '', references: '', linkedin: '', github: ''
  })
  const navigate = useNavigate()

  useEffect(() => {
    fetchJobs()
    // eslint-disable-next-line
  }, [])

  const fetchJobs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (appliedFilters.status) params.append('status', appliedFilters.status)
      // Note: search is handled client-side, so we don't send it to backend
      const response = await api.get(`/hr/jobs?${params.toString()}`)
      setJobs(response.data)
    } catch (error) {
      console.error('Error fetching jobs:', error)
      toast.error('Failed to fetch jobs')
    } finally {
      setLoading(false)
    }
  }

  const handleApplyFilters = () => {
    setAppliedFilters(filters)
    // For HR jobs, we only need to fetch if status filter changes
    // Search is handled client-side
    fetchJobs()
  }

  const handleSearch = () => {
    setAppliedSearch(search)
    // Search is handled client-side, no need to fetch from backend
  }

  const handleClearAll = () => {
    setSearch('')
    setFilters({ status: '' })
    setAppliedSearch('')
    setAppliedFilters({ status: '' })
    fetchJobs()
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return 'badge-warning'
      case 'allocated':
        return 'badge-info'
      case 'closed':
        return 'badge-success'
      case 'submit':
        return 'badge-secondary'
      default:
        return 'badge-secondary'
    }
  }

  const handleViewCandidates = (job) => { 
    setSelectedJob(job)
    setShowViewModal(true) 
  }
  
  const handleAddCandidate = (job) => { 
    setSelectedJob(job)
    setShowAddCandidateModal(true) 
  }
  
    const handleUpdateStatus = (job) => { 
    setSelectedJob(job)
    setNewStatus(job.status)
    setShowUpdateStatusModal(true)
  }

  const handleViewCandidate = async (candidateId) => {
    try {
      setLoading(true)
      const response = await api.get(`/candidates/${candidateId}`)
      setSelectedCandidate(response.data)
      setShowCandidateViewModal(true)
    } catch (error) {
      console.error('Error fetching candidate details:', error)
      toast.error('Failed to fetch candidate details')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveCandidate = async () => {
    if (!candidateForm.name || !candidateForm.email || !candidateForm.phone) {
      toast.error('Please fill in all required fields (Name, Email, Phone)')
      return
    }
    try {
      const candidateData = {
        ...candidateForm,
        job_id: selectedJob.job_id,
        status: 'applied',
        applied_date: new Date().toISOString()
      }
      await api.post('/candidates', candidateData)
      toast.success('Candidate added successfully!')
      setShowAddCandidateModal(false)
      setCandidateForm({
        name: '', email: '', phone: '', pan_number: '', current_location: '', hometown: '',
        total_experience: '', relevant_experience: '',
        education_x_institute: '', education_x_start_date: '', education_x_end_date: '', education_x_percentage: '',
        education_xii_institute: '', education_xii_start_date: '', education_xii_end_date: '', education_xii_percentage: '',
        education_degree_name: '', education_degree_institute: '', education_degree_start_date: '', education_degree_end_date: '', education_degree_percentage: '',
        education_x: '', education_xii: '', education_degree: '', education_percentage: '', education_duration: '',
        experience_entries: [], certifications: '', publications: '', references: '', linkedin: '', github: ''
      })
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Failed to add candidate'
      toast.error(errorMessage)
    }
  }

  const handleUpdateJobStatus = async () => {
    try {
      await api.put(`/hr/jobs/${selectedJob.job_id}/status?status=${newStatus}`)
      toast.success('Job status updated successfully!')
      setShowUpdateStatusModal(false)
      fetchJobs()
    } catch (error) {
      toast.error('Failed to update job status')
    }
  }

  const filteredJobs = jobs.filter(job => {
    // Apply status filter
    if (appliedFilters.status && job.status !== appliedFilters.status) {
      return false
    }
    
    // Apply search filter
    if (appliedSearch) {
      const searchLower = appliedSearch.toLowerCase()
      return (
        job.title?.toLowerCase().includes(searchLower) ||
        job.description?.toLowerCase().includes(searchLower) ||
        job.location?.toLowerCase().includes(searchLower) ||
        job.job_id?.toString().includes(searchLower)
      )
    }
    
    return true
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          initial={{ scale: 0.8, opacity: 0.5 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ repeat: Infinity, duration: 1, repeatType: "reverse" }}
          className="rounded-full h-12 w-12 border-4 border-blue-600 border-b-transparent animate-spin"
        />
      </div>
    )
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 max-w-7xl mx-auto px-6 py-8"
    >
      {/* Header Section */}
      <motion.div
        variants={cardVariants}
        custom={0}
        initial="hidden"
        animate="visible"
        className="text-left"
      >
        <h1 className="gradient-text text-3xl font-bold mb-2">My Jobs</h1>
        <p className="text-slate-600 text-lg">Manage and track your assigned job openings</p>
      </motion.div>

      {/* Search and Filter Section */}
      <motion.div
        variants={cardVariants}
        custom={1}
        initial="hidden"
        animate="visible"
        className="card p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-slate-900">Search & Filters</h3>
        </div>
        
        <div className="space-y-4">
          {/* Search and Filter Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by title, location, ID..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input-field pl-10"
              />
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={filters.status}
                onChange={e => setFilters({ ...filters, status: e.target.value })}
                className="select-field"
              >
                <option value="">All Status</option>
                <option value="open">Open</option>
                <option value="allocated">Allocated</option>
                <option value="closed">Closed</option>
                <option value="submit">Submit</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleSearch}
                className="btn-primary px-4"
              >
                Search
              </button>
              <button
                onClick={handleApplyFilters}
                className="btn-secondary px-4"
              >
                Apply Filters
              </button>
              <button
                onClick={handleClearAll}
                className="btn-ghost px-4"
              >
                Clear All
              </button>
            </div>

            {/* Results Count */}
            <div className="flex items-center justify-end">
              <span className="text-sm text-slate-500 bg-slate-100 px-3 py-3 rounded-lg">
                {filteredJobs.length} jobs found
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Jobs Table */}
      <motion.div
        variants={cardVariants}
        custom={2}
        initial="hidden"
        animate="visible"
        className="card overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/50">
          <h3 className="text-lg font-semibold text-slate-900">Job Openings</h3>
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary-600" />
            <span className="text-sm text-slate-500">Active Positions</span>
          </div>
        </div>

        {filteredJobs.length === 0 ? (
          <div className="text-center py-12">
            <Briefcase className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 text-lg">No jobs found</p>
            <p className="text-slate-400 text-sm">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-modern">
              <thead>
                <tr>
                  <th>Job Details</th>
                  <th>Location</th>
                  <th>Package</th>
                  <th>Status</th>
                  <th>Posted Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map((job, index) => (
                  <motion.tr
                    key={job.job_id}
                    variants={cardVariants}
                    custom={index + 3}
                    initial="hidden"
                    animate="visible"
                  >
                    <td>
                      <div className="flex flex-col items-start">
                        <div className="font-semibold text-slate-900">{job.job_id}</div>
                        <div className="font-medium text-slate-900">{job.title}</div>
                        <div className="text-sm text-slate-500 mt-1 max-w-xs truncate" title={job.description}>
                          {job.description}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center text-sm text-slate-900">
                        <MapPin className="h-4 w-4 mr-2 text-slate-400" />
                        {job.location}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center text-sm text-slate-900">
                        ₹{job.salary_package}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${getStatusColor(job.status)}`}>
                        {job.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center text-sm text-slate-900">
                        <Calendar className="h-4 w-4 mr-2 text-slate-400" />
                        {new Date(job.opening_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleAddCandidate(job)}
                          className="p-2 rounded-lg text-danger-600 hover:bg-danger-50 hover:text-danger-700 transition-colors duration-200"
                          title="Add Candidate"
                        >
                          <Plus className="h-4 w-4" />
                          </button>
                          <button
                          onClick={() => handleViewCandidates(job)}
                          className="p-2 rounded-lg text-primary-600 hover:bg-primary-50 hover:text-primary-700 transition-colors duration-200"
                          title="View Candidates"
                        >
                          <Eye className="h-4 w-4" />
                        </button>  
                        <button
                          onClick={() => handleUpdateStatus(job)}
                          className="p-2 rounded-lg text-success-600 hover:bg-success-50 hover:text-success-700 transition-colors duration-200"
                          title="Update Status"
                        >
                          <Edit className="h-4 w-4" />
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

      {/* View Candidates Modal */}
      <AnimatePresence>
        {showViewModal && selectedJob && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200"
            >
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl z-10">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      Candidates for {selectedJob.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Job ID: {selectedJob.job_id} • Location: {selectedJob.location}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="inline-flex items-center justify-center p-2 border border-gray-300 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-all duration-200"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="p-6">
                <CandidatesList jobId={selectedJob.job_id} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Candidate Modal */}
      <AnimatePresence>
        {showAddCandidateModal && selectedJob && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200"
            >
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl z-10">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      Add Candidate for {selectedJob.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Job ID: {selectedJob.job_id} • Location: {selectedJob.location}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddCandidateModal(false)}
                    className="inline-flex items-center justify-center p-2 border border-gray-300 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-all duration-200"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="p-6">
                <AddCandidateForm
                  formData={candidateForm}
                  setFormData={setCandidateForm}
                  onSave={handleSaveCandidate}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Update Status Modal */}
      <AnimatePresence>
        {showUpdateStatusModal && selectedJob && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-200"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Update Job Status
                </h3>
                <button 
                  onClick={() => setShowUpdateStatusModal(false)}
                  className="inline-flex items-center justify-center p-2 border border-gray-300 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-all duration-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedJob.title}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Status</label>
                  <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(selectedJob.status)}`}>
                    {selectedJob.status}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Status</label>
                  <select
                    value={newStatus}
                    onChange={e => setNewStatus(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="allocated">Allocated</option>
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                    <option value="submit">Submit</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowUpdateStatusModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-lg transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateJobStatus}
                    className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-all duration-200"
                  >
                    Update Status
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Candidate View Modal */}
      <CandidateViewModal
        candidate={selectedCandidate}
        open={showCandidateViewModal}
        onClose={() => {
          setShowCandidateViewModal(false);
          setSelectedCandidate(null);
        }}
        onUpdate={fetchJobs}
      />
    </motion.div>
  )
}

// Candidates List Component
const CandidatesList = ({ jobId }) => {
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [showUpdateStatusModal, setShowUpdateStatusModal] = useState(false)
  const [showCandidateViewModal, setShowCandidateViewModal] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => { 
    fetchCandidates() 
    // eslint-disable-next-line
  }, [jobId])

  const fetchCandidates = async () => {
    setLoading(true)
    try {
      const response = await api.get(`/hr/candidates/${jobId}`)
      setCandidates(response.data)
    } catch (error) {
      console.error('Error fetching candidates:', error)
      toast.error('Failed to fetch candidates')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateCandidateStatus = async () => {
    try {
      const params = new URLSearchParams()
      params.append('status', newStatus)
      if (notes) params.append('notes', notes)
      await api.put(`/hr/candidates/${selectedCandidate.id}/status?${params.toString()}`)
      toast.success('Candidate status updated successfully!')
      setShowUpdateStatusModal(false)
      fetchCandidates()
    } catch (error) {
      toast.error('Failed to update candidate status')
    }
  }

  const handleUpdateStatus = (candidate) => {
    setSelectedCandidate(candidate)
    setNewStatus(candidate.status)
    setNotes('')
    setShowUpdateStatusModal(true)
  }

  const handleViewCandidate = async (candidateId) => {
    try {
      setLoading(true)
      const response = await api.get(`/candidates/${candidateId}`)
      setSelectedCandidate(response.data)
      setShowCandidateViewModal(true)
    } catch (error) {
      console.error('Error fetching candidate details:', error)
      toast.error('Failed to fetch candidate details')
    } finally {
      setLoading(false)
    }
  }



  const getStatusColor = (status) => {
    switch (status) {
      case 'selected':
        return 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200'
      case 'rejected':
        return 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border-red-200'
      case 'interviewed':
        return 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-blue-200'
      case 'in_progress':
        return 'bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 border-orange-200'
      case 'applied':
        return 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0.5 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ repeat: Infinity, duration: 1, repeatType: "reverse" }}
          className="rounded-full h-8 w-8 border-4 border-blue-600 border-b-transparent animate-spin"
        />
      </div>
    )
  }
  
  if (candidates.length === 0) {
    return (
      <div className="text-center py-8">
        <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">No candidates found for this job</p>
        <p className="text-gray-400 text-sm">Add candidates to get started</p>
      </div>
    )
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Candidate
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Experience
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {candidates.map((candidate, index) => (
              <motion.tr
                key={candidate.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="hover:bg-gray-50 transition-colors duration-200"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{candidate.name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    <div className="text-sm text-gray-900">{candidate.email}</div>
                    <div className="text-sm text-gray-500">{candidate.phone}</div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">{candidate.experience || 'N/A'}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(candidate.status)}`}>
                    {candidate.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewCandidate(candidate.id)}
                      className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                    >
                      <Eye className="h-4 w-4" /> 
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(candidate)}
                      className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Update Candidate Status Modal */}
      <AnimatePresence>
        {showUpdateStatusModal && selectedCandidate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-200"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Update Candidate Status
                </h3>
                <button
                  onClick={() => setShowUpdateStatusModal(false)}
                  className="inline-flex items-center justify-center p-2 border border-gray-300 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-all duration-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Candidate Name</label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedCandidate.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Status</label>
                  <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(selectedCandidate.status)}`}>
                    {selectedCandidate.status}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Status</label>
                  <select
                    value={newStatus}
                    onChange={e => setNewStatus(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="applied">Applied</option>
                    <option value="in_progress">In Progress</option>
                    <option value="interviewed">Interviewed</option>
                    <option value="selected">Selected</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    rows="3"
                    placeholder="Add any notes about this candidate..."
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowUpdateStatusModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-lg transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateCandidateStatus}
                    className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-all duration-200"
                  >
                    Update Status
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Candidate View Modal */}
      <CandidateViewModal
        candidate={selectedCandidate}
        open={showCandidateViewModal}
        onClose={() => {
          setShowCandidateViewModal(false);
          setSelectedCandidate(null);
        }}
        onUpdate={fetchCandidates}
      />
    </>
  )
}

// Add Candidate Form Component
const AddCandidateForm = ({ formData, setFormData, onSave }) => {
  const handleChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }))
  const handleExperienceChange = (index, field, value) => {
    setFormData(prev => {
      const newExperienceEntries = [...(prev.experience_entries || [])]
      if (!newExperienceEntries[index]) {
        newExperienceEntries[index] = {
          organization: '', end_client: '', project: '', start_month_year: '', end_month_year: '', technology_tools: ''
        }
      }
      newExperienceEntries[index][field] = value
      return { ...prev, experience_entries: newExperienceEntries }
    })
  }
  const addExperienceEntry = () => {
    setFormData(prev => ({
      ...prev,
      experience_entries: [...(prev.experience_entries || []), {
        organization: '', end_client: '', project: '', start_month_year: '', end_month_year: '', technology_tools: ''
      }]
    }))
  }
  const removeExperienceEntry = (index) => {
    setFormData(prev => ({
      ...prev,
      experience_entries: prev.experience_entries.filter((_, i) => i !== index)
    }))
  }

  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto">
      {/* Required Fields */}
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="bg-blue-50 border border-blue-100 rounded-xl p-6 shadow-sm"
      >
        <h4 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
          <Users className="h-5 w-5" />
          Required Information *
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={e => handleChange('name', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
            <input
              type="email"
              value={formData.email || ''}
              onChange={e => handleChange('email', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
            <input
              type="tel"
              value={formData.phone || ''}
              onChange={e => handleChange('phone', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">PAN Number</label>
            <input
              type="text"
              value={formData.pan_number || ''}
              onChange={e => handleChange('pan_number', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="ABCDE1234F"
            />
          </div>
        </div>
      </motion.div>

      {/* Location and Experience */}
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="bg-gray-50 border border-gray-100 rounded-xl p-6 shadow-sm"
      >
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Location & Experience
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Current Location</label>
            <input
              type="text"
              value={formData.current_location || ''}
              onChange={e => handleChange('current_location', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="e.g., Bangalore, Karnataka"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hometown</label>
            <input
              type="text"
              value={formData.hometown || ''}
              onChange={e => handleChange('hometown', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="e.g., Chennai, Tamil Nadu"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Total Experience</label>
            <input
              type="text"
              value={formData.total_experience || ''}
              onChange={e => handleChange('total_experience', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="e.g., 5 years"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Relevant Experience</label>
            <input
              type="text"
              value={formData.relevant_experience || ''}
              onChange={e => handleChange('relevant_experience', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="e.g., 3 years in React"
            />
          </div>
        </div>
      </motion.div>

      {/* Education */}
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="bg-green-50 border border-green-100 rounded-xl p-6 shadow-sm"
      >
        <h4 className="text-lg font-semibold text-green-900 mb-4 flex items-center gap-2">
          <Briefcase className="h-5 w-5" />
          Education Details
        </h4>
        <div className="space-y-6">
          

          {/* Class X */}
          <div>
            <h5 className="text-md font-medium text-green-800 mb-3">Class X</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Institute/School Name</label>
                <input
                  type="text"
                  value={formData.education_x_institute || ''}
                  onChange={e => handleChange('education_x_institute', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="e.g., St. Mary's High School"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Percentage/CGPA</label>
                <input
                  type="text"
                  value={formData.education_x_percentage || ''}
                  onChange={e => handleChange('education_x_percentage', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="e.g., 85%"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Joining Month/Year</label>
                <DatePicker
                  selected={formData.education_x_start_date ? new Date(formData.education_x_start_date) : null}
                  onChange={date => handleChange('education_x_start_date', date)}
                  dateFormat="MM/yyyy"
                  showMonthYearPicker
                  showFullMonthYearPicker
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholderText="Select month and year"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ending Month/Year</label>
                <DatePicker
                  selected={formData.education_x_end_date ? new Date(formData.education_x_end_date) : null}
                  onChange={date => handleChange('education_x_end_date', date)}
                  dateFormat="MM/yyyy"
                  showMonthYearPicker
                  showFullMonthYearPicker
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholderText="Select month and year"
                />
              </div>
            </div>
          </div>

          {/* Class XII */}
          <div>
            <h5 className="text-md font-medium text-green-800 mb-3">Class XII</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Institute/School Name</label>
                <input
                  type="text"
                  value={formData.education_xii_institute || ''}
                  onChange={e => handleChange('education_xii_institute', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="e.g., St. Joseph's College"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Percentage/CGPA</label>
                <input
                  type="text"
                  value={formData.education_xii_percentage || ''}
                  onChange={e => handleChange('education_xii_percentage', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="e.g., 90%"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Joining Month/Year</label>
                <DatePicker
                  selected={formData.education_xii_start_date ? new Date(formData.education_xii_start_date) : null}
                  onChange={date => handleChange('education_xii_start_date', date)}
                  dateFormat="MM/yyyy"
                  showMonthYearPicker
                  showFullMonthYearPicker
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholderText="Select month and year"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ending Month/Year</label>
                <DatePicker
                  selected={formData.education_xii_end_date ? new Date(formData.education_xii_end_date) : null}
                  onChange={date => handleChange('education_xii_end_date', date)}
                  dateFormat="MM/yyyy"
                  showMonthYearPicker
                  showFullMonthYearPicker
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholderText="Select month and year"
                />
              </div>
            </div>
          </div>

          {/* Degree */}
          <div>
            <h5 className="text-md font-medium text-green-800 mb-3">Degree</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Degree Name</label>
                <input
                  type="text"
                  value={formData.education_degree_name || ''}
                  onChange={e => handleChange('education_degree_name', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="e.g., Bachelor of Technology"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Institute/University Name</label>
                <input
                  type="text"
                  value={formData.education_degree_institute || ''}
                  onChange={e => handleChange('education_degree_institute', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="e.g., Indian Institute of Technology"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Percentage/CGPA</label>
                <input
                  type="text"
                  value={formData.education_degree_percentage || ''}
                  onChange={e => handleChange('education_degree_percentage', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="e.g., 8.5/10"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Joining Month/Year</label>
                <DatePicker
                  selected={formData.education_degree_start_date ? new Date(formData.education_degree_start_date) : null}
                  onChange={date => handleChange('education_degree_start_date', date)}
                  dateFormat="MM/yyyy"
                  showMonthYearPicker
                  showFullMonthYearPicker
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholderText="Select month and year"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ending Month/Year</label>
                <DatePicker
                  selected={formData.education_degree_end_date ? new Date(formData.education_degree_end_date) : null}
                  onChange={date => handleChange('education_degree_end_date', date)}
                  dateFormat="MM/yyyy"
                  showMonthYearPicker
                  showFullMonthYearPicker
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholderText="Select month and year"
                />
              </div>
            </div>
          </div>
        </div>  
      </motion.div>

      {/* Work Experience */}
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="bg-orange-50 border border-orange-100 rounded-xl p-6 shadow-sm"
      >
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-semibold text-orange-900 flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Work Experience
          </h4>
          <button
            onClick={addExperienceEntry}
            className="inline-flex items-center px-3 py-2 border border-orange-200 text-sm rounded-lg text-orange-700 bg-orange-100 hover:bg-orange-200 transition-all duration-200"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Experience
          </button>
        </div>
        
        <div className="space-y-6">
          {formData.experience_entries?.map((entry, index) => (
            <div key={index} className="relative bg-white p-4 rounded-xl border border-orange-100">
              <button
                onClick={() => removeExperienceEntry(index)}
                className="absolute top-4 right-4 p-1 text-red-500 hover:text-red-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Organization</label>
                  <input
                    type="text"
                    value={entry.organization || ''}
                    onChange={e => handleExperienceChange(index, 'organization', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Client</label>
                  <input
                    type="text"
                    value={entry.end_client || ''}
                    onChange={e => handleExperienceChange(index, 'end_client', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Project</label>
                  <input
                    type="text"
                    value={entry.project || ''}
                    onChange={e => handleExperienceChange(index, 'project', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Technology/Tools</label>
                  <input
                    type="text"
                    value={entry.technology_tools || ''}
                    onChange={e => handleExperienceChange(index, 'technology_tools', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input
                    type="month"
                    value={entry.start_month_year || ''}
                    onChange={e => handleExperienceChange(index, 'start_month_year', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                  <input
                    type="month"
                    value={entry.end_month_year || ''}
                    onChange={e => handleExperienceChange(index, 'end_month_year', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Additional Details */}
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 shadow-sm"
      >
        <h4 className="text-lg font-semibold text-indigo-900 mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Additional Details
        </h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Certifications</label>
            <textarea
              value={formData.certifications || ''}
              onChange={e => handleChange('certifications', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              rows="3"
              placeholder="List any relevant certifications..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Publications</label>
            <textarea
              value={formData.publications || ''}
              onChange={e => handleChange('publications', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              rows="3"
              placeholder="List any publications..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">References</label>
            <textarea
              value={formData.references || ''}
              onChange={e => handleChange('references', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              rows="3"
              placeholder="Add any professional references..."
            />
          </div>
        </div>
      </motion.div>
      
      {/* Legacy Fields */}
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="bg-gray-50 border border-gray-100 rounded-xl p-6 shadow-sm"
      >
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Profile Links
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn Profile</label>
            <input
              type="url"
              value={formData.linkedin || ''}
              onChange={e => handleChange('linkedin', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="https://linkedin.com/in/username"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">GitHub Profile</label>
            <input
              type="url"
              value={formData.github || ''}
              onChange={e => handleChange('github', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="https://github.com/username"
            />
          </div>
        </div>
      </motion.div>
      
      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <button
          onClick={() => setFormData({
            name: '', email: '', phone: '', pan_number: '', current_location: '', hometown: '',
            total_experience: '', relevant_experience: '',
            education_x_institute: '', education_x_start_date: '', education_x_end_date: '', education_x_percentage: '',
            education_xii_institute: '', education_xii_start_date: '', education_xii_end_date: '', education_xii_percentage: '',
            education_degree_name: '', education_degree_institute: '', education_degree_start_date: '', education_degree_end_date: '', education_degree_percentage: '',
            education_x: '', education_xii: '', education_degree: '', education_percentage: '', education_duration: '',
            experience_entries: [], certifications: '', publications: '', references: '', linkedin: '', github: ''
          })}
          className="px-4 py-2 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-lg transition-all duration-200"
        >
          Reset
        </button>
        <button
          onClick={onSave}
          className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-all duration-200"
        >
          Save Candidate
        </button>
      </div>
    </div>
  )
}

export default HRJobs