import api from './api'

const tryParseJson = (value) => {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  if (!(trimmed.startsWith('{') || trimmed.startsWith('['))) return null
  try {
    return JSON.parse(trimmed)
  } catch {
    return null
  }
}

const tryDecodeBase64Json = (value) => {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  // Heuristic: base64 is typically longer and only has these chars.
  if (!/^[A-Za-z0-9+/=]+$/.test(trimmed)) return null
  try {
    const json = atob(trimmed)
    return JSON.parse(json)
  } catch {
    return null
  }
}

// Resolves a QRCode qrId (UUID string) from either:
// - an Employee business ID (e.g. EMP001)
// - a QRCode qrId already (UUID)
// - a Mongo ObjectId (24 hex) if user pasted it
const looksLikeMongoObjectId = (value) => typeof value === 'string' && /^[a-fA-F0-9]{24}$/.test(value)

export const toggleProcessWorkSession = async (input) => {
  let qrId = input

  // 1) Some QR codes may be JSON strings.
  //    Example: { employeeId: 'EMP001', ... } or { qrId: '...' }
  const parsedJson = tryParseJson(qrId)
  if (parsedJson && typeof parsedJson === 'object') {
    if (typeof parsedJson.employeeId === 'string' && parsedJson.employeeId.trim()) {
      qrId = parsedJson.employeeId.trim()
    } else if (typeof parsedJson.qrId === 'string' && parsedJson.qrId.trim()) {
      qrId = parsedJson.qrId.trim()
    }
  }

  // 2) Backend-generated QR images encode a base64 JSON payload.
  //    Example payload: { companyId, companyName, employeeId: <mongoId|null> }
  //    If employeeId is present, resolve to a QRCode qrId (UUID) via /api/qr/employee/:employeeId.
  const parsedBase64 = !parsedJson ? tryDecodeBase64Json(qrId) : null
  if (parsedBase64 && typeof parsedBase64 === 'object') {
    const payloadEmployeeId = parsedBase64.employeeId

    if (typeof payloadEmployeeId === 'string' && looksLikeMongoObjectId(payloadEmployeeId)) {
      const qrRes = await api.get(`/api/qr/employee/${payloadEmployeeId}`)
      if (!qrRes?.data?.qrId) {
        throw new Error('QR code lookup failed - no qrId returned')
      }
      qrId = qrRes.data.qrId
    } else {
      // For manpower/company QR payloads, employeeId may be null.
      // Work-session toggles require a specific employee.
      throw new Error('This QR code is not linked to a specific employee. Please scan an employee QR code.')
    }
  }

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
