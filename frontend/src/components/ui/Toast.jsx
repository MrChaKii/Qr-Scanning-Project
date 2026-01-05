import React from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'

export const Toast = ({ message, type, onClose }) => {
  const styles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  }

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-600" />,
    error: <XCircle className="w-5 h-5 text-red-600" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-600" />,
    info: <Info className="w-5 h-5 text-blue-600" />,
  }

  return (
    <div
      className={`flex items-center w-full max-w-sm p-4 rounded-lg border shadow-md ${styles[type]}`}
    >
      <div className="shrink-0 mr-3">
        {icons[type]}
      </div>

      <div className="flex-1 text-sm font-medium">
        {message}
      </div>

      <button
        onClick={onClose}
        className="ml-3 shrink-0 text-slate-400 hover:text-slate-600"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
