import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Table } from '../../components/ui/Table';
import { useToast } from '../../hooks/useToast';
import api from '../../services/api';
import { getCompanies } from '../../services/company.service';

export function SetPlannedAttendancePage() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [plannedList, setPlannedList] = useState([]);
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [formData, setFormData] = useState({
    companyId: '',
    date: new Date().toISOString().split('T')[0],
    plannedCount: '',
    shift: 'Day'
  });
  
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    fetchPlannedList();
  }, [selectedDate]);

  const fetchCompanies = async () => {
    try {
      const data = await getCompanies();
      setCompanies(data);
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  const fetchPlannedList = async () => {
    try {
      const response = await api.get(`/api/planned-attendance?date=${selectedDate}`);
      setPlannedList(response.data);
    } catch (error) {
      console.error('Error fetching planned list:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/planned-attendance', {
        ...formData,
        plannedCount: parseInt(formData.plannedCount)
      });
      showToast('Planned attendance saved successfully', 'success');
      fetchPlannedList();
      setFormData({ ...formData, plannedCount: '' });
    } catch (error) {
      console.error('Error:', error);
      showToast(error.response?.data?.message || 'Error saving planned attendance', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/attendance/planned')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 font-medium rounded-lg border border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-colors duration-200"
          >
            ← Back to Planned Attendance
          </button>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-gray-900">Set Planned Attendance</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage daily expected attendance counts per company.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add Plan Form */}
          <Card className="p-6 lg:col-span-1 h-fit">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Set Plan</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Select
                label="Company"
                value={formData.companyId}
                onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                options={[
                  { value: '', label: 'Select Company' },
                  ...companies.map(c => ({ value: c._id, label: c.companyName }))
                ]}
                required
              />
              <Input
                type="date"
                label="Date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
              <Input
                type="number"
                label="Planned Count"
                min="0"
                value={formData.plannedCount}
                onChange={(e) => setFormData({ ...formData, plannedCount: e.target.value })}
                required
              />
              <Select
                label="Shift"
                value={formData.shift}
                onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                options={[
                  { value: 'Day', label: 'Day' },
                  { value: 'Night', label: 'Night' },
                ]}
                required
              />
              <Button type="submit" isLoading={loading} className="w-full">
                Save Plan
              </Button>
            </form>
          </Card>

          {/* Planned List Table */}
          <Card className="p-6 lg:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">Planned Records</h2>
              <div className="w-48">
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
            </div>
            
            <Table
              columns={[
                { header: 'Company', accessor: (row) => row.companyId?.companyName || 'Unknown' },
                { header: 'Date', accessor: (row) => new Date(row.date).toLocaleDateString() },
                { header: 'Shift', accessor: (row) => row.shift || '—' },
                { header: 'Planned Count', accessor: 'plannedCount' }
              ]}
              data={plannedList}
              keyExtractor={(row) => row._id}
            />
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
