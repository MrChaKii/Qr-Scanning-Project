// controllers/analyticsController.js
import AttendanceLog from '../models/AttendanceLog.js';
import WorkSession from '../models/WorkSession.js';
import Employee from '../models/Employee.js';
import Company from '../Models/Company.js';

// 1. Daily attendance per employee
export const dailyAttendancePerEmployee = async (req, res) => {
  try {
    const { date } = req.query;

    const baseDate = date ? new Date(date) : new Date();
    const start = new Date(baseDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(baseDate);
    end.setHours(23, 59, 59, 999);

    const result = await AttendanceLog.aggregate([
      {
        $match: {
          timestamp: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: "$employee",
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "employees",
          localField: "_id",
          foreignField: "_id",
          as: "employee"
        }
      },
      { $unwind: "$employee" },
      {
        $project: {
          _id: 0,
          employeeId: "$employee._id",
          name: "$employee.name",
          attendanceCount: "$count"
        }
      }
    ]);

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 2. Total work time per employee
export const totalWorkTimePerEmployee = async (req, res) => {
  try {
    const result = await WorkSession.aggregate([
      {
        $group: {
          _id: "$employee",
          totalWorkTime: {
            $sum: { $subtract: ["$endTime", "$startTime"] }
          }
        }
      },
      {
        $lookup: {
          from: "employees",
          localField: "_id",
          foreignField: "_id",
          as: "employee"
        }
      },
      { $unwind: "$employee" },
      {
        $project: {
          _id: 0,
          employeeId: "$employee._id",
          name: "$employee.name",
          totalWorkTimeHours: {
            $divide: ["$totalWorkTime", 1000 * 60 * 60]
          }
        }
      }
    ]);

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 3. Machine usage summary (by QR code)
export const machineUsageSummary = async (req, res) => {
  try {
    const result = await AttendanceLog.aggregate([
      {
        $group: {
          _id: "$qrCode",
          usageCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "qrcodes",
          localField: "_id",
          foreignField: "_id",
          as: "qr"
        }
      },
      { $unwind: "$qr" },
      {
        $project: {
          _id: 0,
          qrCodeId: "$qr._id",
          machineName: "$qr.machineName",
          usageCount: 1
        }
      }
    ]);

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 4. Manpower vs permanent comparison
export const manpowerVsPermanent = async (req, res) => {
  try {
    const result = await Employee.aggregate([
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          type: "$_id",
          count: 1
        }
      }
    ]);

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 5. Company-wise productivity
export const companyWiseProductivity = async (req, res) => {
  try {
    const result = await WorkSession.aggregate([
      {
        $lookup: {
          from: "employees",
          localField: "employee",
          foreignField: "_id",
          as: "employee"
        }
      },
      { $unwind: "$employee" },
      {
        $group: {
          _id: "$employee.company",
          totalWorkTime: {
            $sum: { $subtract: ["$endTime", "$startTime"] }
          }
        }
      },
      {
        $lookup: {
          from: "companies",
          localField: "_id",
          foreignField: "_id",
          as: "company"
        }
      },
      { $unwind: "$company" },
      {
        $project: {
          _id: 0,
          companyId: "$company._id",
          companyName: "$company.name",
          totalWorkTimeHours: {
            $divide: ["$totalWorkTime", 1000 * 60 * 60]
          }
        }
      }
    ]);

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
