import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Mail, Calendar, Plus, Trash2, Edit } from 'lucide-react'
import { toast } from 'react-toastify'
import api from '../../services/api'
import { useFormValidation, ValidatedInput } from '../../components/FormValidation'

// Animation variants for cards and modals
const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, type: 'spring', stiffness: 80 }
  })
}

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
}

const AdminUsers = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [deletingUser, setDeletingUser] = useState(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users')
      setUsers(response.data)
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId) => {
    try {
      await api.delete(`/admin/users/${userId}`)
      toast.success('HR user deleted successfully')
      fetchUsers()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete user')
    }
  }

  const handleAddUser = async (formData) => {
    try {
      await api.post('/admin/users', formData)
      toast.success('HR user added successfully')
      setShowAddForm(false)
      fetchUsers()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add user')
    }
  }

  const handleUpdateUser = async (userId, formData) => {
    try {
      await api.put(`/admin/users/${userId}`, formData)
      toast.success('HR user updated successfully')
      setEditingUser(null)
      fetchUsers()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update user')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-b-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="gradient-text text-3xl font-bold mb-1">HR Users</h1>
          <p className="text-slate-500">Manage HR personnel accounts</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn-primary"
        >
          <Plus className="h-5 w-5" />
          Add HR User
        </button>
      </motion.div>

      {/* Users List Card */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        className="card p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-slate-900">All HR Users</h3>
          <span className="text-sm text-slate-500">{users.length} users found</span>
        </div>

        {users.length === 0 ? (
          <div className="text-center py-12">
            <Users className="mx-auto h-14 w-14 text-slate-200" />
            <p className="mt-3 text-base text-slate-400">No HR users found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map((user, index) => (
              <motion.div
                key={user.id}
                custom={index}
                initial="hidden"
                animate="visible"
                variants={cardVariants}
                className="card p-5 hover-lift"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-r from-primary-600 to-primary-700 flex items-center justify-center shadow-soft">
                      <span className="text-lg font-semibold text-white">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="ml-4">
                      <h4 className="text-base font-semibold text-slate-900">{user.name}</h4>
                      <p className="text-xs text-slate-400 tracking-wide">{user.role.toUpperCase()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingUser(user)}
                      className="p-2 rounded-lg text-primary-600 hover:bg-primary-50 hover:text-primary-700 transition-colors duration-200"
                      title="Edit user"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setDeletingUser(user)}
                      className="p-2 rounded-lg text-danger-600 hover:bg-danger-50 hover:text-danger-700 transition-colors duration-200"
                      title="Delete user"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-slate-600">
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-slate-400" />
                    <span>{user.email}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-slate-400" />
                    <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Add HR User Form Modal */}
      <AnimatePresence>
        {showAddForm && (
          <Modal onClose={() => setShowAddForm(false)}>
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-xl border border-gray-200"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Add New HR User</h3>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold focus:outline-none"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              <AddHRForm onSubmit={handleAddUser} onCancel={() => setShowAddForm(false)} />
            </motion.div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Edit HR User Modal */}
      <AnimatePresence>
        {editingUser && (
          <Modal onClose={() => setEditingUser(null)}>
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-xl border border-gray-200"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Edit HR User</h3>
                <button
                  onClick={() => setEditingUser(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold focus:outline-none"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              <EditHRForm
                user={editingUser}
                onSubmit={handleUpdateUser}
                onCancel={() => setEditingUser(null)}
              />
            </motion.div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingUser && (
          <Modal onClose={() => setDeletingUser(null)}>
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-xl border border-gray-200"
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Delete HR User</h3>
              <p className="text-gray-600 mb-8">
                Are you sure you want to delete <strong>{deletingUser.name}</strong>? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setDeletingUser(null)}
                  className="px-5 py-2 rounded-lg text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleDeleteUser(deletingUser.id)
                    setDeletingUser(null)
                  }}
                  className="px-5 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  )
}

// Modal wrapper for overlay and centering
function Modal({ children, onClose }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.2 } }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
      style={{ background: 'rgba(0,0,0,0.18)' }}
      onClick={onClose}
    >
      <div
        className="w-full flex items-center justify-center"
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </motion.div>
  )
}

// Add HR User Form Component
const AddHRForm = ({ onSubmit, onCancel }) => {
  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit
  } = useFormValidation({
    name: '',
    email: '',
    password: ''
  })

  const handleFormSubmit = (formData) => {
    onSubmit({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role: 'hr'
    })
  }

  return (
    <form
      onSubmit={e => {
        e.preventDefault()
        handleSubmit(handleFormSubmit, {
          name: { required: true, message: 'Name is required' },
          email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Valid email is required' },
          password: { required: true, minLength: 6, message: 'Password must be at least 6 characters' }
        })
      }}
      className="space-y-5"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ValidatedInput
          name="name"
          label="HR Name"
          value={values.name}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.name}
          touched={touched.name}
          placeholder="Enter HR name"
        />
        <ValidatedInput
          name="email"
          label="Email"
          type="email"
          value={values.email}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.email}
          touched={touched.email}
          placeholder="Enter email address"
        />
      </div>
      <ValidatedInput
        name="password"
        label="Password"
        type="password"
        value={values.password}
        onChange={handleChange}
        onBlur={handleBlur}
        error={errors.password}
        touched={touched.password}
        placeholder="Enter password"
      />
      <div className="flex justify-end space-x-4 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2 rounded-lg text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-5 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition"
        >
          Add HR User
        </button>
      </div>
    </form>
  )
}

// Edit HR User Form Component
const EditHRForm = ({ user, onSubmit, onCancel }) => {
  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit
  } = useFormValidation({
    name: user.name,
    email: user.email,
    password: ''
  })

  const handleFormSubmit = (formData) => {
    const updateData = {
      name: formData.name,
      email: formData.email
    }
    if (formData.password) {
      updateData.password = formData.password
    }
    onSubmit(user.id, updateData)
  }

  return (
    <form
      onSubmit={e => {
        e.preventDefault()
        handleSubmit(handleFormSubmit, {
          name: { required: true, message: 'Name is required' },
          email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Valid email is required' },
          password: { minLength: 6, message: 'Password must be at least 6 characters (leave blank to keep current)' }
        })
      }}
      className="space-y-5"
    >
      <ValidatedInput
        name="name"
        label="HR Name"
        value={values.name}
        onChange={handleChange}
        onBlur={handleBlur}
        error={errors.name}
        touched={touched.name}
        placeholder="Enter HR name"
      />
      <ValidatedInput
        name="email"
        label="Email"
        type="email"
        value={values.email}
        onChange={handleChange}
        onBlur={handleBlur}
        error={errors.email}
        touched={touched.email}
        placeholder="Enter email address"
      />
      <ValidatedInput
        name="password"
        label="Password (leave blank to keep current)"
        type="password"
        value={values.password}
        onChange={handleChange}
        onBlur={handleBlur}
        error={errors.password}
        touched={touched.password}
        placeholder="Enter new password (optional)"
      />
      <div className="flex justify-end space-x-4 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2 rounded-lg text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-5 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition"
        >
          Update HR User
        </button>
      </div>
    </form>
  )
}

export default AdminUsers