import React, { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from './LoadingSpinner'
import logoImage from '../assets/Coastal_Seven_Consulting_color.png'
import { 
  Home, 
  Upload, 
  Briefcase, 
  Users, 
  UserCheck, 
  LogOut,
  Menu,
  X,
  
  Shield
} from 'lucide-react'

// --- Modern Animated Dashboard Card ---
export function AnimatedDashboardCard({
  color = 'from-primary-500 to-primary-600',
  icon: Icon,
  value,
  label,
  className = "",
  children,
  trend = null,
  trendValue = null
}) {
  return (
    <div
      className={`
        bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-soft
        hover:shadow-medium transition-all duration-200 hover:scale-[1.02]
        border border-white/50 group relative overflow-hidden
        ${className}
      `}
    >
      {/* Background gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-10 group-hover:opacity-15 transition-opacity duration-200`} />
      
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex-1">
          <div className="text-3xl font-bold text-slate-800 mb-1">{value}</div>
          <div className="text-sm font-medium text-slate-600">{label}</div>
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${
              trend === 'up' ? 'text-success-600' : 'text-danger-600'
            }`}>
              <span className={trend === 'up' ? 'rotate-0' : 'rotate-180'}>↗</span>
              {trendValue}
            </div>
          )}
          {children}
        </div>
        
        <div className="relative z-10">
          <div
            className={`
              flex items-center justify-center rounded-full h-12 w-12
              bg-gradient-to-br ${color} text-white shadow-soft
              transition-all duration-200 group-hover:scale-110 group-hover:shadow-glow
            `}
          >
            {Icon && <Icon className="h-6 w-6" />}
          </div>
        </div>
      </div>
    </div>
  );
}

const Layout = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Early return if user is not available
  if (!user) {
    return <LoadingSpinner message="Loading user data..." />
  }

  // Determine user role and navigation items
  const isAdmin = user?.role === 'admin'

  const adminNavItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: Home },
    { name: 'Jobs', path: '/admin/jobs', icon: Briefcase },
    { name: 'History', path: '/admin/history', icon: Upload },
    { name: 'HR Users', path: '/admin/users', icon: Users },
    { name: 'Candidates', path: '/admin/candidates', icon: UserCheck },
  ]

  const hrNavItems = [
    { name: 'Dashboard', path: '/hr/dashboard', icon: Home },
    { name: 'My Jobs', path: '/hr/jobs', icon: Briefcase },
    { name: 'Candidates', path: '/hr/candidates', icon: UserCheck },
  ]

  const navItems = isAdmin ? adminNavItems : hrNavItems

  // Handle logout with smooth transition
  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Modern Navigation Item Component
  const NavItem = ({ item, isActive, onClick, className = "" }) => {
    const Icon = item.icon
    return (
      <button
        onClick={onClick}
        className={`
          w-full flex items-center px-6 py-4 text-sm font-medium rounded-xl
          transition-all duration-200 ease-in-out group relative overflow-hidden
          ${isActive
            ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
            : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
          }
          ${className}
        `}
      >
        <Icon className={`mr-4 h-5 w-5 transition-all duration-200 ${isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-blue-600'}`} />
        <div className="flex-1 text-left">
          <div className="font-semibold">{item.name}</div>
        </div>
      </button>
    )
  }

  // User Profile with logout icon at right of username, visible on hover with transition
  const UserProfile = ({ className = "" }) => (
    <div className={`relative group ${className}`}>
      <div
        className="flex items-center p-4 bg-gray-50 backdrop-blur-sm rounded-xl border border-gray-200 hover:bg-blue-50 transition-all duration-200 cursor-pointer"
      >
        <div className="flex-shrink-0">
          <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center border-2 border-blue-700 group-hover:border-blue-800 transition-all duration-200">
            <span className="text-lg font-bold text-white">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
        </div>
        <div className="ml-4 flex-1 flex items-center justify-between">
          <div className="text-left">
            <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              {user?.name || 'User'}
              {/* Logout icon, appears on hover */}
              <button
                onClick={handleLogout}
                className={`
                  ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200
                  text-gray-500 hover:text-red-600 p-1 rounded-full
                  focus:outline-none
                `}
                title="Log Out"
                tabIndex={-1}
                type="button"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600 font-medium">{user?.role?.toUpperCase() || 'USER'}</span>
              {isAdmin && <Shield className="h-3 w-3 text-blue-600" />}
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-white">
      {/* Mobile Sidebar Overlay */}
      <div 
        className={`
          fixed inset-0 z-50 lg:hidden transition-opacity duration-200 ease-in-out
          ${sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
      >
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
        
        {/* Mobile Sidebar */}
        <div 
          className={`
            fixed inset-y-0 left-0 flex w-80 flex-col bg-white shadow-2xl border-r border-gray-200
            transform transition-transform duration-200 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          {/* Mobile Header */}
          <div className="flex h-20 items-center justify-between px-6 border-b border-gray-200">
            <img
              src={logoImage}
              alt="Coastal Seven Consulting Logo"
              className="h-12 w-auto object-contain transition-transform duration-200 hover:scale-105"
              style={{ maxWidth: '180px' }}
            />
            <button 
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-xl hover:bg-blue-50 transition-colors duration-200"
            >
              <X className="h-6 w-6 text-gray-600" />
            </button>
          </div>

          {/* Mobile Navigation */}
          <nav className="flex-1 space-y-2 p-4">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <NavItem
                  key={item.name}
                  item={item}
                  isActive={isActive}
                  onClick={() => {
                    navigate(item.path)
                    setSidebarOpen(false)
                  }}
                />
              )
            })}
          </nav>

          {/* Mobile User Section */}
          <div className="p-4 border-t border-gray-200">
            <UserProfile />
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-80 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white shadow-2xl border-r border-gray-200">
          {/* Desktop Header */}
          <div className="flex items-center h-20 px-6 border-b border-gray-200">
            <button
              type="button"
              onClick={() => {
                // Redirect to the correct dashboard based on user role and reload
                if (user?.role === 'admin') {
                  window.location.href = '/admin/dashboard';
                } else if (user?.role === 'hr') {
                  window.location.href = '/hr/dashboard';
                } else {
                  window.location.href = '/dashboard';
                }
              }}
              className="focus:outline-none"
              style={{ display: 'flex', alignItems: 'center' }}
              title="Go to Dashboard"
            >
              <img
                src={logoImage}
                alt="Coastal Seven Consulting Logo"
                className="h-12 w-auto object-contain transition-transform duration-200 hover:scale-105"
                style={{ maxWidth: '220px' }}
              />
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="flex-1 space-y-2 p-6">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <NavItem
                  key={item.name}
                  item={item}
                  isActive={isActive}
                  onClick={() => navigate(item.path)}
                />
              )
            })}
          </nav>

          {/* Desktop User Section */}
          <div className="p-6 border-t border-gray-200">
            <UserProfile />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="lg:pl-80">
        {/* Top Navigation Bar */}
        <div className="sticky top-0 z-40 flex h-20 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-6 shadow-sm">
          <button
            type="button"
            className="lg:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors duration-200"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6 text-gray-700" />
          </button>
          
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1 items-center">
              <h1 className="text-2xl font-bold text-blue-600">
                {location.pathname === '/admin/dashboard' || location.pathname === '/hr/dashboard'
                  ? 'Dashboard'
                  : (navItems.find(item => item.path === location.pathname)?.name || 'Dashboard')}
              </h1>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="py-8">
          <div className="mx-auto max-w-7xl px-6 sm:px-8">
            <div className="animate-fadeIn">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout 