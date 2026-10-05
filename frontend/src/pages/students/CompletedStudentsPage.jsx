import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, Search, BookOpen, ChevronRight, Loader2, Award } from 'lucide-react';
import studentService from '../../services/studentService';
import { StudentProfileModal } from './StudentProfileModal';
import { useToast } from '../../hooks/useToast';
import './StudentListPage.css';

export const CompletedStudentsPage = () => {
  const { showToast } = useToast();
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await studentService.getStudents({ status: 'completed' });
      const stdList = Array.isArray(res?.results) ? res.results : Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setStudents(stdList);
    } catch (err) {
      console.error('Error loading completed students:', err);
      showToast(err.message || 'Failed to load completed students.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = students.filter((s) => {
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
          <h1 className="page-title">Course Completed Students Roster</h1>
          <p className="page-subtitle">List of students who have completed their training duration and are ready for placements.</p>
        </div>
      </div>

      <div className="table-controls-bar">
        <div className="search-box-wrap" style={{ width: '100%' }}>
          <Search size={18} className="search-icon" />
          <input 
            type="text"
            className="search-input"
            placeholder="Search completed students by name, email or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="loading-state">
          <Loader2 size={32} className="animate-spin text-indigo" />
          <p>Loading completed students...</p>
        </div>
      ) : filtered.length > 0 ? (
        <div className="students-table-card">
          <table className="students-table">
            <thead>
              <tr>
                <th>Student & ID</th>
                <th>Course Completed</th>
                <th>Completion Date</th>
                <th>Fee Status</th>
                <th>Placement Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((std) => {
                const enr = std.enrollment || {};
                const dinfo = std.duration_info || {};

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
                      <div className="payment-cell">
                        <span className="course-title-text">✓ 90 Days Completed</span>
                        <span className="qualification-text">{dinfo.expected_end_date}</span>
                      </div>
                    </td>

                    <td>
                      <span className={`payment-status-badge status-${(std.payment_status || 'Pending').toLowerCase().replace(' ', '-')}`}>
                        {std.payment_status}
                      </span>
                    </td>

                    <td>
                      <span className="no-placement-tag">Awaiting Placement Offer</span>
                    </td>

                    <td onClick={(e) => e.stopPropagation()} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button 
                        type="button" 
                        className="view-profile-btn"
                        style={{ background: '#7c3aed', color: '#fff', border: 'none' }}
                        onClick={() => { setSelectedStudent(std); setIsProfileModalOpen(true); }}
                      >
                        <span>Log Placement</span>
                      </button>
                      <button 
                        type="button" 
                        className="view-profile-btn"
                        onClick={() => { setSelectedStudent(std); setIsProfileModalOpen(true); }}
                      >
                        <span>Profile & Details</span>
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
          <CheckCircle2 size={48} className="empty-icon" />
          <h3>No Completed Students Found</h3>
          <p>No students have completed their 90-day training duration yet in this list.</p>
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

export default CompletedStudentsPage;
