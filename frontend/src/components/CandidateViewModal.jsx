import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, Edit, Save, X } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import api from '../services/api';
import { toast } from 'react-toastify';

const CandidateViewModal = ({ candidate, open, onClose, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [statusForm, setStatusForm] = useState({ status: '', notes: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (candidate) {
      setEditForm({ ...candidate });
      setStatusForm({ status: candidate.status || '', notes: candidate.notes || '' });
    }
  }, [candidate]);

  if (!open || !candidate) return null;

  const handleEditCandidate = async () => {
    try {
      setLoading(true);
      const cleanedData = { ...editForm };
      Object.keys(cleanedData).forEach((key) => {
        if (cleanedData[key] === '') cleanedData[key] = null;
      });
      await api.put(`/candidates/${candidate.id}`, cleanedData);
      toast.success('Candidate updated successfully');
      setIsEditing(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error('Failed to update candidate');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    try {
      setLoading(true);
      await api.put(
        `/hr/candidates/${candidate.id}/status?status=${statusForm.status}&notes=${statusForm.notes}`
      );
      toast.success('Candidate status updated successfully');
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error('Failed to update candidate status');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'selected':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'interviewed':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-orange-100 text-orange-800';
      case 'applied':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAssessmentScoreText = (score) => {
    switch (score) {
      case '1':
        return 'Below Average';
      case '2':
        return 'Average';
      case '3':
        return 'Good';
      case '4':
        return 'Excellent';
      default:
        return '';
    }
  };

  const renderField = (label, value, isLink = false, fieldType = 'text', options = []) => {
    if (isEditing) {
      const fieldName = label.toLowerCase().replace(/\s+/g, '_');
      
      if (fieldType === 'dropdown') {
        return (
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <select
              value={editForm[fieldName] || ''}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  [fieldName]: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select...</option>
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        );
      }

      return (
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
          <input
            type={fieldType}
            value={editForm[fieldName] || ''}
            onChange={(e) =>
              setEditForm({
                ...editForm,
                [fieldName]: e.target.value,
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      );
    }
    return (
      <div className="mb-2">
        <span className="font-medium text-gray-700">{label}:</span>
        <span className="ml-2 text-gray-900">
          {isLink && value ? (
            <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
              {value}
            </a>
          ) : (
            value || 'Not provided'
          )}
        </span>
      </div>
    );
  };

  const renderEducationSection = () => {
    if (isEditing) {
      return (
        <div className="space-y-4">
          <h4 className="font-semibold text-lg text-gray-800 border-b pb-2">Education Details</h4>
          {/* Class X */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h5 className="font-medium text-gray-700 mb-3">Class X</h5>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Institute</label>
                <input
                  type="text"
                  value={editForm.education_x_institute || ''}
                  onChange={(e) => setEditForm({ ...editForm, education_x_institute: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Percentage</label>
                <input
                  type="text"
                  value={editForm.education_x_percentage || ''}
                  onChange={(e) => setEditForm({ ...editForm, education_x_percentage: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <DatePicker
                  selected={editForm.education_x_start_date ? new Date(editForm.education_x_start_date) : null}
                  onChange={(date) => setEditForm({ 
                    ...editForm, 
                    education_x_start_date: date ? date.toISOString().slice(0, 7) : '' 
                  })}
                  dateFormat="MM/yyyy"
                  showMonthYearPicker
                  placeholderText="MM/YYYY"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <DatePicker
                  selected={editForm.education_x_end_date ? new Date(editForm.education_x_end_date) : null}
                  onChange={(date) => setEditForm({ 
                    ...editForm, 
                    education_x_end_date: date ? date.toISOString().slice(0, 7) : '' 
                  })}
                  dateFormat="MM/yyyy"
                  showMonthYearPicker
                  placeholderText="MM/YYYY"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
          {/* Class XII */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h5 className="font-medium text-gray-700 mb-3">Class XII</h5>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Institute</label>
                <input
                  type="text"
                  value={editForm.education_xii_institute || ''}
                  onChange={(e) => setEditForm({ ...editForm, education_xii_institute: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Percentage</label>
                <input
                  type="text"
                  value={editForm.education_xii_percentage || ''}
                  onChange={(e) => setEditForm({ ...editForm, education_xii_percentage: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <DatePicker
                  selected={editForm.education_xii_start_date ? new Date(editForm.education_xii_start_date) : null}
                  onChange={(date) => setEditForm({ 
                    ...editForm, 
                    education_xii_start_date: date ? date.toISOString().slice(0, 7) : '' 
                  })}
                  dateFormat="MM/yyyy"
                  showMonthYearPicker
                  placeholderText="MM/YYYY"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <DatePicker
                  selected={editForm.education_xii_end_date ? new Date(editForm.education_xii_end_date) : null}
                  onChange={(date) => setEditForm({ 
                    ...editForm, 
                    education_xii_end_date: date ? date.toISOString().slice(0, 7) : '' 
                  })}
                  dateFormat="MM/yyyy"
                  showMonthYearPicker
                  placeholderText="MM/YYYY"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
          {/* Degree */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h5 className="font-medium text-gray-700 mb-3">Degree</h5>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Degree Name</label>
                <input
                  type="text"
                  value={editForm.education_degree_name || ''}
                  onChange={(e) => setEditForm({ ...editForm, education_degree_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Institute</label>
                <input
                  type="text"
                  value={editForm.education_degree_institute || ''}
                  onChange={(e) => setEditForm({ ...editForm, education_degree_institute: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Percentage</label>
                <input
                  type="text"
                  value={editForm.education_degree_percentage || ''}
                  onChange={(e) => setEditForm({ ...editForm, education_degree_percentage: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <DatePicker
                  selected={editForm.education_degree_start_date ? new Date(editForm.education_degree_start_date) : null}
                  onChange={(date) => setEditForm({ 
                    ...editForm, 
                    education_degree_start_date: date ? date.toISOString().slice(0, 7) : '' 
                  })}
                  dateFormat="MM/yyyy"
                  showMonthYearPicker
                  placeholderText="MM/YYYY"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <DatePicker
                  selected={editForm.education_degree_end_date ? new Date(editForm.education_degree_end_date) : null}
                  onChange={(date) => setEditForm({ 
                    ...editForm, 
                    education_degree_end_date: date ? date.toISOString().slice(0, 7) : '' 
                  })}
                  dateFormat="MM/yyyy"
                  showMonthYearPicker
                  placeholderText="MM/YYYY"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                <input
                  type="text"
                  value={editForm.education_degree_duration || ''}
                  onChange={(e) => setEditForm({ ...editForm, education_degree_duration: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Certifications</label>
                <input
                  type="text"
                  value={editForm.education_additional_certifications || ''}
                  onChange={(e) => setEditForm({ ...editForm, education_additional_certifications: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <h4 className="font-semibold text-lg text-gray-800 border-b pb-2">Education Details</h4>
        {/* Class X */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h5 className="font-medium text-gray-700 mb-2">Class X</h5>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Institute:</span> {candidate.education_x_institute || 'Not provided'}
            </div>
            <div>
              <span className="font-medium">Percentage:</span> {candidate.education_x_percentage || 'Not provided'}
            </div>
            <div>
              <span className="font-medium">Start Date:</span> {candidate.education_x_start_date || 'Not provided'}
            </div>
            <div>
              <span className="font-medium">End Date:</span> {candidate.education_x_end_date || 'Not provided'}
            </div>
          </div>
        </div>
        {/* Class XII */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h5 className="font-medium text-gray-700 mb-2">Class XII</h5>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Institute:</span> {candidate.education_xii_institute || 'Not provided'}
            </div>
            <div>
              <span className="font-medium">Percentage:</span> {candidate.education_xii_percentage || 'Not provided'}
            </div>
            <div>
              <span className="font-medium">Start Date:</span> {candidate.education_xii_start_date || 'Not provided'}
            </div>
            <div>
              <span className="font-medium">End Date:</span> {candidate.education_xii_end_date || 'Not provided'}
            </div>
          </div>
        </div>
        {/* Degree */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h5 className="font-medium text-gray-700 mb-2">Degree</h5>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Degree Name:</span> {candidate.education_degree_name || 'Not provided'}
            </div>
            <div>
              <span className="font-medium">Institute:</span> {candidate.education_degree_institute || 'Not provided'}
            </div>
            <div>
              <span className="font-medium">Percentage:</span> {candidate.education_degree_percentage || 'Not provided'}
            </div>
            <div>
              <span className="font-medium">Start Date:</span> {candidate.education_degree_start_date || 'Not provided'}
            </div>
            <div>
              <span className="font-medium">End Date:</span> {candidate.education_degree_end_date || 'Not provided'}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200"
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-gray-900">
              Candidate Details - {candidate.name}
            </h3>
            <div className="flex space-x-2">
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <Edit className="h-4 w-4" /> Edit
                </button>
              )}
              {isEditing && (
                <button
                  onClick={handleEditCandidate}
                  className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  disabled={loading}
                >
                  <Save className="h-4 w-4" /> Save
                </button>
              )}
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 bg-gray-100 border border-gray-300 rounded-md px-2 py-1"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Personal Information */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold text-lg text-gray-800 border-b pb-2 mb-4">
              Personal Information
            </h4>
            <div className="grid grid-cols-2 gap-4">
              {renderField('Name', candidate.name)}
              {renderField('Title/Position', candidate.title_position || candidate.job_title)}
              {renderField('Email', candidate.email)}
              {renderField('Phone', candidate.phone)}
              {renderField('PAN Number', candidate.pan_number)}
              {renderField('Passport Number', candidate.passport_number)}
              {renderField('Current Location', candidate.current_location)}
              {renderField('Hometown', candidate.hometown)}
              {renderField('Preferred Interview Location', candidate.preferred_interview_location)}
              {renderField('Interview Location', candidate.interview_location)}
              {renderField('Availability for Interview', candidate.availability_interview)}
            </div>
          </div>

          {/* General Information */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold text-lg text-gray-800 border-b pb-2 mb-4">
              General Information
            </h4>
            <div className="grid grid-cols-2 gap-4">
              {renderField('ROC Check Done', candidate.roc_check_done, false, 'dropdown', [
                { value: 'YES', label: 'Yes' },
                { value: 'NO', label: 'No' },
              ])}
              {renderField('Applied for IBM Before', candidate.applied_for_ibm_before, false, 'dropdown', [
                { value: 'YES', label: 'Yes' },
                { value: 'NO', label: 'No' },
              ])}
              {renderField('Is Organization Employee', candidate.is_organization_employee, false, 'dropdown', [
                { value: 'YES', label: 'Yes' },
                { value: 'NO', label: 'No' },
              ])}
              {(candidate.is_organization_employee === 'YES' ||
                candidate.is_organization_employee === 'Yes' ||
                candidate.is_organization_employee === 'yes') && (
                <div className="col-span-2 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded mb-2">
                  <div className="mb-3">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      If “YES” Please answer below:
                    </label>
                  </div>
                  <div className="mb-3">
                    {renderField(
                      'What is the date of joining of the resource in your organization',
                      candidate.date_of_joining_organization,
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
                        Array.isArray(candidate.client_deployment_details) && candidate.client_deployment_details.length > 0
                          ? candidate.client_deployment_details[0]
                          : ''
                      )}
                      {renderField(
                        'Client 2',
                        Array.isArray(candidate.client_deployment_details) && candidate.client_deployment_details.length > 1
                          ? candidate.client_deployment_details[1]
                          : ''
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {renderField('Interested in Relocation', candidate.interested_in_relocation, false, 'dropdown', [
                { value: 'YES', label: 'Yes' },
                { value: 'NO', label: 'No' },
              ])}
              {renderField('Willingness to Work Shifts', candidate.willingness_work_shifts, false, 'dropdown', [
                { value: 'YES', label: 'Yes' },
                { value: 'NO', label: 'No' },
              ])}
              {renderField('Role Applied For', candidate.role_applied_for || candidate.job_title)}
              {renderField('Reason for Job Change', candidate.reason_for_job_change)}
              {renderField('Current Role', candidate.current_role)}
              {renderField(
                'Have you authenticated resources education history with fake list of universities published by UGC',
                candidate.education_authenticated_ugc_check,
                false,
                'dropdown',
                [
                  { value: 'YES', label: 'Yes' },
                  { value: 'NO', label: 'No' },
                ]
              )}
              {renderField('Notice Period', candidate.notice_period)}
              {renderField('Payrolling Company Name', candidate.payrolling_company_name)}
            </div>
          </div>

          {/* Experience Information */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold text-lg text-gray-800 border-b pb-2 mb-4">
              Experience Information
            </h4>
            <div className="grid grid-cols-2 gap-4">
              {renderField('Total Experience', candidate.total_experience)}
              {renderField('Relevant Experience', candidate.relevant_experience)}
            </div>
          </div>

          {/* Education Section */}
          {renderEducationSection()}

          {/* Assessment Information */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold text-lg text-gray-800 border-b pb-2 mb-4">
              Assessment Information
            </h4>
            <div className="grid grid-cols-2 gap-4">
              {isEditing ? (
                <>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assessment of candidate's general attitude (team player, willing to learn, positive attitude, responsive etc.): (score 1 to 4)
                    </label>
                    <select
                      value={
                        editForm.general_attitude_assessment
                          ? editForm.general_attitude_assessment.toString()
                          : ''
                      }
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          general_attitude_assessment: e.target.value ? parseInt(e.target.value) : null,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Score</option>
                      <option value="1">1 - Below Average</option>
                      <option value="2">2 - Average</option>
                      <option value="3">3 - Good</option>
                      <option value="4">4 - Excellent</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assessment of the candidate's oral communication skills: (score 1 to 4)
                    </label>
                    <select
                      value={
                        editForm.oral_communication_assessment
                          ? editForm.oral_communication_assessment.toString()
                          : ''
                      }
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          oral_communication_assessment: e.target.value ? parseInt(e.target.value) : null,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    <span className="font-medium text-gray-700">
                      Assessment of candidate's general attitude (team player, willing to learn, positive attitude, responsive etc.): (score 1 to 4):
                    </span>
                    <span className="ml-2 text-gray-900">
                      {candidate.general_attitude_assessment
                        ? `${candidate.general_attitude_assessment} - ${getAssessmentScoreText(
                            candidate.general_attitude_assessment
                          )}`
                        : 'Not provided'}
                    </span>
                  </div>
                  <div className="mb-2">
                    <span className="font-medium text-gray-700">
                      Assessment of the candidate's oral communication skills: (score 1 to 4):
                    </span>
                    <span className="ml-2 text-gray-900">
                      {candidate.oral_communication_assessment
                        ? `${candidate.oral_communication_assessment} - ${getAssessmentScoreText(
                            candidate.oral_communication_assessment
                          )}`
                        : 'Not provided'}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* SME Information */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold text-lg text-gray-800 border-b pb-2 mb-4">SME Information</h4>
            <div className="grid grid-cols-2 gap-4">
              {renderField('SME Name', candidate.sme_name)}
              {renderField('SME Email', candidate.sme_email)}
              {renderField('SME Mobile', candidate.sme_mobile)}
            </div>
          </div>

          {/* SME Declaration */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold text-lg text-gray-800 border-b pb-2 mb-4">SME Declaration</h4>
            <div className="grid grid-cols-2 gap-4">
              {renderField('Do Not Know Candidate', candidate.do_not_know_candidate)}
              {renderField('Evaluated Resume with JD', candidate.evaluated_resume_with_jd)}
              {renderField('Personally Spoken to Candidate', candidate.personally_spoken_to_candidate)}
              {renderField('Available for Clarification', candidate.available_for_clarification)}
            </div>
          </div>

          {/* Verification */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold text-lg text-gray-800 border-b pb-2 mb-4">Verification</h4>
            <div className="grid grid-cols-2 gap-4">
              {renderField('Salary Slip Verified', candidate.salary_slip_verified, false, 'dropdown', [
                { value: 'YES', label: 'Yes' },
                { value: 'NO', label: 'No' },
              ])}
              {renderField('Offer Letter Verified', candidate.offer_letter_verified, false, 'dropdown', [
                { value: 'YES', label: 'Yes' },
                { value: 'NO', label: 'No' },
              ])}
              {renderField(
                'Have you sent test mail to the resources current organization official email ID to check the authenticity',
                candidate.test_mail_sent_to_organization,
                false,
                'dropdown',
                [
                  { value: 'YES', label: 'Yes' },
                  { value: 'NO', label: 'No' },
                ]
              )}
            </div>
          </div>

          {/* Skills Assessment */}
          {candidate.skill_assessments && candidate.skill_assessments.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="font-semibold text-lg text-gray-800 border-b pb-2 mb-4">Skills Assessment</h4>
              <div className="space-y-4">
                {candidate.skill_assessments.map((skill, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Skill Name:</span> {skill.skill_name || 'Not provided'}
                      </div>
                      <div>
                        <span className="font-medium">Years of Experience:</span> {skill.years_of_experience || 'Not provided'}
                      </div>
                      <div>
                        <span className="font-medium">Last Used Year:</span> {skill.last_used_year || 'Not provided'}
                      </div>
                      <div>
                        <span className="font-medium">Vendor SME Assessment Score:</span> {skill.vendor_sme_assessment_score || 'Not provided'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Work Experience */}
          {candidate.work_experience_entries && candidate.work_experience_entries.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="font-semibold text-lg text-gray-800 border-b pb-2 mb-4">Work Experience</h4>
              <div className="space-y-4">
                {candidate.work_experience_entries.map((exp, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="font-medium text-gray-700 mb-3">Organization {index + 1}</h5>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Organization:</span> {exp.organization || 'Not provided'}
                      </div>
                      <div>
                        <span className="font-medium">End Client:</span> {exp.end_client || 'Not provided'}
                      </div>
                      <div>
                        <span className="font-medium">Project:</span> {exp.project || 'Not provided'}
                      </div>
                      <div>
                        <span className="font-medium">Start Date:</span> {exp.start_month_year || 'Not provided'}
                      </div>
                      <div>
                        <span className="font-medium">End Date:</span> {exp.end_month_year || 'Not provided'}
                      </div>
                      <div>
                        <span className="font-medium">Technology/Tools:</span> {exp.technology_tools || 'Not provided'}
                      </div>
                      <div>
                        <span className="font-medium">Role/Designation:</span> {exp.role_designation || 'Not provided'}
                      </div>
                      <div>
                        <span className="font-medium">Additional Information:</span> {exp.additional_information || 'Not provided'}
                      </div>
                    </div>
                    {exp.responsibilities && exp.responsibilities.length > 0 && (
                      <div className="mt-3">
                        <span className="font-medium">Responsibilities:</span>
                        <ul className="list-disc list-inside mt-1 ml-4">
                          {exp.responsibilities.map((resp, respIndex) => (
                            <li key={respIndex} className="text-sm">
                              {resp}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Additional Information */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold text-lg text-gray-800 border-b pb-2 mb-4">Additional Information</h4>
            <div className="grid grid-cols-2 gap-4">
              {renderField('Skills', candidate.skills)}
              {renderField('Projects', candidate.projects)}
              {renderField('Certifications', candidate.certifications)}
              {renderField('Publications Title', candidate.publications_title)}
              {renderField('Publications Date', candidate.publications_date)}
              {renderField('Publications Publisher', candidate.publications_publisher)}
              {renderField('Publications Description', candidate.publications_description)}
              {renderField('References', candidate.references)}
              {renderField('LinkedIn', candidate.linkedin, true)}
              {renderField('GitHub', candidate.github, true)}
            </div>
          </div>

          {/* Application Status */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold text-lg text-gray-800 border-b pb-2 mb-4">Application Status</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="mb-2">
                <span className="font-medium text-gray-700">Status:</span>
                <span
                  className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                    candidate.status
                  )}`}
                >
                  {candidate.status}
                </span>
              </div>
              <div className="mb-2">
                <span className="font-medium text-gray-700">Applied Date:</span>
                <span className="ml-2 text-gray-900">
                  {candidate.applied_date
                    ? new Date(candidate.applied_date).toLocaleDateString()
                    : 'Not available'}
                </span>
              </div>
              <div className="mb-2 col-span-2">
                <span className="font-medium text-gray-700">Notes:</span>
                <span className="ml-2 text-gray-900">
                  {candidate.notes || 'No notes available'}
                </span>
              </div>
            </div>
          </div>

          {/* Status Update */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold text-lg text-gray-800 border-b pb-2 mb-4">Update Status</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={statusForm.status}
                  onChange={e => setStatusForm({ ...statusForm, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  onChange={e => setStatusForm({ ...statusForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Add notes about the candidate..."
                />
              </div>
              <button
                onClick={handleStatusUpdate}
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-all duration-200"
                disabled={loading}
              >
                Update Status
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CandidateViewModal;