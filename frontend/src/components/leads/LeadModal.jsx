import React, { useState, useEffect } from 'react';
import { Modal } from '../modals/Modal';
import { FormField } from '../forms/FormField';
import { Button } from '../common/Button';
import { userService } from '../../services/userService';
import { validators } from '../../utils/validators';
import { Building2, User, Mail, Phone, IndianRupee, Target, Award } from 'lucide-react';

export const LeadModal = ({
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
    name: '',
    contactName: '',
    email: '',
    phone: '',
    source: 'Website',
    status: 'New',
    estimatedValue: '',
    assignedTo: 'Unassigned',
    score: 60,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchAssignees = async () => {
      try {
        const res = await userService.getUsers({ limit: 100 });
        const list = res.data || res.results || [];
        if (list.length > 0) {
          const opts = list.map((u) => ({
            value: String(u.id),
            label: `${u.name} (${u.role_label || u.role || 'Staff'})`,
          }));
          setAssigneeOptions([{ value: 'Unassigned', label: 'Unassigned' }, ...opts]);
        }
      } catch (e) {
        console.warn('Failed to load assignees for lead modal:', e);
      }
    };

    if (isOpen) {
      fetchAssignees();
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        contactName: initialData.contactName || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        source: initialData.source || 'Website',
        status: initialData.status || 'New',
        estimatedValue: initialData.estimatedValue || '',
        assignedTo: initialData.assigned_to ? String(initialData.assigned_to) : (initialData.assignedTo || 'Unassigned'),
        score: initialData.score ?? 60,
      });
    } else {
      setFormData({
        name: '',
        contactName: '',
        email: '',
        phone: '',
        source: 'Website',
        status: 'New',
        estimatedValue: '',
        assignedTo: 'Unassigned',
        score: 60,
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

    const nameErr = validators.required(formData.name, 'Lead / Company Name');
    if (nameErr) newErrors.name = nameErr;

    const contactErr = validators.required(formData.contactName, 'Contact Name');
    if (contactErr) newErrors.contactName = contactErr;

    const emailErr = validators.required(formData.email, 'Email Address') || validators.email(formData.email);
    if (emailErr) newErrors.email = emailErr;

    if (formData.estimatedValue) {
      const valErr = validators.isPositiveNumber(formData.estimatedValue, 'Estimated Value');
      if (valErr) newErrors.estimatedValue = valErr;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    const selectedUserId = formData.assignedTo !== 'Unassigned' ? Number(formData.assignedTo) : null;
    const selectedUserObj = assigneeOptions.find((o) => String(o.value) === String(formData.assignedTo));
    onSubmit({
      ...formData,
      assignedToId: selectedUserId,
      assignedTo: selectedUserObj ? selectedUserObj.label.split(' (')[0] : formData.assignedTo,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Sales Lead' : 'Create Sales Lead'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} isLoading={isLoading}>
            {isEditing ? 'Save Changes' : 'Create Lead'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 18px' }}>
          <FormField
            label="Company / Lead Title"
            name="name"
            placeholder="e.g. Apex Bio Labs"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            required
            icon={Building2}
          />

          <FormField
            label="Primary Contact Person"
            name="contactName"
            placeholder="e.g. Karen White"
            value={formData.contactName}
            onChange={handleChange}
            error={errors.contactName}
            required
            icon={User}
          />

          <FormField
            label="Contact Email"
            name="email"
            type="email"
            placeholder="e.g. kwhite@apexbio.org"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            required
            icon={Mail}
          />

          <FormField
            label="Phone Number"
            name="phone"
            placeholder="+1 (555) 000-0000"
            value={formData.phone}
            onChange={handleChange}
            icon={Phone}
          />

          <FormField
            label="Lead Acquisition Source"
            name="source"
            type="select"
            value={formData.source}
            onChange={handleChange}
            icon={Target}
            options={[
              { value: 'Website', label: 'Company Website' },
              { value: 'LinkedIn', label: 'LinkedIn Outreach' },
              { value: 'Referral', label: 'Client Referral' },
              { value: 'Cold Call', label: 'Cold Calling' },
              { value: 'Conference', label: 'Industry Conference' },
            ]}
          />

          <FormField
            label="Lead Status"
            name="status"
            type="select"
            value={formData.status}
            onChange={handleChange}
            options={[
              { value: 'New', label: 'New Lead' },
              { value: 'Contacted', label: 'Contacted' },
              { value: 'Qualified', label: 'Qualified Opportunity' },
              { value: 'Proposal', label: 'Proposal Sent' },
              { value: 'Won', label: 'Closed / Won' },
              { value: 'Lost', label: 'Closed / Lost' },
            ]}
          />

          <FormField
            label="Estimated Deal Value (₹)"
            name="estimatedValue"
            type="number"
            placeholder="35000"
            value={formData.estimatedValue}
            onChange={handleChange}
            error={errors.estimatedValue}
            icon={IndianRupee}
          />

          <FormField
            label="Lead Quality Score (0-100)"
            name="score"
            type="number"
            placeholder="75"
            value={formData.score}
            onChange={handleChange}
            icon={Award}
          />

          <div style={{ gridColumn: '1 / -1' }}>
            <FormField
              label="Assigned Sales Representative"
              name="assignedTo"
              type="select"
              value={formData.assignedTo}
              onChange={handleChange}
              options={assigneeOptions}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
};
