import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import api from '../../services/api';

export function PlannedAttendancePage() {
  const navigate = useNavigate();
  const [vsActual, setVsActual] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchVsActual();
  }, [selectedDate]);

  const companyPlans = vsActual.reduce((companies, item) => {
    const companyKey = String(item.companyId);
    const existing = companies.find((company) => String(company.companyId) === companyKey);

    if (existing) {
      existing.shifts[item.shift] = item;
    } else {
      companies.push({
        companyId: item.companyId,
        companyName: item.companyName,
        shifts: { [item.shift]: item },
      });
    }

    return companies;
  }, []);

  const fetchVsActual = async () => {
    try {
      const response = await api.get(`/api/planned-attendance/vs-actual?date=${selectedDate}`);
      setVsActual(response.data);
    } catch (error) {
      console.error('Error fetching vs actual:', error);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Planned vs Actual Attendance</h1>
            <p className="mt-1 text-sm text-gray-500">
              Compare planned attendance against actual checked-in employees by company.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-48">
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            <Button
              onClick={() => navigate('/attendance/planned/set')}
              className="whitespace-nowrap"
            >
              Set Attendance
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {companyPlans.map((company) => (
            <Card key={company.companyId} className="p-4">
              <h3 className="font-semibold text-lg text-gray-800">{company.companyName}</h3>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {['Day', 'Night'].map((shift) => {
                  const plan = company.shifts[shift] || {};

                  return (
                    <div key={shift} className="rounded-lg border border-slate-200 p-3">
                      <p className="text-sm font-semibold text-slate-700">{shift} Shift</p>
                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-600 font-medium">Planned</p>
                          <p className="text-2xl font-bold text-blue-900">{plan.plannedCount || 0}</p>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <p className="text-sm text-green-600 font-medium">Actual</p>
                          <p className="text-2xl font-bold text-green-900">{plan.actualCount || 0}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}
          
          {companyPlans.length === 0 && (
            <div className="col-span-full py-8 text-center text-gray-500">
              No companies found.
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
