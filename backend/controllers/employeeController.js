import Employee from "../models/Employee.js";
import Company from "../models/Company.js";

// Lookup employee by business employeeId (e.g. EMP001)
export const getEmployeeByEmployeeId = async (req, res) => {
  try {
    const { employeeId } = req.query;

    if (!employeeId || typeof employeeId !== "string" || employeeId.trim() === "") {
      return res.status(400).json({ message: "employeeId query param is required" });
    }

    const normalizedEmployeeId = employeeId.trim();

    const employee = await Employee.findOne({ employeeId: normalizedEmployeeId }).populate(
      "companyId"
    );

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    return res.json(employee);
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// Create employee
// export const createEmployee = async (req, res) => {
//   try {
//     const { employeeId, name, employeeType, companyId, isActive } = req.body;

//     if (!employeeId || employeeId === "") {
//       return res
//         .status(400)
//         .json({ message: "Employees must have an employeeId." });
//     }

//     // Only check for duplicate employeeId if provided
//     if (employeeId) {
//       const existingEmployee = await Employee.findOne({ employeeId });
//       if (existingEmployee) {
//         return res.status(400).json({ message: "Employee ID already exists" });
//       }
//     }

//     // Support both MongoDB ObjectId and companyId string for company lookup
//     let existingCompany = null;
//     if (companyId.match(/^[0-9a-fA-F]{24}$/)) {
//       // Looks like an ObjectId
//       existingCompany = await Company.findById(companyId);
//     }
//     if (!existingCompany) {
//       // Try lookup by companyId string (business key)
//       existingCompany = await Company.findOne({ companyId: companyId });
//     }
//     if (!existingCompany) {
//       return res.status(400).json({ message: "Company not found" });
//     }

//     const employee = new Employee({
//       employeeId: employeeId || null,
//       name,
//       employeeType,
//       companyId: existingCompany._id,
//       isActive,
//     });

//     await employee.save();

//     // Generate QR code for the employee after creation
//     let qrResult = null;
//     try {
//       // Import QRCode and Company model here to avoid circular dependencies
//       const QRCode =
//         (await import("qrcode")).default || (await import("qrcode"));
//       const QRCodeModel = (await import("../models/QRCode.js")).default;
//       const { v4: uuidv4 } = await import("uuid");

//       // Helper to create QR payload and encode as Base64 JSON
//       function createQRPayload({ companyId, companyName, employeeId }) {
//         const payload = {
//           companyId,
//           companyName,
//           employeeId: employeeId,
//         };
//         return Buffer.from(JSON.stringify(payload)).toString("base64");
//       }

//       let qrType, qrId, qrDoc;
//       const company = existingCompany;

//       // DEBUG: Log the entire company object to see what fields it has
//       console.log("Company document:", JSON.stringify(company, null, 2));
//       console.log("company.companyName:", company.companyName);

//       // Try multiple possible field names
//       const companyName = company.companyName;

//       console.log("Final companyName:", companyName);

//       // Additional safety check
//       if (!companyName) {
//         throw new Error(
//           "Company name not found. Available fields: " +
//             Object.keys(company.toObject ? company.toObject() : company).join(
//               ", "
//             )
//         );
//       }

//       // Determine QR type based on employee type
//       if (employee.employeeType === "permanent") {
//         qrType = "permanent";
//       } else {
//         qrType = "manpower";
//       }
      
//       qrId = uuidv4();

//       console.log("Creating QR with:", {
//         qrId,
//         companyId: company._id,
//         companyName,
//         employeeId: employee.employeeId, // Now using business employeeId
//         qrType,
//       });

//       qrDoc = await QRCodeModel.create({
//         qrId,
//         companyId: company._id,
//         companyName,
//         employeeId: employee._id, // Store MongoDB _id for reference
//         qrType,
//       });

//       // Prepare payload using business employeeId (not MongoDB _id)
//       const payload = createQRPayload({
//         companyId: company._id,
//         companyName,
//         employeeId: employee.employeeId, // Use business employeeId for QR code payload
//       });

//       // Generate QR image
//       const qrImage = await QRCode.toDataURL(payload);
//       qrResult = { qrId: qrDoc.qrId, qrImage };
//     } catch (qrError) {
//       // QR generation failed, but employee is created
//       console.error("QR Error:", qrError);
//       qrResult = {
//         error: "QR code generation failed",
//         details: qrError.message,
//       };
//     }

//     res.status(201).json({
//       message: "Employee created successfully",
//       employee,
//       qr: qrResult,
//     });
//   } catch (error) {
//     res.status(500).json({
//       message: "Server error",
//       error: error.message,
//     });
//   }
// };

export const createEmployee = async (req, res) => {
  try {
    const { employeeId, name, employeeType, companyId, isActive } = req.body;

    if (!employeeId || employeeId === "") {
      return res
        .status(400)
        .json({ message: "Employees must have an employeeId." });
    }

    // Only check for duplicate employeeId if provided
    if (employeeId) {
      const existingEmployee = await Employee.findOne({ employeeId });
      if (existingEmployee) {
        return res.status(400).json({ message: "Employee ID already exists" });
      }
    }

    // Support both MongoDB ObjectId and companyId string for company lookup
    let existingCompany = null;
    if (companyId.match(/^[0-9a-fA-F]{24}$/)) {
      // Looks like an ObjectId
      existingCompany = await Company.findById(companyId);
    }
    if (!existingCompany) {
      // Try lookup by companyId string (business key)
      existingCompany = await Company.findOne({ companyId: companyId });
    }
    if (!existingCompany) {
      return res.status(400).json({ message: "Company not found" });
    }

    const employee = new Employee({
      employeeId: employeeId || null,
      name,
      employeeType,
      companyId: existingCompany._id,
      isActive,
    });

    await employee.save();

    // Generate QR code for the employee after creation
    let qrResult = null;
    try {
      // Import QRCode and Company model here to avoid circular dependencies
      const QRCode =
        (await import("qrcode")).default || (await import("qrcode"));
      const QRCodeModel = (await import("../models/QRCode.js")).default;
      const { v4: uuidv4 } = await import("uuid");

      // Helper to create QR payload and encode as Base64 JSON
      function createQRPayload({ companyId, companyName, employeeId }) {
        const payload = {
          companyId,
          companyName,
          employeeId: employeeId,
        };
        return Buffer.from(JSON.stringify(payload)).toString("base64");
      }

      const company = existingCompany;

      // DEBUG: Log the entire company object to see what fields it has
      console.log("Company document:", JSON.stringify(company, null, 2));
      console.log("company.companyName:", company.companyName);

      // Try multiple possible field names
      const companyName = company.companyName;

      console.log("Final companyName:", companyName);

      // Additional safety check
      if (!companyName) {
        throw new Error(
          "Company name not found. Available fields: " +
            Object.keys(company.toObject ? company.toObject() : company).join(
              ", "
            )
        );
      }

      // Create unique QR for each employee (regardless of type)
      const qrId = uuidv4();

      console.log("Creating QR with:", {
        qrId,
        companyId: company._id,
        companyName,
        employeeId: employee.employeeId,
        qrType: employee.employeeType,
      });

      const qrDoc = await QRCodeModel.create({
        qrId,
        companyId: company._id,
        companyName,
        employeeId: employee._id, // Store MongoDB _id for reference
        qrType: employee.employeeType,
      });

      // Prepare payload using business employeeId (not MongoDB _id)
      const payload = createQRPayload({
        companyId: company._id,
        companyName,
        employeeId: employee.employeeId, // Use business employeeId for QR code payload
      });

      // Generate QR image
      const qrImage = await QRCode.toDataURL(payload);
      qrResult = { qrId: qrDoc.qrId, qrImage };
    } catch (qrError) {
      // QR generation failed, but employee is created
      console.error("QR Error:", qrError);
      qrResult = {
        error: "QR code generation failed",
        details: qrError.message,
      };
    }

    res.status(201).json({
      message: "Employee created successfully",
      employee,
      qr: qrResult,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// Get all employees
export const getAllEmployees = async (req, res) => {
  try {
    const { employeeType, isActive, companyId, employeeId } = req.query;

    const query = {};
    if (employeeType) query.employeeType = employeeType;
    if (isActive !== undefined) query.isActive = isActive === "true";
    if (companyId) query.companyId = companyId;
    if (employeeId) query.employeeId = employeeId;

    const employees = await Employee.find(query)
      .populate("companyId")
      .sort({ createdAt: -1 });

    res.json(employees);
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// Get employee by ID
export const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await Employee.findById(id).populate("companyId");
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.json(employee);
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// Update employee
export const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!updates.employeeId || updates.employeeId === "") {
      return res
        .status(400)
        .json({ message: "Employees must have an employeeId." });
    }

    // Only check for duplicate employeeId if provided
    if (updates.employeeId) {
      const existingEmployee = await Employee.findOne({
        employeeId: updates.employeeId,
        _id: { $ne: id },
      });
      if (existingEmployee) {
        return res.status(400).json({ message: "Employee ID already exists" });
      }
    }

    const employee = await Employee.findByIdAndUpdate(id, updates, {
      new: true,
    });

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.json({
      message: "Employee updated successfully",
      employee,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// Delete employee
export const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await Employee.findByIdAndDelete(id);

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.json({ message: "Employee deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};