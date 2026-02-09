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
  // Quick heuristic: base64 is usually longer and only has these chars.
  if (!/^[A-Za-z0-9+/=]+$/.test(trimmed)) return null
  try {
    const json = atob(trimmed)
    return JSON.parse(json)
  } catch {
    return null
  }
}

export const getAttendance = async (date) => {
  const response = await api.get('/api/attendance', {
    params: { date },
  })
  return response.data.data
}

// Accepts either a QRCode _id/code or employeeId
export const scanAttendance = async (input, scanType) => {
  let qrId = input;
  let employeeObjectId = null

  // 1) Some QR codes in this app are generated as JSON strings.
  //    Example: { employeeId: 'EMP001', ... }
  const parsedJson = tryParseJson(qrId)
  if (parsedJson && typeof parsedJson === 'object') {
    // Prefer business employeeId when present (e.g. EMP001)
    if (typeof parsedJson.employeeId === 'string' && parsedJson.employeeId.trim()) {
      qrId = parsedJson.employeeId.trim()
    } else if (typeof parsedJson.qrId === 'string' && parsedJson.qrId.trim()) {
      qrId = parsedJson.qrId.trim()
    }
  }

  // 2) Backend-generated QR images may encode a base64 JSON payload.
  //    If so, extract employeeId and resolve to a QR id.
  const parsedBase64 = !parsedJson ? tryDecodeBase64Json(qrId) : null
  if (parsedBase64 && typeof parsedBase64 === 'object') {
    const payloadEmployeeId = parsedBase64.employeeId
    // If payload has a Mongo ObjectId for employee, resolve QR directly.
    if (typeof payloadEmployeeId === 'string' && /^[a-fA-F0-9]{24}$/.test(payloadEmployeeId)) {
      employeeObjectId = payloadEmployeeId
      try {
        const qrRes = await api.get(`/api/qr/employee/${payloadEmployeeId}`)
        if (qrRes?.data?.qrId) {
          qrId = qrRes.data.qrId
        }
      } catch (err) {
        console.error('Error resolving QR code from base64 payload:', err)
      }
    }
  }

  // If input looks like an employeeId (starts with EMP or is not a valid ObjectId/UUID), fetch QRCode for employee
  if (typeof qrId === 'string' && (qrId.startsWith('EMP') || qrId.length < 24)) {
    // Try to fetch QRCode for employee
    try {
      // Don't strip the prefix - employee IDs are stored with their full format (EMP001, ABC001, etc.)
      const empId = qrId.trim();
      console.log('Looking up employee with ID:', empId);
      
      // Get employee by business employeeId (scoped endpoint)
      const empRes = await api.get('/api/employees/lookup', { params: { employeeId: empId } });
      console.log('Employee lookup response:', empRes.data);
      
      const employee = empRes.data;
      
      if (!employee || !employee._id) {
        throw new Error(`Employee with ID '${empId}' not found`);
      }
      
      console.log('Found employee:', employee);

      // Get existing QR id for employee (no admin permission required)
      const qrRes = await api.get(`/api/qr/employee/${employee._id}`);
      console.log('QR lookup response:', qrRes.data);
      qrId = qrRes.data.qrId;
      
      if (!qrId) {
        throw new Error('QR code lookup failed - no qrId returned');
      }
    } catch (err) {
      console.error('Error resolving QR code:', err);
      // Preserve the original error message if available
      const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'Could not resolve QR code for employee';
      throw new Error(errorMsg);
    }
  }
  const response = await api.post('/api/attendance/scan', {
    context: 'SECURITY',
    qrId,
    scanType,
    employeeId: employeeObjectId,
  })
  return response.data.attendance || response.data;
}

export const getDailySummary = async (date) => {
  const response = await api.get('/api/attendance/daily-summary', {
    params: { date },
  })
  return response.data
}

