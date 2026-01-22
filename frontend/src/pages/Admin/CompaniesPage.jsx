import React, { useEffect, useState } from 'react'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { Table } from '../../components/ui/Table'
import { Button } from '../../components/UI/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { CompanyForm } from '../../components/forms/CompanyForm'
import { getCompanies } from '../../services/company.service'
import { useToast } from '../../hooks/useToast'
import { Plus, Search, Edit, Building2 } from 'lucide-react'
import { Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export const CompaniesPage = () => {
    const { showToast } = useToast();
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleDeleteClick = (companyId) => {
    setDeleteTarget(companyId);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsLoading(true);
      await import('../../services/company.service').then(({ deleteCompany }) => deleteCompany(deleteTarget));
      showToast('Company deleted successfully', 'success');
      fetchCompanies();
    } catch (error) {
      alert('Failed to delete company');
    } finally {
      setIsLoading(false);
      setIsDeleteModalOpen(false);
      setDeleteTarget(null);
    }
  };
  const [companies, setCompanies] = useState([])
  const [filteredCompanies, setFilteredCompanies] = useState([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCompany, setEditingCompany] = useState(undefined)

  const navigate = useNavigate()

  const fetchCompanies = async () => {
    setIsLoading(true)
    try {
      const data = await getCompanies()
      setCompanies(data)
      setFilteredCompanies(data)
    } catch (error) {
      console.error('Failed to fetch companies', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCompanies()
  }, [])

  useEffect(() => {
    const safeCompanies = Array.isArray(companies) ? companies : [];
    const filtered = safeCompanies.filter(
      (c) =>
        c.companyId?.toLowerCase().includes(search.toLowerCase()) ||
        c.companyName?.toLowerCase().includes(search.toLowerCase()) ||
        c.employeeTypeAllowed?.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredCompanies(filtered);
  }, [search, companies])

  const handleEdit = (company) => {
    setEditingCompany(company)
    setIsModalOpen(true)
  }

  const handleAdd = () => {
    setEditingCompany(undefined)
    setIsModalOpen(true)
  }

  const handleSuccess = () => {
    setIsModalOpen(false)
    fetchCompanies()
  }

  const columns = [
    {
      header: 'Company ID',
      accessor: 'companyId',
    },
    {
      header: 'Company Name',
      accessor: (item) => (
        <div className="flex items-center">
          <div className="h-8 w-8 rounded bg-blue-100 flex items-center justify-center mr-3">
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <span className="font-medium">{item.companyName}</span>
        </div>
      ),
    },
    {
      header: 'Employee Type',
      accessor: 'employeeTypeAllowed',
    },
    {
      header: 'Created At',
      accessor: (item) => item.createdAt ? new Date(item.createdAt).toLocaleString() : '',
    },
    {
      header: 'Actions',
      accessor: (item) => (
        <div className="flex space-x-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleEdit(item)}
          >
            <Edit className="w-4 h-4" />
          </Button>

          {/* <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/companies/${item.companyId}`)}
          >
            View
          </Button> */}

          <Button
            variant="danger"
            size="sm"
            onClick={() => handleDeleteClick(item.companyId)}
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
        <h1 className="text-2xl font-bold text-slate-900">
          Companies
        </h1>

        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Add Company
        </Button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <Input
            placeholder="Search companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Table
        data={filteredCompanies}
        columns={columns}
        keyExtractor={(item) => item.companyId}
        isLoading={isLoading}
        emptyMessage="No companies found"
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCompany ? 'Edit Company' : 'Add New Company'}
      >
        <CompanyForm
          initialData={editingCompany}
          onSuccess={handleSuccess}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Delete"
      >
        <div className="p-4">
          <p className="mb-6 text-slate-700">Are you sure you want to delete this company?</p>
          <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete} isLoading={isLoading}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  )
}
