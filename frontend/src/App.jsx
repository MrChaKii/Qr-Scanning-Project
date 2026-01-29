import React from 'react'
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import { ToastProvider } from './hooks/useToast'
import { ProtectedRoute } from './components/ProtectedRoute'
import { RoleBasedRedirect } from './components/RoleBasedRedirect'

// admin Pages
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/Admin/DashboardPage'
import { CompaniesPage } from './pages/Admin/CompaniesPage'
import { EmployeesPage } from './pages/Admin/EmployeesPage'
import { EmployeeDetailPage } from './pages/Admin/EmployeeDetailPage'
import { UsersPage } from './pages/Admin/UsersPage'
import { AttendancePage } from './pages/Admin/AttendancePage'
import { WorkSessionsPage } from './pages/Admin/WorkSessionsPage'
import { BreaksPage } from './pages/Admin/BreaksPage'
import { ProcessesPage } from './pages/Admin/ProcessesPage'
import { AnalyticsPage } from './pages/Admin/AnalyticsPage'

// Security Pages
import { AttendanceScanPage } from './pages/Security/AttendanceScanPage'

// Process Pages
// import { ProcessDashboardPage } from './pages/Process/ProcessDashboardPage'
import { ProcessScanPage } from './pages/Process/ProcessScanPage'

export function App() {
  return (
    <Router>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <RoleBasedRedirect />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute requiredRole="admin">
                  <DashboardPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/companies"
              element={
                <ProtectedRoute requiredRole="admin">
                  <CompaniesPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/companies/:id"
              element={
                <ProtectedRoute requiredRole="admin">
                  <CompaniesPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/employees"
              element={
                <ProtectedRoute requiredRole="admin">
                  <EmployeesPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/employees/:id"
              element={
                <ProtectedRoute requiredRole="admin">
                  <EmployeeDetailPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/users"
              element={
                <ProtectedRoute requiredRole="admin">
                  <UsersPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/attendance"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AttendancePage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/work-sessions"
              element={
                <ProtectedRoute requiredRole="admin">
                  <WorkSessionsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/breaks"
              element={
                <ProtectedRoute requiredRole="admin">
                  <BreaksPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/processes"
              element={
                <ProtectedRoute requiredRole="admin">
                  <ProcessesPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/analytics"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AnalyticsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/security/scan"
              element={
                <ProtectedRoute requiredRole="security">
                  <AttendanceScanPage />
                </ProtectedRoute>
              }
            />

            {/* Process Routes */}
            {/* <Route
              path="/process/dashboard"
              element={
                <ProtectedRoute requiredRole="process">
                  <ProcessDashboardPage />
                </ProtectedRoute>
              }
            /> */}

            <Route
              path="/process/scan"
              element={
                <ProtectedRoute requiredRole="process">
                  <ProcessScanPage />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={
              <ProtectedRoute>
                <RoleBasedRedirect />
              </ProtectedRoute>
            } />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </Router>
  )
}
