import React, { useState, useEffect, useCallback } from 'react';
import { Clock, Search, Plus, BookOpen, ChevronRight, CalendarPlus, Loader2 } from 'lucide-react';
import studentService from '../../services/studentService';
import { StudentProfileModal } from './StudentProfileModal';
import { useToast } from '../../hooks/useToast';
import './StudentListPage.css';

export const OngoingTraineesPage = () => {
  const { showToast } = useToast();
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'finishing_soon'
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await studentService.getStudents({ status: 'in_training' });
      const stdList = Array.isArray(res?.results) ? res.results : Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setStudents(stdList);
    } catch (err) {
      console.error('Error loading ongoing trainees:', err);
      showToast(err.message || 'Failed to load ongoing trainees.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleMarkCompleted = async (e, std) => {
    e.stopPropagation();
    try {
      await studentService.updateStudent(std.id, { status: 'completed' });
      showToast(`🏆 ${std.full_name} marked as Course Completed!`, 'success');
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to update student status.', 'error');
    }
  };

  const finishingSoonStudents = students.filter((s) => (s.duration_info?.days_remaining ?? 99) <= 10);

  const filtered = students.filter((s) => {
    if (activeTab === 'finishing_soon' && (s.duration_info?.days_remaining ?? 99) > 10) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (s.full_name || '').toLowerCase().includes(q) ||
           (s.email || '').toLowerCase().includes(q) ||
           (s.enrollment_id || '').toLowerCase().includes(q);
  });

  return (
    <div className="student-crm-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Ongoing Trainee Tracker</h1>
          <p className="page-subtitle">Monitor students currently taking training. Track remaining days, extend duration, or mark course completed.</p>
        </div>
      </div>

      <div className="table-controls-bar">
        <div className="filter-tabs">
          <button 
            className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All Ongoing Trainees ({students.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'finishing_soon' ? 'active' : ''}`}
            onClick={() => setActiveTab('finishing_soon')}
            style={{ position: 'relative' }}
          >
            ⚡ Finishing Soon (≤ 10 Days Left) ({finishingSoonStudents.length})
          </button>
        </div>

        <div className="search-box-wrap">
          <Search size={18} className="search-icon" />
          <input 
            type="text"
            className="search-input"
            placeholder="Search ongoing trainees by name, email or enrollment ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="loading-state">
          <Loader2 size={32} className="animate-spin text-indigo" />
          <p>Loading ongoing trainees...</p>
        </div>
      ) : filtered.length > 0 ? (
        <div className="students-table-card">
          <table className="students-table">
            <thead>
              <tr>
                <th>Student & ID</th>
                <th>Enrolled Course</th>
                <th>Training Progress</th>
                <th>Duration & Extension</th>
                <th>Fee Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((std) => {
                const enr = std.enrollment || {};
                const dinfo = std.duration_info || {};
                const progressPct = dinfo.progress_percentage || 0;

                return (
                  <tr key={std.id} className="table-row-hover" onClick={() => { setSelectedStudent(std); setIsProfileModalOpen(true); }}>
                    <td>
                      <div className="student-profile-cell">
                        <div className="student-avatar-small">
                          {std.first_name?.[0]}{std.last_name?.[0]}
                        </div>
                        <div>
                          <span className="student-name-text">{std.full_name}</span>
                          <span className="student-id-text">{std.enrollment_id} • {std.phone}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="course-cell">
                        <span className="course-title-text">{enr.course_title}</span>
                        <span className="qualification-text">{std.qualification}</span>
                      </div>
                    </td>

                    <td>
                      <div className="duration-cell">
                        <div className="duration-text-row">
                          <span className="day-counter">Day {dinfo.days_elapsed || 0} of {dinfo.total_duration_days || 90}</span>
                          <span className="pct-text">{progressPct}%</span>
                        </div>
                        <div className="mini-progress-bar">
                          <div className="mini-progress-fill" style={{ width: `${progressPct}%` }} />
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="payment-cell">
                        <span className="course-title-text">{dinfo.expected_end_date}</span>
                        <span className="qualification-text text-amber">
                          {dinfo.extension_days > 0 ? `+${dinfo.extension_days}d Extended` : `${dinfo.days_remaining}d Left`}
                        </span>
                      </div>
                    </td>

                    <td>
                      <span className={`payment-status-badge status-${(std.payment_status || 'Pending').toLowerCase().replace(' ', '-')}`}>
                        {std.payment_status}
                      </span>
                    </td>

                    <td onClick={(e) => e.stopPropagation()} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button 
                        type="button" 
                        className="view-profile-btn"
                        style={{ background: '#16a34a', color: '#fff', border: 'none' }}
                        onClick={(e) => handleMarkCompleted(e, std)}
                      >
                        <span>Mark Completed</span>
                      </button>
                      <button 
                        type="button" 
                        className="view-profile-btn"
                        onClick={() => { setSelectedStudent(std); setIsProfileModalOpen(true); }}
                      >
                        <span>Profile & Extend</span>
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
          <Clock size={48} className="empty-icon" />
          <h3>No Active Ongoing Trainees</h3>
          <p>No ongoing trainees currently match your search.</p>
        </div>
      )}

      <StudentProfileModal
        student={selectedStudent}
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onRefresh={loadData}
      />
    </div>
  );
};

export default OngoingTraineesPage;
