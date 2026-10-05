import React, { useState, useEffect, useCallback } from 'react';
import { 
  Award, 
  Search, 
  Plus, 
  Download, 
  Eye, 
  ShieldCheck, 
  AlertTriangle, 
  X, 
  Loader2, 
  CheckCircle2, 
  FileText, 
  Calendar, 
  User, 
  BookOpen, 
  ExternalLink,
  Ban
} from 'lucide-react';
import studentService from '../../services/studentService';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import './CertificatesPage.css';

export const CertificatesPage = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const isStaffOrAdmin = ['admin', 'manager', 'counselor', 'trainer'].includes((user?.role || '').toLowerCase()) || user?.is_superuser;

  const [certificates, setCertificates] = useState([]);
  const [courses, setCourses] = useState([]);
  const [eligibleStudents, setEligibleStudents] = useState([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState('');

  // Modals
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isRevokeModalOpen, setIsRevokeModalOpen] = useState(false);
  
  const [selectedCert, setSelectedCert] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  // Generate Form state
  const [genStudentId, setGenStudentId] = useState('');
  const [genCourseId, setGenCourseId] = useState('');
  const [genIssueDate, setGenIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [genSignatory, setGenSignatory] = useState('Academic Director');
  const [isGenerating, setIsGenerating] = useState(false);

  // Revoke Form state
  const [revokeReason, setRevokeReason] = useState('');
  const [isRevoking, setIsRevoking] = useState(false);

  const fetchCertificates = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (courseFilter) params.course = courseFilter;

      const res = await studentService.getCertificates(params);
      const list = Array.isArray(res?.results) ? res.results : Array.isArray(res) ? res : [];
      setCertificates(list);
    } catch (err) {
      console.error('Failed to load certificates:', err);
      showToast(err.message || 'Failed to load certificates.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, courseFilter, showToast]);

  const fetchAuxiliaryData = useCallback(async () => {
    try {
      const [cRes, sRes] = await Promise.all([
        studentService.getCourses(),
        studentService.getStudents({ status: 'completed' })
      ]);
      const courseList = Array.isArray(cRes?.results) ? cRes.results : Array.isArray(cRes) ? cRes : [];
      setCourses(courseList);

      const stdList = Array.isArray(sRes?.results) ? sRes.results : Array.isArray(sRes?.data) ? sRes.data : Array.isArray(sRes) ? sRes : [];
      setEligibleStudents(stdList);
    } catch (err) {
      console.error('Failed to load course/student data:', err);
    }
  }, []);

  useEffect(() => {
    fetchCertificates();
    if (isStaffOrAdmin) {
      fetchAuxiliaryData();
    }
  }, [fetchCertificates, fetchAuxiliaryData, isStaffOrAdmin]);

  // Handle student selection in Generate Form
  const handleStudentSelectChange = (e) => {
    const sId = e.target.value;
    setGenStudentId(sId);
    if (!sId) {
      setGenCourseId('');
      return;
    }
    const studentObj = eligibleStudents.find((s) => String(s.id) === String(sId));
    if (studentObj && studentObj.enrolled_course_id) {
      setGenCourseId(String(studentObj.enrolled_course_id));
    }
  };

  const handleGenerateCertificate = async (e) => {
    e.preventDefault();
    if (!genStudentId || !genCourseId) {
      showToast('Please select an eligible student and course.', 'error');
      return;
    }

    setIsGenerating(true);
    try {
      const payload = {
        student_id: parseInt(genStudentId),
        course_id: parseInt(genCourseId),
        issue_date: genIssueDate,
        signatory_title: genSignatory
      };
      const res = await studentService.generateCertificate(payload);
      showToast(`Certificate ${res.certificate_id} generated successfully!`, 'success');
      setIsGenerateModalOpen(false);
      // Reset form
      setGenStudentId('');
      setGenCourseId('');
      fetchCertificates();
    } catch (err) {
      console.error('Generate error:', err);
      showToast(err.message || 'Failed to generate certificate.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = async (cert) => {
    setDownloadingId(cert.id);
    try {
      const filename = `Certificate_${cert.student_name ? cert.student_name.replace(/\s+/g, '_') : cert.certificate_id}_${cert.certificate_id}.pdf`;
      await studentService.downloadCertificatePDF(cert.id, filename);
      showToast(`Downloaded ${filename}`, 'success');
    } catch (err) {
      console.error('Download error:', err);
      showToast(err.message || 'Failed to download certificate PDF.', 'error');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleRevokeCertificate = async (e) => {
    e.preventDefault();
    if (!selectedCert) return;
    if (!revokeReason.trim()) {
      showToast('Please enter a reason for revocation.', 'error');
      return;
    }

    setIsRevoking(true);
    try {
      await studentService.revokeCertificate(selectedCert.id, revokeReason.trim());
      showToast(`Certificate ${selectedCert.certificate_id} has been revoked.`, 'info');
      setIsRevokeModalOpen(false);
      setSelectedCert(null);
      setRevokeReason('');
      fetchCertificates();
    } catch (err) {
      console.error('Revoke error:', err);
      showToast(err.message || 'Failed to revoke certificate.', 'error');
    } finally {
      setIsRevoking(false);
    }
  };

  const filteredCertificates = certificates.filter((cert) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (cert.certificate_id || '').toLowerCase().includes(q) ||
      (cert.student_name || '').toLowerCase().includes(q) ||
      (cert.student_email || '').toLowerCase().includes(q) ||
      (cert.course_name || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="certificates-page">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <div className="page-title-wrap">
            <Award className="page-icon text-indigo" size={28} />
            <h1 className="page-title">Certificates Roster</h1>
          </div>
          <p className="page-subtitle">
            Generate, preview, verify, and download official course completion certificates.
          </p>
        </div>

        {isStaffOrAdmin && (
          <button 
            className="btn btn-primary btn-generate"
            onClick={() => setIsGenerateModalOpen(true)}
          >
            <Plus size={18} />
            <span>Generate Certificate</span>
          </button>
        )}
      </div>

      {/* Control Bar: Search & Filters */}
      <div className="table-controls-bar">
        <div className="search-box-wrap">
          <Search size={18} className="search-icon" />
          <input 
            type="text"
            className="search-input"
            placeholder="Search by Certificate ID, Student Name, Email or Course..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filters-wrap">
          <div className="filter-group">
            <label className="filter-label">Status:</label>
            <select 
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active / Issued</option>
              <option value="revoked">Revoked</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Course:</label>
            <select 
              className="filter-select"
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
            >
              <option value="">All Courses</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.course_name || c.title || `Course #${c.id}`}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      {isLoading ? (
        <div className="loading-state">
          <Loader2 size={32} className="animate-spin text-indigo" />
          <p>Loading certificate records...</p>
        </div>
      ) : filteredCertificates.length === 0 ? (
        <div className="empty-state-card">
          <Award size={48} className="empty-icon text-slate-400" />
          <h3>No certificates available</h3>
          <p>
            {searchQuery || statusFilter !== 'all' || courseFilter
              ? 'No certificate records match your search or filter criteria.'
              : 'No certificates have been issued yet.'}
          </p>
          {isStaffOrAdmin && !searchQuery && (
            <button 
              className="btn btn-primary mt-4"
              onClick={() => setIsGenerateModalOpen(true)}
            >
              <Plus size={16} />
              Generate First Certificate
            </button>
          )}
        </div>
      ) : (
        <div className="table-card">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Certificate ID</th>
                <th>Student</th>
                <th>Course</th>
                <th>Completion / Issue Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCertificates.map((cert) => (
                <tr key={cert.id}>
                  <td>
                    <div className="cert-id-badge">
                      <ShieldCheck size={16} className="text-indigo" />
                      <span className="font-mono font-semibold">{cert.certificate_id}</span>
                    </div>
                  </td>

                  <td>
                    <div className="student-info-cell">
                      <div className="student-name">{cert.student_name}</div>
                      <div className="student-email">{cert.student_email}</div>
                    </div>
                  </td>

                  <td>
                    <div className="course-name-cell">
                      <BookOpen size={15} className="text-slate-400" />
                      <span>{cert.course_name}</span>
                    </div>
                  </td>

                  <td>
                    <div className="date-cell">
                      <div><span className="text-slate-500">Issued:</span> {cert.issue_date}</div>
                      <div className="text-xs text-slate-400">Completed: {cert.completion_date}</div>
                    </div>
                  </td>

                  <td>
                    {cert.status === 'active' ? (
                      <span className="badge badge-success">
                        <CheckCircle2 size={12} /> Active & Issued
                      </span>
                    ) : (
                      <span className="badge badge-danger">
                        <Ban size={12} /> Revoked
                      </span>
                    )}
                  </td>

                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn-action btn-action-view"
                        title="View Certificate Details & Preview"
                        onClick={() => {
                          setSelectedCert(cert);
                          setIsPreviewModalOpen(true);
                        }}
                      >
                        <Eye size={16} />
                        <span>Preview</span>
                      </button>

                      <button 
                        className="btn-action btn-action-download"
                        title="Download PDF"
                        disabled={downloadingId === cert.id}
                        onClick={() => handleDownloadPDF(cert)}
                      >
                        {downloadingId === cert.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Download size={16} />
                        )}
                        <span>PDF</span>
                      </button>

                      <a 
                        href={`/verify-certificate/${cert.certificate_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-action btn-action-verify"
                        title="Public Verification Link"
                      >
                        <ExternalLink size={16} />
                        <span>Verify</span>
                      </a>

                      {isStaffOrAdmin && cert.status === 'active' && (
                        <button 
                          className="btn-action btn-action-revoke"
                          title="Revoke Certificate"
                          onClick={() => {
                            setSelectedCert(cert);
                            setRevokeReason('');
                            setIsRevokeModalOpen(true);
                          }}
                        >
                          <Ban size={16} />
                          <span>Revoke</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* GENERATE CERTIFICATE MODAL */}
      {isGenerateModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card modal-md">
            <div className="modal-header">
              <div className="modal-title-wrap">
                <Award className="text-indigo" size={22} />
                <h3>Generate New Certificate</h3>
              </div>
              <button className="modal-close" onClick={() => setIsGenerateModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleGenerateCertificate} className="modal-body">
              <div className="form-group">
                <label className="form-label required">Select Eligible Completed Student</label>
                <select 
                  className="form-control"
                  value={genStudentId}
                  onChange={handleStudentSelectChange}
                  required
                >
                  <option value="">-- Choose Completed Student --</option>
                  {eligibleStudents.map((std) => (
                    <option key={std.id} value={std.id}>
                      {std.full_name} ({std.enrollment_id}) — {std.course_name}
                    </option>
                  ))}
                </select>
                <p className="form-help">
                  Only students marked as completed/placed or having completed course duration are eligible.
                </p>
              </div>

              <div className="form-group">
                <label className="form-label required">Course Program</label>
                <select 
                  className="form-control"
                  value={genCourseId}
                  onChange={(e) => setGenCourseId(e.target.value)}
                  required
                >
                  <option value="">-- Choose Course --</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.course_name || c.title || `Course #${c.id}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group col-6">
                  <label className="form-label required">Issue Date</label>
                  <input 
                    type="date"
                    className="form-control"
                    value={genIssueDate}
                    onChange={(e) => setGenIssueDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group col-6">
                  <label className="form-label required">Signatory Title</label>
                  <input 
                    type="text"
                    className="form-control"
                    value={genSignatory}
                    onChange={(e) => setGenSignatory(e.target.value)}
                    placeholder="e.g. Academic Director"
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setIsGenerateModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Award size={16} />
                      <span>Generate Certificate</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PREVIEW & DETAILS MODAL */}
      {isPreviewModalOpen && selectedCert && (
        <div className="modal-backdrop">
          <div className="modal-card modal-lg">
            <div className="modal-header">
              <div className="modal-title-wrap">
                <FileText className="text-indigo" size={22} />
                <h3>Certificate Details & Preview</h3>
              </div>
              <button className="modal-close" onClick={() => setIsPreviewModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {/* Visual Certificate Card Preview */}
              <div className="cert-preview-card">
                <div className="cert-preview-header">
                  <div className="cert-preview-brand">{selectedCert.institute_name || 'CRESCENT TECH CRM'}</div>
                  <div className="cert-preview-subtitle">Certificate of Course Completion</div>
                </div>

                <div className="cert-preview-body">
                  <p className="cert-presented-to">This is proudly presented to</p>
                  <h2 className="cert-student-title">{selectedCert.student_name}</h2>
                  <p className="cert-completion-text">
                    for successfully completing the specialized professional program in
                  </p>
                  <h3 className="cert-course-title">{selectedCert.course_name}</h3>
                </div>

                <div className="cert-preview-meta">
                  <div>
                    <span className="meta-label">Completion Date:</span>
                    <span className="meta-val">{selectedCert.completion_date}</span>
                  </div>
                  <div>
                    <span className="meta-label">Issue Date:</span>
                    <span className="meta-val">{selectedCert.issue_date}</span>
                  </div>
                  <div>
                    <span className="meta-label">Certificate ID:</span>
                    <span className="meta-val font-mono">{selectedCert.certificate_id}</span>
                  </div>
                </div>

                <div className="cert-preview-footer">
                  <div className="cert-status-tag">
                    {selectedCert.status === 'active' ? (
                      <span className="badge badge-success"><CheckCircle2 size={14} /> Official Verified Certificate</span>
                    ) : (
                      <span className="badge badge-danger"><Ban size={14} /> REVOKED CERTIFICATE</span>
                    )}
                  </div>
                  <div className="cert-signatory-wrap">
                    <div className="signatory-title">{selectedCert.signatory_title}</div>
                    <div className="signatory-sub">Authorized Signatory</div>
                  </div>
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div className="cert-details-grid">
                <div className="detail-item">
                  <span className="detail-label">Student Name:</span>
                  <span className="detail-value">{selectedCert.student_name}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Student Email:</span>
                  <span className="detail-value">{selectedCert.student_email}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Course Title:</span>
                  <span className="detail-value">{selectedCert.course_name}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Status:</span>
                  <span className="detail-value font-semibold capital">{selectedCert.status}</span>
                </div>
                {selectedCert.status === 'revoked' && (
                  <div className="detail-item full-width bg-red-50 text-red-700 p-3 rounded">
                    <span className="detail-label">Revocation Reason:</span>
                    <p className="mt-1 text-sm">{selectedCert.revoked_reason || 'No reason specified.'}</p>
                    <span className="text-xs text-red-500 mt-1 block">Revoked on: {selectedCert.revoked_at}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer flex-between">
              <a 
                href={`/verify-certificate/${selectedCert.certificate_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
              >
                <ExternalLink size={16} />
                <span>Verify Link</span>
              </a>

              <div className="flex gap-2">
                <button 
                  className="btn btn-secondary"
                  onClick={() => setIsPreviewModalOpen(false)}
                >
                  Close
                </button>
                <button 
                  className="btn btn-primary"
                  disabled={downloadingId === selectedCert.id}
                  onClick={() => handleDownloadPDF(selectedCert)}
                >
                  {downloadingId === selectedCert.id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Download size={16} />
                  )}
                  <span>Download PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REVOKE CERTIFICATE MODAL */}
      {isRevokeModalOpen && selectedCert && (
        <div className="modal-backdrop">
          <div className="modal-card modal-md">
            <div className="modal-header bg-red-50">
              <div className="modal-title-wrap text-red-700">
                <AlertTriangle size={22} />
                <h3>Revoke Certificate</h3>
              </div>
              <button className="modal-close" onClick={() => setIsRevokeModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRevokeCertificate} className="modal-body">
              <p className="text-sm text-slate-600 mb-4">
                Are you sure you want to revoke certificate <strong>{selectedCert.certificate_id}</strong> issued to <strong>{selectedCert.student_name}</strong>?
                This will mark the certificate as invalid on public verification pages.
              </p>

              <div className="form-group">
                <label className="form-label required">Reason for Revocation</label>
                <textarea 
                  className="form-control"
                  rows={3}
                  placeholder="e.g. Issued in error, student withdraws, administrative correction..."
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  required
                />
              </div>

              <div className="modal-footer">
                <button 
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsRevokeModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn btn-danger"
                  disabled={isRevoking}
                >
                  {isRevoking ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Revoking...</span>
                    </>
                  ) : (
                    <>
                      <Ban size={16} />
                      <span>Revoke Certificate</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CertificatesPage;
