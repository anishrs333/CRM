import React, { useState, useEffect, useCallback } from 'react';
import { ClipboardList, Plus, Search, User, Calendar, CheckCircle2, Loader2, X } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../hooks/useToast';
import './SchoolPages.css';

export const SchoolAdmissionsPage = () => {
  const { showToast } = useToast();
  const [admissions, setAdmissions] = useState([]);
  const [classes, setClasses] = useState([]);
  const [years, setYears] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [appNumber, setAppNumber] = useState('');
  const [applicantName, setApplicantName] = useState('');
  const [dob, setDob] = useState('2014-04-10');
  const [gender, setGender] = useState('male');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [targetClassId, setTargetClassId] = useState('');
  const [targetYearId, setTargetYearId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadAdmissions = useCallback(async () => {
    setIsLoading(true);
    try {
      const [aRes, cRes, yRes] = await Promise.all([
        api.get('/school/admissions/'),
        api.get('/school/classes/'),
        api.get('/school/academic-years/')
      ]);

      const aList = Array.isArray(aRes?.results) ? aRes.results : Array.isArray(aRes) ? aRes : [];
      setAdmissions(aList);

      const cList = Array.isArray(cRes?.results) ? cRes.results : Array.isArray(cRes) ? cRes : [];
      setClasses(cList);

      const yList = Array.isArray(yRes?.results) ? yRes.results : Array.isArray(yRes) ? yRes : [];
      setYears(yList);
    } catch (err) {
      console.error('Failed to load admissions:', err);
      showToast(err.message || 'Failed to load admissions.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadAdmissions();
  }, [loadAdmissions]);

  const handleCreateAdmission = async (e) => {
    e.preventDefault();
    if (!appNumber || !applicantName || !targetClassId || !targetYearId) {
      showToast('Fill in all required admission fields.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        application_number: appNumber,
        applicant_name: applicantName,
        date_of_birth: dob,
        gender,
        parent_name: parentName,
        parent_phone: parentPhone,
        target_class: parseInt(targetClassId),
        target_academic_year: parseInt(targetYearId),
        status: 'submitted'
      };
      await api.post('/school/admissions/', payload);
      showToast(`Admission application ${appNumber} submitted!`, 'success');
      setIsApplyModalOpen(false);
      setAppNumber('');
      setApplicantName('');
      loadAdmissions();
    } catch (err) {
      showToast(err.message || 'Failed to submit admission application.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="learning-page-container">
      <div className="page-header">
        <div>
          <div className="page-title-wrap">
            <ClipboardList className="text-emerald-600" size={28} />
            <h1 className="page-title">School Admissions Workflow</h1>
          </div>
          <p className="page-subtitle">
            Student application registration, document verification, and enrollment approval.
          </p>
        </div>

        <button className="btn btn-primary" style={{ backgroundColor: '#059669' }} onClick={() => setIsApplyModalOpen(true)}>
          <Plus size={18} />
          <span>Register New Admission</span>
        </button>
      </div>

      {isLoading ? (
        <div className="loading-state">
          <Loader2 size={32} className="animate-spin text-emerald-600" />
          <p>Loading admission applications...</p>
        </div>
      ) : admissions.length === 0 ? (
        <div className="empty-state-card">
          <ClipboardList size={48} className="text-slate-400 mb-2" />
          <h3>No admission applications submitted</h3>
          <p>Register student admission applications to track processing through enrollment.</p>
          <button className="btn btn-primary mt-4" style={{ backgroundColor: '#059669' }} onClick={() => setIsApplyModalOpen(true)}>
            <Plus size={16} /> Register Admission
          </button>
        </div>
      ) : (
        <div className="table-card">
          <table className="custom-table">
            <thead>
              <tr>
                <th>App #</th>
                <th>Applicant Name</th>
                <th>Parent / Guardian</th>
                <th>Phone</th>
                <th>Target Class</th>
                <th>Academic Year</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {admissions.map((adm) => (
                <tr key={adm.id}>
                  <td><span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-1 rounded">{adm.application_number}</span></td>
                  <td className="font-bold text-slate-900">{adm.applicant_name}</td>
                  <td>{adm.parent_name}</td>
                  <td className="font-mono text-xs">{adm.parent_phone}</td>
                  <td>{adm.target_class_name}</td>
                  <td>{adm.target_academic_year_name}</td>
                  <td><span className="badge badge-primary uppercase text-xs">{adm.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ADMISSION MODAL */}
      {isApplyModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card modal-md">
            <div className="modal-header">
              <div className="modal-title-wrap">
                <ClipboardList className="text-emerald-600" size={22} />
                <h3>New School Admission Application</h3>
              </div>
              <button className="modal-close" onClick={() => setIsApplyModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateAdmission} className="modal-body">
              <div className="form-group">
                <label className="form-label required">Application Number</label>
                <input 
                  type="text"
                  className="form-control font-mono"
                  placeholder="e.g. APP-2026-101"
                  value={appNumber}
                  onChange={(e) => setAppNumber(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label required">Applicant Student Name</label>
                <input 
                  type="text"
                  className="form-control"
                  placeholder="Full Name"
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group col-6">
                  <label className="form-label required">Parent Name</label>
                  <input 
                    type="text"
                    className="form-control"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group col-6">
                  <label className="form-label required">Parent Phone</label>
                  <input 
                    type="text"
                    className="form-control"
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group col-6">
                  <label className="form-label required">Target Class</label>
                  <select 
                    className="form-control"
                    value={targetClassId}
                    onChange={(e) => setTargetClassId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Class --</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group col-6">
                  <label className="form-label required">Target Academic Year</label>
                  <select 
                    className="form-control"
                    value={targetYearId}
                    onChange={(e) => setTargetYearId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Year --</option>
                    {years.map((y) => (
                      <option key={y.id} value={y.id}>{y.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsApplyModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#059669' }} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchoolAdmissionsPage;
