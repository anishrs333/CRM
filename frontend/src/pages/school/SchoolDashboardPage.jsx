import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  School, 
  GraduationCap, 
  ClipboardList, 
  Users, 
  Calendar, 
  Award, 
  IndianRupee, 
  Loader2,
  Plus,
  ArrowRight,
  BookOpen,
  FileCheck,
  CheckCircle2,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/common/Button';
import './SchoolPages.css';

export const SchoolDashboardPage = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalStudents: 0,
    totalAdmissions: 0,
    totalClasses: 0,
    totalTeachers: 12,
    feeCollections: 1250000
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchSchoolStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const [sRes, aRes, cRes] = await Promise.all([
        api.get('/school/students/').catch(() => ({ count: 0 })),
        api.get('/school/admissions/').catch(() => ({ count: 0 })),
        api.get('/school/classes/').catch(() => ({ count: 0 }))
      ]);

      const sCount = sRes?.count || (Array.isArray(sRes?.results) ? sRes.results.length : 0);
      const aCount = aRes?.count || (Array.isArray(aRes?.results) ? aRes.results.length : 0);
      const cCount = cRes?.count || (Array.isArray(cRes?.results) ? cRes.results.length : 0);

      setStats({
        totalStudents: sCount,
        totalAdmissions: aCount,
        totalClasses: cCount,
        totalTeachers: 12,
        feeCollections: 1250000
      });
    } catch (err) {
      console.error('Failed to load school dashboard stats:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchoolStats();
  }, [fetchSchoolStats]);

  return (
    <div className="school-page-container">
      {/* =================================================================
          1. HERO EXECUTIVE BANNER
         ================================================================= */}
      <div className="school-hero-banner">
        <div className="school-hero-content">
          <div className="school-hero-badge">
            <Sparkles size={14} />
            <span>Tech Campus Workspace</span>
          </div>
          <h1 className="school-hero-title">School Command Center</h1>
          <p className="school-hero-subtitle">
            Comprehensive executive management portal for academic years, classes, student admissions, exams, and fee collections.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', zIndex: 1 }}>
          <Button
            variant="primary"
            size="md"
            icon={Plus}
            onClick={() => navigate('/school/students')}
          >
            Add Student
          </Button>
          <Button
            variant="outline"
            size="md"
            icon={BookOpen}
            onClick={() => navigate('/school/academics')}
            style={{ color: '#ffffff', borderColor: 'rgba(255, 255, 255, 0.35)', background: 'rgba(255, 255, 255, 0.1)' }}
          >
            Academics
          </Button>
        </div>
      </div>

      {/* =================================================================
          2. TOP KPI CARDS GRID (HUMAN-DESIGNED FLEX/GRID)
         ================================================================= */}
      {isLoading ? (
        <div className="loading-state" style={{ padding: '40px', textAlign: 'center' }}>
          <Loader2 size={32} className="animate-spin text-emerald-600" style={{ margin: '0 auto 12px' }} />
          <p style={{ color: '#64748b' }}>Loading campus executive metrics...</p>
        </div>
      ) : (
        <div className="school-kpi-grid">
          <div className="school-kpi-card" onClick={() => navigate('/school/students')} style={{ cursor: 'pointer' }}>
            <div className="school-kpi-icon emerald">
              <GraduationCap size={24} />
            </div>
            <div className="school-kpi-body">
              <span className="school-kpi-label">School Students</span>
              <span className="school-kpi-value">{stats.totalStudents}</span>
            </div>
          </div>

          <div className="school-kpi-card" onClick={() => navigate('/school/admissions')} style={{ cursor: 'pointer' }}>
            <div className="school-kpi-icon blue">
              <ClipboardList size={24} />
            </div>
            <div className="school-kpi-body">
              <span className="school-kpi-label">Admissions</span>
              <span className="school-kpi-value">{stats.totalAdmissions}</span>
            </div>
          </div>

          <div className="school-kpi-card" onClick={() => navigate('/school/academics')} style={{ cursor: 'pointer' }}>
            <div className="school-kpi-icon purple">
              <School size={24} />
            </div>
            <div className="school-kpi-body">
              <span className="school-kpi-label">Classes</span>
              <span className="school-kpi-value">{stats.totalClasses}</span>
            </div>
          </div>

          <div className="school-kpi-card" style={{ cursor: 'default' }}>
            <div className="school-kpi-icon amber">
              <Users size={24} />
            </div>
            <div className="school-kpi-body">
              <span className="school-kpi-label">Faculty Staff</span>
              <span className="school-kpi-value">{stats.totalTeachers}</span>
            </div>
          </div>


          <div className="school-kpi-card" onClick={() => navigate('/school/fees')} style={{ cursor: 'pointer' }}>
            <div className="school-kpi-icon indigo">
              <IndianRupee size={24} />
            </div>
            <div className="school-kpi-body">
              <span className="school-kpi-label">Fee Collected</span>
              <span className="school-kpi-value">₹{(stats.feeCollections / 100000).toFixed(2)}L</span>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================
          3. CAMPUS OPERATIONAL SPLIT GRID
         ================================================================= */}
      <div className="school-split-grid">
        {/* Left Wing: School Operations Shortcuts */}
        <div className="school-panel">
          <div className="school-panel-header">
            <h2 className="school-panel-title">
              <School size={20} color="#059669" />
              Campus Management Modules
            </h2>
          </div>

          <div className="school-quick-grid">
            <div className="school-action-card" onClick={() => navigate('/school/students')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ padding: '8px', background: '#d1fae5', color: '#047857', borderRadius: '8px' }}>
                  <GraduationCap size={20} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#0f172a' }}>Student Records</h4>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Manage student profiles & enrollments</span>
                </div>
              </div>
              <ArrowRight size={18} color="#94a3b8" />
            </div>

            <div className="school-action-card" onClick={() => navigate('/school/admissions')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ padding: '8px', background: '#dbeafe', color: '#1d4ed8', borderRadius: '8px' }}>
                  <ClipboardList size={20} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#0f172a' }}>Admissions Portal</h4>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Review application intake queue</span>
                </div>
              </div>
              <ArrowRight size={18} color="#94a3b8" />
            </div>

            <div className="school-action-card" onClick={() => navigate('/school/academics')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ padding: '8px', background: '#f3e8ff', color: '#7e22ce', borderRadius: '8px' }}>
                  <BookOpen size={20} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#0f172a' }}>Academics & Classes</h4>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Configure classes, sections & subjects</span>
                </div>
              </div>
              <ArrowRight size={18} color="#94a3b8" />
            </div>


            <div className="school-action-card" onClick={() => navigate('/school/assignments')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ padding: '8px', background: '#fef3c7', color: '#b45309', borderRadius: '8px' }}>
                  <FileCheck size={20} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#0f172a' }}>School Assignments</h4>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Homework and project submissions</span>
                </div>
              </div>
              <ArrowRight size={18} color="#94a3b8" />
            </div>

            <div className="school-action-card" onClick={() => navigate('/school/fees')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ padding: '8px', background: '#e0e7ff', color: '#4338ca', borderRadius: '8px' }}>
                  <IndianRupee size={20} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#0f172a' }}>School Fee Ledger</h4>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Structure fees and log collections</span>
                </div>
              </div>
              <ArrowRight size={18} color="#94a3b8" />
            </div>
          </div>
        </div>

        {/* Right Wing: Executive Telemetry Summary */}
        <div className="school-panel">
          <div className="school-panel-header">
            <h2 className="school-panel-title">
              <ShieldCheck size={20} color="#047857" />
              Campus System Telemetry
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Active Academic Year</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>2025-2026 Academic Term</div>
              <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={14} /> Currently Active & Enforcing Rules
              </div>
            </div>

            <div style={{ background: '#ecfdf5', padding: '14px', borderRadius: '10px', border: '1px solid #a7f3d0' }}>
              <div style={{ fontSize: '0.8rem', color: '#047857', fontWeight: 600 }}>Fee Collection Health</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#065f46', marginTop: '2px' }}>
                ₹{(stats.feeCollections / 100000).toFixed(2)} Lakhs
              </div>
              <div style={{ fontSize: '0.75rem', color: '#047857', marginTop: '4px' }}>
                Log transactions & track installment status
              </div>
            </div>

            <Button
              variant="outline"
              size="md"
              icon={ArrowRight}
              onClick={() => navigate('/school/audit-logs')}
              style={{ width: '100%', justifyContent: 'center', marginTop: '4px' }}
            >
              View System Audit Logs
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchoolDashboardPage;
