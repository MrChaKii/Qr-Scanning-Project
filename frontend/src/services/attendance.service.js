import api from './api'

export const getAttendance = async (date) => {
  const response = await api.get('/api/attendance', {
    params: { date },
  })
  return response.data.data
}

// Accepts either a QRCode _id/code or employeeId
export const scanAttendance = async (input, scanType) => {
  let qrId = input;
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
  })
  return response.data.attendance || response.data;
}

export const getDailySummary = async (date) => {
  const response = await api.get('/api/attendance/daily-summary', {
    params: { date },
  })
  return response.data
}

