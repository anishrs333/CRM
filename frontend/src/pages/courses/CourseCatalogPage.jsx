import React, { useState, useEffect, useCallback } from 'react';
import { BookOpen, Plus, Clock, IndianRupee, Tag, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import studentService from '../../services/studentService';
import { useToast } from '../../hooks/useToast';
import '../students/StudentListPage.css';

export const CourseCatalogPage = () => {
  const { showToast } = useToast();
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: '',
    code: '',
    description: '',
    duration_days: 90,
    fee_amount: 50000,
    category: 'Software Engineering',
  });

  const loadCourses = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await studentService.getCourses();
      const list = Array.isArray(res?.results) ? res.results : Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setCourses(list);
    } catch (err) {
      console.error('Failed to load courses:', err);
      showToast(err.message || 'Failed to load institute courses.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!form.title || !form.code || !form.fee_amount) {
      showToast('Please fill all required course details.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await studentService.createCourse(form);
      showToast(`🎉 Course "${form.title}" added to Institute catalog!`, 'success');
      setIsAddModalOpen(false);
      setForm({
        title: '',
        code: '',
        description: '',
        duration_days: 90,
        fee_amount: 50000,
        category: 'Software Engineering',
      });
      loadCourses();
    } catch (err) {
      showToast(err.message || 'Failed to create course.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="student-crm-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Institute Courses & Curriculum Catalog</h1>
          <p className="page-subtitle">Manage training courses, base durations (90 Days), fee structure, and academic programs.</p>
        </div>

        <button 
          type="button" 
          className="enroll-student-btn"
          onClick={() => setIsAddModalOpen(true)}
        >
          <Plus size={18} />
          <span>Add New Course</span>
        </button>
      </div>

      {isLoading ? (
        <div className="loading-state">
          <Loader2 size={32} className="animate-spin text-indigo" />
          <p>Loading course catalog...</p>
        </div>
      ) : courses.length > 0 ? (
        <div className="stats-cards-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {courses.map((crs) => (
            <div key={crs.id} className="stat-card" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '24px', borderRadius: '16px', background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginBottom: '12px' }}>
                <div className="stat-icon-wrap blue-bg">
                  <BookOpen size={22} />
                </div>
                <span className="payment-status-badge status-fully-paid" style={{ fontSize: '11px' }}>
                  {crs.code}
                </span>
              </div>

              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>{crs.title}</h3>
              <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px', minHeight: '38px', lineHeight: '1.4' }}>
                {crs.description || 'Comprehensive industry-oriented training program with live projects and placement assistance.'}
              </p>

              <div style={{ display: 'flex', gap: '16px', width: '100%', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#475569', fontWeight: 600 }}>
                  <Clock size={16} color="#4f46e5" />
                  <span>{crs.duration_days || 90} Days Base</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#15803d', fontWeight: 700, marginLeft: 'auto' }}>
                  <IndianRupee size={16} color="#15803d" />
                  <span>₹{parseFloat(crs.fee_amount || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state-card">
          <BookOpen size={48} className="empty-icon" />
          <h3>No Courses Created Yet</h3>
          <p>Create your institute's training courses to start enrolling students.</p>
          <button type="button" className="enroll-student-btn" onClick={() => setIsAddModalOpen(true)}>
            <Plus size={16} />
            <span>Create First Course</span>
          </button>
        </div>
      )}

      {/* ADD COURSE MODAL */}
      {isAddModalOpen && (
        <div className="sub-modal-overlay">
          <div className="sub-modal-card">
            <h3>Add New Institute Course</h3>
            <form onSubmit={handleCreateCourse} className="sub-modal-form">
              <div className="form-group">
                <label>Course Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MERN Full Stack Development"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Course Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MERN-90"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                />
              </div>

              <div className="form-group">
                <label>Base Duration (Days)</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="90"
                  value={form.duration_days}
                  onChange={(e) => setForm({ ...form, duration_days: parseInt(e.target.value) || 90 })}
                />
              </div>

              <div className="form-group">
                <label>Total Course Fee (₹)</label>
                <input
                  type="number"
                  required
                  min="0"
                  placeholder="50000"
                  value={form.fee_amount}
                  onChange={(e) => setForm({ ...form, fee_amount: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className="form-group">
                <label>Category / Track</label>
                <input
                  type="text"
                  placeholder="e.g. Software Development"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                />
              </div>

              <div className="sub-modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseCatalogPage;
