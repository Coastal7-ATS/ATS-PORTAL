import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, Edit, Save, X } from 'lucide-react'
import api from '../../services/api'
import { toast } from 'react-toastify'

// Animation variants for modals and cards
const modalVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 200, damping: 20 } },
  exit: { opacity: 0, y: 40, scale: 0.98, transition: { duration: 0.2 } }
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
}

const AdminCandidates = () => {
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [statusForm, setStatusForm] = useState({ status: '', notes: '' })
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({})

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [filterAppliedFor, setFilterAppliedFor] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [appliedSearchTerm, setAppliedSearchTerm] = useState('')
  const [appliedFilterAppliedFor, setAppliedFilterAppliedFor] = useState('')
  const [appliedFilterStatus, setAppliedFilterStatus] = useState('')

  useEffect(() => {
    fetchCandidates()
  }, [])

  const fetchCandidates = async () => {
    try {
      const response = await api.get('/admin/candidates')
      setCandidates(response.data)
    } catch (error) {
      console.error('Error fetching candidates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async () => {
    try {
      await api.put(`/candidates/${selectedCandidate.id}/status?status=${statusForm.status}&notes=${statusForm.notes}`)
      toast.success('Candidate status updated successfully')
      setShowStatusModal(false)
      setSelectedCandidate(null)
      setStatusForm({ status: '', notes: '' })
      fetchCandidates()
    } catch (error) {
      toast.error('Failed to update candidate status')
    }
  }

  const handleEditCandidate = async () => {
    try {
      const cleanedData = { ...editForm }
      Object.keys(cleanedData).forEach(key => {
        if (cleanedData[key] === '') {
          cleanedData[key] = null
        }
      })
      await api.put(`/candidates/${selectedCandidate.id}`, cleanedData)
      toast.success('Candidate updated successfully')
      setIsEditing(false)
      setEditForm({})
      // Fix: Do not close the modal on save, just exit edit mode and refresh candidate details
      const response = await api.get(`/candidates/${selectedCandidate.id}`)
      setSelectedCandidate(response.data)
      fetchCandidates()
    } catch (error) {
      console.error('Update error:', error)
      toast.error('Failed to update candidate')
    }
  }

  const startEditing = () => {
    setEditForm({
      name: selectedCandidate.name || '',
      email: selectedCandidate.email || '',
      phone: selectedCandidate.phone || '',
      title_position: selectedCandidate.title_position || '',
      pan_number: selectedCandidate.pan_number || '',
      passport_number: selectedCandidate.passport_number || '',
      current_location: selectedCandidate.current_location || '',
      hometown: selectedCandidate.hometown || '',
      preferred_interview_location: selectedCandidate.preferred_interview_location || '',
      interview_location: selectedCandidate.interview_location || '',
      availability_interview: selectedCandidate.availability_interview || '',
      roc_check_done: selectedCandidate.roc_check_done || '',
      applied_for_ibm_before: selectedCandidate.applied_for_ibm_before || '',
      is_organization_employee: selectedCandidate.is_organization_employee || '',
      date_of_joining_organization: selectedCandidate.date_of_joining_organization || '',
      client_deployment_details: selectedCandidate.client_deployment_details || [],
      interested_in_relocation: selectedCandidate.interested_in_relocation || '',
      willingness_work_shifts: selectedCandidate.willingness_work_shifts || '',
      role_applied_for: selectedCandidate.role_applied_for || '',
      reason_for_job_change: selectedCandidate.reason_for_job_change || '',
      current_role: selectedCandidate.current_role || '',
      notice_period: selectedCandidate.notice_period || '',
      payrolling_company_name: selectedCandidate.payrolling_company_name || '',
      education_authenticated_ugc_check: selectedCandidate.education_authenticated_ugc_check || '',
      total_experience: selectedCandidate.total_experience || '',
      relevant_experience: selectedCandidate.relevant_experience || '',
      general_attitude_assessment: selectedCandidate.general_attitude_assessment || null,
      oral_communication_assessment: selectedCandidate.oral_communication_assessment || null,
      general_attitude_comments: selectedCandidate.general_attitude_comments || '',
      oral_communication_comments: selectedCandidate.oral_communication_comments || '',
      sme_name: selectedCandidate.sme_name || '',
      sme_email: selectedCandidate.sme_email || '',
      sme_mobile: selectedCandidate.sme_mobile || '',
      do_not_know_candidate: selectedCandidate.do_not_know_candidate || '',
      evaluated_resume_with_jd: selectedCandidate.evaluated_resume_with_jd || '',
      personally_spoken_to_candidate: selectedCandidate.personally_spoken_to_candidate || '',
      available_for_clarification: selectedCandidate.available_for_clarification || '',
      salary_slip_verified: selectedCandidate.salary_slip_verified || '',
      offer_letter_verified: selectedCandidate.offer_letter_verified || '',
      test_mail_sent_to_organization: selectedCandidate.test_mail_sent_to_organization || '',
      talent_acquisition_consultant: selectedCandidate.talent_acquisition_consultant || '',
      date_of_assessment: selectedCandidate.date_of_assessment || '',
      education_x_institute: selectedCandidate.education_x_institute || '',
      education_x_start_date: selectedCandidate.education_x_start_date || '',
      education_x_end_date: selectedCandidate.education_x_end_date || '',
      education_x_percentage: selectedCandidate.education_x_percentage || '',
      education_x_year_completion: selectedCandidate.education_x_year_completion || '',
      education_xii_institute: selectedCandidate.education_xii_institute || '',
      education_xii_start_date: selectedCandidate.education_xii_start_date || '',
      education_xii_end_date: selectedCandidate.education_xii_end_date || '',
      education_xii_percentage: selectedCandidate.education_xii_percentage || '',
      education_xii_year_completion: selectedCandidate.education_xii_year_completion || '',
      education_degree_name: selectedCandidate.education_degree_name || '',
      education_degree_institute: selectedCandidate.education_degree_institute || '',
      education_degree_start_date: selectedCandidate.education_degree_start_date || '',
      education_degree_end_date: selectedCandidate.education_degree_end_date || '',
      education_degree_percentage: selectedCandidate.education_degree_percentage || '',
      education_degree_year_completion: selectedCandidate.education_degree_year_completion || '',
      education_degree_duration: selectedCandidate.education_degree_duration || '',
      education_additional_certifications: selectedCandidate.education_additional_certifications || '',
      education_x: selectedCandidate.education_x || '',
      education_xii: selectedCandidate.education_xii || '',
      education_degree: selectedCandidate.education_degree || '',
      education_percentage: selectedCandidate.education_percentage || '',
      education_duration: selectedCandidate.education_duration || '',
      work_experience_entries: selectedCandidate.work_experience_entries || [],
      experience_entries: selectedCandidate.experience_entries || [],
      skill_assessments: selectedCandidate.skill_assessments || [],
      certifications: selectedCandidate.certifications || '',
      publications_title: selectedCandidate.publications_title || '',
      publications_date: selectedCandidate.publications_date || '',
      publications_publisher: selectedCandidate.publications_publisher || '',
      publications_description: selectedCandidate.publications_description || '',
      references: selectedCandidate.references || '',
      linkedin: selectedCandidate.linkedin || '',
      github: selectedCandidate.github || '',
      experience: selectedCandidate.experience || '',
      education: selectedCandidate.education || '',
      skills: selectedCandidate.skills || '',
      projects: selectedCandidate.projects || '',
    })
    setIsEditing(true)
  }

  const cancelEditing = () => {
    setIsEditing(false)
    setEditForm({})
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'selected':
        return 'badge-success'
      case 'rejected':
        return 'badge-danger'
      case 'interviewed':
        return 'badge-info'
      case 'in_progress':
        return 'badge-warning'
      case 'applied':
        return 'badge-warning'
      default:
        return 'badge-secondary'
    }
  }

  const getAssessmentScoreText = (score) => {
    switch (score) {
      case '1':
        return 'Below Average'
      case '2':
        return 'Average'
      case '3':
        return 'Good'
      case '4':
        return 'Excellent'
      default:
        return ''
    }
  }

  // Clean, simple field renderer with spacing and white background
  const renderField = (label, value, isLink = false, fieldType = 'text', options = []) => {
    // Map display labels to actual field names
    const fieldNameMap = {
      'Salary Slip Verified': 'salary_slip_verified',
      'Offer Letter Verified': 'offer_letter_verified',
      'Have you sent test mail to the resources current organization official email ID to check the authenticity': 'test_mail_sent_to_organization',
      'Do Not Know Candidate': 'do_not_know_candidate',
      'Evaluated Resume with JD': 'evaluated_resume_with_jd',
      'Personally Spoken to Candidate': 'personally_spoken_to_candidate',
      'Available for Clarification': 'available_for_clarification',
      'ROC Check Done': 'roc_check_done',
      'Applied for IBM Before': 'applied_for_ibm_before',
      'Is Organization Employee': 'is_organization_employee',
      'Is the resource employee of your organization': 'is_organization_employee',
      'Date of Joining Organization': 'date_of_joining_organization',
      'Interested in Relocation': 'interested_in_relocation',
      'Willingness Work Shifts': 'willingness_work_shifts',
      'Willingness to Work Shifts': 'willingness_work_shifts',
      'Role Applied For': 'role_applied_for',
      'Reason for Job Change': 'reason_for_job_change',
      'Current Role': 'current_role',
      'Notice Period': 'notice_period',
      'Payrolling Company Name': 'payrolling_company_name',
      'Education Authenticated UGC Check': 'education_authenticated_ugc_check',
      'Have you authenticated resources education history with fake list of universities published by UGC': 'education_authenticated_ugc_check',
      'Total Experience': 'total_experience',
      'Relevant Experience': 'relevant_experience',
      'SME Name': 'sme_name',
      'SME Email': 'sme_email',
      'SME Mobile': 'sme_mobile',
      'Talent Acquisition Consultant': 'talent_acquisition_consultant',
      'Date of Assessment': 'date_of_assessment',
      'Title Position': 'title_position',
      'Title/Position': 'title_position',
      'PAN Number': 'pan_number',
      'Passport Number': 'passport_number',
      'Current Location': 'current_location',
      'Hometown': 'hometown',
      'Preferred Interview Location': 'preferred_interview_location',
      'Interview Location': 'interview_location',
      'Availability Interview': 'availability_interview',
      'Availability for Interview': 'availability_interview',
      'General Attitude Comments': 'general_attitude_comments',
      'Oral Communication Comments': 'oral_communication_comments',
      'Additional Certifications': 'education_additional_certifications',
      'Duration': 'education_degree_duration'
    }
    const fieldName = fieldNameMap[label] || label.toLowerCase().replace(/\s+/g, '_')

    if (isEditing) {
      if (fieldType === 'dropdown') {
        return (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <select
              value={editForm[fieldName] || ''}
              onChange={(e) => setEditForm({ ...editForm, [fieldName]: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white transition"
            >
              <option value="">Select...</option>
              {options.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        )
      }
      if (fieldType === 'date') {
        return (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <input
              type="date"
              value={editForm[fieldName] || ''}
              onChange={(e) => setEditForm({ ...editForm, [fieldName]: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white transition"
            />
          </div>
        )
      }
      return (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
          <input
            type={fieldType}
            value={editForm[fieldName] || ''}
            onChange={(e) => setEditForm({ ...editForm, [fieldName]: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white transition"
          />
        </div>
      )
    }
    return (
      <div className="mb-2">
        <span className="font-medium text-gray-700">{label}:</span>
        <span className="ml-2 text-gray-900">
          {isLink && value ? (
            <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{value}</a>
          ) : (value || 'Not provided')}
        </span>
      </div>
    )
  }

  // Education section with clean card and spacing
  const renderEducationSection = () => {
    if (isEditing) {
      return (
        <div className="space-y-4">
          <h4 className="font-semibold text-lg text-gray-800 border-b pb-2">Education Details</h4>
          {/* Class X */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <h5 className="font-medium text-gray-700 mb-3">Class X</h5>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Institute</label>
                <input
                  type="text"
                  value={editForm.education_x_institute || ''}
                  onChange={(e) => setEditForm({ ...editForm, education_x_institute: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Percentage</label>
                <input
                  type="text"
                  value={editForm.education_x_percentage || ''}
                  onChange={(e) => setEditForm({ ...editForm, education_x_percentage: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="text"
                  value={editForm.education_x_start_date || ''}
                  onChange={(e) => setEditForm({ ...editForm, education_x_start_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="text"
                  value={editForm.education_x_end_date || ''}
                  onChange={(e) => setEditForm({ ...editForm, education_x_end_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white transition"
                />
              </div>
            </div>
          </div>
          {/* Class XII */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <h5 className="font-medium text-gray-700 mb-3">Class XII</h5>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Institute</label>
                <input
                  type="text"
                  value={editForm.education_xii_institute || ''}
                  onChange={(e) => setEditForm({ ...editForm, education_xii_institute: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Percentage</label>
                <input
                  type="text"
                  value={editForm.education_xii_percentage || ''}
                  onChange={(e) => setEditForm({ ...editForm, education_xii_percentage: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="text"
                  value={editForm.education_xii_start_date || ''}
                  onChange={(e) => setEditForm({ ...editForm, education_xii_start_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="text"
                  value={editForm.education_xii_end_date || ''}
                  onChange={(e) => setEditForm({ ...editForm, education_xii_end_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white transition"
                />
              </div>
            </div>
          </div>
          {/* Degree */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <h5 className="font-medium text-gray-700 mb-3">Degree</h5>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Degree Name</label>
                <input
                  type="text"
                  value={editForm.education_degree_name || ''}
                  onChange={(e) => setEditForm({ ...editForm, education_degree_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Institute</label>
                <input
                  type="text"
                  value={editForm.education_degree_institute || ''}
                  onChange={(e) => setEditForm({ ...editForm, education_degree_institute: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Percentage</label>
                <input
                  type="text"
                  value={editForm.education_degree_percentage || ''}
                  onChange={(e) => setEditForm({ ...editForm, education_degree_percentage: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="text"
                  value={editForm.education_degree_start_date || ''}
                  onChange={(e) => setEditForm({ ...editForm, education_degree_start_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="text"
                  value={editForm.education_degree_end_date || ''}
                  onChange={(e) => setEditForm({ ...editForm, education_degree_end_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                <input
                  type="text"
                  value={editForm.education_degree_duration || ''}
                  onChange={(e) => setEditForm({ ...editForm, education_degree_duration: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Certifications</label>
                <input
                  type="text"
                  value={editForm.education_additional_certifications || ''}
                  onChange={(e) => setEditForm({ ...editForm, education_additional_certifications: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white transition"
                />
              </div>
            </div>
          </div>
        </div>
      )
    }
    // View mode
    return (
      <div className="space-y-4">
        <h4 className="font-semibold text-lg text-gray-800 border-b pb-2">Education Details</h4>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <h5 className="font-medium text-gray-700 mb-2">Class X</h5>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="font-medium">Institute:</span> {selectedCandidate.education_x_institute || 'Not provided'}</div>
            <div><span className="font-medium">Percentage:</span> {selectedCandidate.education_x_percentage || 'Not provided'}</div>
            <div><span className="font-medium">Start Date:</span> {selectedCandidate.education_x_start_date || 'Not provided'}</div>
            <div><span className="font-medium">End Date:</span> {selectedCandidate.education_x_end_date || 'Not provided'}</div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <h5 className="font-medium text-gray-700 mb-2">Class XII</h5>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="font-medium">Institute:</span> {selectedCandidate.education_xii_institute || 'Not provided'}</div>
            <div><span className="font-medium">Percentage:</span> {selectedCandidate.education_xii_percentage || 'Not provided'}</div>
            <div><span className="font-medium">Start Date:</span> {selectedCandidate.education_xii_start_date || 'Not provided'}</div>
            <div><span className="font-medium">End Date:</span> {selectedCandidate.education_xii_end_date || 'Not provided'}</div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <h5 className="font-medium text-gray-700 mb-2">Degree</h5>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="font-medium">Degree Name:</span> {selectedCandidate.education_degree_name || 'Not provided'}</div>
            <div><span className="font-medium">Institute:</span> {selectedCandidate.education_degree_institute || 'Not provided'}</div>
            <div><span className="font-medium">Percentage:</span> {selectedCandidate.education_degree_percentage || 'Not provided'}</div>
            <div><span className="font-medium">Start Date:</span> {selectedCandidate.education_degree_start_date || 'Not provided'}</div>
            <div><span className="font-medium">End Date:</span> {selectedCandidate.education_degree_end_date || 'Not provided'}</div>
          </div>
        </div>
      </div>
    )
  }

  // --- SEARCH AND FILTER LOGIC ---

  // Get unique values for Applied For and Status for filter dropdowns
  const appliedForOptions = Array.from(
    new Set(candidates.map(c => c.applied_for || c.role_applied_for || '').filter(Boolean))
  )
  const statusOptions = Array.from(
    new Set(candidates.map(c => c.status || '').filter(Boolean))
  )

  // Filtering and searching
  const filteredCandidates = candidates.filter(candidate => {
    // Search: check if any of the main fields contain the search term (case-insensitive)
    const search = appliedSearchTerm.trim().toLowerCase()
    const matchesSearch =
      !search ||
      [
        candidate.name,
        candidate.email,
        candidate.phone,
        candidate.applied_for,
        candidate.role_applied_for,
        candidate.experience,
        candidate.education,
        candidate.skills,
        candidate.projects,
        candidate.linkedin,
        candidate.github,
        candidate.status
      ]
        .map(val => (val || '').toString().toLowerCase())
        .some(val => val.includes(search))

    // Filter: applied for
    const matchesAppliedFor =
      !appliedFilterAppliedFor ||
      (candidate.applied_for || candidate.role_applied_for || '') === appliedFilterAppliedFor

    // Filter: status
    const matchesStatus =
      !appliedFilterStatus ||
      (candidate.status || '') === appliedFilterStatus

    return matchesSearch && matchesAppliedFor && matchesStatus
  })

  const handleApplySearch = () => {
    setAppliedSearchTerm(searchTerm)
  }

  const handleApplyFilters = () => {
    setAppliedFilterAppliedFor(filterAppliedFor)
    setAppliedFilterStatus(filterStatus)
  }

  const handleClearAll = () => {
    setSearchTerm('')
    setFilterAppliedFor('')
    setFilterStatus('')
    setAppliedSearchTerm('')
    setAppliedFilterAppliedFor('')
    setAppliedFilterStatus('')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8 px-2 md:px-8 py-6 bg-white-50 min-h-screen">
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="mb-2"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-1">All Candidates</h1>
        <p className="text-gray-600">View all candidate applications</p>
      </motion.div>

      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="bg-white rounded-2xl border border-gray-200 shadow-md p-6 transition-all"
      >
        {/* Search and Filter Controls */}
        <div className="space-y-4 mb-6">
          {/* Search Row */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search candidates..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white transition"
              />
            </div>
            <button
              onClick={handleApplySearch}
              className="btn-primary px-6"
            >
              Search
            </button>
          </div>
          
          {/* Filter Row */}
          <div className="flex flex-col md:flex-row gap-4">
            <select
              value={filterAppliedFor}
              onChange={e => setFilterAppliedFor(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white transition"
            >
              <option value="">All Applied For</option>
              {appliedForOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white transition"
            >
              <option value="">All Status</option>
              {statusOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <button
              onClick={handleApplyFilters}
              className="btn-secondary px-6"
            >
              Apply Filters
            </button>
            <button
              onClick={handleClearAll}
              className="btn-ghost px-6"
            >
              Clear All
            </button>
          </div>
          
          {(appliedFilterAppliedFor || appliedFilterStatus || appliedSearchTerm) && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Active filters:</span>
              {appliedSearchTerm && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Search: {appliedSearchTerm}</span>
              )}
              {appliedFilterAppliedFor && (
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Applied For: {appliedFilterAppliedFor}</span>
              )}
              {appliedFilterStatus && (
                <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">Status: {appliedFilterStatus}</span>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-500">{filteredCandidates.length} candidates found</span>
        </div>
        {filteredCandidates.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No candidates found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-modern">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Applied For</th>
                  <th>Experience</th>
                  <th>Education</th>
                  <th>Skills</th>
                  <th>Projects</th>
                  <th>LinkedIn</th>
                  <th>GitHub</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCandidates.map((candidate) => (
                  <motion.tr
                    key={candidate.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <td className="font-medium text-slate-900">{candidate.name}</td>
                    <td className="text-slate-900">{candidate.email}</td>
                    <td className="text-slate-900">{candidate.phone}</td>
                    <td className="text-slate-900">{candidate.applied_for || candidate.role_applied_for || 'N/A'}</td>
                    <td className="text-slate-900">{candidate.experience}</td>
                    <td className="text-slate-900">{candidate.education}</td>
                    <td className="text-slate-900">{candidate.skills}</td>
                    <td className="text-slate-900">{candidate.projects}</td>
                    <td>
                      {candidate.linkedin && (
                        <a href={candidate.linkedin} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700 underline">LinkedIn</a>
                      )}
                    </td>
                    <td>
                      {candidate.github && (
                        <a href={candidate.github} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700 underline">GitHub</a>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${getStatusColor(candidate.status)}`}>
                        {candidate.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setSelectedCandidate(candidate); setShowViewModal(true) }}
                          className="p-2 rounded-lg text-primary-600 hover:bg-primary-50 hover:text-primary-700 transition-colors duration-200"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => { setSelectedCandidate(candidate); setStatusForm({ status: candidate.status, notes: candidate.notes || '' }); setShowStatusModal(true) }}
                          className="p-2 rounded-lg text-success-600 hover:bg-success-50 hover:text-success-700 transition-colors duration-200"
                          title="Edit Status"
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

      {/* View Candidate Modal */}
      <AnimatePresence>
        {showViewModal && selectedCandidate && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.div
              className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200"
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            >
              <div className="sticky top-0 bg-white border-b border-gray-100 p-6 rounded-t-2xl z-10">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold text-gray-900">Candidate Details - {selectedCandidate.name}</h3>
                  <div className="flex space-x-2">
                    {!isEditing && (
                      <>
                        <button
                          onClick={startEditing}
                          className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                          <Edit className="h-4 w-4" /> Edit
                        </button>
                        <button
                          onClick={() => setShowViewModal(false)}
                          className="flex items-center gap-1 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                          title="Close"
                        >
                          <X className="h-4 w-4" /> Close
                        </button>
                      </>
                    )}
                    {isEditing && (
                      <>
                        <button
                          onClick={handleEditCandidate}
                          className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                          <Save className="h-4 w-4" /> Save
                        </button>
                        <button
                          onClick={() => {
                            cancelEditing();
                            // Fix: Only exit edit mode, do not close the modal
                            // setShowViewModal(false); // Remove this line to fix the issue
                            setEditForm({});
                          }}
                          className="flex items-center gap-1 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                        >
                          <X className="h-4 w-4" /> Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-8">
                {/* Personal Information */}
                <motion.div
                  className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <h4 className="font-semibold text-lg text-gray-800 border-b pb-2 mb-4">Personal Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {renderField('Name', selectedCandidate.name)}
                    {renderField('Title/Position', selectedCandidate.title_position || selectedCandidate.job_title)}
                    {renderField('Email', selectedCandidate.email)}
                    {renderField('Phone', selectedCandidate.phone)}
                    {renderField('PAN Number', selectedCandidate.pan_number)}
                    {renderField('Passport Number', selectedCandidate.passport_number)}
                    {renderField('Current Location', selectedCandidate.current_location)}
                    {renderField('Hometown', selectedCandidate.hometown)}
                    {renderField('Preferred Interview Location', selectedCandidate.preferred_interview_location)}
                    {renderField('Interview Location', selectedCandidate.interview_location)}
                    {renderField('Availability for Interview', selectedCandidate.availability_interview)}
                  </div>
                </motion.div>

                {/* General Information */}
                <motion.div
                  className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.05 }}
                >
                  <h4 className="font-semibold text-lg text-gray-800 border-b pb-2 mb-4">General Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {renderField('ROC Check Done', selectedCandidate.roc_check_done, false, 'dropdown', [
                      { value: 'YES', label: 'Yes' },
                      { value: 'NO', label: 'No' }
                    ])}
                    {renderField('Applied for IBM Before', selectedCandidate.applied_for_ibm_before, false, 'dropdown', [
                      { value: 'YES', label: 'Yes' },
                      { value: 'NO', label: 'No' }
                    ])}
                    {renderField('Is Organization Employee', selectedCandidate.is_organization_employee, false, 'dropdown', [
                      { value: 'YES', label: 'Yes' },
                      { value: 'NO', label: 'No' }
                    ])}
                    {(selectedCandidate.is_organization_employee === 'YES' ||
                      selectedCandidate.is_organization_employee === 'Yes' ||
                      selectedCandidate.is_organization_employee === 'yes') && (
                      <div className="col-span-2 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded mb-2">
                        <div className="mb-3">
                          <label className="block text-sm font-semibold text-gray-700 mb-1">
                            If "YES" Please answer below:
                          </label>
                        </div>
                        <div className="mb-3">
                          {renderField(
                            'What is the date of joining of the resource in your organization',
                            selectedCandidate.date_of_joining_organization,
                            false,
                            'date'
                          )}
                        </div>
                        <div className="mb-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Which client the resource has been deployed through your organization:
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {renderField(
                              'Client 1',
                              Array.isArray(selectedCandidate.client_deployment_details) && selectedCandidate.client_deployment_details.length > 0
                                ? selectedCandidate.client_deployment_details[0]
                                : ''
                            )}
                            {renderField(
                              'Client 2',
                              Array.isArray(selectedCandidate.client_deployment_details) && selectedCandidate.client_deployment_details.length > 1
                                ? selectedCandidate.client_deployment_details[1]
                                : ''
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    {renderField('Interested in Relocation', selectedCandidate.interested_in_relocation, false, 'dropdown', [
                      { value: 'YES', label: 'Yes' },
                      { value: 'NO', label: 'No' }
                    ])}
                    {renderField('Willingness to Work Shifts', selectedCandidate.willingness_work_shifts, false, 'dropdown', [
                      { value: 'YES', label: 'Yes' },
                      { value: 'NO', label: 'No' }
                    ])}
                    {renderField('Role Applied For', selectedCandidate.role_applied_for || selectedCandidate.job_title)}
                    {renderField('Reason for Job Change', selectedCandidate.reason_for_job_change)}
                    {renderField('Current Role', selectedCandidate.current_role)}
                    {renderField('Have you authenticated resources education history with fake list of universities published by UGC', selectedCandidate.education_authenticated_ugc_check, false, 'dropdown', [
                      { value: 'YES', label: 'Yes' },
                      { value: 'NO', label: 'No' }
                    ])}
                    {renderField('Notice Period', selectedCandidate.notice_period)}
                    {renderField('Payrolling Company Name', selectedCandidate.payrolling_company_name)}
                  </div>
                </motion.div>

                {/* Experience Information */}
                <motion.div
                  className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <h4 className="font-semibold text-lg text-gray-800 border-b pb-2 mb-4">Experience Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {renderField('Total Experience', selectedCandidate.total_experience)}
                    {renderField('Relevant Experience', selectedCandidate.relevant_experience)}
                  </div>
                </motion.div>

                {/* Education Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.15 }}
                >
                  {renderEducationSection()}
                </motion.div>

                {/* Assessment Information */}
                <motion.div
                  className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                >
                  <h4 className="font-semibold text-lg text-gray-800 border-b pb-2 mb-4">Assessment Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {isEditing ? (
                      <>
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Assessment of candidate's general attitude (score 1 to 4)
                          </label>
                          <select
                            value={editForm.general_attitude_assessment ? editForm.general_attitude_assessment.toString() : ''}
                            onChange={(e) => setEditForm({ ...editForm, general_attitude_assessment: e.target.value ? parseInt(e.target.value) : null })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white transition"
                          >
                            <option value="">Select Score</option>
                            <option value="1">1 - Below Average</option>
                            <option value="2">2 - Average</option>
                            <option value="3">3 - Good</option>
                            <option value="4">4 - Excellent</option>
                          </select>
                        </div>
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Assessment of the candidate's oral communication skills (score 1 to 4)
                          </label>
                          <select
                            value={editForm.oral_communication_assessment ? editForm.oral_communication_assessment.toString() : ''}
                            onChange={(e) => setEditForm({ ...editForm, oral_communication_assessment: e.target.value ? parseInt(e.target.value) : null })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white transition"
                          >
                            <option value="">Select Score</option>
                            <option value="1">1 - Below Average</option>
                            <option value="2">2 - Average</option>
                            <option value="3">3 - Good</option>
                            <option value="4">4 - Excellent</option>
                          </select>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="mb-2">
                          <span className="font-medium text-gray-700">General Attitude:</span>
                          <span className="ml-2 text-gray-900">
                            {selectedCandidate.general_attitude_assessment
                              ? `${selectedCandidate.general_attitude_assessment} - ${getAssessmentScoreText(selectedCandidate.general_attitude_assessment)}`
                              : 'Not provided'}
                          </span>
                        </div>
                        <div className="mb-2">
                          <span className="font-medium text-gray-700">Oral Communication:</span>
                          <span className="ml-2 text-gray-900">
                            {selectedCandidate.oral_communication_assessment
                              ? `${selectedCandidate.oral_communication_assessment} - ${getAssessmentScoreText(selectedCandidate.oral_communication_assessment)}`
                              : 'Not provided'}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>

                {/* SME Information */}
                <motion.div
                  className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.25 }}
                >
                  <h4 className="font-semibold text-lg text-gray-800 border-b pb-2 mb-4">SME Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {renderField('SME Name', selectedCandidate.sme_name)}
                    {renderField('SME Email', selectedCandidate.sme_email)}
                    {renderField('SME Mobile', selectedCandidate.sme_mobile)}
                  </div>
                </motion.div>

                {/* SME Declaration */}
                <motion.div
                  className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                >
                  <h4 className="font-semibold text-lg text-gray-800 border-b pb-2 mb-4">SME Declaration</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {renderField('Do Not Know Candidate', selectedCandidate.do_not_know_candidate)}
                    {renderField('Evaluated Resume with JD', selectedCandidate.evaluated_resume_with_jd)}
                    {renderField('Personally Spoken to Candidate', selectedCandidate.personally_spoken_to_candidate)}
                    {renderField('Available for Clarification', selectedCandidate.available_for_clarification)}
                  </div>
                </motion.div>

                {/* Verification */}
                <motion.div
                  className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.35 }}
                >
                  <h4 className="font-semibold text-lg text-gray-800 border-b pb-2 mb-4">Verification</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {renderField('Salary Slip Verified', selectedCandidate.salary_slip_verified, false, 'dropdown', [
                      { value: 'YES', label: 'Yes' },
                      { value: 'NO', label: 'No' }
                    ])}
                    {renderField('Offer Letter Verified', selectedCandidate.offer_letter_verified, false, 'dropdown', [
                      { value: 'YES', label: 'Yes' },
                      { value: 'NO', label: 'No' }
                    ])}
                    {renderField('Have you sent test mail to the resources current organization official email ID to check the authenticity', selectedCandidate.test_mail_sent_to_organization, false, 'dropdown', [
                      { value: 'YES', label: 'Yes' },
                      { value: 'NO', label: 'No' }
                    ])}
                  </div>
                </motion.div>

                {/* Skills Assessment */}
                {selectedCandidate.skill_assessments && selectedCandidate.skill_assessments.length > 0 && (
                  <motion.div
                    className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.4 }}
                  >
                    <h4 className="font-semibold text-lg text-gray-800 border-b pb-2 mb-4">Skills Assessment</h4>
                    <div className="space-y-4">
                      {selectedCandidate.skill_assessments.map((skill, index) => (
                        <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div><span className="font-medium">Skill Name:</span> {skill.skill_name || 'Not provided'}</div>
                            <div><span className="font-medium">Years of Experience:</span> {skill.years_of_experience || 'Not provided'}</div>
                            <div><span className="font-medium">Last Used Year:</span> {skill.last_used_year || 'Not provided'}</div>
                            <div><span className="font-medium">Vendor SME Assessment Score:</span> {skill.vendor_sme_assessment_score || 'Not provided'}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Work Experience */}
                {selectedCandidate.work_experience_entries && selectedCandidate.work_experience_entries.length > 0 && (
                  <motion.div
                    className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.45 }}
                  >
                    <h4 className="font-semibold text-lg text-gray-800 border-b pb-2 mb-4">Work Experience</h4>
                    <div className="space-y-4">
                      {selectedCandidate.work_experience_entries.map((exp, index) => (
                        <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                          <h5 className="font-medium text-gray-700 mb-3">Organization {index + 1}</h5>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div><span className="font-medium">Organization:</span> {exp.organization || 'Not provided'}</div>
                            <div><span className="font-medium">End Client:</span> {exp.end_client || 'Not provided'}</div>
                            <div><span className="font-medium">Project:</span> {exp.project || 'Not provided'}</div>
                            <div><span className="font-medium">Start Date:</span> {exp.start_month_year || 'Not provided'}</div>
                            <div><span className="font-medium">End Date:</span> {exp.end_month_year || 'Not provided'}</div>
                            <div><span className="font-medium">Technology/Tools:</span> {exp.technology_tools || 'Not provided'}</div>
                            <div><span className="font-medium">Role/Designation:</span> {exp.role_designation || 'Not provided'}</div>
                            <div><span className="font-medium">Additional Information:</span> {exp.additional_information || 'Not provided'}</div>
                          </div>
                          {exp.responsibilities && exp.responsibilities.length > 0 && (
                            <div className="mt-3">
                              <span className="font-medium">Responsibilities:</span>
                              <ul className="list-disc list-inside mt-1 ml-4">
                                {exp.responsibilities.map((resp, respIndex) => (
                                  <li key={respIndex} className="text-sm">{resp}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Additional Information */}
                <motion.div
                  className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.5 }}
                >
                  <h4 className="font-semibold text-lg text-gray-800 border-b pb-2 mb-4">Additional Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {renderField('Skills', selectedCandidate.skills)}
                    {renderField('Projects', selectedCandidate.projects)}
                    {renderField('Certifications', selectedCandidate.certifications)}
                    {renderField('Publications Title', selectedCandidate.publications_title)}
                    {renderField('Publications Date', selectedCandidate.publications_date)}
                    {renderField('Publications Publisher', selectedCandidate.publications_publisher)}
                    {renderField('Publications Description', selectedCandidate.publications_description)}
                    {renderField('References', selectedCandidate.references)}
                    {renderField('LinkedIn', selectedCandidate.linkedin, true)}
                    {renderField('GitHub', selectedCandidate.github, true)}
                  </div>
                </motion.div>

                {/* Application Status */}
                <motion.div
                  className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.55 }}
                >
                  <h4 className="font-semibold text-lg text-gray-800 border-b pb-2 mb-4">Application Status</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="mb-2">
                      <span className="font-medium text-gray-700">Status:</span>
                      <span className={`ml-2 px-2 py-1 border rounded-full text-xs font-medium ${getStatusColor(selectedCandidate.status)}`}>
                        {selectedCandidate.status}
                      </span>
                    </div>
                    <div className="mb-2">
                      <span className="font-medium text-gray-700">Applied Date:</span>
                      <span className="ml-2 text-gray-900">
                        {selectedCandidate.applied_date ? new Date(selectedCandidate.applied_date).toLocaleDateString() : 'Not available'}
                      </span>
                    </div>
                    <div className="mb-2 col-span-2">
                      <span className="font-medium text-gray-700">Notes:</span>
                      <span className="ml-2 text-gray-900">
                        {selectedCandidate.notes || 'No notes available'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Update Status Modal */}
      <AnimatePresence>
        {showStatusModal && selectedCandidate && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.div
              className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl border border-gray-200"
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Update Status for {selectedCandidate.name}</h3>
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-xl px-2 transition"
                >✕</button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={statusForm.status}
                    onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white transition"
                  >
                    <option value="applied">Applied</option>
                    <option value="in_progress">In Progress</option>
                    <option value="interviewed">Interviewed</option>
                    <option value="selected">Selected</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={statusForm.notes}
                    onChange={(e) => setStatusForm({ ...statusForm, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white transition"
                    rows="3"
                    placeholder="Add notes about the candidate..."
                  />
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowStatusModal(false)}
                    className="px-4 py-2 rounded-lg border border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                  >Cancel</button>
                  <button
                    onClick={handleStatusUpdate}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
                  >Update Status</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default AdminCandidates