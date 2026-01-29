import api from './api'

// Resolves a QRCode qrId (UUID string) from either:
// - an Employee business ID (e.g. EMP001)
// - a QRCode qrId already (UUID)
// - a Mongo ObjectId (24 hex) if user pasted it
const looksLikeMongoObjectId = (value) => typeof value === 'string' && /^[a-fA-F0-9]{24}$/.test(value)

export const toggleProcessWorkSession = async (input) => {
  let qrId = input

  // If input looks like an employee business ID (or short), resolve employee -> qrId
  if (typeof qrId === 'string' && (qrId.startsWith('EMP') || qrId.length < 24)) {
    const empId = qrId.trim()

    // Get employee by business employeeId
    const empRes = await api.get('/api/employees/lookup', { params: { employeeId: empId } })
    const employee = empRes.data

    if (!employee || !employee._id) {
      throw new Error(`Employee with ID '${empId}' not found`)
    }

    // Get existing QR id for employee
    const qrRes = await api.get(`/api/qr/employee/${employee._id}`)
    qrId = qrRes.data.qrId

    if (!qrId) {
      throw new Error('QR code lookup failed - no qrId returned')
    }
  }

  // Fallback: allow passing a Mongo ObjectId directly (backend now supports both)
  if (typeof qrId !== 'string' || (!looksLikeMongoObjectId(qrId) && qrId.trim().length === 0)) {
    throw new Error('Invalid QR/Employee input')
  }

  const response = await api.post('/api/scan', {
    context: 'PROCESS',
    qrId: qrId.trim(),
  })

  return response.data
}
