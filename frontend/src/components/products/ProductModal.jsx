import React, { useState, useEffect } from 'react';
import { Modal } from '../modals/Modal';
import { FormField } from '../forms/FormField';
import { Button } from '../common/Button';
import { validators } from '../../utils/validators';
import { Package, Hash, IndianRupee, Percent, Tag } from 'lucide-react';
import './ProductModal.css';

export const ProductModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  isLoading = false,
}) => {
  const isEditing = Boolean(initialData);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: 'Software License',
    unitPrice: '',
    taxPercentage: '18',
    status: 'Active',
    description: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        code: initialData.code || '',
        name: initialData.name || '',
        category: initialData.category || 'Software License',
        unitPrice: initialData.unitPrice || '',
        taxPercentage: String(initialData.taxPercentage ?? 18),
        status: initialData.status || 'Active',
        description: initialData.description || '',
      });
    } else {
      setFormData({
        code: '',
        name: '',
        category: 'Software License',
        unitPrice: '',
        taxPercentage: '18',
        status: 'Active',
        description: '',
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

    const codeErr = validators.required(formData.code, 'Product Code / SKU');
    if (codeErr) newErrors.code = codeErr;

    const nameErr = validators.required(formData.name, 'Product / Service Name');
    if (nameErr) newErrors.name = nameErr;

    const priceErr = validators.required(formData.unitPrice, 'Unit Price') || validators.isPositiveNumber(formData.unitPrice, 'Unit Price');
    if (priceErr) newErrors.unitPrice = priceErr;

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
      title={isEditing ? 'Edit Product / Service' : 'Add New Product / Service'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} isLoading={isLoading}>
            {isEditing ? 'Save Changes' : 'Create Item'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate>
        <div className="product-form-grid">
          <FormField
            label="Product Code / SKU"
            name="code"
            placeholder="e.g. PLSTS-CRM-ENT"
            value={formData.code}
            onChange={handleChange}
            error={errors.code}
            required
            icon={Hash}
          />

          <FormField
            label="Product / Service Name"
            name="name"
            placeholder="e.g. Enterprise CRM Core"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            required
            icon={Package}
          />

          <FormField
            label="Category"
            name="category"
            type="select"
            value={formData.category}
            onChange={handleChange}
            icon={Tag}
            options={[
              { value: 'Software License', label: 'Software License' },
              { value: 'Implementation', label: 'Implementation & Setup' },
              { value: 'Infrastructure', label: 'Infrastructure & Hosting' },
              { value: 'Service Contract', label: 'Service Contract / SLA' },
              { value: 'Professional Services', label: 'Professional Services' },
            ]}
          />

          <FormField
            label="Unit Price (₹)"
            name="unitPrice"
            type="number"
            placeholder="75000"
            value={formData.unitPrice}
            onChange={handleChange}
            error={errors.unitPrice}
            required
            icon={IndianRupee}
          />

          <FormField
            label="Tax Rate (%) [GST]"
            name="taxPercentage"
            type="select"
            value={formData.taxPercentage}
            onChange={handleChange}
            icon={Percent}
            options={[
              { value: '0', label: '0% (Exempt)' },
              { value: '5', label: '5% GST' },
              { value: '12', label: '12% GST' },
              { value: '18', label: '18% GST (Standard)' },
              { value: '28', label: '28% GST' },
            ]}
          />

          <FormField
            label="Status"
            name="status"
            type="select"
            value={formData.status}
            onChange={handleChange}
            options={[
              { value: 'Active', label: 'Active in Catalog' },
              { value: 'Inactive', label: 'Inactive / Archived' },
            ]}
          />

          <div style={{ gridColumn: '1 / -1' }}>
            <FormField
              label="Product Description"
              name="description"
              type="textarea"
              placeholder="Scope, specifications, SLA details..."
              value={formData.description}
              onChange={handleChange}
              rows={3}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
};
