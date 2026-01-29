import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { ProcessForm } from '../../components/forms/ProcessForm';
import { getProcesses, deleteProcess } from '../../services/process.service';
import { useToast } from '../../hooks/useToast';
import { Plus, Search, Edit, Workflow, Trash2, User } from 'lucide-react';

export const ProcessesPage = () => {
  const { showToast } = useToast();
  const [processes, setProcesses] = useState([]);
  const [filteredProcesses, setFilteredProcesses] = useState([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProcess, setEditingProcess] = useState(undefined);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const fetchProcesses = async () => {
    setIsLoading(true);
    try {
      const data = await getProcesses();
      setProcesses(data);
      setFilteredProcesses(data);
    } catch (error) {
      showToast('Failed to fetch processes', 'error');
      console.error('Failed to fetch processes', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProcesses();
  }, []);

  useEffect(() => {
    const safeProcesses = Array.isArray(processes) ? processes : [];
    const filtered = safeProcesses.filter(
      (p) =>
        p.processId?.toLowerCase().includes(search.toLowerCase()) ||
        p.processName?.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredProcesses(filtered);
  }, [search, processes]);

  const handleEdit = (process) => {
    setEditingProcess(process);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingProcess(undefined);
    setIsModalOpen(true);
  };

  const handleSuccess = () => {
    setIsModalOpen(false);
    fetchProcesses();
  };

  const handleDeleteClick = (processId) => {
    setDeleteTarget(processId);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsLoading(true);
      await deleteProcess(deleteTarget);
      showToast('Process deleted successfully', 'success');
      fetchProcesses();
    } catch (error) {
      showToast('Failed to delete process', 'error');
    } finally {
      setIsLoading(false);
      setIsDeleteModalOpen(false);
      setDeleteTarget(null);
    }
  };

  const columns = [
    {
      header: 'Process ID',
      accessor: 'processId',
    },
    {
      header: 'Process Name',
      accessor: (item) => (
        <div className="flex items-center">
          <div className="h-8 w-8 rounded bg-purple-100 flex items-center justify-center mr-3">
            <Workflow className="w-4 h-4 text-purple-600" />
          </div>
          <span className="font-medium">{item.processName}</span>
        </div>
      ),
    },
    {
      header: 'Assigned User',
      accessor: (item) => (
        item.userId ? (
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-slate-500" />
            <div>
              <div className="font-medium text-slate-900">{item.userId.name}</div>
              <div className="text-xs text-slate-500">@{item.userId.username}</div>
            </div>
          </div>
        ) : (
          <Badge variant="secondary">Not Assigned</Badge>
        )
      ),
    },
    {
      header: 'Created At',
      accessor: (item) =>
        item.createdAt ? new Date(item.createdAt).toLocaleString() : '',
    },
    {
      header: 'Actions',
      accessor: (item) => (
        <div className="flex space-x-2">
          <Button variant="secondary" size="sm" onClick={() => handleEdit(item)}>
            <Edit className="w-4 h-4" />
          </Button>

          <Button
            variant="danger"
            size="sm"
            onClick={() => handleDeleteClick(item.processId)}
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Processes</h1>
          <p className="text-slate-600">Manage your business processes</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Add Process
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <div className="flex items-center space-x-2">
            <Search className="w-5 h-5 text-slate-400" />
            <Input
              placeholder="Search processes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1"
            />
          </div>
        </div>

        <Table
          data={filteredProcesses}
          columns={columns}
          keyExtractor={(item) => item.processId}
          isLoading={isLoading}
          emptyMessage="No processes found. Create your first process to get started."
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProcess ? 'Edit Process' : 'Create New Process'}
      >
        <ProcessForm
          initialData={editingProcess}
          onSuccess={handleSuccess}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Delete"
      >
        <div className="space-y-4">
          <p className="text-slate-600">
            Are you sure you want to delete this process? This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              variant="secondary"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
};
