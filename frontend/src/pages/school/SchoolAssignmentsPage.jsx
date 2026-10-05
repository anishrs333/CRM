import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Plus, Search, Calendar, CheckCircle2, Loader2, X } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../hooks/useToast';
import './SchoolPages.css';

export const SchoolAssignmentsPage = () => {
  const { showToast } = useToast();
  const [assignments, setAssignments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [maxMarks, setMaxMarks] = useState('100');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadAssignments = useCallback(async () => {
    setIsLoading(true);
    try {
      const [aRes, cRes, sRes] = await Promise.all([
        api.get('/school/assignments/'),
        api.get('/school/classes/'),
        api.get('/school/subjects/')
      ]);

      const aList = Array.isArray(aRes?.results) ? aRes.results : Array.isArray(aRes) ? aRes : [];
      setAssignments(aList);

      const cList = Array.isArray(cRes?.results) ? cRes.results : Array.isArray(cRes) ? cRes : [];
      setClasses(cList);

      const sList = Array.isArray(sRes?.results) ? sRes.results : Array.isArray(sRes) ? sRes : [];
      setSubjects(sList);
    } catch (err) {
      console.error('Failed to load assignments:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!title || !classId || !subjectId) {
      showToast('Title, class, and subject are required.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      // Find section for class or default
      const classObj = classes.find(c => String(c.id) === String(classId));
      const sectionId = classObj?.sections?.[0]?.id || 1;
      const yearRes = await api.get('/school/academic-years/');
      const activeYear = yearRes.results?.[0]?.id || 1;

      const payload = {
        title,
        description,
        academic_year: activeYear,
        school_class: parseInt(classId),
        section: sectionId,
        subject: parseInt(subjectId),
        teacher: 1, // Default teacher
        due_date: dueDate,
        max_marks: parseFloat(maxMarks)
      };
      await api.post('/school/assignments/', payload);
      showToast(`Assignment "${title}" published!`, 'success');
      setIsModalOpen(false);
      setTitle('');
      loadAssignments();
    } catch (err) {
      showToast(err.message || 'Failed to create assignment.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="learning-page-container">
      <div className="page-header">
        <div>
          <div className="page-title-wrap">
            <FileText className="text-emerald-600" size={28} />
            <h1 className="page-title">Homework & School Assignments</h1>
          </div>
          <p className="page-subtitle">
            Publish homework assignments, review student submissions, and grade coursework.
          </p>
        </div>

        <button className="btn btn-primary" style={{ backgroundColor: '#059669' }} onClick={() => setIsModalOpen(true)}>
          <Plus size={18} />
          <span>Create Assignment</span>
        </button>
      </div>

      {isLoading ? (
        <div className="loading-state">
          <Loader2 size={32} className="animate-spin text-emerald-600" />
          <p>Loading assignments...</p>
        </div>
      ) : assignments.length === 0 ? (
        <div className="empty-state-card">
          <FileText size={48} className="text-slate-400 mb-2" />
          <h3>No homework assignments published</h3>
          <button className="btn btn-primary mt-4" style={{ backgroundColor: '#059669' }} onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> Create Assignment
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {assignments.map((ass) => (
            <div key={ass.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-slate-900 text-base">{ass.title}</h3>
                <span className="badge badge-primary">{ass.subject_name}</span>
              </div>
              <p className="text-xs text-slate-500 mb-3 line-clamp-2">{ass.description || 'No detailed instructions.'}</p>
              <div className="text-xs text-slate-600 space-y-1 border-t pt-2">
                <div>Class: <span className="font-semibold">{ass.class_name} ({ass.section_name})</span></div>
                <div>Due Date: <span className="font-semibold text-red-600">{ass.due_date}</span></div>
                <div>Max Marks: <span className="font-semibold">{ass.max_marks}</span></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE MODAL */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card modal-md">
            <div className="modal-header">
              <div className="modal-title-wrap">
                <FileText className="text-emerald-600" size={22} />
                <h3>Create Homework Assignment</h3>
              </div>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="modal-body">
              <div className="form-group">
                <label className="form-label required">Assignment Title</label>
                <input 
                  type="text"
                  className="form-control"
                  placeholder="e.g. Mathematics Chapter 4 Exercise 4.2"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-row">
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

                <div className="form-group col-6">
                  <label className="form-label required">Subject</label>
                  <select 
                    className="form-control"
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    required
                  >
                    <option value="">-- Select Subject --</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} ({s.class_name})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group col-6">
                  <label className="form-label required">Due Date</label>
                  <input 
                    type="date"
                    className="form-control"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group col-6">
                  <label className="form-label required">Max Marks</label>
                  <input 
                    type="number"
                    className="form-control"
                    value={maxMarks}
                    onChange={(e) => setMaxMarks(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#059669' }} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Publish Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchoolAssignmentsPage;
