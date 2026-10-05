import React, { useState, useEffect } from 'react';
import { Modal } from '../modals/Modal';
import { FormField } from '../forms/FormField';
import { Button } from '../common/Button';
import { userService } from '../../services/userService';
import { validators } from '../../utils/validators';
import { TrendingUp, Building2, User, IndianRupee, Calendar, Percent } from 'lucide-react';
import './OpportunityModal.css';

export const OpportunityModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  isLoading = false,
}) => {
  const isEditing = Boolean(initialData);

  const [assigneeOptions, setAssigneeOptions] = useState([
    { value: 'Unassigned', label: 'Unassigned' }
  ]);

  const [formData, setFormData] = useState({
    title: '',
    customerName: '',
    contactPerson: '',
    stage: 'Proposal',
    dealValue: '',
    probability: '75',
    expectedCloseDate: '',
    assignedTo: 'Unassigned',
    notes: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchAssignees = async () => {
      try {
        const res = await userService.getUsers({ limit: 100 });
        const list = res.data || res.results || [];
        if (list.length > 0) {
          const opts = list.map((u) => ({
            value: u.name,
            label: `${u.name} (${u.role || 'Staff'})`,
          }));
          setAssigneeOptions([{ value: 'Unassigned', label: 'Unassigned' }, ...opts]);
        }
      } catch (e) {
        console.warn('Failed to load assignees for opportunity modal:', e);
      }
    };

    if (isOpen) {
      fetchAssignees();
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        customerName: initialData.customerName || '',
        contactPerson: initialData.contactPerson || '',
        stage: initialData.stage || 'Proposal',
        dealValue: initialData.dealValue || '',
        probability: String(initialData.probability ?? 75),
        expectedCloseDate: initialData.expectedCloseDate || '',
        assignedTo: initialData.assignedTo || 'Unassigned',
        notes: initialData.notes || '',
      });
    } else {
      setFormData({
        title: '',
        customerName: '',
        contactPerson: '',
        stage: 'Proposal',
        dealValue: '',
        probability: '75',
        expectedCloseDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        assignedTo: 'Unassigned',
        notes: '',
      });
    }
    setErrors({});
  }, [initialData, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    const titleErr = validators.required(formData.title, 'Opportunity Title');
    if (titleErr) newErrors.title = titleErr;

    const custErr = validators.required(formData.customerName, 'Client / Customer Name');
    if (custErr) newErrors.customerName = custErr;

    const valErr = validators.required(formData.dealValue, 'Deal Value') || validators.isPositiveNumber(formData.dealValue, 'Deal Value');
    if (valErr) newErrors.dealValue = valErr;

    const dateErr = validators.required(formData.expectedCloseDate, 'Expected Closing Date');
    if (dateErr) newErrors.expectedCloseDate = dateErr;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(formData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Sales Opportunity' : 'New Sales Opportunity'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} isLoading={isLoading}>
            {isEditing ? 'Save Changes' : 'Create Opportunity'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate>
        <div className="opp-form-grid">
          <FormField
            label="Deal / Opportunity Title"
            name="title"
            placeholder="e.g. Enterprise Cloud ERP Migration"
            value={formData.title}
            onChange={handleChange}
            error={errors.title}
            required
            icon={TrendingUp}
          />

          <FormField
            label="Client / Customer Name"
            name="customerName"
            placeholder="e.g. Acme Global Corp"
            value={formData.customerName}
            onChange={handleChange}
            error={errors.customerName}
            required
            icon={Building2}
          />

          <FormField
            label="Primary Contact Person"
            name="contactPerson"
            placeholder="e.g. David Miller"
            value={formData.contactPerson}
            onChange={handleChange}
            icon={User}
          />

          <FormField
            label="Pipeline Stage"
            name="stage"
            type="select"
            value={formData.stage}
            onChange={handleChange}
            options={[
              { value: 'Qualification', label: '1. Qualification' },
              { value: 'Proposal', label: '2. Proposal Presented' },
              { value: 'Negotiation', label: '3. Contract Negotiation' },
              { value: 'Closed Won', label: '4. Closed / Won 🎉' },
              { value: 'Closed Lost', label: '5. Closed / Lost ❌' },
            ]}
          />

          <FormField
            label="Estimated Deal Value (₹)"
            name="dealValue"
            type="number"
            placeholder="120000"
            value={formData.dealValue}
            onChange={handleChange}
            error={errors.dealValue}
            required
            icon={IndianRupee}
          />

          <FormField
            label="Win Probability (%)"
            name="probability"
            type="number"
            placeholder="75"
            value={formData.probability}
            onChange={handleChange}
            icon={Percent}
          />

          <FormField
            label="Expected Closing Date"
            name="expectedCloseDate"
            type="date"
            value={formData.expectedCloseDate}
            onChange={handleChange}
            error={errors.expectedCloseDate}
            required
            icon={Calendar}
          />

          <FormField
            label="Assigned Salesperson"
            name="assignedTo"
            type="select"
            value={formData.assignedTo}
            onChange={handleChange}
            icon={User}
            options={assigneeOptions}
          />

          <div style={{ gridColumn: '1 / -1' }}>
            <FormField
              label="Deal Notes & Remarks"
              name="notes"
              type="textarea"
              placeholder="Terms discussed, objections, competitors, or milestones..."
              value={formData.notes}
              onChange={handleChange}
              rows={3}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
};
