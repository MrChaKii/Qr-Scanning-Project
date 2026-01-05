import React from 'react'

export const Card = ({
  children,
  className = '',
  title,
  action,
}) => {
  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-slate-200 p-6 ${className}`}
    >
      {(title || action) && (
        <div className="flex justify-between items-center mb-4">
          {title && (
            <h3 className="text-lg font-semibold text-slate-900">
              {title}
            </h3>
          )}
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  )
}
