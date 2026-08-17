import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import api from '../../services/api';

export function PlannedVsActualPage() {
  const [vsActual, setVsActual] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchVsActual();
  }, [selectedDate]);

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
              Compare the planned manpower against actual checked-in employees.
            </p>
          </div>
          <div className="w-48">
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {vsActual.map((item) => (
            <Card key={item.companyId} className="p-4">
              <h3 className="font-semibold text-lg text-gray-800">{item.companyName}</h3>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-600 font-medium">Planned</p>
                  <p className="text-2xl font-bold text-blue-900">{item.plannedCount}</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-600 font-medium">Actual</p>
                  <p className="text-2xl font-bold text-green-900">{item.actualCount}</p>
                </div>
              </div>
            </Card>
          ))}
          
          {vsActual.length === 0 && (
            <div className="col-span-full py-8 text-center text-gray-500">
              No manpower companies found.
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
