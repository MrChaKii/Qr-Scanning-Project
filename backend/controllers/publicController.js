import Employee from '../models/Employee.js';
import Company from '../models/Company.js';
import Process from '../models/Process.js';
import { getDailyEmployeeIdleTime } from './idleAnalyticsController.js';

// GET /api/public/dashboard-summary
export const getPublicDashboardSummary = async (req, res) => {
  try {
    const [
      totalEmployees,
      manpowerEmployees,
      permanentEmployees,
      processes,
      manpowerCompanies,
    ] = await Promise.all([
      Employee.countDocuments({}),
      Employee.countDocuments({ employeeType: 'manpower' }),
      Employee.countDocuments({ employeeType: 'permanent' }),
      Process.countDocuments({}),
      Company.countDocuments({ employeeTypeAllowed: 'manpower' }),
    ]);

    return res.status(200).json({
      employees: {
        total: totalEmployees,
        manpower: manpowerEmployees,
        permanent: permanentEmployees,
      },
      processes,
      manpowerCompanies,
    });
  } catch (err) {
    return res.status(500).json({
      message: 'Error fetching dashboard summary',
      error: err.message,
    });
  }
};

// GET /api/public/employee-idle/daily?date=YYYY-MM-DD
export const getPublicDailyEmployeeIdleTime = getDailyEmployeeIdleTime;
