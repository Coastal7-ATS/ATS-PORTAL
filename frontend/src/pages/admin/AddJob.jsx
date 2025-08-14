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
import * as XLSX from 'xlsx'
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

const cardClass = 'card p-8'

const AdminAddJob = () => {
  const navigate = useNavigate()
  const [uploadMethod, setUploadMethod] = useState('manual')
  const [uploadedFile, setUploadedFile] = useState(null)
  const [previewData, setPreviewData] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [hrUsers, setHrUsers] = useState([])
  const [salaryBands, setSalaryBands] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploadResult, setUploadResult] = useState(null)

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

  // File drop handler - now supports both CSV and Excel
  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0]
    if (file) {
      setUploadedFile(file)
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        parseCSV(file)
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                 file.type === 'application/vnd.ms-excel' || 
                 file.name.endsWith('.xlsx') || 
                 file.name.endsWith('.xls')) {
        parseExcel(file)
      } else {
        toast.error('Please upload a valid CSV or Excel file (.csv, .xlsx, .xls)')
      }
    }
  }, [salaryBands]) // Add salaryBands as dependency

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: false
  })

  // Calculate actual salary based on band and rate selection
  const calculateActualSalary = (band, rate) => {
    if (!band || !rate) return ''
    
    console.log('Calculating actual salary for:', { band, rate, salaryBands })
    
    const selectedBand = salaryBands.find(b => b.band === band)
    if (!selectedBand) {
      console.log('Band not found:', band)
      return ''
    }
    
    const rateValue = selectedBand.rates[rate]
    if (!rateValue) {
      console.log('Rate not found:', rate, 'Available rates:', selectedBand.rates)
      return ''
    }
    
    const result = (rateValue * 1920).toString()
    console.log('Calculated actual salary:', result)
    return result
  }

  // Calculate expected package based on actual salary and profit percentage
  const calculateExpectedPackage = (actualSalary, profitPercentage) => {
    if (!actualSalary || !profitPercentage) return ''
    
    const actual = parseFloat(actualSalary)
    const profit = parseFloat(profitPercentage)
    
    if (isNaN(actual) || isNaN(profit)) return ''
    
    const expected = actual - (actual * (profit / 100))
    console.log('Calculated expected package:', expected.toString())
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

  // Enhanced CSV parsing with proper handling of quoted fields and special characters
  const parseCSV = (file) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target.result
      const lines = text.split('\n').filter(line => line.trim())
      if (!lines.length) return setPreviewData(null)
      
      // Parse headers
      const headers = parseCSVLine(lines[0]).map(h => h.trim())
      
      // Parse data rows
      let parsedData = lines.slice(1).map((line, idx) => {
        const values = parseCSVLine(line)
        const row = {}
        headers.forEach((header, colIdx) => {
          row[header] = values[colIdx]?.trim() || ''
        })
        row.id = idx
        return row
      })

      // Normalize and pre-compute packages for preview
      parsedData = parsedData.map((row) => {
        const band = row.salary_band || row.band || row['Band'] || ''
        const rate = (row.salary_rate || row.rate || row['Rate'] || '').toString().toLowerCase()
        const profit = row.profit_percentage || row['profit_percentage'] || row['Profit Percentage'] || ''
        const assignedHr = row.assigned_hr || row['assigned_hr'] || row['Assigned HR'] || ''
        const startDate = row.start_date || row['Start Date'] || row['start_date'] || ''
        const endDate = row.end_date || row['End Date'] || row['end_date'] || ''
        const priority = row.priority || row['Priority'] || ''

        console.log('Processing row:', { band, rate, profit, salaryBands: salaryBands.length })

        let actual = ''
        if (band && rate) {
          actual = calculateActualSalary(band, rate)
        }
        let expected = ''
        if (actual && profit) {
          expected = calculateExpectedPackage(actual, profit)
        }

        console.log('Calculated values:', { actual, expected })

        return {
          ...row,
          salary_band: band,
          salary_rate: rate,
          profit_percentage: profit,
          assigned_hr: assignedHr,
          start_date: startDate,
          end_date: endDate,
          priority: priority,
          actual_salary: actual,
          expected_package: expected
        }
      })

      setPreviewData({ headers, data: parsedData })
    }
    reader.readAsText(file)
  }

  // Helper function to parse CSV lines with proper handling of quoted fields
  const parseCSVLine = (line) => {
    const result = []
    let current = ''
    let inQuotes = false
    let i = 0
    
    while (i < line.length) {
      const char = line[i]
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          current += '"'
          i += 2
        } else {
          // Toggle quote state
          inQuotes = !inQuotes
          i++
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        result.push(current)
        current = ''
        i++
      } else {
        current += char
        i++
      }
    }
    
    // Add the last field
    result.push(current)
    return result
  }

  // Excel file parsing
  const parseExcel = (file) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        
        // Convert to JSON with header row
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
        
        if (jsonData.length < 2) {
          toast.error('Excel file must have at least a header row and one data row')
          return
        }
        
        const headers = jsonData[0].map(h => h?.toString().trim() || '')
        let parsedData = jsonData.slice(1).map((row, idx) => {
          const rowObj = {}
          headers.forEach((header, colIdx) => {
            rowObj[header] = row[colIdx]?.toString().trim() || ''
          })
          rowObj.id = idx
          return rowObj
        })
        
        // Normalize and pre-compute packages for preview
        parsedData = parsedData.map((row) => {
          const band = row.salary_band || row.band || row['Band'] || ''
          const rate = (row.salary_rate || row.rate || row['Rate'] || '').toString().toLowerCase()
          const profit = row.profit_percentage || row['profit_percentage'] || row['Profit Percentage'] || ''
          const assignedHr = row.assigned_hr || row['assigned_hr'] || row['Assigned HR'] || ''
          const startDate = row.start_date || row['Start Date'] || row['start_date'] || ''
          const endDate = row.end_date || row['End Date'] || row['end_date'] || ''
          const priority = row.priority || row['Priority'] || ''

          console.log('Processing Excel row:', { band, rate, profit, salaryBands: salaryBands.length })

          let actual = ''
          if (band && rate) {
            actual = calculateActualSalary(band, rate)
          }
          let expected = ''
          if (actual && profit) {
            expected = calculateExpectedPackage(actual, profit)
          }

          console.log('Calculated Excel values:', { actual, expected })

          return {
            ...row,
            salary_band: band,
            salary_rate: rate,
            profit_percentage: profit,
            assigned_hr: assignedHr,
            start_date: startDate,
            end_date: endDate,
            priority: priority,
            actual_salary: actual,
            expected_package: expected
          }
        })
        
        setPreviewData({ headers, data: parsedData })
      } catch (error) {
        console.error('Error parsing Excel file:', error)
        toast.error('Error parsing Excel file. Please ensure it\'s a valid Excel file.')
      }
    }
    reader.readAsArrayBuffer(file)
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

  // Enhanced CSV bulk upload with proper field mapping
  const handleCSVUpload = async () => {
    if (!previewData || !previewData.data) return
    setUploading(true)
    try {
      const jobsData = previewData.data.map(row => ({
        csa_id: row.csa_id || '',
        title: row.title || '',
        description: row.description || '',
        location: row.location || '',
        salary_band: row.salary_band || row.band || '',
        salary_rate: row.salary_rate || row.rate || '',
        actual_salary: row.actual_salary || '',
        profit_percentage: row.profit_percentage || '',
        expected_package: row.expected_package || '',
        assigned_hr: row.assigned_hr || '',
        start_date: row.start_date || row['Start Date'] || row['start_date'] || '',
        end_date: row.end_date || row['End Date'] || row['end_date'] || '',
        priority: row.priority || ''
      }))
      const response = await api.post('/admin/add-jobs-bulk', jobsData)
      if (response.data && typeof response.data === 'object' && 'added_count' in response.data) {
        setUploadResult(response.data)
        toast.success(`Added ${response.data.added_count} jobs. Skipped ${response.data.skipped_count}.`)
      } else if (response.data?.message) {
        toast.success(response.data.message)
        navigate('/admin/jobs')
      } else {
        toast.success('Jobs processed')
        navigate('/admin/jobs')
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add jobs')
    } finally {
      setUploading(false)
    }
  }

  // Enhanced header validation for new format
  const validateHeaders = () => {
    if (!previewData) return false
    const requiredHeaders = ['csa_id', 'title', 'description']
    const headerMap = {
      'csa_id': ['csa_id', 'csa id'],
      'title': ['title', 'job title'],
      'description': ['description', 'job description']
    }
    
    const missing = requiredHeaders.filter(requiredHeader => {
      const possibleNames = headerMap[requiredHeader]
      return !previewData.headers.some(header => 
        possibleNames.some(name => header.toLowerCase().includes(name.toLowerCase()))
      )
    })
    
    return missing.length === 0
  }



  const hrOptionsManual = [
    { value: '', label: 'Select HR User' },
    ...hrUsers.map(hr => ({ value: hr.id, label: hr.name }))
  ]



  // Updated download sample CSV function with new format
  const downloadSampleCSV = () => {
    const csvContent = `csa_id,title,description,location,band,rate,profit_percentage,start_date,end_date,priority,assigned_hr`
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sample_jobs.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

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
          <p className="text-slate-500 mt-1">Add new job openings manually or via CSV/Excel</p>
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
            <span className="font-medium">File Upload</span>
            <span className="text-sm text-slate-500 mt-1">Upload multiple jobs via CSV/Excel</span>
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
                   label="CSA ID (Primary Key)"
                   value={manualForm.csa_id}
                   onChange={(name, value) => handleChange(name, value)}
                   onBlur={handleBlur}
                   error={errors.csa_id}
                   touched={touched.csa_id}
                   placeholder="6 character alphanumeric (e.g., U2XKD2)"
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
                  options={hrOptionsManual}
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

      {/* File Upload Section */}
      <AnimatePresence>
        {uploadMethod === 'csv' && (
          <>
            {/* File Upload Card */}
            <motion.div
              variants={fadeIn}
              className={cardClass}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload File</h3>
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
                    ? 'Drop the file here'
                    : 'Drag and drop a CSV or Excel file here, or click to select'}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Supported formats: CSV (.csv), Excel (.xlsx, .xls)
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

            {/* File Preview Card */}
            {uploadedFile && (
              <motion.div
                variants={fadeIn}
                className={cardClass}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="h-5 w-5 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  File Preview
                </h3>
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
                    
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white border border-gray-200 rounded-xl overflow-hidden">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px] w-[200px]">CSA ID</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Band</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit Percentage</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned HR</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actual Package</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expected Value</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {previewData.data.slice(0, 5).map((row) => (
                              <tr key={row.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm text-gray-900 min-w-[200px] w-[200px]">
                                  {row.csa_id || ''}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {row.title || ''}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  <div className="max-h-20 overflow-y-auto">
                                    {row.description || ''}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {row.location || ''}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {row.salary_band || row.band || ''}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {row.salary_rate || row.rate || ''}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {row.profit_percentage || ''}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {row.start_date || ''}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {row.end_date || ''}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {row.priority || ''}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {row.assigned_hr || ''}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {row.actual_salary || ''}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {row.expected_package || ''}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      {previewData.data.length > 5 && (
                        <div className="text-center text-sm text-gray-500 mt-2">
                          Showing first 5 rows of {previewData.data.length} total rows
                        </div>
                      )}
                      {uploadResult && (
                        <div className="mt-6 p-4 border border-gray-200 rounded-xl bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-800">
                              <span className="font-semibold">Added:</span> {uploadResult.added_count} &nbsp;|&nbsp; <span className="font-semibold">Skipped:</span> {uploadResult.skipped_count}
                            </div>
                            <button
                              onClick={() => navigate('/admin/jobs')}
                              className="px-3 py-1.5 text-sm rounded-lg bg-primary-600 text-white hover:bg-primary-700"
                            >
                              Go to Jobs
                            </button>
                          </div>
                          {Array.isArray(uploadResult.skipped_rows) && uploadResult.skipped_rows.length > 0 && (
                            <div className="mt-3 max-h-48 overflow-auto bg-white border border-gray-200 rounded-lg">
                              <table className="min-w-full text-sm">
                                <thead className="bg-gray-100">
                                  <tr>
                                    <th className="px-3 py-2 text-left text-gray-600">Row</th>
                                    <th className="px-3 py-2 text-left text-gray-600">Reasons</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {uploadResult.skipped_rows.slice(0, 50).map((r, i) => (
                                    <tr key={i} className="border-t">
                                      <td className="px-3 py-2 text-gray-800">{r.row_index}</td>
                                      <td className="px-3 py-2 text-gray-700">{(r.reasons || []).join(', ')}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                              {uploadResult.skipped_rows.length > 50 && (
                                <div className="text-xs text-gray-500 px-3 py-2">Showing first 50 of {uploadResult.skipped_rows.length} skipped rows</div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
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
                    <p className="text-xs text-gray-400">Upload a CSV or Excel file to see parsed data</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* File Requirements Card */}
            <motion.div
              variants={fadeIn}
              className={cardClass}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="h-5 w-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                File Format Requirements
              </h3>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-2">Required Columns:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        <span className="font-medium">csa_id</span>
                        <span className="text-blue-600">(Primary Key)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        <span className="font-medium">title</span>
                        <span className="text-blue-600">(Job Title)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        <span className="font-medium">description</span>
                        <span className="text-blue-600">(Job Description)</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-2">Column Order:</h4>
                    <div className="text-sm text-blue-800 bg-blue-100 p-3 rounded-lg">
                      <code>csa_id, title, description, location, band, rate, profit_percentage, start_date, end_date, priority, assigned_hr</code>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-2">Special Handling:</h4>
                    <ul className="space-y-1 text-sm text-blue-800">
                      <li>• <strong>Job Description:</strong> Supports long text with paragraphs, bullet points, commas, and special characters</li>
                      <li>• <strong>CSA ID:</strong> Must be unique across the system</li>
                      <li>• <strong>Band/Rate:</strong> Optional; Rate must be one of <em>standard</em>, <em>ra1</em>, <em>ra2</em></li>
                      <li>• <strong>Priority:</strong> Optional; use <em>low</em>, <em>medium</em>, or <em>high</em></li>
                      <li>• <strong>Assigned HR:</strong> Optional; provide HR <em>username</em> (case-insensitive)</li>
                      <li>• <strong>Profit %:</strong> Optional integer (e.g., 15)</li>
                      <li>• <strong>Dates:</strong> Use dd-mm-yyyy format (e.g., 01-09-2025)</li>
                      <li>• <strong>File Formats:</strong> CSV (.csv) and Excel (.xlsx, .xls) are supported</li>
                      <li>• <strong>CSV Format:</strong> Use quotes around text fields to handle commas and special characters</li>
                    </ul>
                  </div>
                  
                  <div className="mt-3 text-xs text-blue-700 bg-blue-100 p-3 rounded-lg">
                    <div className="font-semibold mb-1">💡 Tips:</div>
                    <ul className="space-y-1">
                      <li>• Use quotes around text values to handle commas and special characters</li>
                      <li>• Ensure required columns (csa_id, title, description) are present</li>
                      <li>• Band and Rate drive automatic package calculation (rate × 1920)</li>
                      <li>• Profit percentage drives expected value calculation</li>
                      <li>• CSA ID must be unique (alphanumeric characters)</li>
                    </ul>
                  </div>
                  <div className="mt-4 flex justify-center">
                    <button
                      onClick={downloadSampleCSV}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download Sample CSV
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default AdminAddJob
