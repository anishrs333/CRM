import React, { useState, useEffect, useCallback } from 'react';
import { Users, Plus, Search, Phone, Mail, Loader2, X } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../hooks/useToast';
import './SchoolPages.css';

export const SchoolParentsPage = () => {
  const { showToast } = useToast();
  const [parents, setParents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [relationship, setRelationship] = useState('father');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadParents = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/school/parents/');
      const list = Array.isArray(res?.results) ? res.results : Array.isArray(res) ? res : [];
      setParents(list);
    } catch (err) {
      console.error('Failed to load parents:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadParents();
  }, [loadParents]);

  const handleRegisterParent = async (e) => {
    e.preventDefault();
    if (!fullName || !phone) return;

    setIsSubmitting(true);
    try {
      await api.post('/school/parents/', {
        full_name: fullName,
        relationship,
        phone,
        email
      });
      showToast(`Parent record "${fullName}" created!`, 'success');
      setIsModalOpen(false);
      setFullName('');
      setPhone('');
      loadParents();
    } catch (err) {
      showToast(err.message || 'Failed to register parent.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="learning-page-container">
      <div className="page-header">
        <div>
          <div className="page-title-wrap">
            <Users className="text-emerald-600" size={28} />
            <h1 className="page-title">Parents & Guardians Registry</h1>
          </div>
          <p className="page-subtitle">
            Parent profiles, linked student dependencies, and emergency contacts.
          </p>
        </div>

        <button className="btn btn-primary" style={{ backgroundColor: '#059669' }} onClick={() => setIsModalOpen(true)}>
          <Plus size={18} />
          <span>Register Parent</span>
        </button>
      </div>

      {isLoading ? (
        <div className="loading-state">
          <Loader2 size={32} className="animate-spin text-emerald-600" />
          <p>Loading parent records...</p>
        </div>
      ) : parents.length === 0 ? (
        <div className="empty-state-card">
          <Users size={48} className="text-slate-400 mb-2" />
          <h3>No parent records registered</h3>
          <button className="btn btn-primary mt-4" style={{ backgroundColor: '#059669' }} onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> Register Parent
          </button>
        </div>
      ) : (
        <div className="table-card">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Parent Name</th>
                <th>Relationship</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Linked Children</th>
              </tr>
            </thead>
            <tbody>
              {parents.map((p) => (
                <tr key={p.id}>
                  <td className="font-bold text-slate-900">{p.full_name}</td>
                  <td><span className="capitalize badge badge-primary">{p.relationship}</span></td>
                  <td className="font-mono text-xs">{p.phone}</td>
                  <td className="text-xs text-slate-600">{p.email || 'N/A'}</td>
                  <td className="text-xs font-semibold text-emerald-800">{p.student_links?.length || 0} Linked Children</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card modal-md">
            <div className="modal-header">
              <div className="modal-title-wrap">
                <Users className="text-emerald-600" size={22} />
                <h3>Register Parent / Guardian</h3>
              </div>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRegisterParent} className="modal-body">
              <div className="form-group">
                <label className="form-label required">Full Name</label>
                <input 
                  type="text"
                  className="form-control"
                  placeholder="Parent / Guardian Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group col-6">
                  <label className="form-label required">Relationship</label>
                  <select 
                    className="form-control"
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                  >
                    <option value="father">Father</option>
                    <option value="mother">Mother</option>
                    <option value="guardian">Legal Guardian</option>
                  </select>
                </div>

                <div className="form-group col-6">
                  <label className="form-label required">Phone</label>
                  <input 
                    type="text"
                    className="form-control"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input 
                  type="email"
                  className="form-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#059669' }} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Register Parent'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchoolParentsPage;
