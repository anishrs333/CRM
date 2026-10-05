import React, { useState, useEffect, useCallback } from 'react';
import { Building2, Plus, Briefcase, Award, Search, Loader2, Globe, MapPin, Phone, Mail } from 'lucide-react';
import studentService from '../../services/studentService';
import { useToast } from '../../hooks/useToast';
import '../students/StudentListPage.css';

export const HiringPartnersPage = () => {
  const { showToast } = useToast();
  const [companies, setCompanies] = useState([]);
  const [placements, setPlacements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: '',
    company_tier: 'MNC',
    website: '',
    location: 'Chennai / Bangalore',
    contact_person: '',
    contact_email: '',
    contact_phone: '',
  });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [compRes, plcRes] = await Promise.all([
        studentService.getCompanies().catch(() => []),
        studentService.getStudents({ status: 'placed' }).catch(() => [])
      ]);

      const compList = Array.isArray(compRes?.results) ? compRes.results : Array.isArray(compRes?.data) ? compRes.data : Array.isArray(compRes) ? compRes : [];
      const plcList = Array.isArray(plcRes?.results) ? plcRes.results : Array.isArray(plcRes?.data) ? plcRes.data : Array.isArray(plcRes) ? plcRes : [];

      setCompanies(compList);
      setPlacements(plcList);
    } catch (err) {
      console.error('Failed to load corporate hiring data:', err);
      showToast(err.message || 'Failed to load hiring partner records.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    if (!form.name) {
      showToast('Please enter company name.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await studentService.createCompany(form);
      showToast(`🎉 Corporate Hiring Partner "${form.name}" registered!`, 'success');
      setIsAddModalOpen(false);
      setForm({
        name: '',
        company_tier: 'MNC',
        website: '',
        location: 'Chennai / Bangalore',
        contact_person: '',
        contact_email: '',
        contact_phone: '',
      });
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to register hiring company.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPlacements = placements.filter((std) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const plc = std.placement || {};
    return (plc.company_name || '').toLowerCase().includes(q) ||
           (plc.job_role || '').toLowerCase().includes(q) ||
           (std.full_name || '').toLowerCase().includes(q);
  });

  return (
    <div className="student-crm-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Corporate Hiring Partners & Placement Drives</h1>
          <p className="page-subtitle">Manage corporate recruiters, recruitment drives, placed candidates, and LPA salary packages.</p>
        </div>

        <button 
          type="button" 
          className="enroll-student-btn"
          onClick={() => setIsAddModalOpen(true)}
        >
          <Plus size={18} />
          <span>Add Hiring Partner</span>
        </button>
      </div>

      {/* Corporate Partners Grid */}
      {companies.length > 0 && (
        <div style={{ marginBottom: '28px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', marginBottom: '14px' }}>Registered Corporate Recruiters</h3>
          <div className="stats-cards-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {companies.map((comp) => (
              <div key={comp.id} className="stat-card" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '18px', borderRadius: '12px', background: '#fff', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginBottom: '8px' }}>
                  <span className="payment-status-badge status-fully-paid" style={{ fontSize: '11px' }}>
                    {comp.company_tier || 'MNC'}
                  </span>
                  <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: 700 }}>{comp.total_placements || 0} Placed</span>
                </div>
                <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>{comp.name}</h4>
                <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={13} /> {comp.location || 'Pan India'}
                </p>
                {comp.contact_person && (
                  <p style={{ fontSize: '12px', color: '#475569' }}>HR: <strong>{comp.contact_person}</strong></p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Placement Roster */}
      <div className="table-controls-bar">
        <div className="search-box-wrap" style={{ width: '100%' }}>
          <Search size={18} className="search-icon" />
          <input 
            type="text"
            className="search-input"
            placeholder="Search placed students, company names, or job roles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="loading-state">
          <Loader2 size={32} className="animate-spin text-indigo" />
          <p>Loading corporate hiring partners roster...</p>
        </div>
      ) : filteredPlacements.length > 0 ? (
        <div className="students-table-card">
          <table className="students-table">
            <thead>
              <tr>
                <th>Hiring Company</th>
                <th>Designated Job Role</th>
                <th>Placed Student</th>
                <th>CTC Package</th>
                <th>Offer Date</th>
                <th>Offer Letter Ref</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlacements.map((std) => {
                const plc = std.placement || {};
                return (
                  <tr key={std.id} className="table-row-hover">
                    <td>
                      <div className="company-text" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Building2 size={18} className="text-green" color="#16a34a" />
                        <strong style={{ fontSize: '14px', color: '#0f172a' }}>{plc.company_name || 'Hiring Partner'}</strong>
                      </div>
                    </td>

                    <td>
                      <span className="course-title-text">{plc.job_role || 'Software Engineer'}</span>
                    </td>

                    <td>
                      <div className="student-profile-cell">
                        <div className="student-avatar-small">
                          {std.first_name?.[0]}{std.last_name?.[0]}
                        </div>
                        <div>
                          <span className="student-name-text">{std.full_name}</span>
                          <span className="student-id-text">{std.enrollment_id}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="ctc-text" style={{ color: '#16a34a', fontWeight: 700 }}>₹{parseFloat(plc.ctc_package || 0).toFixed(2)} LPA</span>
                    </td>

                    <td>
                      <span className="qualification-text">{plc.offer_date || 'N/A'}</span>
                    </td>

                    <td>
                      <span className="qualification-text" style={{ fontFamily: 'monospace' }}>{plc.offer_letter_number || 'OFFER-2026-OK'}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state-card">
          <Building2 size={48} className="empty-icon" />
          <h3>No Corporate Placement Records Logged</h3>
          <p>Corporate hiring partners and placed candidates will appear here when students complete their 90-day training and accept placement offers.</p>
        </div>
      )}

      {/* ADD HIRING COMPANY MODAL */}
      {isAddModalOpen && (
        <div className="sub-modal-overlay">
          <div className="sub-modal-card">
            <h3>Register Corporate Hiring Partner</h3>
            <form onSubmit={handleCreateCompany} className="sub-modal-form">
              <div className="form-group">
                <label>Company Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Zoho Corporation"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Company Category / Tier</label>
                <select
                  value={form.company_tier}
                  onChange={(e) => setForm({ ...form, company_tier: e.target.value })}
                >
                  <option value="Unicorn">Product Unicorn</option>
                  <option value="Tier-1">Tier-1 IT Giant</option>
                  <option value="MNC">Global MNC</option>
                  <option value="Startup">High-Growth Startup</option>
                </select>
              </div>

              <div className="form-group">
                <label>Office Location</label>
                <input
                  type="text"
                  placeholder="e.g. Chennai / Bangalore"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>HR Contact Person</label>
                <input
                  type="text"
                  placeholder="e.g. Talent Acquisition Team"
                  value={form.contact_person}
                  onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>HR Contact Email</label>
                <input
                  type="email"
                  placeholder="e.g. careers@company.com"
                  value={form.contact_email}
                  onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                />
              </div>

              <div className="sub-modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Register Company'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HiringPartnersPage;
