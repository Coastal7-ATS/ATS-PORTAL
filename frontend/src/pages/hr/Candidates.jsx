import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, Edit, Save, X, UserCheck, Calendar, Download, Trash2 } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { useSearchParams } from 'react-router-dom';
import { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel, TextRun, BorderStyle } from 'docx';

const HRCandidates = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusForm, setStatusForm] = useState({ status: '', notes: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [searchParams] = useSearchParams();

  useEffect(() => {
    fetchCandidates();
  }, []);

  // Handle candidateId query parameter
  useEffect(() => {
    const candidateId = searchParams.get('candidateId');
    if (candidateId) {
      fetchCandidateDetails(candidateId);
    }
  }, [searchParams]);

  const fetchCandidates = async () => {
    try {
      const response = await api.get('/hr/candidates');
      setCandidates(response.data);
    } catch (error) {
      console.error('Error fetching candidates:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCandidateDetails = async (candidateId) => {
    try {
      setLoading(true);
      const response = await api.get(`/candidates/${candidateId}`);
      setSelectedCandidate(response.data);
      setShowViewModal(true);
    } catch (error) {
      console.error('Error fetching candidate details:', error);
      toast.error('Failed to fetch candidate details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    try {
      await api.put(
        `/hr/candidates/${selectedCandidate.id}/status?status=${statusForm.status}&notes=${statusForm.notes}`
      );
      toast.success('Candidate status updated successfully');
      setShowStatusModal(false);
      setSelectedCandidate(null);
      setStatusForm({ status: '', notes: '' });
      fetchCandidates();
    } catch (error) {
      toast.error('Failed to update candidate status');
    }
  };

  const handleDeleteCandidate = async (candidateId) => {
    if (window.confirm('Are you sure you want to delete this candidate? This action cannot be undone.')) {
      try {
        await api.delete(`/candidates/${candidateId}`)
        toast.success('Candidate deleted successfully')
        setShowViewModal(false)
        setSelectedCandidate(null)
        fetchCandidates()
      } catch (error) {
        toast.error(error.response?.data?.detail || 'Failed to delete candidate')
      }
    }
  }

  const handleEditCandidate = async () => {
    try {
      // Validate required fields
      if (!editForm.name || !editForm.email || !editForm.phone || !editForm.pan_number) {
        toast.error('Please fill in all required fields (Name, Email, Phone, PAN Number)');
        return;
      }
      
      // Validate email format
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(editForm.email)) {
        toast.error('Please enter a valid email address with @ symbol');
        return;
      }
      
      // Validate phone format (10 digits)
      const phonePattern = /^\d{10}$/;
      if (!phonePattern.test(editForm.phone)) {
        toast.error('Phone number must contain exactly 10 digits');
        return;
      }
      
      // Validate PAN number format
      const panPattern = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      if (!panPattern.test(editForm.pan_number)) {
        toast.error('PAN Number must be in format ABCDE1234F');
        return;
      }

      // Clean up the data before sending - convert empty strings to null for optional fields
      const cleanedData = { ...editForm };
      Object.keys(cleanedData).forEach((key) => {
        if (cleanedData[key] === '') {
          cleanedData[key] = null;
        }
      });

      await api.put(`/candidates/${selectedCandidate.id}`, cleanedData);
      toast.success('Candidate updated successfully');
      setIsEditing(false);
      setEditForm({});
      fetchCandidates();
      // Refresh the selected candidate data
      const response = await api.get(`/candidates/${selectedCandidate.id}`);
      setSelectedCandidate(response.data);
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Failed to update candidate');
    }
  };

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
      current_ctc: selectedCandidate.current_ctc || '',
      expected_ctc: selectedCandidate.expected_ctc || '',

      // General Information
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

      // Experience Information
      total_experience: selectedCandidate.total_experience || '',
      relevant_experience: selectedCandidate.relevant_experience || '',

      // Assessment Information
      general_attitude_assessment: selectedCandidate.general_attitude_assessment || null,
      oral_communication_assessment: selectedCandidate.oral_communication_assessment || null,
      general_attitude_comments: selectedCandidate.general_attitude_comments || '',
      oral_communication_comments: selectedCandidate.oral_communication_comments || '',

      // SME Information
      sme_name: selectedCandidate.sme_name || '',
      sme_email: selectedCandidate.sme_email || '',
      sme_mobile: selectedCandidate.sme_mobile || '',

      // SME Declaration
      do_not_know_candidate: selectedCandidate.do_not_know_candidate || '',
      evaluated_resume_with_jd: selectedCandidate.evaluated_resume_with_jd || '',
      personally_spoken_to_candidate: selectedCandidate.personally_spoken_to_candidate || '',
      available_for_clarification: selectedCandidate.available_for_clarification || '',

      // Verification
      salary_slip_verified: selectedCandidate.salary_slip_verified || '',
      offer_letter_verified: selectedCandidate.offer_letter_verified || '',
      test_mail_sent_to_organization: selectedCandidate.test_mail_sent_to_organization || '',

      // Assessment Details
      talent_acquisition_consultant: selectedCandidate.talent_acquisition_consultant || '',
      date_of_assessment: selectedCandidate.date_of_assessment || '',

      // Class X
      education_x_institute: selectedCandidate.education_x_institute || '',
      education_x_start_date: selectedCandidate.education_x_start_date || '',
      education_x_end_date: selectedCandidate.education_x_end_date || '',
      education_x_percentage: selectedCandidate.education_x_percentage || '',
      education_x_year_completion: selectedCandidate.education_x_year_completion || '',

      // Class XII
      education_xii_institute: selectedCandidate.education_xii_institute || '',
      education_xii_start_date: selectedCandidate.education_xii_start_date || '',
      education_xii_end_date: selectedCandidate.education_xii_end_date || '',
      education_xii_percentage: selectedCandidate.education_xii_percentage || '',
      education_xii_year_completion: selectedCandidate.education_xii_year_completion || '',

      // Degree
      education_degree_name: selectedCandidate.education_degree_name || '',
      education_degree_institute: selectedCandidate.education_degree_institute || '',
      education_degree_start_date: selectedCandidate.education_degree_start_date || '',
      education_degree_end_date: selectedCandidate.education_degree_end_date || '',
      education_degree_percentage: selectedCandidate.education_degree_percentage || '',
      education_degree_year_completion: selectedCandidate.education_degree_year_completion || '',
      education_degree_duration: selectedCandidate.education_degree_duration || '',
      education_additional_certifications: selectedCandidate.education_additional_certifications || '',

      // Legacy education fields
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

      // Legacy fields
      experience: selectedCandidate.experience || '',
      education: selectedCandidate.education || '',
      skills: selectedCandidate.skills || '',
      projects: selectedCandidate.projects || '',
      // job_id is not needed for updates
    });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditForm({});
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'placed':
        return 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300';
      case 'interview_selected':
        return 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300';
      case 'interview_reject':
        return 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 border border-red-300';
      case 'screen_reject':
        return 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 border border-red-300';
      case 'no_show_for_joining':
        return 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 border border-red-300';
      case 'interviewed':
        return 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-300';
      case 'in_progress':
        return 'bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 border border-orange-300';
      case 'applied':
        return 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border border-yellow-300';
      case 'submitted':
        return 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border border-purple-300';
      default:
        return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-300';
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

  // Export function to generate document with table formatting
  const exportCandidateToDoc = async (candidate) => {
    const formatValue = (value) => {
      if (value === null || value === undefined || value === '') {
        return 'Not provided'
      }
      if (Array.isArray(value)) {
        return value.length > 0 ? value.join(', ') : 'Not provided'
      }
      return value.toString()
    }

    const formatDate = (dateString) => {
      if (!dateString) return 'Not provided'
      try {
        return new Date(dateString).toLocaleDateString()
      } catch {
        return dateString
      }
    }

    const createTable = (headers, rows) => {
      const tableRows = [
        new TableRow({
          children: headers.map(header => 
            new TableCell({
              children: [new Paragraph({ text: header, style: 'Heading3' })],
              width: { size: 50, type: WidthType.PERCENTAGE },
              shading: { fill: 'F2F2F2' }
            })
          )
        }),
        ...rows.map(row => 
          new TableRow({
            children: row.map(cell => 
              new TableCell({
                children: [new Paragraph({ text: cell })],
                width: { size: 50, type: WidthType.PERCENTAGE }
              })
            )
          })
        )
      ]

      return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: tableRows,
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1 },
          bottom: { style: BorderStyle.SINGLE, size: 1 },
          left: { style: BorderStyle.SINGLE, size: 1 },
          right: { style: BorderStyle.SINGLE, size: 1 },
          insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
          insideVertical: { style: BorderStyle.SINGLE, size: 1 }
        }
      })
    }

    try {
      const children = [
        new Paragraph({
          text: `Candidate Profile - ${candidate.name}`,
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER
        }),
        new Paragraph({ text: '' }), // Spacing

        // Personal Information
        new Paragraph({ text: 'PERSONAL INFORMATION', heading: HeadingLevel.HEADING_2 }),
        createTable(
          ['Field', 'Value'],
          [
            ['Name', formatValue(candidate.name)],
            ['Title/Position', formatValue(candidate.title_position)],
            ['Email', formatValue(candidate.email)],
            ['Phone', formatValue(candidate.phone)],
            ['PAN Number', formatValue(candidate.pan_number)],
            ['Passport Number', formatValue(candidate.passport_number)],
            ['Current Location', formatValue(candidate.current_location)],
            ['Hometown', formatValue(candidate.hometown)],
            ['Preferred Interview Location', formatValue(candidate.preferred_interview_location)],
            ['Interview Location', formatValue(candidate.interview_location)],
            ['Availability Interview', formatValue(candidate.availability_interview)],
            ['Current CTC', formatValue(candidate.current_ctc)],
            ['Expected CTC', formatValue(candidate.expected_ctc)]
          ]
        ),
        new Paragraph({ text: '' }), // Spacing

        // General Information
        new Paragraph({ text: 'GENERAL INFORMATION', heading: HeadingLevel.HEADING_2 }),
        createTable(
          ['Field', 'Value'],
          [
            ['ROC Check Done', formatValue(candidate.roc_check_done)],
            ['Applied for IBM Before', formatValue(candidate.applied_for_ibm_before)],
            ['Is Organization Employee', formatValue(candidate.is_organization_employee)],
            ['Date of Joining Organization', formatValue(candidate.date_of_joining_organization)],
            ['Client Deployment Details', formatValue(candidate.client_deployment_details)],
            ['Interested in Relocation', formatValue(candidate.interested_in_relocation)],
            ['Willingness Work Shifts', formatValue(candidate.willingness_work_shifts)],
            ['Role Applied For', formatValue(candidate.role_applied_for)],
            ['Reason for Job Change', formatValue(candidate.reason_for_job_change)],
            ['Current Role', formatValue(candidate.current_role)],
            ['Notice Period', formatValue(candidate.notice_period)],
            ['Payrolling Company Name', formatValue(candidate.payrolling_company_name)],
            ['Education Authenticated UGC Check', formatValue(candidate.education_authenticated_ugc_check)]
          ]
        ),
        new Paragraph({ text: '' }), // Spacing

        // Experience Information
        new Paragraph({ text: 'EXPERIENCE INFORMATION', heading: HeadingLevel.HEADING_2 }),
        createTable(
          ['Field', 'Value'],
          [
            ['Total Experience', formatValue(candidate.total_experience)],
            ['Relevant Experience', formatValue(candidate.relevant_experience)]
          ]
        ),
        new Paragraph({ text: '' }), // Spacing

        // Education Details
        new Paragraph({ text: 'EDUCATION DETAILS', heading: HeadingLevel.HEADING_2 }),
        
        // Class X
        new Paragraph({ text: 'Class X', heading: HeadingLevel.HEADING_3 }),
        createTable(
          ['Field', 'Value'],
          [
            ['Institute', formatValue(candidate.education_x_institute)],
            ['Percentage', formatValue(candidate.education_x_percentage)],
            ['Start Date', formatValue(candidate.education_x_start_date)],
            ['End Date', formatValue(candidate.education_x_end_date)]
          ]
        ),
        new Paragraph({ text: '' }), // Spacing

        // Class XII
        new Paragraph({ text: 'Class XII', heading: HeadingLevel.HEADING_3 }),
        createTable(
          ['Field', 'Value'],
          [
            ['Institute', formatValue(candidate.education_xii_institute)],
            ['Percentage', formatValue(candidate.education_xii_percentage)],
            ['Start Date', formatValue(candidate.education_xii_start_date)],
            ['End Date', formatValue(candidate.education_xii_end_date)]
          ]
        ),
        new Paragraph({ text: '' }), // Spacing

        // Degree
        new Paragraph({ text: 'Degree', heading: HeadingLevel.HEADING_3 }),
        createTable(
          ['Field', 'Value'],
          [
            ['Degree Name', formatValue(candidate.education_degree_name)],
            ['Institute', formatValue(candidate.education_degree_institute)],
            ['Percentage', formatValue(candidate.education_degree_percentage)],
            ['Start Date', formatValue(candidate.education_degree_start_date)],
            ['End Date', formatValue(candidate.education_degree_end_date)],
            
          ]
        ),
        new Paragraph({ text: '' }), // Spacing

        // Assessment Information
        new Paragraph({ text: 'ASSESSMENT INFORMATION', heading: HeadingLevel.HEADING_2 }),
        createTable(
          ['Field', 'Value'],
          [
            ['General Attitude', candidate.general_attitude_assessment ? `${candidate.general_attitude_assessment} - ${getAssessmentScoreText(candidate.general_attitude_assessment)}` : 'Not provided'],
            ['Oral Communication', candidate.oral_communication_assessment ? `${candidate.oral_communication_assessment} - ${getAssessmentScoreText(candidate.oral_communication_assessment)}` : 'Not provided'],
            ['General Attitude Comments', formatValue(candidate.general_attitude_comments)],
            ['Oral Communication Comments', formatValue(candidate.oral_communication_comments)]
          ]
        ),
        new Paragraph({ text: '' }), // Spacing

        // SME Information
        new Paragraph({ text: 'SME INFORMATION', heading: HeadingLevel.HEADING_2 }),
        createTable(
          ['Field', 'Value'],
          [
            ['SME Name', formatValue(candidate.sme_name)],
            ['SME Email', formatValue(candidate.sme_email)],
            ['SME Mobile', formatValue(candidate.sme_mobile)]
          ]
        ),
        new Paragraph({ text: '' }), // Spacing

        // SME Declaration
        new Paragraph({ text: 'SME DECLARATION', heading: HeadingLevel.HEADING_2 }),
        createTable(
          ['Field', 'Value'],
          [
            ['Do Not Know Candidate', formatValue(candidate.do_not_know_candidate)],
            ['Evaluated Resume with JD', formatValue(candidate.evaluated_resume_with_jd)],
            ['Personally Spoken to Candidate', formatValue(candidate.personally_spoken_to_candidate)],
            ['Available for Clarification', formatValue(candidate.available_for_clarification)]
          ]
        ),
        new Paragraph({ text: '' }), // Spacing

        // Verification
        new Paragraph({ text: 'VERIFICATION', heading: HeadingLevel.HEADING_2 }),
        createTable(
          ['Field', 'Value'],
          [
            ['Salary Slip Verified', formatValue(candidate.salary_slip_verified)],
            ['Offer Letter Verified', formatValue(candidate.offer_letter_verified)],
            ['Test Mail Sent to Organization', formatValue(candidate.test_mail_sent_to_organization)]
          ]
        ),
        new Paragraph({ text: '' }), // Spacing

        // Additional Information
        new Paragraph({ text: 'ADDITIONAL INFORMATION', heading: HeadingLevel.HEADING_2 }),
        createTable(
          ['Field', 'Value'],
          [
            ['Skills', formatValue(candidate.skills)],
            ['Projects', formatValue(candidate.projects)],
            ['Certifications', formatValue(candidate.certifications)],
            ['Publications Title', formatValue(candidate.publications_title)],
            ['Publications Date', formatValue(candidate.publications_date)],
            ['Publications Publisher', formatValue(candidate.publications_publisher)],
            ['Publications Description', formatValue(candidate.publications_description)],
            ['References', formatValue(candidate.references)],
            ['LinkedIn', formatValue(candidate.linkedin)],
            ['GitHub', formatValue(candidate.github)]
          ]
        ),
        new Paragraph({ text: '' }), // Spacing

        // Application Status
        new Paragraph({ text: 'APPLICATION STATUS', heading: HeadingLevel.HEADING_2 }),
        createTable(
          ['Field', 'Value'],
          [
            ['Status', formatValue(candidate.status)],
            ['Applied Date', formatDate(candidate.applied_date)],
            ['Added By HR', formatValue(candidate.created_by_hr)],
            ['Created Date', formatDate(candidate.created_at)],
            ['Notes', formatValue(candidate.notes)]
          ]
        ),
        new Paragraph({ text: '' }), // Spacing
      ]

      // Add Skills Assessment section if available
      if (candidate.skill_assessments && candidate.skill_assessments.length > 0) {
        children.push(
          new Paragraph({ text: 'SKILLS ASSESSMENT', heading: HeadingLevel.HEADING_2 }),
          createTable(
            ['Skill Name', 'Years Experience', 'Last Used', 'Vendor SME Score'],
            candidate.skill_assessments.map(skill => [
              formatValue(skill.skill_name),
              formatValue(skill.years_of_experience),
              formatValue(skill.last_used_year),
              formatValue(skill.vendor_sme_assessment_score)
            ])
          ),
          new Paragraph({ text: '' }) // Spacing
        )
      }

      // Add Work Experience section if available
      if (candidate.work_experience_entries && candidate.work_experience_entries.length > 0) {
        children.push(new Paragraph({ text: 'WORK EXPERIENCE', heading: HeadingLevel.HEADING_2 }))
        
        candidate.work_experience_entries.forEach((exp, index) => {
          children.push(
            new Paragraph({ text: `Organization ${index + 1}`, heading: HeadingLevel.HEADING_3 }),
            createTable(
              ['Field', 'Value'],
              [
                ['Organization', formatValue(exp.organization)],
                ['End Client', formatValue(exp.end_client)],
                ['Project', formatValue(exp.project)],
                ['Start Date', formatValue(exp.start_month_year)],
                ['End Date', formatValue(exp.end_month_year)],
                ['Technology/Tools', formatValue(exp.technology_tools)],
                ['Role/Designation', formatValue(exp.role_designation)],
                ['Additional Information', formatValue(exp.additional_information)]
              ]
            )
          )

          if (exp.responsibilities && exp.responsibilities.length > 0) {
            children.push(
              new Paragraph({ text: 'Responsibilities:', heading: HeadingLevel.HEADING_4 }),
              ...exp.responsibilities.map(resp => new Paragraph({ text: `• ${resp}` }))
            )
          }
          children.push(new Paragraph({ text: '' })) // Spacing
        })
      }

      // Add generated timestamp
      children.push(
        new Paragraph({ text: `Generated on: ${new Date().toLocaleString()}`, alignment: AlignmentType.RIGHT })
      )

      const doc = new Document({
        sections: [{
          properties: {},
          children: children
        }]
      })

      const blob = await Packer.toBlob(doc)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `candidate_${new Date().toISOString().split('T')[0]}.docx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('Candidate profile exported successfully')
    } catch (error) {
      console.error('Error generating document:', error)
      toast.error('Failed to export candidate profile')
    }
  };

  const renderField = (label, value, isLink = false, fieldType = 'text', options = []) => {
    if (isEditing) {
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
        
        'Current CTC': 'current_ctc',
        'Expected CTC': 'expected_ctc',
      };

      const fieldName = fieldNameMap[label] || label.toLowerCase().replace(/\s+/g, '_');

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
              className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

      // Add validation attributes for specific fields
      const getValidationProps = (fieldName, label) => {
        const props = {};
        
        if (fieldName === 'email') {
          props.type = 'email';
          props.pattern = '[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$';
          props.title = 'Please enter a valid email address with @ symbol';
          props.required = true;
        } else if (fieldName === 'phone') {
          props.type = 'tel';
          props.pattern = '[0-9]{10}';
          props.maxLength = '10';
          props.title = 'Phone number must contain exactly 10 digits';
          props.required = true;
        } else if (fieldName === 'pan_number') {
          props.pattern = '[A-Z]{5}[0-9]{4}[A-Z]{1}';
          props.maxLength = '10';
          props.title = 'PAN Number is mandatory and must be in format ABCDE1234F';
          props.required = true;
        }
        
        return props;
      };

      const validationProps = getValidationProps(fieldName, label);

      return (
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {validationProps.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type={fieldType}
            value={editForm[fieldName] || ''}
            onChange={(e) =>
              setEditForm({
                ...editForm,
                [fieldName]: e.target.value,
              })
            }
            className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            {...validationProps}
          />
        </div>
      );
    }
    return (
      <div className="mb-2">
        <span className="font-medium text-gray-700">{label}:</span>
        <span className="ml-2 text-gray-900 break-words">
          {isLink && value ? (
            <a href={value.startsWith('http') ? value : `https://${value}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:no-underline">
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
          <div className="bg-gray-50 p-4">
            <h5 className="font-medium text-gray-700 mb-3">Class X</h5>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Institute</label>
                <input
                  type="text"
                  value={editForm.education_x_institute || ''}
                  onChange={(e) => setEditForm({ ...editForm, education_x_institute: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Percentage</label>
                <input
                  type="text"
                  value={editForm.education_x_percentage || ''}
                  onChange={(e) => setEditForm({ ...editForm, education_x_percentage: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
          {/* Class XII */}
          <div className="bg-gray-50 p-4">
            <h5 className="font-medium text-gray-700 mb-3">Class XII</h5>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Institute</label>
                <input
                  type="text"
                  value={editForm.education_xii_institute || ''}
                  onChange={(e) => setEditForm({ ...editForm, education_xii_institute: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Percentage</label>
                <input
                  type="text"
                  value={editForm.education_xii_percentage || ''}
                  onChange={(e) => setEditForm({ ...editForm, education_xii_percentage: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
          {/* Degree */}
          <div className="bg-gray-50 p-4">
            <h5 className="font-medium text-gray-700 mb-3">Degree</h5>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Degree Name</label>
                <input
                  type="text"
                  value={editForm.education_degree_name || ''}
                  onChange={(e) => setEditForm({ ...editForm, education_degree_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Institute</label>
                <input
                  type="text"
                  value={editForm.education_degree_institute || ''}
                  onChange={(e) => setEditForm({ ...editForm, education_degree_institute: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Percentage</label>
                <input
                  type="text"
                  value={editForm.education_degree_percentage || ''}
                  onChange={(e) => setEditForm({ ...editForm, education_degree_percentage: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        <div className="bg-gray-50 p-4">
          <h5 className="font-medium text-gray-700 mb-2">Class X</h5>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Institute:</span> {selectedCandidate.education_x_institute || 'Not provided'}
            </div>
            <div>
              <span className="font-medium">Percentage:</span> {selectedCandidate.education_x_percentage || 'Not provided'}
            </div>
            <div>
              <span className="font-medium">Start Date:</span> {selectedCandidate.education_x_start_date || 'Not provided'}
            </div>
            <div>
              <span className="font-medium">End Date:</span> {selectedCandidate.education_x_end_date || 'Not provided'}
            </div>
          </div>
        </div>
        {/* Class XII */}
        <div className="bg-gray-50 p-4">
          <h5 className="font-medium text-gray-700 mb-2">Class XII</h5>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Institute:</span> {selectedCandidate.education_xii_institute || 'Not provided'}
            </div>
            <div>
              <span className="font-medium">Percentage:</span> {selectedCandidate.education_xii_percentage || 'Not provided'}
            </div>
            <div>
              <span className="font-medium">Start Date:</span> {selectedCandidate.education_xii_start_date || 'Not provided'}
            </div>
            <div>
              <span className="font-medium">End Date:</span> {selectedCandidate.education_xii_end_date || 'Not provided'}
            </div>
          </div>
        </div>
        {/* Degree */}
        <div className="bg-gray-50 p-4">
          <h5 className="font-medium text-gray-700 mb-2">Degree</h5>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Degree Name:</span> {selectedCandidate.education_degree_name || 'Not provided'}
            </div>
            <div>
              <span className="font-medium">Institute:</span> {selectedCandidate.education_degree_institute || 'Not provided'}
            </div>
            <div>
              <span className="font-medium">Percentage:</span> {selectedCandidate.education_degree_percentage || 'Not provided'}
            </div>
            <div>
              <span className="font-medium">Start Date:</span> {selectedCandidate.education_degree_start_date || 'Not provided'}
            </div>
            <div>
              <span className="font-medium">End Date:</span> {selectedCandidate.education_degree_end_date || 'Not provided'}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Candidates</h1>
          <p className="text-gray-600 text-lg">Manage and track your candidate applications</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-white/90 backdrop-blur-sm shadow-soft border border-white/40 rounded-xl"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Candidates</h3>
            <p className="text-sm text-gray-500 mt-1">Manage your candidate applications</p>
          </div>
          <div className="flex items-center gap-2 text-blue-600">
            <UserCheck className="h-5 w-5" />
            <span className="text-sm font-medium">Active Candidates</span>
          </div>
        </div>
        
        {candidates.length === 0 ? (
          <div className="text-center py-12">
            <UserCheck className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-500">No candidates found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-blue-50 to-blue-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Candidate Details</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Position</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Experience</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Education</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Skills</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {candidates.map((candidate) => (
                  <tr key={candidate.id} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <div className="text-sm font-medium text-gray-900 truncate max-w-xs" title={candidate.name}>
                          {candidate.name}
                        </div>
                        <div className="text-xs text-gray-500 truncate max-w-xs" title={candidate.email}>
                          {candidate.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <div className="text-sm text-gray-900 truncate max-w-xs" title={candidate.phone}>
                          {candidate.phone || 'N/A'}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {candidate.linkedin && (
                            <a 
                              href={candidate.linkedin.startsWith('http') ? candidate.linkedin : `https://${candidate.linkedin}`} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-blue-600 hover:text-blue-800 text-xs hover:underline"
                            >
                              LinkedIn
                            </a>
                          )}
                          {candidate.github && (
                            <a 
                              href={candidate.github.startsWith('http') ? candidate.github : `https://${candidate.github}`} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-gray-600 hover:text-gray-800 text-xs hover:underline"
                            >
                              GitHub
                            </a>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <div className="text-sm font-medium text-gray-900 truncate max-w-xs" title={candidate.applied_for || candidate.role_applied_for || 'N/A'}>
                          {candidate.applied_for || candidate.role_applied_for || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {candidate.current_location || 'Location not specified'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <div className="text-sm text-gray-900">
                          {candidate.total_experience || candidate.experience || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500">
                          CTC: {candidate.current_ctc || 'N/A'} → {candidate.expected_ctc || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 truncate max-w-xs" title={candidate.education}>
                        {candidate.education || candidate.education_degree_name || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 truncate max-w-xs" title={candidate.skills}>
                        {candidate.skills || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-3 py-1.5 text-xs font-semibold ${getStatusColor(
                          candidate.status
                        )}`}
                      >
                        {candidate.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedCandidate(candidate);
                            setShowViewModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-50 transition-colors duration-200"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCandidate(candidate);
                            setStatusForm({ status: candidate.status, notes: candidate.notes || '' });
                            setShowStatusModal(true);
                          }}
                          className="text-green-600 hover:text-green-800 p-1 hover:bg-green-50 transition-colors duration-200"
                          title="Edit Status"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => exportCandidateToDoc(candidate)}
                          className="text-purple-600 hover:text-purple-800 p-1 hover:bg-purple-50 transition-colors duration-200"
                          title="Export Details"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCandidate(candidate.id)}
                          className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 transition-colors duration-200"
                          title="Delete Candidate"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Enhanced View Candidate Modal */}
      {showViewModal && selectedCandidate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-900 truncate">
                  Candidate Details - {selectedCandidate.name}
                </h3>
                <div className="flex space-x-2">
                  {!isEditing && (
                    <>
                      <button
                        onClick={() => exportCandidateToDoc(selectedCandidate)}
                        className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white hover:bg-green-700 transition"
                        title="Export Details"
                      >
                        <Download className="h-4 w-4" /> Export
                      </button>
                      <button
                        onClick={startEditing}
                        className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white hover:bg-blue-700"
                      >
                        <Edit className="h-4 w-4" /> Edit
                      </button>
                      <button
                        onClick={() => handleDeleteCandidate(selectedCandidate.id)}
                        className="flex items-center gap-1 px-3 py-2 bg-red-600 text-white hover:bg-red-700 transition"
                        title="Delete Candidate"
                      >
                        <Trash2 className="h-4 w-4" /> Delete
                      </button>
                    </>
                  )}
                  {isEditing && (
                    <>
                      <button
                        onClick={handleEditCandidate}
                        className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white hover:bg-blue-700"
                      >
                        <Save className="h-4 w-4" /> Save
                      </button>
                      
                    </>
                  )}
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      setIsEditing(false);
                      setEditForm({});
                    }}
                    className="text-gray-500 hover:text-gray-700 bg-gray-100 border border-gray-300 px-2 py-1"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Personal Information */}
              <div className="bg-white border border-gray-200 p-6 rounded-xl">
                <h4 className="font-semibold text-lg text-gray-800 border-b pb-2 mb-4">
                  Personal Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  {renderField('Current CTC', selectedCandidate.current_ctc)}
                  {renderField('Expected CTC', selectedCandidate.expected_ctc)}
                </div>
              </div>

              {/* General Information */}
              <div className="bg-white border border-gray-200 p-6 rounded-xl">
                <h4 className="font-semibold text-lg text-gray-800 border-b pb-2 mb-4">
                  General Information
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  {renderField('ROC Check Done', selectedCandidate.roc_check_done, false, 'dropdown', [
                    { value: 'YES', label: 'Yes' },
                    { value: 'NO', label: 'No' },
                  ])}
                  {renderField('Applied for IBM Before', selectedCandidate.applied_for_ibm_before, false, 'dropdown', [
                    { value: 'YES', label: 'Yes' },
                    { value: 'NO', label: 'No' },
                  ])}
                  {renderField('Is Organization Employee', selectedCandidate.is_organization_employee, false, 'dropdown', [
                    { value: 'YES', label: 'Yes' },
                    { value: 'NO', label: 'No' },
                  ])}
                  {(selectedCandidate.is_organization_employee === 'YES' ||
                    selectedCandidate.is_organization_employee === 'Yes' ||
                    selectedCandidate.is_organization_employee === 'yes') && (
                    <>
                      {renderField('Date of Joining Organization', selectedCandidate.date_of_joining_organization)}
                      {renderField(
                        'Client Deployment Details',
                        selectedCandidate.client_deployment_details?.join(', ') || ''
                      )}
                    </>
                  )}
                  {renderField('Interested in Relocation', selectedCandidate.interested_in_relocation, false, 'dropdown', [
                    { value: 'YES', label: 'Yes' },
                    { value: 'NO', label: 'No' },
                  ])}
                  {renderField('Willingness to Work Shifts', selectedCandidate.willingness_work_shifts, false, 'dropdown', [
                    { value: 'YES', label: 'Yes' },
                    { value: 'NO', label: 'No' },
                  ])}
                  {renderField('Role Applied For', selectedCandidate.role_applied_for || selectedCandidate.job_title)}
                  {renderField('Reason for Job Change', selectedCandidate.reason_for_job_change)}
                  {renderField('Current Role', selectedCandidate.current_role)}
                  {renderField(
                    'Have you authenticated resources education history with fake list of universities published by UGC',
                    selectedCandidate.education_authenticated_ugc_check,
                    false,
                    'dropdown',
                    [
                      { value: 'YES', label: 'Yes' },
                      { value: 'NO', label: 'No' },
                    ]
                  )}
                  {renderField('Notice Period', selectedCandidate.notice_period)}
                  {renderField('Payrolling Company Name', selectedCandidate.payrolling_company_name)}
                </div>
              </div>

              {/* Experience Information */}
              <div className="bg-white border border-gray-200 p-6 rounded-xl">
                <h4 className="font-semibold text-lg text-gray-800 border-b pb-2 mb-4">
                  Experience Information
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  {renderField('Total Experience', selectedCandidate.total_experience)}
                  {renderField('Relevant Experience', selectedCandidate.relevant_experience)}
                </div>
              </div>

              {/* Education Section */}
              {renderEducationSection()}

              {/* Assessment Information */}
              <div className="bg-white border border-gray-200 p-6 rounded-xl">
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
                          className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                          className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                          {selectedCandidate.general_attitude_assessment
                            ? `${selectedCandidate.general_attitude_assessment} - ${getAssessmentScoreText(
                                selectedCandidate.general_attitude_assessment
                              )}`
                            : 'Not provided'}
                        </span>
                      </div>
                      <div className="mb-2">
                        <span className="font-medium text-gray-700">
                          Assessment of the candidate's oral communication skills: (score 1 to 4):
                        </span>
                        <span className="ml-2 text-gray-900">
                          {selectedCandidate.oral_communication_assessment
                            ? `${selectedCandidate.oral_communication_assessment} - ${getAssessmentScoreText(
                                selectedCandidate.oral_communication_assessment
                              )}`
                            : 'Not provided'}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* SME Information */}
              <div className="bg-white border border-gray-200 p-6 rounded-xl">
                <h4 className="font-semibold text-lg text-gray-800 border-b pb-2 mb-4">SME Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  {renderField('SME Name', selectedCandidate.sme_name)}
                  {renderField('SME Email', selectedCandidate.sme_email)}
                  {renderField('SME Mobile', selectedCandidate.sme_mobile)}
                </div>
              </div>

              {/* SME Declaration */}
              <div className="bg-white border border-gray-200 p-6 rounded-xl">
                <h4 className="font-semibold text-lg text-gray-800 border-b pb-2 mb-4">SME Declaration</h4>
                <div className="grid grid-cols-2 gap-4">
                  {renderField('Do Not Know Candidate', selectedCandidate.do_not_know_candidate)}
                  {renderField('Evaluated Resume with JD', selectedCandidate.evaluated_resume_with_jd)}
                  {renderField('Personally Spoken to Candidate', selectedCandidate.personally_spoken_to_candidate)}
                  {renderField('Available for Clarification', selectedCandidate.available_for_clarification)}
                </div>
              </div>

              {/* Verification */}
              <div className="bg-white border border-gray-200 p-6 rounded-xl">
                <h4 className="font-semibold text-lg text-gray-800 border-b pb-2 mb-4">Verification</h4>
                <div className="grid grid-cols-2 gap-4">
                  {renderField('Salary Slip Verified', selectedCandidate.salary_slip_verified, false, 'dropdown', [
                    { value: 'YES', label: 'Yes' },
                    { value: 'NO', label: 'No' },
                  ])}
                  {renderField('Offer Letter Verified', selectedCandidate.offer_letter_verified, false, 'dropdown', [
                    { value: 'YES', label: 'Yes' },
                    { value: 'NO', label: 'No' },
                  ])}
                  {renderField(
                    'Have you sent test mail to the resources current organization official email ID to check the authenticity',
                    selectedCandidate.test_mail_sent_to_organization,
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
              {selectedCandidate.skill_assessments && selectedCandidate.skill_assessments.length > 0 && (
                <div className="bg-white border border-gray-200 p-6 rounded-xl">
                  <h4 className="font-semibold text-lg text-gray-800 border-b pb-2 mb-4">Skills Assessment</h4>
                  <div className="space-y-4">
                    {selectedCandidate.skill_assessments.map((skill, index) => (
                      <div key={index} className="bg-gray-50 p-4">
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
              {selectedCandidate.work_experience_entries && selectedCandidate.work_experience_entries.length > 0 && (
                <div className="bg-white border border-gray-200 p-6 rounded-xl">
                  <h4 className="font-semibold text-lg text-gray-800 border-b pb-2 mb-4">Work Experience</h4>
                  <div className="space-y-4">
                    {selectedCandidate.work_experience_entries.map((exp, index) => (
                      <div key={index} className="bg-gray-50 p-4">
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
              <div className="bg-white border border-gray-200 p-6">
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
              </div>

              {/* Application Status */}
              <div className="bg-white border border-gray-200 p-6">
                <h4 className="font-semibold text-lg text-gray-800 border-b pb-2 mb-4">Application Status</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="mb-2">
                    <span className="font-medium text-gray-700">Status:</span>
                    <span
                      className={`ml-2 px-2 py-1 text-xs font-medium ${getStatusColor(
                        selectedCandidate.status
                      )}`}
                    >
                      {selectedCandidate.status}
                    </span>
                  </div>
                  <div className="mb-2">
                    <span className="font-medium text-gray-700">Applied Date:</span>
                    <span className="ml-2 text-gray-900">
                      {selectedCandidate.applied_date
                        ? new Date(selectedCandidate.applied_date).toLocaleDateString()
                        : 'Not available'}
                    </span>
                  </div>
                  <div className="mb-2 col-span-2">
                    <span className="font-medium text-gray-700">Notes:</span>
                    <span className="ml-2 text-gray-900">
                      {selectedCandidate.notes || 'No notes available'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {showStatusModal && selectedCandidate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 w-full max-w-md rounded-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                Update Status for {selectedCandidate.name}
              </h3>
              <button
                onClick={() => setShowStatusModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={statusForm.status}
                  onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
                  className="w-full px-4 py-3 text-sm bg-white/90 backdrop-blur-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 hover:border-slate-300 appearance-none cursor-pointer rounded-xl"
                >
                  <option value="applied">Applied</option>
                  <option value="in_progress">In Progress</option>
                  <option value="screen_reject">Screen Reject</option>
                  <option value="interviewed">Interviewed</option>
                  <option value="interview_reject">Interview Reject</option>
                  <option value="interview_selected">Interview Selected</option>
                  <option value="no_show_for_joining">No Show for Joining</option>
                  <option value="placed">Placed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={statusForm.notes}
                  onChange={(e) => setStatusForm({ ...statusForm, notes: e.target.value })}
                  className="w-full px-4 py-3 text-sm bg-white/90 backdrop-blur-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 placeholder:text-slate-400 hover:border-slate-300 rounded-xl"
                  rows="3"
                  placeholder="Add notes about the candidate..."
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button onClick={() => setShowStatusModal(false)} className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-slate-700 bg-white hover:bg-pastel-blue border border-slate-200 hover:border-primary-200 shadow-soft hover:shadow-medium transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 rounded-xl">
                  Cancel
                </button>
                <button onClick={handleStatusUpdate} className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-soft hover:shadow-medium transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none rounded-xl">
                  Update Status
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRCandidates;