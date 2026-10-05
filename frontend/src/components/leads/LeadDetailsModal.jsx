import React from 'react';
import { Modal } from '../modals/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { formatCurrency, formatDate, getStatusBadgeVariant } from '../../utils/formatters';
import { Building2, User, Mail, Phone, IndianRupee, Target, Award, ArrowUpRight } from 'lucide-react';

export const LeadDetailsModal = ({ isOpen, onClose, lead, onEdit, onConvertToCustomer }) => {
  if (!lead) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Lead Qualification Card"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          {onEdit && (
            <Button
              variant="outline"
              onClick={() => {
                onClose();
                onEdit(lead);
              }}
            >
              Edit Lead
            </Button>
          )}
          {onConvertToCustomer && lead.status !== 'Won' && (
            <Button
              variant="primary"
              rightIcon={ArrowUpRight}
              onClick={() => {
                onClose();
                onConvertToCustomer(lead);
              }}
            >
              Convert to Customer
            </Button>
          )}
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div
          style={{
            padding: '16px',
            background: 'var(--bg-app)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--warning-bg)',
              color: 'var(--warning-solid)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Building2 size={26} />
          </div>
          <div>
            <h4 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {lead.name}
            </h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <Badge variant={getStatusBadgeVariant(lead.status)}>{lead.status}</Badge>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Source: {lead.source}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.92rem' }}>
            <User size={16} color="var(--text-muted)" />
            <span style={{ color: 'var(--text-muted)', width: '130px' }}>Contact Name:</span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{lead.contactName}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.92rem' }}>
            <Mail size={16} color="var(--text-muted)" />
            <span style={{ color: 'var(--text-muted)', width: '130px' }}>Email:</span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{lead.email}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.92rem' }}>
            <Phone size={16} color="var(--text-muted)" />
            <span style={{ color: 'var(--text-muted)', width: '130px' }}>Phone:</span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{lead.phone || '—'}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.92rem' }}>
            <IndianRupee size={16} color="var(--text-muted)" />
            <span style={{ color: 'var(--text-muted)', width: '130px' }}>Estimated Value:</span>
            <span style={{ fontWeight: 700, color: 'var(--success-solid)' }}>
              {formatCurrency(lead.estimatedValue)}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.92rem' }}>
            <Award size={16} color="var(--text-muted)" />
            <span style={{ color: 'var(--text-muted)', width: '130px' }}>Quality Score:</span>
            <span style={{ fontWeight: 700, color: 'var(--primary-600)' }}>
              {lead.score || 50} / 100
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.92rem' }}>
            <Target size={16} color="var(--text-muted)" />
            <span style={{ color: 'var(--text-muted)', width: '130px' }}>Assigned Agent:</span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{lead.assignedTo}</span>
          </div>
        </div>
      </div>
    </Modal>
  );
};
