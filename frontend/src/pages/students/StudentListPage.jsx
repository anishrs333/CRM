import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  BookOpen, 
  CheckCircle2, 
  Briefcase, 
  Download, 
  Clock, 
  Filter, 
  ChevronRight, 
  Award, 
  IndianRupee,
  Loader2,
  Building2
} from 'lucide-react';
import studentService from '../../services/studentService';
import { StudentProfileModal } from './StudentProfileModal';
import { useToast } from '../../hooks/useToast';
import './StudentListPage.css';

export const StudentListPage = () => {
  const { showToast } = useToast();

  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'in_training', 'completed', 'placed'

  // Selected Student Profile Modal
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Add Student Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addForm, setAddForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    qualification: 'B.Tech Computer Science',
    course_id: '',
    duration_days: 90,
  });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [stdRes, crsRes] = await Promise.all([
        studentService.getStudents(),
        studentService.getCourses()
      ]);

      const stdList = Array.isArray(stdRes?.results) ? stdRes.results : Array.isArray(stdRes?.data) ? stdRes.data : Array.isArray(stdRes) ? stdRes : [];
      const crsList = Array.isArray(crsRes?.results) ? crsRes.results : Array.isArray(crsRes?.data) ? crsRes.data : Array.isArray(crsRes) ? crsRes : [];

      setStudents(stdList);
      setCourses(crsList);
      if (crsList.length > 0 && !addForm.course_id) {
        setAddForm((prev) => ({ ...prev, course_id: crsList[0].id }));
      }
    } catch (err) {
      console.error('Failed to load student CRM data:', err);
      showToast(err.message || 'Failed to load student records.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Tab Filtering & Search
  const filteredStudents = students.filter((s) => {
    // Tab Filter
    if (activeTab === 'in_training' && s.status !== 'in_training') return false;
    if (activeTab === 'completed' && s.status !== 'completed') return false;
    if (activeTab === 'placed' && s.status !== 'placed') return false;

    // Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const name = (s.full_name || `${s.first_name} ${s.last_name}`).toLowerCase();
      const email = (s.email || '').toLowerCase();
      const id = (s.enrollment_id || '').toLowerCase();
      const phone = (s.phone || '').toLowerCase();
      return name.includes(q) || email.includes(q) || id.includes(q) || phone.includes(q);
    }

    return true;
  });

  // Metrics
  const totalStudents = students.length;
  const activeTrainees = students.filter((s) => s.status === 'in_training').length;
  const completedStudents = students.filter((s) => s.status === 'completed' || (s.duration_info && s.duration_info.is_duration_completed)).length;
  const placedStudents = students.filter((s) => s.status === 'placed').length;

  const handleOpenProfile = (student) => {
    setSelectedStudent(student);
    setIsProfileModalOpen(true);
  };

  const handleAddStudentSubmit = async (e) => {
    e.preventDefault();
    if (!addForm.first_name || !addForm.last_name || !addForm.email || !addForm.phone) {
      showToast('Please fill all required fields.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const enrollmentId = `STD-2026-${String(students.length + 1).padStart(3, '0')}`;
      const newStd = await studentService.createStudent({
        enrollment_id: enrollmentId,
        first_name: addForm.first_name,
        last_name: addForm.last_name,
        email: addForm.email,
        phone: addForm.phone,
        qualification: addForm.qualification,
        course_id: addForm.course_id,
        duration_days: addForm.duration_days,
        status: 'in_training',
      });

      showToast(`🎉 New student "${addForm.first_name} ${addForm.last_name}" enrolled successfully!`, 'success');
      setIsAddModalOpen(false);
      setAddForm({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        qualification: 'B.Tech Computer Science',
        course_id: courses[0]?.id || '',
        duration_days: 90,
      });
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to enroll student.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="student-crm-page">
      {/* Top Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">EdTech Student Management & Placement CRM</h1>
          <p className="page-subtitle">Track 90-day training progress, course completion, fee payments, and company placements.</p>
        </div>

        <button 
          type="button" 
          className="enroll-student-btn"
          onClick={() => setIsAddModalOpen(true)}
        >
          <Plus size={18} />
          <span>Enroll New Student</span>
        </button>
      </div>

      {/* Overview Stat Cards */}
      <div className="stats-cards-grid">
        <div className="stat-card" onClick={() => setActiveTab('all')}>
          <div className="stat-icon-wrap blue-bg">
            <Users size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Students Enrolled</span>
            <span className="stat-number">{totalStudents}</span>
          </div>
        </div>

        <div className="stat-card" onClick={() => setActiveTab('in_training')}>
          <div className="stat-icon-wrap indigo-bg">
            <Clock size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Active 90-Day Trainees</span>
            <span className="stat-number">{activeTrainees}</span>
          </div>
        </div>

        <div className="stat-card" onClick={() => setActiveTab('completed')}>
          <div className="stat-icon-wrap amber-bg">
            <CheckCircle2 size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Completed (90 Days)</span>
            <span className="stat-number">{completedStudents}</span>
          </div>
        </div>

        <div className="stat-card" onClick={() => setActiveTab('placed')}>
          <div className="stat-icon-wrap green-bg">
            <Briefcase size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Placed Students</span>
            <span className="stat-number">{placedStudents}</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs Bar */}
      <div className="table-controls-bar">
        <div className="filter-tabs">
          <button 
            className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All Students ({students.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'in_training' ? 'active' : ''}`}
            onClick={() => setActiveTab('in_training')}
          >
            Active 90-Day Trainees ({activeTrainees})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'completed' ? 'active' : ''}`}
            onClick={() => setActiveTab('completed')}
          >
            Completed (90 Days Finished) ({completedStudents})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'placed' ? 'active' : ''}`}
            onClick={() => setActiveTab('placed')}
          >
            Placed Students ({placedStudents})
          </button>
        </div>

        <div className="search-box-wrap">
          <Search size={18} className="search-icon" />
          <input 
            type="text"
            className="search-input"
            placeholder="Search by student name, email or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Main Student Roster Table */}
      {isLoading ? (
        <div className="loading-state">
          <Loader2 size={32} className="animate-spin text-indigo" />
          <p>Loading student CRM records...</p>
        </div>
      ) : filteredStudents.length > 0 ? (
        <div className="students-table-card">
          <table className="students-table">
            <thead>
              <tr>
                <th>Student & ID</th>
                <th>Enrolled Course</th>
                <th>90-Day Duration Progress</th>
                <th>Fee & Payment Status</th>
                <th>Placement Offer</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((std) => {
                if (!std) return null;
                const enr = std.enrollment || {};
                const dinfo = std.duration_info || {};
                const plc = std.placement;
                const progressPct = Math.min(Math.max(Number(dinfo.progress_percentage) || 0, 0), 100);
                const totalDuration = Number(dinfo.total_duration_days || dinfo.duration_days) || 90;
                const daysElapsed = Number(dinfo.days_elapsed) || 0;
                const daysRemaining = typeof dinfo.days_remaining === 'number' ? dinfo.days_remaining : (totalDuration - daysElapsed);
                const totalPaid = Number(std.total_paid) || 0;
                const ctcPkg = plc && plc.ctc_package ? parseFloat(plc.ctc_package) || 0 : 0;
                const paymentStatusStr = std.payment_status || 'Payment Pending';
                const statusSlug = paymentStatusStr.toLowerCase().replace(/\s+/g, '-');

                return (
                  <tr key={std.id} className="table-row-hover" onClick={() => handleOpenProfile(std)}>
                    <td>
                      <div className="student-profile-cell">
                        <div className="student-avatar-small">
                          {(std.first_name?.[0] || 'S')}{(std.last_name?.[0] || '')}
                        </div>
                        <div>
                          <span className="student-name-text">{std.full_name || `${std.first_name || ''} ${std.last_name || ''}`}</span>
                          <span className="student-id-text">{std.enrollment_id || `STD-${std.id}`} • {std.phone || 'N/A'}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="course-cell">
                        <span className="course-title-text">{enr.course_title || 'MERN Stack Bootcamp'}</span>
                        <span className="qualification-text">{std.qualification || 'B.Tech / Degree'}</span>
                      </div>
                    </td>

                    <td>
                      <div className="duration-cell">
                        <div className="duration-text-row">
                          <span className="day-counter">Day {daysElapsed} of {totalDuration}</span>
                          <span className="pct-text">{progressPct}%</span>
                        </div>
                        <div className="mini-progress-bar">
                          <div className="mini-progress-fill" style={{ width: `${progressPct}%` }} />
                        </div>
                        <span className="timeline-hint">
                          {daysRemaining <= 0 ? '✓ Course Completed' : `${daysRemaining} Days Remaining`}
                        </span>
                      </div>
                    </td>

                    <td>
                      <div className="payment-cell">
                        <span className="paid-amount-text">₹{totalPaid.toLocaleString('en-IN')} Paid</span>
                        <span className={`payment-status-badge status-${statusSlug}`}>
                          {paymentStatusStr}
                        </span>
                      </div>
                    </td>

                    <td>
                      {plc ? (
                        <div className="placement-cell">
                          <span className="company-text"><Building2 size={13} /> {plc.company_name || 'Recruiter'}</span>
                          <span className="ctc-text">{plc.job_role || 'Placed'} • ₹{ctcPkg.toFixed(2)} LPA</span>
                        </div>
                      ) : (
                        <span className="no-placement-tag">
                          {std.status === 'completed' ? 'Awaiting Placement' : 'In-Training'}
                        </span>
                      )}
                    </td>

                    <td onClick={(e) => e.stopPropagation()}>
                      <button 
                        type="button" 
                        className="view-profile-btn"
                        onClick={() => handleOpenProfile(std)}
                      >
                        <span>View Profile</span>
                        <ChevronRight size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state-card">
          <BookOpen size={48} className="empty-icon" />
          <h3>No Student Records Found</h3>
          <p>No student accounts match the selected tab filter or search query.</p>
          <button type="button" className="enroll-student-btn" onClick={() => setIsAddModalOpen(true)}>
            <Plus size={16} />
            <span>Enroll First Student</span>
          </button>
        </div>
      )}

      {/* STUDENT PROFILE POPUP MODAL */}
      <StudentProfileModal
        student={selectedStudent}
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onRefresh={loadData}
      />

      {/* ENROLL NEW STUDENT MODAL */}
      {isAddModalOpen && (
        <div className="sub-modal-overlay">
          <div className="sub-modal-card">
            <h3>Enroll New Student</h3>
            <form onSubmit={handleAddStudentSubmit} className="sub-modal-form">
              <div className="form-group">
                <label>First Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh"
                  value={addForm.first_name}
                  onChange={(e) => setAddForm({ ...addForm, first_name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Last Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kumar"
                  value={addForm.last_name}
                  onChange={(e) => setAddForm({ ...addForm, last_name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. ramesh@gmail.com"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. +91 98765 43210"
                  value={addForm.phone}
                  onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Enrolled Course</label>
                <select
                  value={addForm.course_id}
                  onChange={(e) => {
                    const selCourse = courses.find((c) => String(c.id) === String(e.target.value));
                    setAddForm({ 
                      ...addForm, 
                      course_id: e.target.value,
                      duration_days: selCourse?.duration_days || 90
                    });
                  }}
                >
                  {courses.length === 0 ? (
                    <option value="">Full Stack MERN Web Development (Default 90d)</option>
                  ) : (
                    courses.map((crs) => (
                      <option key={crs.id} value={crs.id}>
                        {crs.title} ({crs.duration_days} Days) - ₹{parseFloat(crs.fee_amount || 0).toLocaleString('en-IN')}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="form-group">
                <label>Training Duration Allocation (Days)</label>
                <select
                  value={addForm.duration_days}
                  onChange={(e) => setAddForm({ ...addForm, duration_days: parseInt(e.target.value) || 90 })}
                >
                  <option value={30}>30 Days (Fast-Track Certificate)</option>
                  <option value={45}>45 Days (Crash Course)</option>
                  <option value={60}>60 Days (Intermediate Track)</option>
                  <option value={90}>90 Days (Standard Professional Bootcamp)</option>
                  <option value={120}>120 Days (Extended Practical Track)</option>
                  <option value={180}>180 Days (Master Specialization Degree)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Educational Qualification</label>
                <input
                  type="text"
                  placeholder="e.g. B.Tech Computer Science"
                  value={addForm.qualification}
                  onChange={(e) => setAddForm({ ...addForm, qualification: e.target.value })}
                />
              </div>

              <div className="sub-modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Enrolling...' : 'Enroll Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentListPage;
