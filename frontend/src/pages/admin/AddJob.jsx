import React, { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload as UploadIcon,
  FileText,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Plus
} from 'lucide-react'
import { toast } from 'react-toastify'
import api from '../../services/api'
import {
  useFormValidation,
  ValidatedInput,
  ValidatedSelect
} from '../../components/FormValidation'

const fadeInUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
}

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4 } }
}

const cardClass =
  'card p-8'

const AdminAddJob = () => {
  const navigate = useNavigate()
  const [uploadMethod, setUploadMethod] = useState('manual')
  const [uploadedFile, setUploadedFile] = useState(null)
  const [previewData, setPreviewData] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [hrUsers, setHrUsers] = useState([])
  const [salaryBands, setSalaryBands] = useState([])
  const [loading, setLoading] = useState(true)

  // Manual form validation
  const {
    values: manualForm,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit
  } = useFormValidation({
    title: '',
    description: '',
    location: '',
    actual_salary: '',
    salary_band: '',
    salary_rate: '',
    profit_percentage: '',
    expected_package: '',
    priority: '',
    csa_id: '',
    start_date: '',
    end_date: '',
    assigned_hr: ''
  })

  // Fetch HR users and salary bands on mount
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [hrResponse, salaryBandsResponse] = await Promise.all([
          api.get('/admin/users'),
          api.get('/admin/salary-bands')
        ])
        setHrUsers(hrResponse.data)
        setSalaryBands(salaryBandsResponse.data)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // CSV drop handler
  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0]
    if (file && file.type === 'text/csv') {
      setUploadedFile(file)
      parseCSV(file)
    } else {
      toast.error('Please upload a valid CSV file')
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    multiple: false
  })

  // Calculate actual salary based on band and rate selection
  const calculateActualSalary = (band, rate) => {
    if (!band || !rate) return ''
    
    const selectedBand = salaryBands.find(b => b.band === band)
    if (!selectedBand) return ''
    
    const rateValue = selectedBand.rates[rate]
    if (!rateValue) return ''
    
    return (rateValue * 1920).toString()
  }

  // Calculate expected package based on actual salary and profit percentage
  const calculateExpectedPackage = (actualSalary, profitPercentage) => {
    if (!actualSalary || !profitPercentage) return ''
    
    const actual = parseFloat(actualSalary)
    const profit = parseFloat(profitPercentage)
    
    if (isNaN(actual) || isNaN(profit)) return ''
    
    const expected = actual - (actual * (profit / 100))
    return expected.toString()
  }

  // Handle salary band change
  const handleSalaryBandChange = (name, value) => {
    handleChange(name, value)
    
    // Recalculate salary if rate is also selected
    if (manualForm.salary_rate) {
      const newSalary = calculateActualSalary(value, manualForm.salary_rate)
      handleChange('actual_salary', newSalary)
      
      // Recalculate expected package if profit percentage is also selected
      if (manualForm.profit_percentage) {
        const newExpected = calculateExpectedPackage(newSalary, manualForm.profit_percentage)
        handleChange('expected_package', newExpected)
      }
    }
  }

  // Handle salary rate change
  const handleSalaryRateChange = (name, value) => {
    handleChange(name, value)
    
    // Recalculate salary if band is also selected
    if (manualForm.salary_band) {
      const newSalary = calculateActualSalary(manualForm.salary_band, value)
      handleChange('actual_salary', newSalary)
      
      // Recalculate expected package if profit percentage is also selected
      if (manualForm.profit_percentage) {
        const newExpected = calculateExpectedPackage(newSalary, manualForm.profit_percentage)
        handleChange('expected_package', newExpected)
      }
    }
  }

  // Handle profit percentage change
  const handleProfitPercentageChange = (name, value) => {
    handleChange(name, value)
    
    // Recalculate expected package if actual salary is also selected
    if (manualForm.actual_salary) {
      const newExpected = calculateExpectedPackage(manualForm.actual_salary, value)
      handleChange('expected_package', newExpected)
    }
  }

  // CSV salary band change handler
  const handleCSVSalaryBandChange = (rowId, band) => {
    setPreviewData(prev => ({
      ...prev,
      data: prev.data.map(row => {
        if (row.id === rowId) {
          const newRow = { ...row, salary_band: band }
          // Recalculate salary if rate is also selected
          if (row.salary_rate) {
            const newSalary = calculateActualSalary(band, row.salary_rate)
            newRow.actual_salary = newSalary
            
            // Recalculate expected package if profit percentage is also selected
            if (row.profit_percentage) {
              const newExpected = calculateExpectedPackage(newSalary, row.profit_percentage)
              newRow.expected_package = newExpected
            }
          }
          return newRow
        }
        return row
      })
    }))
  }

  // CSV salary rate change handler
  const handleCSVSalaryRateChange = (rowId, rate) => {
    setPreviewData(prev => ({
      ...prev,
      data: prev.data.map(row => {
        if (row.id === rowId) {
          const newRow = { ...row, salary_rate: rate }
          // Recalculate salary if band is also selected
          if (row.salary_band) {
            const newSalary = calculateActualSalary(row.salary_band, rate)
            newRow.actual_salary = newSalary
            
            // Recalculate expected package if profit percentage is also selected
            if (row.profit_percentage) {
              const newExpected = calculateExpectedPackage(newSalary, row.profit_percentage)
              newRow.expected_package = newExpected
            }
          }
          return newRow
        }
        return row
      })
    }))
  }

  // CSV profit percentage change handler
  const handleCSVProfitPercentageChange = (rowId, percentage) => {
    setPreviewData(prev => ({
      ...prev,
      data: prev.data.map(row => {
        if (row.id === rowId) {
          const newRow = { ...row, profit_percentage: percentage }
          // Recalculate expected package if actual salary is also selected
          if (row.actual_salary) {
            const newExpected = calculateExpectedPackage(row.actual_salary, percentage)
            newRow.expected_package = newExpected
          }
          return newRow
        }
        return row
      })
    }))
  }

  // CSV priority change handler
  const handleCSVPriorityChange = (rowId, priority) => {
    setPreviewData(prev => ({
      ...prev,
      data: prev.data.map(row => {
        if (row.id === rowId) {
          return { ...row, priority: priority }
        }
        return row
      })
    }))
  }

  // CSV parsing
  const parseCSV = (file) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target.result
      const lines = text.split('\n').filter(line => line.trim())
      if (!lines.length) return setPreviewData(null)
      const headers = lines[0].split(',').map(h => h.trim())
      const parsedData = lines.slice(1).map((line, idx) => {
        const values = line.split(',')
        const row = {}
        headers.forEach((header, colIdx) => {
          row[header] = values[colIdx]?.trim() || ''
        })
        row.assigned_hr = ''
        row.id = idx
        return row
      })
      setPreviewData({ headers, data: parsedData })
    }
    reader.readAsText(file)
  }

  // Manual form submit
  const handleManualSubmit = async (formData) => {
    setUploading(true)
    try {
      const jobData = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        salary_package: formData.actual_salary,
        salary_band: formData.salary_band,
        salary_rate: formData.salary_rate,
        profit_percentage: formData.profit_percentage,
        expected_package: formData.expected_package,
        priority: formData.priority,
        csa_id: formData.csa_id,
        start_date: formData.start_date,
        end_date: formData.end_date,
        source_company: 'Manual Entry',
        assigned_hr: formData.assigned_hr
      }
      await api.post('/admin/add-job', jobData)
      toast.success('Job added successfully!')
      navigate('/admin/jobs')
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add job')
    } finally {
      setUploading(false)
    }
  }

  // CSV bulk upload
  const handleCSVUpload = async () => {
    if (!previewData || !previewData.data) return
    setUploading(true)
    try {
      const jobsData = previewData.data.map(row => ({
        title: row.title,
        description: row.description,
        location: row.location,
        actual_salary: row.actual_salary,
        salary_band: row.salary_band,
        salary_rate: row.salary_rate,
        profit_percentage: row.profit_percentage,
        expected_package: row.expected_package,
        priority: row.priority,
        csa_id: row.csa_id,
        start_date: row.start_date,
        end_date: row.end_date,
        assigned_hr: row.assigned_hr || null
      }))
      const response = await api.post('/admin/add-jobs-bulk', jobsData)
      toast.success(response.data.message)
      navigate('/admin/jobs')
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add jobs')
    } finally {
      setUploading(false)
    }
  }

  // CSV header validation
  const validateHeaders = () => {
    if (!previewData) return false
    const requiredHeaders = ['title', 'description', 'location']
    const missing = requiredHeaders.filter(header =>
      !previewData.headers.some(h => h.toLowerCase().includes(header.toLowerCase()))
    )
    return missing.length === 0
  }

  // Assign HR in CSV preview
  const handleAssignHRChange = (rowId, hrId) => {
    if (!previewData) return
    const updatedData = previewData.data.map(row =>
      row.id === rowId ? { ...row, assigned_hr: hrId } : row
    )
    setPreviewData({ ...previewData, data: updatedData })
  }

  const hrOptions = [
    { value: '', label: 'Select HR User' },
    ...hrUsers.map(hr => ({
      value: hr.id,
      label: hr.name
    }))
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-white rounded-2xl">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
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
          onClick={() => navigate('/admin/jobs')}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors duration-200"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </button>
        <div>
          <h1 className="gradient-text text-3xl font-bold">Add Job</h1>
          <p className="text-slate-500 mt-1">Add new job openings manually or via CSV</p>
        </div>
      </motion.div>

      {/* Upload Method Selection */}
      <motion.div
        variants={fadeInUp}
        className={`${cardClass} mb-6`}
      >
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Select Upload Method</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setUploadMethod('manual')}
            className={`flex flex-col items-center p-5 border transition-all rounded-xl focus:outline-none ${
              uploadMethod === 'manual'
                ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-soft'
                : 'border-slate-200 hover:border-primary-400 bg-white hover-lift'
            }`}
          >
            <Plus className="h-8 w-8 mb-2" />
            <span className="font-medium">Manual Entry</span>
            <span className="text-sm text-slate-500 mt-1">Add jobs one by one</span>
          </button>
          <button
            onClick={() => setUploadMethod('csv')}
            className={`flex flex-col items-center p-5 border transition-all rounded-xl focus:outline-none ${
              uploadMethod === 'csv'
                ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-soft'
                : 'border-slate-200 hover:border-primary-400 bg-white hover-lift'
            }`}
          >
            <UploadIcon className="h-8 w-8 mb-2" />
            <span className="font-medium">CSV Upload</span>
            <span className="text-sm text-slate-500 mt-1">Upload multiple jobs via CSV</span>
          </button>
        </div>
      </motion.div>

      {/* Manual Entry Form */}
      <AnimatePresence>
        {uploadMethod === 'manual' && (
          <motion.div
            key="manual-form"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={fadeInUp}
            className={`${cardClass} mb-6`}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Manual Job Entry</h3>
            <form
              onSubmit={e => {
                e.preventDefault()
                handleSubmit(handleManualSubmit, {
                  title: { required: true, message: 'Job title is required' },
                  description: { required: true, message: 'Job description is required' },
                  location: { required: true, message: 'Location is required' },
                  csa_id: { required: true, message: 'CSA ID is required' },
                  salary_band: { required: true, message: 'Salary band is required' },
                  salary_rate: { required: true, message: 'Rate type is required' },
                  actual_salary: { required: true, message: 'Actual salary is required' },
                  profit_percentage: { required: true, message: 'Profit percentage is required' },
                  expected_package: { required: true, message: 'Expected package is required' },
                  priority: { required: true, message: 'Priority is required' },
                  start_date: { required: true, message: 'Start date is required' },
                  end_date: { required: true, message: 'End date is required' },
                  assigned_hr: { required: true, message: 'Please assign to an HR' }
                })
              }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                 <ValidatedInput
                   name="title"
                   label="Job Title"
                   value={manualForm.title}
                   onChange={(name, value) => handleChange(name, value)}
                   onBlur={handleBlur}
                   error={errors.title}
                   touched={touched.title}
                   placeholder="e.g., Software Engineer"
                 />
                                 <ValidatedInput
                   name="location"
                   label="Location"
                   value={manualForm.location}
                   onChange={(name, value) => handleChange(name, value)}
                   onBlur={handleBlur}
                   error={errors.location}
                   touched={touched.location}
                   placeholder="e.g., Bangalore"
                 />
                 <ValidatedInput
                   name="csa_id"
                   label="CSA ID"
                   value={manualForm.csa_id}
                   onChange={(name, value) => handleChange(name, value)}
                   onBlur={handleBlur}
                   error={errors.csa_id}
                   touched={touched.csa_id}
                   placeholder="6 character alphanumeric"
                   maxLength={6}
                 />
                                 <ValidatedSelect
                   name="salary_band"
                   label="Salary Band"
                   options={[
                     { value: '', label: 'Select salary band' },
                     ...salaryBands.map(band => ({
                       value: band.band,
                       label: `${band.band}${band.experience_range ? ` (${band.experience_range})` : ''}`
                     }))
                   ]}
                   value={manualForm.salary_band}
                   onChange={handleSalaryBandChange}
                   onBlur={handleBlur}
                   error={errors.salary_band}
                   touched={touched.salary_band}
                   placeholder="Select salary band"
                 />
                                 <ValidatedSelect
                   name="salary_rate"
                   label="Rate Type"
                   options={[
                     { value: '', label: 'Select rate type' },
                     { value: 'standard', label: 'Standard' },
                     { value: 'ra1', label: 'RA1' },
                     { value: 'ra2', label: 'RA2' }
                   ]}
                   value={manualForm.salary_rate}
                   onChange={handleSalaryRateChange}
                   onBlur={handleBlur}
                   error={errors.salary_rate}
                   touched={touched.salary_rate}
                   placeholder="Select rate type"
                 />
                                 <ValidatedInput
                   name="actual_salary"
                   label="Actual Salary"
                   value={manualForm.actual_salary}
                   onChange={(name, value) => handleChange(name, value)}
                   onBlur={handleBlur}
                   error={errors.actual_salary}
                   touched={touched.actual_salary}
                   placeholder="Calculated automatically"
                   readOnly
                 />
                 <ValidatedInput
                   name="profit_percentage"
                   label="Profit Percentage"
                   value={manualForm.profit_percentage}
                   onChange={handleProfitPercentageChange}
                   onBlur={handleBlur}
                   error={errors.profit_percentage}
                   touched={touched.profit_percentage}
                   placeholder="e.g., 15"
                   type="number"
                   min="0"
                   max="100"
                 />
                 <ValidatedInput
                   name="expected_package"
                   label="Expected Package"
                   value={manualForm.expected_package}
                   onChange={(name, value) => handleChange(name, value)}
                   onBlur={handleBlur}
                   error={errors.expected_package}
                   touched={touched.expected_package}
                   placeholder="Calculated automatically"
                   readOnly
                 />
                 <ValidatedInput
                   name="start_date"
                   label="Start Date"
                   type="date"
                   value={manualForm.start_date}
                   onChange={(name, value) => handleChange(name, value)}
                   onBlur={handleBlur}
                   error={errors.start_date}
                   touched={touched.start_date}
                 />
                 <ValidatedInput
                   name="end_date"
                   label="End Date"
                   type="date"
                   value={manualForm.end_date}
                   onChange={(name, value) => handleChange(name, value)}
                   onBlur={handleBlur}
                   error={errors.end_date}
                   touched={touched.end_date}
                 />
                 <ValidatedSelect
                   name="priority"
                   label="Priority"
                   options={[
                     { value: '', label: 'Select priority' },
                     { value: 'low', label: 'Low' },
                     { value: 'medium', label: 'Medium' },
                     { value: 'high', label: 'High' }
                   ]}
                   value={manualForm.priority}
                   onChange={(name, value) => handleChange(name, value)}
                   onBlur={handleBlur}
                   error={errors.priority}
                   touched={touched.priority}
                   placeholder="Select priority"
                 />
                 <ValidatedSelect
                   name="assigned_hr"
                   label="Assign to HR"
                   options={hrOptions}
                   value={manualForm.assigned_hr}
                   onChange={(name, value) => handleChange(name, value)}
                   onBlur={handleBlur}
                   error={errors.assigned_hr}
                   touched={touched.assigned_hr}
                 />
              </div>
                             <ValidatedInput
                 name="description"
                 label="Job Description"
                 value={manualForm.description}
                 onChange={(name, value) => handleChange(name, value)}
                 onBlur={handleBlur}
                 error={errors.description}
                 touched={touched.description}
                 placeholder="Detailed job description..."
                 textarea
                 rows={4}
               />
              <button
                type="submit"
                disabled={uploading}
                className="w-full py-3 mt-2 rounded-xl bg-primary-600 text-white font-semibold shadow transition-all hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Adding Job...
                  </div>
                ) : (
                  'Add Job'
                )}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CSV Upload Section */}
      <AnimatePresence>
        {uploadMethod === 'csv' && (
          <motion.div
            key="csv-section"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={fadeInUp}
            className="space-y-6 mb-6"
          >
            {/* CSV Upload Card */}
            <motion.div
              variants={fadeIn}
              className={cardClass}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload CSV File</h3>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all bg-gray-50 ${
                  isDragActive
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-primary-400'
                }`}
              >
                <input {...getInputProps()} />
                <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">
                  {isDragActive
                    ? 'Drop the CSV file here'
                    : 'Drag and drop a CSV file here, or click to select'}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Only CSV files are supported
                </p>
              </div>
              {uploadedFile && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 bg-white border border-gray-100 rounded-xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{uploadedFile.name}</div>
                      <div className="text-xs text-gray-500">
                        Size: {(uploadedFile.size / 1024).toFixed(2)} KB
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setUploadedFile(null)
                      setPreviewData(null)
                    }}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200"
                    title="Delete file"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </motion.div>
              )}
            </motion.div>

            {/* CSV Preview Card */}
            {uploadedFile && (
              <motion.div
                variants={fadeIn}
                className={cardClass}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">CSV Preview</h3>
                {previewData ? (
                  <div className="space-y-4">
                    <div
                      className={`flex items-center p-3 rounded-xl transition-all ${
                        validateHeaders()
                          ? 'bg-green-50 text-green-800'
                          : 'bg-red-50 text-red-800'
                      }`}
                    >
                      {validateHeaders() ? (
                        <CheckCircle className="h-5 w-5 mr-2" />
                      ) : (
                        <AlertCircle className="h-5 w-5 mr-2" />
                      )}
                      <span className="text-sm font-medium">
                        {validateHeaders()
                          ? 'File format is valid'
                          : 'Missing required columns'}
                      </span>
                    </div>
                    <div className="overflow-x-auto rounded-xl border border-gray-100">
                      <table className="min-w-full bg-white rounded-xl">
                        <thead>
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                              Job Title
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                              Description
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                              Location
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                              Salary Band
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                              Rate Type
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                              Actual Salary
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                              Profit Percentage
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                              Expected Package
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                              Priority
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                              Assign to HR
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {previewData.data.map(row => (
                            <tr key={row.id} className="hover:bg-gray-50 transition">
                              <td className="px-4 py-2 text-sm text-gray-900">{row.title}</td>
                              <td
                                className="px-4 py-2 text-sm text-gray-900 max-w-xs truncate"
                                title={row.description}
                              >
                                {row.description}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-900">{row.location}</td>
                              <td className="px-4 py-2 text-sm text-gray-900">
                                <select
                                  value={row.salary_band || ''}
                                  onChange={e => handleCSVSalaryBandChange(row.id, e.target.value)}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
                                >
                                  <option value="">Select Band</option>
                                  {salaryBands.map(band => (
                                    <option key={band.band} value={band.band}>
                                      {band.band}{band.experience_range ? ` (${band.experience_range})` : ''}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-900">
                                <select
                                  value={row.salary_rate || ''}
                                  onChange={e => handleCSVSalaryRateChange(row.id, e.target.value)}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
                                >
                                  <option value="">Select Rate</option>
                                  <option value="standard">Standard</option>
                                  <option value="ra1">RA1</option>
                                  <option value="ra2">RA2</option>
                                </select>
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-900">
                                <input
                                  type="text"
                                  value={row.actual_salary || ''}
                                  readOnly
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md bg-gray-50"
                                  placeholder="Calculated automatically"
                                />
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-900">
                                <input
                                  type="text"
                                  value={row.profit_percentage || ''}
                                  onChange={e => handleCSVProfitPercentageChange(row.id, e.target.value)}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
                                />
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-900">
                                <input
                                  type="text"
                                  value={row.expected_package || ''}
                                  readOnly
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md bg-gray-50"
                                  placeholder="Calculated automatically"
                                />
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-900">
                                <select
                                  value={row.priority || ''}
                                  onChange={e => handleCSVPriorityChange(row.id, e.target.value)}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
                                >
                                  <option value="">Select Priority</option>
                                  <option value="low">Low</option>
                                  <option value="medium">Medium</option>
                                  <option value="high">High</option>
                                </select>
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-900">
                                <select
                                  value={row.assigned_hr}
                                  onChange={e => handleAssignHRChange(row.id, e.target.value)}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
                                >
                                  <option value="">Select HR</option>
                                  {hrUsers.map(hr => (
                                    <option key={hr.id} value={hr.id}>
                                      {hr.name}
                                    </option>
                                  ))}
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <button
                      onClick={handleCSVUpload}
                      disabled={uploading || !validateHeaders()}
                      className="w-full py-3 rounded-xl bg-primary-600 text-white font-semibold shadow transition-all hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploading ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Adding Jobs...
                        </div>
                      ) : (
                        'Add Jobs'
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <FileText className="mx-auto h-12 w-12 mb-2" />
                    <p className="text-sm">No file selected</p>
                    <p className="text-xs text-gray-400">Upload a CSV file to see parsed data</p>
                  </div>
                )}

                {/* CSV Format Requirements */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">CSV Format Requirements</h4>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div>
                        <h5 className="font-semibold text-blue-900 mb-3 flex items-center">
                          <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          Required Columns
                        </h5>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-100">
                            <div className="flex items-center">
                              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                              <span className="font-mono font-semibold text-blue-700">title</span>
                            </div>
                            <span className="text-sm text-gray-600">Job title</span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-100">
                            <div className="flex items-center">
                              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                              <span className="font-mono font-semibold text-blue-700">description</span>
                            </div>
                            <span className="text-sm text-gray-600">Job description</span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-100">
                            <div className="flex items-center">
                              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                              <span className="font-mono font-semibold text-blue-700">location</span>
                            </div>
                            <span className="text-sm text-gray-600">Job location</span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-100">
                            <div className="flex items-center">
                              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                              <span className="font-mono font-semibold text-blue-700">csa_id</span>
                            </div>
                            <span className="text-sm text-gray-600">CSA ID</span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-100">
                            <div className="flex items-center">
                              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                              <span className="font-mono font-semibold text-blue-700">start_date</span>
                            </div>
                            <span className="text-sm text-gray-600">Start Date (YYYY-MM-DD)</span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-100">
                            <div className="flex items-center">
                              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                              <span className="font-mono font-semibold text-blue-700">end_date</span>
                            </div>
                            <span className="text-sm text-gray-600">End Date (YYYY-MM-DD)</span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-green-100 rounded-lg border border-green-200">
                            <div className="flex items-center">
                              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                              <span className="font-mono font-semibold text-green-700">profit_percentage</span>
                            </div>
                            <span className="text-sm text-gray-600">Profit % (calculated in preview)</span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-green-100 rounded-lg border border-green-200">
                            <div className="flex items-center">
                              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                              <span className="font-mono font-semibold text-green-700">expected_package</span>
                            </div>
                            <span className="text-sm text-gray-600">Expected Package (auto-calculated)</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h5 className="font-semibold text-blue-900 mb-3 flex items-center">
                          <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                          </svg>
                          Example Format
                        </h5>
                        <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                          <div className="mb-2">
                            <span className="text-gray-400"># Header row</span>
                          </div>
                                                     <div className="mb-1">
                             <span className="text-yellow-400">title</span>
                             <span className="text-gray-400">,</span>
                             <span className="text-yellow-400">description</span>
                             <span className="text-gray-400">,</span>
                             <span className="text-yellow-400">location</span>
                             <span className="text-gray-400">,</span>
                             <span className="text-yellow-400">csa_id</span>
                             <span className="text-gray-400">,</span>
                             <span className="text-yellow-400">start_date</span>
                             <span className="text-gray-400">,</span>
                             <span className="text-yellow-400">end_date</span>
                           </div>
                          <div className="mt-4 mb-2">
                            <span className="text-gray-400"># Data rows</span>
                          </div>
                                                     <div className="mb-1">
                             <span className="text-green-400">"Software Engineer"</span>
                             <span className="text-gray-400">,</span>
                             <span className="text-green-400">"Develop web applications using React"</span>
                             <span className="text-gray-400">,</span>
                             <span className="text-green-400">"Bangalore"</span>
                             <span className="text-gray-400">,</span>
                             <span className="text-green-400">"u452jsx"</span>
                             <span className="text-gray-400">,</span>
                             <span className="text-green-400">"2025-01-15"</span>
                             <span className="text-gray-400">,</span>
                             <span className="text-green-400">"2025-02-15"</span>
                           </div>
                           <div>
                             <span className="text-green-400">"Data Analyst"</span>
                             <span className="text-gray-400">,</span>
                             <span className="text-green-400">"Analyze data and create reports"</span>
                             <span className="text-gray-400">,</span>
                             <span className="text-green-400">"Mumbai"</span>
                             <span className="text-gray-400">,</span>
                             <span className="text-green-400">"u452jsy"</span>
                             <span className="text-gray-400">,</span>
                             <span className="text-green-400">"2025-01-20"</span>
                             <span className="text-gray-400">,</span>
                             <span className="text-green-400">"2025-02-20"</span>
                           </div>
                        </div>
                        <div className="mt-3 text-xs text-blue-700 bg-blue-100 p-3 rounded-lg">
                          <div className="font-semibold mb-1">💡 Tips:</div>
                          <ul className="space-y-1">
                            <li>• Use quotes around text values to handle commas</li>
                            <li>• Ensure all required columns are present</li>
                            <li>• Don't include empty rows at the end</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default AdminAddJob