import React, { useState, useEffect, useCallback } from 'react';
import { Briefcase, Search, Building2, ChevronRight, Loader2, Award, IndianRupee } from 'lucide-react';
import studentService from '../../services/studentService';
import { StudentProfileModal } from './StudentProfileModal';
import { useToast } from '../../hooks/useToast';
import './StudentListPage.css';

export const PlacedStudentsPage = () => {
  const { showToast } = useToast();
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await studentService.getStudents({ status: 'placed' });
      const stdList = Array.isArray(res?.results) ? res.results : Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setStudents(stdList);
    } catch (err) {
      console.error('Error loading placed students:', err);
      showToast(err.message || 'Failed to load placed students.', 'error');
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
    const plc = s.placement || {};
    return (s.full_name || '').toLowerCase().includes(q) ||
           (s.email || '').toLowerCase().includes(q) ||
           (s.enrollment_id || '').toLowerCase().includes(q) ||
           (plc.company_name || '').toLowerCase().includes(q) ||
           (plc.job_role || '').toLowerCase().includes(q);
  });

  return (
    <div className="student-crm-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Placed Students App</h1>
          <p className="page-subtitle">Track placed students, corporate hiring partners, CTC packages, and offer letter letters.</p>
        </div>
      </div>

      <div className="table-controls-bar">
        <div className="search-box-wrap" style={{ width: '100%' }}>
          <Search size={18} className="search-icon" />
          <input 
            type="text"
            className="search-input"
            placeholder="Search placed students by company name, role, student name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="loading-state">
          <Loader2 size={32} className="animate-spin text-indigo" />
          <p>Loading placed students roster...</p>
        </div>
      ) : filtered.length > 0 ? (
        <div className="students-table-card">
          <table className="students-table">
            <thead>
              <tr>
                <th>Student & ID</th>
                <th>Course Graduated</th>
                <th>Hiring Company</th>
                <th>Designated Role</th>
                <th>CTC Package</th>
                <th>Offer Ref #</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((std) => {
                const enr = std.enrollment || {};
                const plc = std.placement || {};

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
                      <div className="company-text">
                        <Building2 size={16} className="text-green" />
                        <strong>{plc.company_name || 'N/A'}</strong>
                      </div>
                    </td>

                    <td>
                      <span className="course-title-text">{plc.job_role || 'N/A'}</span>
                    </td>

                    <td>
                      <span className="ctc-text">₹{parseFloat(plc.ctc_package || 0).toFixed(2)} LPA</span>
                    </td>

                    <td>
                      <span className="qualification-text">{plc.offer_letter_number || 'N/A'}</span>
                    </td>

                    <td onClick={(e) => e.stopPropagation()}>
                      <button 
                        type="button" 
                        className="view-profile-btn"
                        onClick={() => { setSelectedStudent(std); setIsProfileModalOpen(true); }}
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
          <Briefcase size={48} className="empty-icon" />
          <h3>No Placed Students Logged</h3>
          <p>No student placement records currently match your search.</p>
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

export default PlacedStudentsPage;
