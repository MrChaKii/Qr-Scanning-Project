import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useToast } from '../../hooks/useToast';
import { createProcess, updateProcess } from '../../services/process.service';

export const ProcessForm = ({
  initialData,
  onSuccess,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    processId: initialData?.processId || '',
    processName: initialData?.processName || '',
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  const validate = () => {
    const newErrors = {};
    if (!formData.processId || formData.processId.length < 3) {
      newErrors.processId = 'Process ID must be at least 3 characters';
    }
    if (!formData.processName || formData.processName.length < 3) {
      newErrors.processName = 'Process Name must be at least 3 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);

    try {
      if (initialData) {
        await updateProcess(initialData.processId, formData);
        showToast('Process updated successfully', 'success');
      } else {
        await createProcess(formData);
        showToast('Process created successfully', 'success');
      }
      onSuccess();
    } catch (error) {
      showToast(
        error?.response?.data?.message || 'Operation failed',
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Process ID"
        value={formData.processId}
        onChange={(e) =>
          setFormData({ ...formData, processId: e.target.value })
        }
        error={errors.processId}
        disabled={!!initialData}
      />

      <Input
        label="Process Name"
        value={formData.processName}
        onChange={(e) =>
          setFormData({ ...formData, processName: e.target.value })
        }
        error={errors.processName}
      />

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>

        <Button type="submit" isLoading={isLoading}>
          {initialData ? 'Update Process' : 'Create Process'}
        </Button>
      </div>
    </form>
  );
};
