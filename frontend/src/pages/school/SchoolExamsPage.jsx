import React, { useState, useEffect, useCallback } from 'react';
import { Award, Plus, Calendar, CheckCircle2, Loader2, X } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../hooks/useToast';
import './SchoolPages.css';

export const SchoolExamsPage = () => {
  const { showToast } = useToast();
  const [exams, setExams] = useState([]);
  const [examTypes, setExamTypes] = useState([]);
  const [classes, setClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [typeId, setTypeId] = useState('');
  const [classId, setClassId] = useState('');
  const [startDate, setStartDate] = useState('2026-03-01');
  const [endDate, setEndDate] = useState('2026-03-15');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadExams = useCallback(async () => {
    setIsLoading(true);
    try {
      const [eRes, tRes, cRes] = await Promise.all([
        api.get('/school/exams/'),
        api.get('/school/exam-types/'),
        api.get('/school/classes/')
      ]);

      const eList = Array.isArray(eRes?.results) ? eRes.results : Array.isArray(eRes) ? eRes : [];
      setExams(eList);

      const tList = Array.isArray(tRes?.results) ? tRes.results : Array.isArray(tRes) ? tRes : [];
      setExamTypes(tList);

      const cList = Array.isArray(cRes?.results) ? cRes.results : Array.isArray(cRes) ? cRes : [];
      setClasses(cList);
    } catch (err) {
      console.error('Failed to load exams:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExams();
  }, [loadExams]);

  const handleScheduleExam = async (e) => {
    e.preventDefault();
    if (!title || !typeId || !classId) return;

    setIsSubmitting(true);
    try {
      const yearRes = await api.get('/school/academic-years/');
      const activeYear = yearRes.results?.[0]?.id || 1;

      const payload = {
        title,
        exam_type: parseInt(typeId),
        academic_year: activeYear,
        school_class: parseInt(classId),
        start_date: startDate,
        end_date: endDate,
        is_published: true
      };
      await api.post('/school/exams/', payload);
      showToast(`Exam "${title}" scheduled successfully!`, 'success');
      setIsModalOpen(false);
      setTitle('');
      loadExams();
    } catch (err) {
      showToast(err.message || 'Failed to schedule exam.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="learning-page-container">
      <div className="page-header">
        <div>
          <div className="page-title-wrap">
            <Award className="text-emerald-600" size={28} />
            <h1 className="page-title">Exams & Report Cards</h1>
          </div>
          <p className="page-subtitle">
            Exam scheduling, marks entry, grade calculation, and report card publishing.
          </p>
        </div>

        <button className="btn btn-primary" style={{ backgroundColor: '#059669' }} onClick={() => setIsModalOpen(true)}>
          <Plus size={18} />
          <span>Schedule Exam</span>
        </button>
      </div>

      {isLoading ? (
        <div className="loading-state">
          <Loader2 size={32} className="animate-spin text-emerald-600" />
          <p>Loading exams...</p>
        </div>
      ) : exams.length === 0 ? (
        <div className="empty-state-card">
          <Award size={48} className="text-slate-400 mb-2" />
          <h3>No school exams scheduled</h3>
          <button className="btn btn-primary mt-4" style={{ backgroundColor: '#059669' }} onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> Schedule Exam
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {exams.map((ex) => (
            <div key={ex.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-slate-900 text-base">{ex.title}</h3>
                <span className="badge badge-success">{ex.exam_type_name || 'Standard Exam'}</span>
              </div>
              <div className="text-xs text-slate-600 space-y-1 border-t pt-2 mt-2">
                <div>Class: <span className="font-semibold">{ex.class_name}</span></div>
                <div>Academic Year: <span className="font-semibold">{ex.academic_year_name}</span></div>
                <div>Duration: <span className="font-semibold text-emerald-800">{ex.start_date} to {ex.end_date}</span></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE EXAM MODAL */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card modal-md">
            <div className="modal-header">
              <div className="modal-title-wrap">
                <Award className="text-emerald-600" size={22} />
                <h3>Schedule New Exam</h3>
              </div>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleScheduleExam} className="modal-body">
              <div className="form-group">
                <label className="form-label required">Exam Title</label>
                <input 
                  type="text"
                  className="form-control"
                  placeholder="e.g. Annual Final Examination 2026"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group col-6">
                  <label className="form-label required">Exam Type</label>
                  <select 
                    className="form-control"
                    value={typeId}
                    onChange={(e) => setTypeId(e.target.value)}
                    required
                  >
                    <option value="">-- Select Type --</option>
                    {examTypes.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group col-6">
                  <label className="form-label required">Class</label>
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
              </div>

              <div className="form-row">
                <div className="form-group col-6">
                  <label className="form-label required">Start Date</label>
                  <input 
                    type="date"
                    className="form-control"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group col-6">
                  <label className="form-label required">End Date</label>
                  <input 
                    type="date"
                    className="form-control"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#059669' }} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Schedule Exam'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchoolExamsPage;
