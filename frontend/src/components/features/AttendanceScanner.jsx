
import React, { useState, useRef, useEffect } from 'react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { QrCode, CheckCircle, XCircle } from 'lucide-react'
import { scanAttendance } from '../../services/attendance.service'
import { toggleProcessWorkSession } from '../../services/scan.service'
import { useToast } from '../../hooks/useToast'

// Dynamically load html5-qrcode script if not present
function loadHtml5QrcodeScript(cb) {
  if (window.Html5Qrcode) {
    cb();
    return;
  }
  const script = document.createElement('script');
  script.src = 'https://unpkg.com/html5-qrcode@2.3.10/minified/html5-qrcode.min.js';
  script.onload = cb;
  document.body.appendChild(script);
}


export const AttendanceScanner = ({ onScanSuccess, mode = 'attendance' }) => {
  const [employeeId, setEmployeeId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [lastScan, setLastScan] = useState(null)
  const [showCamera, setShowCamera] = useState(true) // Camera always visible
  const [isScanning, setIsScanning] = useState(false)
  const cameraRef = useRef(null)
  const html5QrcodeScannerRef = useRef(null)

  const { showToast } = useToast()

  const handleScan = async (type) => {
    if (!employeeId.trim()) {
      showToast('Please scan a QR code', 'warning')
      return
    }

    setIsLoading(true)

    try {
      // Extract ID if it's in format EMP-{id}, otherwise keep as-is
      const cleanId = employeeId.trim()
      console.log('Scanning attendance for:', cleanId, 'type:', type)
      
      const result = await scanAttendance(cleanId, type)

      setLastScan(result)
      const scanTypeText = result.scanType || type
      showToast(`Successfully checked ${scanTypeText}`, 'success')
      setEmployeeId('')

      if (onScanSuccess) {
        onScanSuccess()
      }
    } catch (error) {
      console.error('Attendance scan error:', error)
      console.error('Error response:', error?.response)
      const errorMessage = error?.response?.data?.error || error?.response?.data?.message || error?.message || 'Failed to scan attendance'
      console.error('Final error message:', errorMessage)
      showToast(errorMessage, 'error')
      setEmployeeId('') // Clear on error too
    } finally {
      setIsLoading(false)
    }
  }

  // Auto scan with toggle (no type needed - backend determines IN/OUT)
  const handleAutoScan = async (valueOverride) => {
    const raw = (valueOverride ?? employeeId).trim()
    if (!raw) {
      showToast('Please scan a QR code', 'warning')
      return
    }

    setIsLoading(true)

    try {
      const cleanId = raw
      console.log('Auto scanning attendance for:', cleanId)
      
      // Don't pass scanType - let backend auto-toggle
      const result = await scanAttendance(cleanId, null)

      setLastScan(result)
      const action = result.scanType === 'IN' ? 'IN' : 'OUT'
      showToast(`✓ Checked ${action}`, 'success')
      setEmployeeId('')

      if (onScanSuccess) {
        onScanSuccess()
      }
    } catch (error) {
      console.error('Attendance scan error:', error)
      const errorMessage = error?.response?.data?.error || error?.response?.data?.message || error?.message || 'Failed to scan attendance'
      showToast(errorMessage, 'error')
      setEmployeeId('') // Clear on error too
    } finally {
      setIsLoading(false)
    }
  }

  const handleProcessToggle = async (valueOverride) => {
    const raw = (valueOverride ?? employeeId).trim()
    if (!raw) {
      showToast('Please scan a QR code or enter an Employee ID', 'warning')
      return
    }

    setIsLoading(true)

    try {
      const result = await toggleProcessWorkSession(raw)

      setLastScan({
        scanType: result.scanType,
        scanTime: result.scanTime,
        processName: result.processName || result.session?.processName,
      })

      const action = result.scanType === 'IN' ? 'started' : 'ended'
      const proc = result.processName || result.session?.processName
      showToast(`Session ${action}${proc ? ` (${proc})` : ''}`, 'success')
      setEmployeeId('')

      if (onScanSuccess) {
        onScanSuccess(result)
      }
    } catch (error) {
      const errorMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        'Failed to record session'
      showToast(errorMessage, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  // Camera QR scan logic
  const startCameraScan = () => {
    setIsScanning(true)
    loadHtml5QrcodeScript(() => {
      if (!window.Html5Qrcode) {
        showToast('QR scanner failed to load', 'error')
        setIsScanning(false)
        return
      }
      if (html5QrcodeScannerRef.current) {
        html5QrcodeScannerRef.current.stop().catch(()=>{})
        html5QrcodeScannerRef.current = null
      }
      const qr = new window.Html5Qrcode(cameraRef.current.id)
      html5QrcodeScannerRef.current = qr
      qr.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 250 },
        (decodedText) => {
          const decoded = decodedText
          setEmployeeId(decoded)

          if (mode === 'workSession') {
            handleProcessToggle(decoded)
          } else {
            // Auto-scan for attendance mode
            handleAutoScan(decoded)
          }
          // Keep camera running for next scan
        },
        (err) => {}
      ).catch(() => {
        setIsScanning(false)
        showToast('Unable to access camera', 'error')
      })
    })
  }

  const stopCameraScan = () => {
    setIsScanning(false)
    if (html5QrcodeScannerRef.current) {
      html5QrcodeScannerRef.current.stop().catch(()=>{})
      html5QrcodeScannerRef.current = null
    }
  }

  // Auto-start camera when component mounts
  useEffect(() => {
    startCameraScan()
    
    return () => {
      stopCameraScan()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
      <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
        <QrCode className="w-5 h-5 mr-2 text-blue-600" />
        {mode === 'workSession' ? 'Process Scanner' : 'Attendance Scanner'}
      </h3>

      <div className="space-y-4">
        {/* Camera View - Always Displayed */}
        <div className="mt-2 mb-4 bg-slate-50 rounded-lg p-4">
          <div ref={cameraRef} id="qr-reader" style={{ width: '100%', maxWidth: 400, margin: '0 auto' }} />
          <p className="text-center text-sm text-slate-600 mt-3">
            {isLoading ? 'Processing...' : 'Point camera at QR code to scan'}
          </p>
        </div>

        {lastScan && (
          <div
            className={`p-4 rounded-md border ${
              lastScan.scanType === 'IN'
                ? 'bg-green-50 border-green-200'
                : 'bg-amber-50 border-amber-200'
            }`}
          >
            <div className="flex items-center">
              {lastScan.scanType === 'IN' ? (
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              ) : (
                <XCircle className="w-5 h-5 text-amber-600 mr-2" />
              )}

              <div>
                <p className="font-medium text-slate-900">
                  Last Scan:{' '}
                  <span className="font-bold">
                    {lastScan.scanType}
                  </span>
                </p>
                {lastScan.processName && (
                  <p className="text-sm text-slate-700">
                    Process: <span className="font-medium">{lastScan.processName}</span>
                  </p>
                )}
                <p className="text-sm text-slate-600">
                  {new Date(lastScan.scanTime).toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
