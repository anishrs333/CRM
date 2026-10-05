import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  Search, 
  CheckCircle2, 
  AlertOctagon, 
  AlertTriangle, 
  Loader2, 
  Award, 
  Calendar, 
  BookOpen, 
  User, 
  Building2,
  ArrowLeft
} from 'lucide-react';
import studentService from '../../services/studentService';
import './VerifyCertificatePage.css';

export const VerifyCertificatePage = () => {
  const { certificateId: routeCertId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialId = routeCertId || searchParams.get('certificate_id') || '';
  const [searchId, setSearchId] = useState(initialId);
  const [activeCertId, setActiveCertId] = useState(initialId);

  const [verificationResult, setVerificationResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorState, setErrorState] = useState(null);

  const performVerification = useCallback(async (certIdToVerify) => {
    if (!certIdToVerify || !certIdToVerify.trim()) {
      setVerificationResult(null);
      setErrorState(null);
      return;
    }

    setIsLoading(true);
    setErrorState(null);
    setVerificationResult(null);

    try {
      const res = await studentService.verifyCertificate(certIdToVerify.trim());
      setVerificationResult(res);
    } catch (err) {
      console.error('Verification error:', err);
      setErrorState(err.message || 'Certificate verification failed.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialId) {
      performVerification(initialId);
    }
  }, [initialId, performVerification]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchId.trim()) return;
    setActiveCertId(searchId.trim());
    navigate(`/verify-certificate/${encodeURIComponent(searchId.trim())}`);
    performVerification(searchId.trim());
  };

  return (
    <div className="verify-page-container">
      <div className="verify-card">
        {/* Verification Header */}
        <div className="verify-header">
          <div className="brand-badge">
            <Award size={32} className="brand-icon" />
            <h2>CRESCENT TECH ACADEMY</h2>
          </div>
          <h1>Official Certificate Verification Portal</h1>
          <p className="verify-subtitle">
            Verify the authenticity and current validity of certificates issued by Crescent Tech Academy.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="verify-search-form">
          <div className="verify-input-wrap">
            <Search size={20} className="verify-search-icon" />
            <input 
              type="text"
              className="verify-input"
              placeholder="Enter Certificate ID (e.g. CERT-2026-STD001-XXXX)..."
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
            />
            <button type="submit" className="verify-btn" disabled={isLoading}>
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : 'Verify'}
            </button>
          </div>
        </form>

        {/* Verification Loading State */}
        {isLoading && (
          <div className="verify-loading">
            <Loader2 size={36} className="animate-spin text-indigo" />
            <p>Searching central registry database for Certificate ID: <strong>{activeCertId}</strong>...</p>
          </div>
        )}

        {/* Verification Result Display */}
        {!isLoading && verificationResult && (
          <div className="verify-result-section">
            {verificationResult.valid && verificationResult.status === 'active' ? (
              <div className="result-card status-active">
                <div className="result-header">
                  <CheckCircle2 size={44} className="status-icon-active" />
                  <div>
                    <h3 className="status-title text-green">Authentic & Valid Certificate</h3>
                    <p className="status-desc">
                      This certificate has been officially issued and verified in good standing.
                    </p>
                  </div>
                </div>

                <div className="result-grid">
                  <div className="result-item">
                    <span className="result-label"><User size={14} /> Student Name:</span>
                    <span className="result-value font-bold">{verificationResult.student_name}</span>
                  </div>

                  <div className="result-item">
                    <span className="result-label"><BookOpen size={14} /> Course Title:</span>
                    <span className="result-value font-bold">{verificationResult.course_name}</span>
                  </div>

                  <div className="result-item">
                    <span className="result-label"><ShieldCheck size={14} /> Certificate ID:</span>
                    <span className="result-value font-mono font-bold text-indigo">{verificationResult.certificate_id}</span>
                  </div>

                  <div className="result-item">
                    <span className="result-label"><Calendar size={14} /> Completion Date:</span>
                    <span className="result-value">{verificationResult.completion_date}</span>
                  </div>

                  <div className="result-item">
                    <span className="result-label"><Calendar size={14} /> Issue Date:</span>
                    <span className="result-value">{verificationResult.issue_date}</span>
                  </div>

                  <div className="result-item">
                    <span className="result-label"><Building2 size={14} /> Issuer:</span>
                    <span className="result-value">{verificationResult.institute_name}</span>
                  </div>
                </div>
              </div>
            ) : verificationResult.status === 'revoked' ? (
              <div className="result-card status-revoked">
                <div className="result-header">
                  <AlertOctagon size={44} className="status-icon-revoked" />
                  <div>
                    <h3 className="status-title text-red">Certificate Has Been Revoked</h3>
                    <p className="status-desc">
                      Notice: This certificate was revoked by the institution and is no longer valid.
                    </p>
                  </div>
                </div>

                <div className="result-grid">
                  <div className="result-item">
                    <span className="result-label">Student Name:</span>
                    <span className="result-value">{verificationResult.student_name}</span>
                  </div>
                  <div className="result-item">
                    <span className="result-label">Course Title:</span>
                    <span className="result-value">{verificationResult.course_name}</span>
                  </div>
                  <div className="result-item">
                    <span className="result-label">Certificate ID:</span>
                    <span className="result-value font-mono text-red">{verificationResult.certificate_id}</span>
                  </div>
                  <div className="result-item">
                    <span className="result-label">Revocation Reason:</span>
                    <span className="result-value text-red font-semibold">
                      {verificationResult.revoked_reason || 'Administrative revocation.'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="result-card status-invalid">
                <div className="result-header">
                  <AlertTriangle size={44} className="status-icon-invalid" />
                  <div>
                    <h3 className="status-title text-amber">Certificate Not Found</h3>
                    <p className="status-desc">
                      No matching record was found for Certificate ID: <strong>{activeCertId}</strong>.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error State */}
        {!isLoading && errorState && (
          <div className="result-card status-invalid">
            <div className="result-header">
              <AlertTriangle size={44} className="status-icon-invalid" />
              <div>
                <h3 className="status-title text-amber">Verification Error</h3>
                <p className="status-desc">{errorState}</p>
              </div>
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="verify-footer-info">
          <p>For support or verification inquiries, contact Crescent Tech Academy Academic Office.</p>
          <a href="/login" className="back-link">
            <ArrowLeft size={16} /> Return to CRM Portal
          </a>
        </div>
      </div>
    </div>
  );
};

export default VerifyCertificatePage;
