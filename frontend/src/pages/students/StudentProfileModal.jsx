import React, { useState } from 'react';
import { 
  X, 
  User, 
  BookOpen, 
  Calendar, 
  Clock, 
  CreditCard, 
  FileText, 
  Award, 
  Building2, 
  CheckCircle2, 
  Download, 
  PlusCircle, 
  Briefcase,
  Loader2,
  CalendarPlus
} from 'lucide-react';
import studentService from '../../services/studentService';
import { useToast } from '../../hooks/useToast';
import './StudentProfileModal.css';

export const StudentProfileModal = ({ student, isOpen, onClose, onRefresh }) => {
  const { showToast } = useToast();
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isPlacementModalOpen, setIsPlacementModalOpen] = useState(false);
  const [isExtensionModalOpen, setIsExtensionModalOpen] = useState(false);

  // Extension Form State
  const [extensionForm, setExtensionForm] = useState({
    added_days: 15,
    reason: 'Extra project guidance and revision'
  });

  // Payment Form State
  const [paymentForm, setPaymentForm] = useState({
    amount_paid: '',
    payment_method: 'UPI',
    transaction_id: '',
    remarks: 'Course Fee Installment'
  });

  // Placement Form State
  const [placementForm, setPlacementForm] = useState({
    company_name: '',
    job_role: '',
    ctc_package: '',
    offer_letter_number: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !student) return null;

  const enrollment = student.enrollment || {};
  const durationInfo = student.duration_info || {};
  const payments = student.payments || [];
  const placement = student.placement;
  const extensions = enrollment.extensions || [];

  const totalFee = student.total_fee || 0;
  const totalPaid = student.total_paid || 0;
  const balanceDue = student.balance_due || 0;
  const paymentStatus = student.payment_status || 'Payment Pending';

  const progressPct = durationInfo.progress_percentage || 0;
  const daysElapsed = durationInfo.days_elapsed || 0;
  const totalDurationDays = durationInfo.total_duration_days || durationInfo.duration_days || 90;
  const baseDurationDays = durationInfo.base_duration_days || 90;
  const extensionDays = durationInfo.extension_days || 0;
  const daysRemaining = durationInfo.days_remaining || 0;

  const handleDownloadPDF = async () => {
    setIsDownloadingPdf(true);
    try {
      await studentService.downloadPDF(student.id, student.enrollment_id);
      showToast('📄 Fee Statement PDF downloaded successfully!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to download PDF.', 'error');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleMarkCompleted = async () => {
    setIsSubmitting(true);
    try {
      await studentService.updateStudent(student.id, { status: 'completed' });
      showToast(`🏆 ${student.full_name} marked as Course Completed!`, 'success');
      if (onRefresh) onRefresh();
      onClose();
    } catch (err) {
      showToast(err.message || 'Failed to update student status.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExtendCourse = async (e) => {
    e.preventDefault();
    if (!extensionForm.added_days || parseInt(extensionForm.added_days) <= 0) {
      showToast('Please enter valid extension days.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await studentService.extendCourse(
        student.id,
        parseInt(extensionForm.added_days),
        extensionForm.reason
      );

      showToast(`⏳ Course extended by +${extensionForm.added_days} days!`, 'success');
      setIsExtensionModalOpen(false);
      setExtensionForm({ added_days: 15, reason: 'Extra project guidance and revision' });
      if (onRefresh) onRefresh();
    } catch (err) {
      showToast(err.message || 'Failed to extend course duration.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    if (!paymentForm.amount_paid || parseFloat(paymentForm.amount_paid) <= 0) {
      showToast('Please enter a valid payment amount.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const receiptNo = `RCPT-${student.enrollment_id || student.id}-${payments.length + 1}`;
      await studentService.createPayment({
        student: student.id,
        enrollment: enrollment?.id || null,
        receipt_number: receiptNo,
        amount_paid: paymentForm.amount_paid,
        payment_method: paymentForm.payment_method,
        transaction_id: paymentForm.transaction_id,
        remarks: paymentForm.remarks
      });

      showToast(`🎉 Payment of ₹${paymentForm.amount_paid} recorded successfully!`, 'success');
      setIsPaymentModalOpen(false);
      setPaymentForm({ amount_paid: '', payment_method: 'UPI', transaction_id: '', remarks: 'Course Fee Installment' });
      if (onRefresh) onRefresh();
    } catch (err) {
      showToast(err.message || 'Failed to record payment.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddPlacement = async (e) => {
    e.preventDefault();
    if (!placementForm.company_name || !placementForm.job_role || !placementForm.ctc_package) {
      showToast('Please fill company name, role and CTC package.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await studentService.createPlacement({
        student: student.id,
        company_name: placementForm.company_name,
        job_role: placementForm.job_role,
        ctc_package: placementForm.ctc_package,
        offer_letter_number: placementForm.offer_letter_number,
        placement_status: 'placed'
      });

      // Update student status to placed
      await studentService.updateStudent(student.id, { status: 'placed' });

      showToast(`💼 Placement record added for ${placementForm.company_name}!`, 'success');
      setIsPlacementModalOpen(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      showToast(err.message || 'Failed to record placement.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="student-profile-overlay">
      <div className="student-profile-modal">
        {/* Header Bar */}
        <div className="profile-modal-header">
          <div className="student-header-info">
            <div className="student-avatar-big">
              {student.first_name?.[0]}{student.last_name?.[0]}
            </div>
            <div>
              <div className="student-title-row">
                <h2>{student.full_name}</h2>
                <span className={`status-pill status-${student.status}`}>
                  {student.status === 'in_training' ? 'Ongoing Trainee' :
                   student.status === 'completed' ? 'Course Completed' :
                   student.status === 'placed' ? 'Placed Student' : student.status}
                </span>
              </div>
              <p className="student-sub-id">Enrollment ID: <strong>{student.enrollment_id}</strong> | Enrolled: {student.enrolled_date}</p>
            </div>
          </div>

          <div className="header-action-buttons">
            {student.status === 'in_training' && (
              <button 
                type="button" 
                className="pdf-download-btn"
                style={{ background: '#16a34a', borderColor: '#15803d', color: '#ffffff' }}
                onClick={handleMarkCompleted}
                disabled={isSubmitting}
              >
                <Award size={16} />
                <span>Mark Course Completed</span>
              </button>
            )}

            {student.status === 'completed' && !placement && (
              <button 
                type="button" 
                className="pdf-download-btn"
                style={{ background: '#7c3aed', borderColor: '#6d28d9', color: '#ffffff' }}
                onClick={() => setIsPlacementModalOpen(true)}
              >
                <Briefcase size={16} />
                <span>Log Placement & Move to Placed</span>
              </button>
            )}

            <button 
              type="button" 
              className="pdf-download-btn"
              onClick={handleDownloadPDF}
              disabled={isDownloadingPdf}
            >
              {isDownloadingPdf ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              <span>Download PDF Statement</span>
            </button>
            <button type="button" className="profile-close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body Content */}
        <div className="profile-modal-body">
          {/* Quick Contact & Qualification Strip */}
          <div className="student-meta-strip">
            <div className="meta-item">
              <User size={15} className="meta-icon" />
              <span>Email: <strong>{student.email}</strong></span>
            </div>
            <div className="meta-item">
              <Clock size={15} className="meta-icon" />
              <span>Phone: <strong>{student.phone}</strong></span>
            </div>
            <div className="meta-item">
              <Award size={15} className="meta-icon" />
              <span>Qualification: <strong>{student.qualification}</strong></span>
            </div>
          </div>

          {/* COURSE DURATION & EXTENSION TRACKER CARD */}
          <div className="duration-tracker-card">
            <div className="tracker-card-header">
              <div className="tracker-title">
                <BookOpen size={18} className="tracker-icon" />
                <span>Course Training Duration & Extension Tracker</span>
              </div>

              <div className="tracker-header-actions">
                <span className="course-code-pill">{enrollment.course_code || 'CRS-90'}</span>
                <button 
                  type="button" 
                  className="extend-duration-btn"
                  onClick={() => setIsExtensionModalOpen(true)}
                >
                  <CalendarPlus size={14} />
                  <span>Extend Course (+15/30 Days)</span>
                </button>
              </div>
            </div>

            <h3 className="course-name-heading">{enrollment.course_title || 'Software Engineering Bootcamp'}</h3>

            <div className="progress-bar-container">
              <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
            </div>

            <div className="duration-metrics-grid">
              <div className="metric-box">
                <span className="metric-lbl">Duration Completed</span>
                <span className="metric-val">{daysElapsed} of {totalDurationDays} Days</span>
              </div>

              <div className="metric-box">
                <span className="metric-lbl">Extension Applied</span>
                <span className="metric-val text-amber">
                  {extensionDays > 0 ? `+${extensionDays} Days Extended` : 'Base Duration (90d)'}
                </span>
              </div>

              <div className="metric-box">
                <span className="metric-lbl">Days Remaining</span>
                <span className={`metric-val ${daysRemaining === 0 ? 'text-green' : 'text-blue'}`}>
                  {daysRemaining === 0 ? 'Completed (0 Days Left)' : `${daysRemaining} Days Remaining`}
                </span>
              </div>

              <div className="metric-box">
                <span className="metric-lbl">Expected End Date</span>
                <span className="metric-val">{durationInfo.expected_end_date}</span>
              </div>
            </div>

            {/* Extension Log History */}
            {extensions.length > 0 && (
              <div className="extension-log-strip">
                <span className="ext-log-title">Extension History ({extensions.length}):</span>
                {extensions.map((ext, idx) => (
                  <span key={idx} className="ext-log-item">
                    + {ext.added_days} days on {ext.extended_on} ({ext.reason})
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* FINANCIAL & PAYMENT SUMMARY CARD */}
          <div className="financial-summary-card">
            <div className="card-top-bar">
              <div className="section-title">
                <CreditCard size={18} className="section-icon" />
                <span>Course Fee & Financial Ledger</span>
              </div>

              <button 
                type="button" 
                className="add-payment-btn"
                onClick={() => setIsPaymentModalOpen(true)}
              >
                <PlusCircle size={15} />
                <span>Record Payment</span>
              </button>
            </div>

            <div className="financial-stats-row">
              <div className="fin-stat-box">
                <span className="fin-lbl">Total Course Fee</span>
                <span className="fin-val">₹{totalFee.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="fin-stat-box green-stat">
                <span className="fin-lbl">Total Amount Paid</span>
                <span className="fin-val">₹{totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="fin-stat-box orange-stat">
                <span className="fin-lbl">Balance Outstanding</span>
                <span className="fin-val">₹{balanceDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="fin-stat-box">
                <span className="fin-lbl">Payment Status</span>
                <span className={`payment-pill status-${paymentStatus.toLowerCase().replace(' ', '-')}`}>
                  {paymentStatus}
                </span>
              </div>
            </div>

            {/* Payment Transactions Table */}
            <div className="payments-table-wrapper">
              <h4 className="table-sub-heading">Payment Transactions ({payments.length})</h4>
              {payments.length > 0 ? (
                <table className="mini-ledger-table">
                  <thead>
                    <tr>
                      <th>Receipt #</th>
                      <th>Date</th>
                      <th>Method</th>
                      <th>Txn ID</th>
                      <th>Amount Paid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id}>
                        <td><strong>{p.receipt_number}</strong></td>
                        <td>{p.payment_date}</td>
                        <td>{p.payment_method}</td>
                        <td>{p.transaction_id || 'N/A'}</td>
                        <td className="amount-cell">₹{parseFloat(p.amount_paid).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="no-records-text">No payment receipts recorded yet.</p>
              )}
            </div>
          </div>

          {/* PLACEMENT & CAREER RECORD */}
          <div className="placement-summary-card">
            <div className="card-top-bar">
              <div className="section-title">
                <Briefcase size={18} className="section-icon" />
                <span>Placement & Career Offer Details</span>
              </div>

              {!placement && (
                <button 
                  type="button" 
                  className="add-placement-btn"
                  onClick={() => setIsPlacementModalOpen(true)}
                >
                  <PlusCircle size={15} />
                  <span>Record Placement</span>
                </button>
              )}
            </div>

            {placement ? (
              <div className="placement-details-grid">
                <div className="placement-item">
                  <span className="plc-lbl">Hiring Company</span>
                  <span className="plc-val company-title"><Building2 size={16} /> {placement.company_name}</span>
                </div>
                <div className="placement-item">
                  <span className="plc-lbl">Designated Job Role</span>
                  <span className="plc-val">{placement.job_role}</span>
                </div>
                <div className="placement-item">
                  <span className="plc-lbl">Offered CTC Package</span>
                  <span className="plc-val ctc-val">₹{parseFloat(placement.ctc_package).toFixed(2)} LPA</span>
                </div>
                <div className="placement-item">
                  <span className="plc-lbl">Offer Letter / Ref #</span>
                  <span className="plc-val">{placement.offer_letter_number || 'N/A'}</span>
                </div>
              </div>
            ) : (
              <div className="no-placement-box">
                <p>No placement record logged yet. Click "Record Placement" once an offer letter is issued.</p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="profile-modal-footer">
          <button type="button" className="close-action-btn" onClick={onClose}>
            Close Profile
          </button>
        </div>
      </div>

      {/* EXTEND COURSE DURATION MODAL */}
      {isExtensionModalOpen && (
        <div className="sub-modal-overlay">
          <div className="sub-modal-card">
            <h3>Extend Course Duration</h3>
            <p className="sub-modal-subtitle">Extend training duration for {student.full_name}</p>

            <form onSubmit={handleExtendCourse} className="sub-modal-form">
              <div className="form-group">
                <label>Additional Extension Days</label>
                <select
                  value={extensionForm.added_days}
                  onChange={(e) => setExtensionForm({ ...extensionForm, added_days: e.target.value })}
                >
                  <option value={15}>+ 15 Days Extension</option>
                  <option value={30}>+ 30 Days Extension</option>
                  <option value={45}>+ 45 Days Extension</option>
                  <option value={60}>+ 60 Days Extension</option>
                </select>
              </div>

              <div className="form-group">
                <label>Extension Reason / Remarks</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Additional project practice & mock interview prep"
                  value={extensionForm.reason}
                  onChange={(e) => setExtensionForm({ ...extensionForm, reason: e.target.value })}
                />
              </div>

              <div className="sub-modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setIsExtensionModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Extending...' : 'Apply Course Extension'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD PAYMENT MODAL */}
      {isPaymentModalOpen && (
        <div className="sub-modal-overlay">
          <div className="sub-modal-card">
            <h3>Record Course Fee Payment</h3>
            <form onSubmit={handleAddPayment} className="sub-modal-form">
              <div className="form-group">
                <label>Amount Paid (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 25000"
                  value={paymentForm.amount_paid}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount_paid: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Payment Method</label>
                <select
                  value={paymentForm.payment_method}
                  onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                >
                  <option value="UPI">UPI / GPay / PhonePe</option>
                  <option value="Bank Transfer">NEFT / RTGS Bank Transfer</option>
                  <option value="Credit/Debit Card">Credit / Debit Card</option>
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div className="form-group">
                <label>Transaction ID / Ref #</label>
                <input
                  type="text"
                  placeholder="e.g. TXN99881122"
                  value={paymentForm.transaction_id}
                  onChange={(e) => setPaymentForm({ ...paymentForm, transaction_id: e.target.value })}
                />
              </div>

              <div className="sub-modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setIsPaymentModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Recording...' : 'Submit Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD PLACEMENT MODAL */}
      {isPlacementModalOpen && (
        <div className="sub-modal-overlay">
          <div className="sub-modal-card">
            <h3>Record Student Placement Offer</h3>
            <form onSubmit={handleAddPlacement} className="sub-modal-form">
              <div className="form-group">
                <label>Company Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Zoho Corporation"
                  value={placementForm.company_name}
                  onChange={(e) => setPlacementForm({ ...placementForm, company_name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Job Role</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Associate Software Developer"
                  value={placementForm.job_role}
                  onChange={(e) => setPlacementForm({ ...placementForm, job_role: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>CTC Package (in LPA, e.g. 7.50)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  placeholder="e.g. 7.5"
                  value={placementForm.ctc_package}
                  onChange={(e) => setPlacementForm({ ...placementForm, ctc_package: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Offer Letter Ref Number</label>
                <input
                  type="text"
                  placeholder="e.g. OFF-ZOHO-8821"
                  value={placementForm.offer_letter_number}
                  onChange={(e) => setPlacementForm({ ...placementForm, offer_letter_number: e.target.value })}
                />
              </div>

              <div className="sub-modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setIsPlacementModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Recording...' : 'Save Placement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
