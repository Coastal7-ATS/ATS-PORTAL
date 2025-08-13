import React from 'react'
import { motion } from 'framer-motion'

const ModernTable = ({ 
  headers, 
  data, 
  onRowClick, 
  emptyMessage = "No data found",
  emptyIcon: EmptyIcon,
  loading = false,
  className = ""
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="spinner h-8 w-8"></div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12">
        {EmptyIcon && <EmptyIcon className="mx-auto h-16 w-16 text-slate-300 mb-4" />}
        <p className="text-lg text-slate-500 mb-2">{emptyMessage}</p>
        <p className="text-sm text-slate-400">No data available to display.</p>
      </div>
    )
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="table-modern">
        <thead>
          <tr>
            {headers.map((header, index) => (
              <th key={index} className={header.className || ""}>
                {header.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <motion.tr
              key={row.id || rowIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.02 * rowIndex }}
              className={`hover:bg-pastel-blue/30 transition-colors duration-200 ${
                onRowClick ? 'cursor-pointer' : ''
              }`}
              onClick={() => onRowClick && onRowClick(row)}
            >
              {headers.map((header, colIndex) => (
                <td key={colIndex} className={header.cellClassName || ""}>
                  {header.render ? header.render(row, row[header.key]) : row[header.key]}
                </td>
              ))}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default ModernTable 