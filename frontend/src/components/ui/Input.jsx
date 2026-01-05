import React, { forwardRef } from 'react'

export const Input = forwardRef(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {label}
          </label>
        )}

        <input
          ref={ref}
          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500
            ${
              error
                ? 'border-red-500 focus:border-red-500'
                : 'border-slate-300 focus:border-blue-500'
            }
            ${className}`}
          {...props}
        />

        {error && (
          <p className="mt-1 text-xs text-red-600">
            {error}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
