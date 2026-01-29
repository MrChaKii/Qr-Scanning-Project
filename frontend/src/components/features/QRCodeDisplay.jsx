import React, { useRef } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { Button } from '../ui/Button'
import { Download } from 'lucide-react'

export const QRCodeDisplay = ({
  value,
  size = 256,
  label,
  employeeId,
  name
}) => {
  const qrRef = useRef(null)

  const downloadQRCode = () => {
    if (!qrRef.current) return

    const canvas = qrRef.current.querySelector('canvas')
    if (!canvas) return

    const pngUrl = canvas.toDataURL('image/png')
    const downloadLink = document.createElement('a')

    downloadLink.href = pngUrl
    // Simple filename: employeeId_name.png, spaces replaced with _
    const safeName = (name || 'name').replace(/\s+/g, '_');
    downloadLink.download = `${employeeId || 'employee'}_${safeName}.png`;

    document.body.appendChild(downloadLink)
    downloadLink.click()
    document.body.removeChild(downloadLink)
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <div
        ref={qrRef}
        className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm"
      >
        <QRCodeCanvas
          value={value}
          size={size}
          level="H"
          includeMargin={true}
        />
      </div>

      {label && (
        <p className="text-sm font-medium text-slate-600">
          {label}
        </p>
      )}

      <Button
        variant="secondary"
        onClick={downloadQRCode}
        className="flex items-center"
      >
        <Download className="w-4 h-4 mr-2" />
        Download QR Code
      </Button>
    </div>
  )
}
