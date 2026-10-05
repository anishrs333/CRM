import React, { useState, useEffect, useCallback } from 'react';
import { CreditCard, Search, Download, ChevronRight, Loader2, IndianRupee } from 'lucide-react';
import studentService from '../../services/studentService';
import { StudentProfileModal } from './StudentProfileModal';
import { useToast } from '../../hooks/useToast';
import './StudentListPage.css';

export const StudentPaymentsPage = () => {
  const { showToast } = useToast();
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await studentService.getStudents();
      const stdList = Array.isArray(res?.results) ? res.results : Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setStudents(stdList);
    } catch (err) {
      console.error('Error loading student fee ledger:', err);
      showToast(err.message || 'Failed to load student fee ledger.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDownloadPDF = async (e, std) => {
    e.stopPropagation();
    setDownloadingId(std.id);
    try {
      await studentService.downloadPDF(std.id, std.enrollment_id);
      showToast(`📄 PDF Receipt for ${std.full_name} downloaded!`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to download PDF statement.', 'error');
    } finally {
      setDownloadingId(null);
    }
  };

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
          <h1 className="page-title">Student Fee Payments & PDF Receipt Statements App</h1>
          <p className="page-subtitle">Manage total course fees, installment collections, balance dues, and official PDF receipts.</p>
        </div>
      </div>

      <div className="table-controls-bar">
        <div className="search-box-wrap" style={{ width: '100%' }}>
          <Search size={18} className="search-icon" />
          <input 
            type="text"
            className="search-input"
            placeholder="Search payment accounts by student name, email or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="loading-state">
          <Loader2 size={32} className="animate-spin text-indigo" />
          <p>Loading fee ledger records...</p>
        </div>
      ) : filtered.length > 0 ? (
        <div className="students-table-card">
          <table className="students-table">
            <thead>
              <tr>
                <th>Student & ID</th>
                <th>Enrolled Course</th>
                <th>Total Course Fee</th>
                <th>Total Paid</th>
                <th>Balance Outstanding</th>
                <th>Payment Status</th>
                <th>PDF Statement</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((std) => {
                const enr = std.enrollment || {};
                const isDownloading = downloadingId === std.id;

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
                      <span className="course-title-text">₹{(std.total_fee || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </td>

                    <td>
                      <span className="paid-amount-text">₹{(std.total_paid || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </td>

                    <td>
                      <span className={`course-title-text ${std.balance_due > 0 ? 'text-amber' : 'text-green'}`}>
                        ₹{(std.balance_due || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
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
                        style={{ background: '#16a34a', color: '#ffffff', border: 'none' }}
                        onClick={() => { setSelectedStudent(std); setIsProfileModalOpen(true); }}
                      >
                        <IndianRupee size={14} />
                        <span>Log Fee Payment</span>
                      </button>

                      <button 
                        type="button" 
                        className="view-profile-btn"
                        onClick={(e) => handleDownloadPDF(e, std)}
                        disabled={isDownloading}
                      >
                        {isDownloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                        <span>PDF Receipt</span>
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
          <CreditCard size={48} className="empty-icon" />
          <h3>No Payment Records Found</h3>
          <p>No student payment accounts match your search.</p>
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

export default StudentPaymentsPage;
