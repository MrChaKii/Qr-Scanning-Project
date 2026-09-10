import cron from 'node-cron';
import { applyDueAutoCheckouts } from '../controllers/attendanceController.js';

const AUTO_CHECKOUT_SCHEDULE = '* * * * *';
const SRI_LANKA_TIME_ZONE = 'Asia/Colombo';

export const startAttendanceAutoCheckoutJob = () => {
  let isRunning = false;

  const runAutoCheckout = async () => {
    if (isRunning) return;

    isRunning = true;
    try {
      const createdCount = await applyDueAutoCheckouts();
      if (createdCount > 0) {
        console.log(`[Attendance auto-checkout] Created ${createdCount} checkout record(s).`);
      }
    } catch (error) {
      console.error('[Attendance auto-checkout] Job failed:', error);
    } finally {
      isRunning = false;
    }
  };

  const task = cron.schedule(AUTO_CHECKOUT_SCHEDULE, runAutoCheckout, {
    timezone: SRI_LANKA_TIME_ZONE,
  });

  void runAutoCheckout();
  console.log('[Attendance auto-checkout] Background job scheduled every minute.');

  return task;
};
