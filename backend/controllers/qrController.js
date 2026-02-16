// import QRCode from 'qrcode';
// import QRCodeModel from '../models/QRCode.js';
// import Company from '../models/Company.js';
// import Employee from '../models/Employee.js';
// import { v4 as uuidv4 } from 'uuid';

// // Helper to create QR payload and encode as Base64 JSON
// function createQRPayload({ companyId, companyName, employeeId }) {
//   const payload = {
//     companyId,
//     companyName,
//     employeeId: employeeId || null
//   };
//   return Buffer.from(JSON.stringify(payload)).toString('base64');
// }

// // Generate QR Controller
// export const generateQR = async (req, res) => {
//   try {
//     const { companyId, employeeId } = req.body;
//     const company = await Company.findById(companyId);
//     if (!company) return res.status(404).json({ error: 'Company not found' });

//     let qrType, qrId, qrDoc, employee = null;

//     if (employeeId) {
//       employee = await Employee.findById(employeeId);
//       if (!employee) return res.status(404).json({ error: 'Employee not found' });
//       qrType = employee.employeeType;
//       if (qrType === 'permanent') {
//         // Unique QR per permanent employee
//         qrId = uuidv4();
//         qrDoc = await QRCodeModel.create({
//           qrId,
//           companyId: company._id,
//           companyName: company.companyName,
//           employeeId: employee._id,
//           qrType,
//         });
//       } else {
//         // Shared QR for manpower: one per company
//         qrType = 'manpower';
//         // qrDoc = await QRCodeModel.findOne({ companyId: company._id, qrType });
//         if (!qrDoc) {
//           qrId = uuidv4();
//           qrDoc = await QRCodeModel.create({
//             qrId,
//             companyId: company._id,
//             companyName: company.companyName,
//             employeeId: employee._id,
//             qrType,
//           });
//         }
//       }
//     } 
//     // else {
//     //   // Manpower QR (shared per company)
//     //   qrType = 'manpower';
//     //   qrDoc = await QRCodeModel.findOne({ companyId: company._id, qrType });
//     //   if (!qrDoc) {
//     //     qrId = uuidv4();
//     //     qrDoc = await QRCodeModel.create({
//     //       qrId,
//     //       companyId: company._id,
//     //       companyName: company.companyName,
//     //       employeeId: null,
//     //       qrType,
//     //     });
//     //   }
//     // }

//     // Prepare payload
//     const payload = createQRPayload({
//       companyId: company._id,
//       companyName: company.companyName,
//       employeeId: employee._id,
//     });

//     // Generate QR image
//     const qrImage = await QRCode.toDataURL(payload);
//     res.json({ qrId: qrDoc.qrId, qrImage });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// // Get QR Code for an employee (for scanning purposes)
// export const getQRForEmployee = async (req, res) => {
//   try {
//     const { employeeId } = req.params;
    
//     const employee = await Employee.findById(employeeId).populate('companyId');
//     if (!employee) {
//       return res.status(404).json({ error: 'Employee not found' });
//     }

//     let qrDoc;
//     if (employee.employeeType === 'permanent') {
//       // Find permanent employee's unique QR
//       qrDoc = await QRCodeModel.findOne({ employeeId: employee._id });
//     } else {
//       // Find shared manpower QR for the company
//       qrDoc = await QRCodeModel.findOne({ 
//         companyId: employee.companyId._id, 
//         qrType: 'manpower' 
//       });
//     }

//     if (!qrDoc) {
//       return res.status(404).json({ error: 'QR code not found for this employee' });
//     }

//     res.json({ qrId: qrDoc.qrId });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };


import QRCode from 'qrcode';
import QRCodeModel from '../models/QRCode.js';
import Company from '../models/Company.js';
import Employee from '../models/Employee.js';
import { v4 as uuidv4 } from 'uuid';

// Helper to create QR payload and encode as Base64 JSON
function createQRPayload({ companyId, companyName, employeeId }) {
  const payload = {
    companyId,
    companyName,
    employeeId: employeeId || null
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

// Generate QR Controller - NOW CREATES UNIQUE QR FOR EACH EMPLOYEE
export const generateQR = async (req, res) => {
  try {
    const { companyId, employeeId } = req.body;
    
    if (!employeeId) {
      return res.status(400).json({ error: 'Employee ID is required' });
    }
    
    const company = await Company.findById(companyId);
    if (!company) return res.status(404).json({ error: 'Company not found' });
    
    const employee = await Employee.findById(employeeId);
    if (!employee) return res.status(404).json({ error: 'Employee not found' });
    
    // Check if QR already exists for this employee
    let qrDoc = await QRCodeModel.findOne({ employeeId: employee._id });
    
    if (!qrDoc) {
      // Create unique QR for each employee (both permanent and manpower)
      const qrId = uuidv4();
      qrDoc = await QRCodeModel.create({
        qrId,
        companyId: company._id,
        companyName: company.companyName,
        employeeId: employee._id,
        qrType: employee.employeeType,
      });
    }
    
    // Prepare payload
    const payload = createQRPayload({
      companyId: company._id,
      companyName: company.companyName,
      employeeId: employee._id,
    });
    
    // Generate QR image
    const qrImage = await QRCode.toDataURL(payload);
    res.json({ qrId: qrDoc.qrId, qrImage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get QR Code for an employee (for scanning purposes)
export const getQRForEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    const employee = await Employee.findById(employeeId).populate('companyId');
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    // Find QR by employee ID (unique for each employee now)
    const qrDoc = await QRCodeModel.findOne({ employeeId: employee._id });
    
    if (!qrDoc) {
      return res.status(404).json({ error: 'QR code not found for this employee' });
    }
    
    res.json({ qrId: qrDoc.qrId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};