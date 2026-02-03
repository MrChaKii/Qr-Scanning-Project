import React from 'react'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { WorkSessionScanner } from '../../components/features/WorkSessionScanner'
import { Card } from '../../components/ui/Card'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'

export const ProcessScanPage = () => {
  const navigate = useNavigate()

  const handleScanSuccess = (result) => {
    console.log('Scan successful:', result)
    // You can add additional logic here if needed
  }

  const handleBackToDashboard = () => {
    navigate('/process/dashboard')
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header
          <div className="mb-6 flex items-center gap-4">
            <Button
              variant="outline"
              onClick={handleBackToDashboard}
              className="flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div> */}

          <div className="mb-6">
            <h1 className="text-3xl font-bold text-slate-900">
              Process Scanner
            </h1>
            <p className="text-slate-600 mt-2">
              Scan employee QR codes to start/stop work sessions
            </p>
          </div>

          {/* Scanner Component */}
          <Card className="bg-white shadow-lg">
            <div className="p-6">
              <WorkSessionScanner onScanSuccess={handleScanSuccess} />
            </div>
          </Card>

          {/* Help Section */}
          {/* <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Tips:</h3>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>• Ensure the QR code is well-lit and clearly visible</li>
              <li>• Hold the QR code steady in front of the camera</li>
              <li>• You can also manually enter the Employee ID if needed</li>
            </ul>
          </div> */}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default ProcessScanPage
