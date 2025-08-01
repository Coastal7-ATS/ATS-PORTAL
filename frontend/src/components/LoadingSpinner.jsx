import React from 'react'

const LoadingSpinner = ({ message = "Loading...", size = "md" }) => {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12", 
    lg: "h-16 w-16",
    xl: "h-20 w-20"
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30">
      <div className="text-center">
        <div className={`spinner ${sizeClasses[size]} mx-auto mb-4`}></div>
        <p className="text-slate-600">{message}</p>
      </div>
    </div>
  )
}

export default LoadingSpinner 