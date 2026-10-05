import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Layers, BookOpen, Clock, Plus, Loader2, X, AlertTriangle } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../hooks/useToast';
import './SchoolPages.css';

export const SchoolAcademicsPage = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('years');

  const [academicYears, setAcademicYears] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [yearName, setYearName] = useState('');
  const [startDate, setStartDate] = useState('2025-06-01');
  const [endDate, setEndDate] = useState('2026-04-30');
  const [isCurrent, setIsCurrent] = useState(true);

  // Class Modal
  const [className, setClassName] = useState('');
  const [classCode, setClassCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadAcademics = useCallback(async () => {
    setIsLoading(true);
    try {
      const [yRes, cRes, sRes, tRes] = await Promise.all([
        api.get('/school/academic-years/'),
        api.get('/school/classes/'),
        api.get('/school/subjects/'),
        api.get('/school/timetable/')
      ]);

      const yList = Array.isArray(yRes?.results) ? yRes.results : Array.isArray(yRes) ? yRes : [];
      setAcademicYears(yList);

      const cList = Array.isArray(cRes?.results) ? cRes.results : Array.isArray(cRes) ? cRes : [];
      setClasses(cList);

      const sList = Array.isArray(sRes?.results) ? sRes.results : Array.isArray(sRes) ? sRes : [];
      setSubjects(sList);

      const tList = Array.isArray(tRes?.results) ? tRes.results : Array.isArray(tRes) ? tRes : [];
      setTimetable(tList);
    } catch (err) {
      console.error('Failed to load academic data:', err);
      showToast(err.message || 'Failed to load academic data.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadAcademics();
  }, [loadAcademics]);

  const handleCreateYear = async (e) => {
    e.preventDefault();
    if (!yearName) return;
    setIsSubmitting(true);
    try {
      await api.post('/school/academic-years/', { name: yearName, start_date: startDate, end_date: endDate, is_current: isCurrent });
      showToast(`Academic Year "${yearName}" created!`, 'success');
      setIsModalOpen(false);
      setYearName('');
      loadAcademics();
    } catch (err) {
      showToast(err.message || 'Failed to create academic year.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    if (!className || !classCode) return;
    setIsSubmitting(true);
    try {
      await api.post('/school/classes/', { name: className, code: classCode });
      showToast(`Class "${className}" created!`, 'success');
      setIsModalOpen(false);
      setClassName('');
      setClassCode('');
      loadAcademics();
    } catch (err) {
      showToast(err.message || 'Failed to create class.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="learning-page-container">
      <div className="page-header">
        <div>
          <div className="page-title-wrap">
            <Calendar className="text-emerald-600" size={28} />
            <h1 className="page-title">Tech Curriculum & Timetable Architecture</h1>
          </div>
          <p className="page-subtitle">
            Configure Academic Years, Classes, Sections, Campus Subjects, and Conflict-Free Timetable Slots.
          </p>
        </div>

        <button className="btn btn-primary" style={{ backgroundColor: '#059669' }} onClick={() => setIsModalOpen(true)}>
          <Plus size={18} />
          <span>Add {activeTab === 'years' ? 'Academic Year' : activeTab === 'classes' ? 'Class' : 'Subject'}</span>
        </button>
      </div>

      {/* Tabs Bar */}
      <div className="academic-tabs-bar">
        <button
          className={`academic-tab-btn ${activeTab === 'years' ? 'active' : ''}`}
          onClick={() => setActiveTab('years')}
        >
          <Calendar size={16} /> Academic Years
        </button>

        <button
          className={`academic-tab-btn ${activeTab === 'classes' ? 'active' : ''}`}
          onClick={() => setActiveTab('classes')}
        >
          <Layers size={16} /> Classes & Sections
        </button>

        <button
          className={`academic-tab-btn ${activeTab === 'subjects' ? 'active' : ''}`}
          onClick={() => setActiveTab('subjects')}
        >
          <BookOpen size={16} /> Campus Subjects
        </button>

        <button
          className={`academic-tab-btn ${activeTab === 'timetable' ? 'active' : ''}`}
          onClick={() => setActiveTab('timetable')}
        >
          <Clock size={16} /> Timetable Slots
        </button>
      </div>

      {isLoading ? (
        <div className="loading-state">
          <Loader2 size={32} className="animate-spin text-emerald-600" />
          <p>Loading academic configuration...</p>
        </div>
      ) : activeTab === 'years' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {academicYears.map((year) => (
            <div key={year.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-slate-900 text-lg">{year.name}</h3>
                {year.is_current && <span className="badge badge-success">Active Year</span>}
              </div>
              <div className="text-xs text-slate-500 mt-2">
                <div>Start: {year.start_date}</div>
                <div>End: {year.end_date}</div>
              </div>
            </div>
          ))}
        </div>
      ) : activeTab === 'classes' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {classes.map((cls) => (
            <div key={cls.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-slate-900 text-base">{cls.name}</h3>
                <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-700">{cls.code}</span>
              </div>
              <div className="text-xs text-slate-500">{cls.sections?.length || 0} sections configured</div>
            </div>
          ))}
        </div>
      ) : activeTab === 'subjects' ? (
        <div className="table-card">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Subject Name</th>
                <th>Code</th>
                <th>Class</th>
                <th>Assigned Teacher</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((sub) => (
                <tr key={sub.id}>
                  <td className="font-bold text-slate-900">{sub.name}</td>
                  <td><span className="font-mono text-xs text-slate-600">{sub.code}</span></td>
                  <td>{sub.class_name}</td>
                  <td>{sub.teacher_name || 'Unassigned'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="table-card">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Class & Section</th>
                <th>Day</th>
                <th>Time Slot</th>
                <th>Subject</th>
                <th>Teacher</th>
                <th>Room</th>
              </tr>
            </thead>
            <tbody>
              {timetable.map((slot) => (
                <tr key={slot.id}>
                  <td className="font-bold text-slate-900">{slot.class_name} {slot.section_name}</td>
                  <td><span className="badge badge-primary">{slot.day_of_week}</span></td>
                  <td className="font-mono text-xs">{slot.start_time} - {slot.end_time}</td>
                  <td className="font-medium text-emerald-800">{slot.subject_name}</td>
                  <td>{slot.teacher_name}</td>
                  <td><span className="text-xs text-slate-500">{slot.room_number}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE MODAL */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card modal-md">
            <div className="modal-header">
              <div className="modal-title-wrap">
                <Calendar className="text-emerald-600" size={22} />
                <h3>Add {activeTab === 'years' ? 'Academic Year' : 'Class'}</h3>
              </div>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            {activeTab === 'years' ? (
              <form onSubmit={handleCreateYear} className="modal-body">
                <div className="form-group">
                  <label className="form-label required">Academic Year Name</label>
                  <input 
                    type="text"
                    className="form-control font-mono"
                    placeholder="e.g. 2025-2026"
                    value={yearName}
                    onChange={(e) => setYearName(e.target.value)}
                    required
                  />
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
                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Create Year'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleCreateClass} className="modal-body">
                <div className="form-group">
                  <label className="form-label required">Class Name</label>
                  <input 
                    type="text"
                    className="form-control"
                    placeholder="e.g. Class 10"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label required">Class Code</label>
                  <input 
                    type="text"
                    className="form-control font-mono"
                    placeholder="e.g. CL10"
                    value={classCode}
                    onChange={(e) => setClassCode(e.target.value)}
                    required
                  />
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#059669' }} disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Create Class'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SchoolAcademicsPage;
