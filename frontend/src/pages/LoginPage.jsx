import React from 'react'
import { AuthLayout } from '../components/layout/AuthLayout'
import { LoginForm } from '../components/forms/LoginForm'

export const LoginPage = () => {
  return (
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  )
}
