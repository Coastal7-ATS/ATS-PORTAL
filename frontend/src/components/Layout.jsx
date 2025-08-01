import React, { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from './LoadingSpinner'
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
  color = 'from-blue-500 to-blue-600',
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
        card-gradient p-6 flex items-center gap-4 min-w-[200px] 
        hover-lift group relative overflow-hidden
        ${className}
      `}
    >
      {/* Background gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-5 group-hover:opacity-10 transition-opacity duration-300`} />
      
      <div className="relative z-10">
        <div
          className={`
            flex items-center justify-center rounded-2xl h-14 w-14
            bg-gradient-to-br ${color} text-white shadow-lg
            transition-all duration-300 group-hover:scale-110 group-hover:shadow-glow
          `}
        >
          {Icon && <Icon className="h-7 w-7" />}
        </div>
      </div>
      
      <div className="relative z-10 flex-1">
        <div className="text-3xl font-bold text-slate-900 mb-1">{value}</div>
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
    { name: 'Dashboard', path: '/admin/dashboard', icon: Home, description: 'Overview & Analytics' },
    { name: 'Jobs', path: '/admin/jobs', icon: Briefcase, description: 'Manage Job Openings' },
    { name: 'HR Users', path: '/admin/users', icon: Users, description: 'HR Team Management' },
    { name: 'Candidates', path: '/admin/candidates', icon: UserCheck, description: 'Candidate Database' },
  ]

  const hrNavItems = [
    { name: 'Dashboard', path: '/hr/dashboard', icon: Home, description: 'Overview & Analytics' },
    { name: 'My Jobs', path: '/hr/jobs', icon: Briefcase, description: 'Manage Your Jobs' },
    { name: 'Candidates', path: '/hr/candidates', icon: UserCheck, description: 'Candidate Management' },
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
          w-full flex items-center px-4 py-4 text-sm font-medium rounded-2xl
          transition-all duration-300 ease-in-out transform hover:scale-[1.02]
          group relative overflow-hidden
          ${isActive
            ? 'bg-gradient-to-r from-primary-50 to-indigo-50 text-primary-700 shadow-soft border border-primary-200'
            : 'text-slate-600 hover:bg-slate-50/80 hover:text-slate-900 hover:shadow-soft'
          }
          ${className}
        `}
      >
        {/* Active indicator */}
        {isActive && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-primary-500 to-indigo-500 rounded-r-full" />
        )}
        
        <Icon className={`mr-4 h-5 w-5 transition-all duration-300 ${isActive ? 'text-primary-600 scale-110' : 'group-hover:scale-110'}`} />
        <div className="flex-1 text-left">
          <div className="font-semibold">{item.name}</div>
          <div className="text-xs text-slate-500 font-normal">{item.description}</div>
        </div>
      </button>
    )
  }

  // User Profile with logout icon at right of username, visible on hover with transition
  const UserProfile = ({ className = "" }) => (
    <div className={`relative group ${className}`}>
      <div
        className="flex items-center p-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-white/40 hover:bg-white/90 transition-all duration-300 hover:shadow-soft cursor-pointer"
      >
        <div className="flex-shrink-0">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center shadow-lg group-hover:shadow-glow transition-all duration-300">
            <span className="text-lg font-bold text-white">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
        </div>
        <div className="ml-4 flex-1 flex items-center justify-between">
          <div className="text-left">
            <p className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              {user?.name || 'User'}
              {/* Logout icon, appears on hover */}
              <button
                onClick={handleLogout}
                className={`
                  ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200
                  text-danger-600 hover:text-danger-800 p-1 rounded-full
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
              <span className="text-xs text-slate-500 font-medium">{user?.role?.toUpperCase() || 'USER'}</span>
              {isAdmin && <Shield className="h-3 w-3 text-primary-600" />}
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30">
      {/* Mobile Sidebar Overlay */}
      <div 
        className={`
          fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ease-in-out
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
            fixed inset-y-0 left-0 flex w-80 flex-col bg-white/90 backdrop-blur-md shadow-2xl
            transform transition-transform duration-300 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          {/* Mobile Header */}
          <div className="flex h-20 items-center justify-between px-6 border-b border-slate-200/50">
            <img
              src="/Coastal_Seven_Consulting_color.png"
              alt="Coastal Seven Consulting Logo"
              className="h-12 w-auto object-contain transition-transform duration-200 hover:scale-105"
              style={{ maxWidth: '180px' }}
            />
            <button 
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-xl hover:bg-slate-100 transition-colors duration-200"
            >
              <X className="h-6 w-6 text-slate-500" />
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
          <div className="p-4 border-t border-slate-200/50">
            <UserProfile />
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-80 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white/80 backdrop-blur-md border-r border-white/40 shadow-soft">
          {/* Desktop Header */}
          <div className="flex items-center h-20 px-6 border-b border-slate-200/50">
            <img
              src="/Coastal_Seven_Consulting_color.png"
              alt="Coastal Seven Consulting Logo"
              className="h-12 w-auto object-contain transition-transform duration-200 hover:scale-105"
              style={{ maxWidth: '220px' }}
            />
          </div>

          {/* Desktop Navigation */}
          <nav className="flex-1 space-y-3 p-6">
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
          <div className="p-6 border-t border-slate-200/50">
            <UserProfile />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="lg:pl-80">
        {/* Top Navigation Bar */}
        <div className="sticky top-0 z-40 flex h-20 shrink-0 items-center gap-x-4 border-b border-slate-200/50 bg-white/80 backdrop-blur-md px-6 shadow-soft">
          <button
            type="button"
            className="lg:hidden p-2 rounded-xl hover:bg-slate-100 transition-colors duration-200"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6 text-slate-700" />
          </button>
          
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1 items-center">
              <h1 className="text-2xl font-bold gradient-text">
                {location.pathname === '/admin/dashboard' || location.pathname === '/hr/dashboard'
                  ? 'Recruitment Portal'
                  : (navItems.find(item => item.path === location.pathname)?.name || 'Recruitment Portal')}
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