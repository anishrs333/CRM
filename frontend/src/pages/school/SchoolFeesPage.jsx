import React, { useState, useEffect, useCallback } from 'react';
import { IndianRupee, Plus, Calendar, CheckCircle2, Loader2, X } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../hooks/useToast';
import './SchoolPages.css';

export const SchoolFeesPage = () => {
  const { showToast } = useToast();
  const [feeStructures, setFeeStructures] = useState([]);
  const [feeAssignments, setFeeAssignments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [classId, setClassId] = useState('');
  const [amount, setAmount] = useState('25000');
  const [dueDate, setDueDate] = useState('2026-12-31');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadFees = useCallback(async () => {
    setIsLoading(true);
    try {
      const [fsRes, faRes, cRes] = await Promise.all([
        api.get('/school/fee-structures/'),
        api.get('/school/fee-assignments/'),
        api.get('/school/classes/')
      ]);

      const fsList = Array.isArray(fsRes?.results) ? fsRes.results : Array.isArray(fsRes) ? fsRes : [];
      setFeeStructures(fsList);

      const faList = Array.isArray(faRes?.results) ? faRes.results : Array.isArray(faRes) ? faRes : [];
      setFeeAssignments(faList);

      const cList = Array.isArray(cRes?.results) ? cRes.results : Array.isArray(cRes) ? cRes : [];
      setClasses(cList);
    } catch (err) {
      console.error('Failed to load fee structures:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFees();
  }, [loadFees]);

  const handleCreateFeeStructure = async (e) => {
    e.preventDefault();
    if (!name || !classId || !amount) return;

    setIsSubmitting(true);
    try {
      const yearRes = await api.get('/school/academic-years/');
      const activeYear = yearRes.results?.[0]?.id || 1;

      await api.post('/school/fee-structures/', {
        name,
        academic_year: activeYear,
        school_class: parseInt(classId),
        total_amount: parseFloat(amount),
        due_date: dueDate
      });
      showToast(`Fee Structure "${name}" created!`, 'success');
      setIsModalOpen(false);
      setName('');
      loadFees();
    } catch (err) {
      showToast(err.message || 'Failed to create fee structure.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="learning-page-container">
      <div className="page-header">
        <div>
          <div className="page-title-wrap">
            <IndianRupee className="text-emerald-600" size={28} />
            <h1 className="page-title">School Fee Management</h1>
          </div>
          <p className="page-subtitle">
            Configure annual fee structures, class assignments, payments, and receipts.
          </p>
        </div>

        <button className="btn btn-primary" style={{ backgroundColor: '#059669' }} onClick={() => setIsModalOpen(true)}>
          <Plus size={18} />
          <span>Create Fee Structure</span>
        </button>
      </div>

      {isLoading ? (
        <div className="loading-state">
          <Loader2 size={32} className="animate-spin text-emerald-600" />
          <p>Loading fee structures...</p>
        </div>
      ) : feeStructures.length === 0 ? (
        <div className="empty-state-card">
          <IndianRupee size={48} className="text-slate-400 mb-2" />
          <h3>No school fee structures configured</h3>
          <button className="btn btn-primary mt-4" style={{ backgroundColor: '#059669' }} onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> Create Fee Structure
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {feeStructures.map((fs) => (
            <div key={fs.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <h3 className="font-bold text-slate-900 text-base mb-1">{fs.name}</h3>
              <div className="text-xs text-slate-500 mb-3">{fs.class_name} ({fs.academic_year_name})</div>
              <div className="text-lg font-bold text-emerald-700 font-mono border-t pt-2">
                ₹{parseFloat(fs.total_amount).toLocaleString('en-IN')}
              </div>
              <div className="text-xs text-slate-400 mt-1">Due Date: {fs.due_date}</div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card modal-md">
            <div className="modal-header">
              <div className="modal-title-wrap">
                <IndianRupee className="text-emerald-600" size={22} />
                <h3>Create School Fee Structure</h3>
              </div>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateFeeStructure} className="modal-body">
              <div className="form-group">
                <label className="form-label required">Fee Structure Name</label>
                <input 
                  type="text"
                  className="form-control"
                  placeholder="e.g. Class 10 Annual Tuition & Lab Fee"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group col-6">
                  <label className="form-label required">Target Class</label>
                  <select 
                    className="form-control"
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    required
                  >
                    <option value="">-- Select Class --</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group col-6">
                  <label className="form-label required">Total Amount (₹)</label>
                  <input 
                    type="number"
                    className="form-control"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label required">Due Date</label>
                <input 
                  type="date"
                  className="form-control"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#059669' }} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Create Fee Structure'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchoolFeesPage;
