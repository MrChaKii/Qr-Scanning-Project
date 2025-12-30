import { scanAtSecurity } from './attendanceController.js';
import { startSession, stopSession } from './workSessionController.js';

// POST /api/scan
export const handleScan = async (req, res) => {
  try {
    const { context, ...scanData } = req.body;

    if (!context) {
      return res.status(400).json({
        message: 'Scan context is required (SECURITY, SUPERVISOR, BREAK)'
      });
    }

    // SECURITY scan → attendance IN / OUT
    if (context === 'SECURITY') {
      return scanAtSecurity(req, res);
    }

    // SUPERVISOR scan → work session start / stop
    if (context === 'SUPERVISOR') {
      req.body = scanData;

      const stopResult = await new Promise(resolve => {
        const fakeRes = {
          status: code => ({
            json: obj => resolve({ code, obj })
          })
        };
        stopSession({ body: scanData }, fakeRes);
      });

      if (stopResult.code === 200) {
        return res.status(200).json(stopResult.obj);
      }

      return startSession(req, res);
    }
    
  } catch (err) {
    res.status(500).json({
      message: 'Scan error',
      error: err.message
    });
  }
};
