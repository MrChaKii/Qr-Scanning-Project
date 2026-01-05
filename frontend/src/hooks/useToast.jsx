import React, { useCallback, useState, createContext, useContext } from 'react'
import { Toast } from '../components/ui/Toast'

const ToastContext = createContext(undefined)

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((message, type) => {
    const id = Math.random().toString(36).substring(2, 9)

    setToasts((prev) => [
      ...prev,
      {
        id,
        message,
        type,
      },
    ])

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }, 5000)
  }, [])

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)

  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }

  return context
}
