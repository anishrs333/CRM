import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { dashboardService } from '../../services/dashboardService';
import { studentService } from '../../services/studentService';
import { formatCurrency, formatTimeAgo, formatDateTime } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Skeleton } from '../../components/common/Skeleton';
import { ErrorState } from '../../components/common/EmptyState';
import { 
  Users, 
  Briefcase, 
  Flame, 
  IndianRupee, 
  Plus, 
  ArrowRight, 
  Activity,
  PhoneCall,
  TrendingUp,
  FileText,
  Clock,
  GraduationCap,
  Target,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Calendar,
  CheckCircle2,
  Phone,
  Mail,
  Zap,
  ArrowUpRight,
  Layers,
  Award,
  Check,
  Percent,
  UserCheck,
  Shield,
  ArrowRightCircle,
  Trophy,
  PieChart,
  BarChart3,
  ExternalLink
} from 'lucide-react';
import './DashboardPage.css';

export const DashboardPage = () => {
  const { user, isAdmin, isManager } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [studentStats, setStudentStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [recentOpportunities, setRecentOpportunities] = useState([]);
  const [pendingFollowUps, setPendingFollowUps] = useState([]);
  const [completedFollowUpIds, setCompletedFollowUpIds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [sumData, stStats, actData, oppData, followData] = await Promise.all([
        dashboardService.getSummary().catch(() => ({})),
        studentService.getDashboardStats().catch(() => ({})),
        dashboardService.getRecentActivities().catch(() => []),
        dashboardService.getRecentOpportunities().catch(() => []),
        dashboardService.getPendingFollowUps().catch(() => []),
      ]);

      setSummary(sumData && typeof sumData === 'object' ? sumData : {});
      setStudentStats(stStats && typeof stStats === 'object' ? stStats : {});
      setActivities(Array.isArray(actData) ? actData : []);
      setRecentOpportunities(Array.isArray(oppData) ? oppData : []);
      setPendingFollowUps(Array.isArray(followData) ? followData : []);
    } catch (err) {
      console.error('Failed loading CRM executive cockpit:', err);
      setError(err.message || 'Unable to load executive dashboard.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleCompleteFollowUp = (id, title) => {
    setCompletedFollowUpIds((prev) => [...prev, id]);
    showToast(`Touchpoint logged as complete: "${title}"`, 'success', 2200);
  };

  const activeFollowUps = pendingFollowUps.filter(
    (f) => !completedFollowUpIds.includes(f.id)
  );

  // Compute key figures dynamically
  const totalPipelineVal = recentOpportunities.reduce((sum, d) => sum + (Number(d.dealValue || d.amount) || 0), 0) || (summary?.opportunityPipelineValue || 0);
  const totalLeadsCount = summary?.openOpportunities ?? summary?.totalLeads ?? recentOpportunities.length ?? 0;
  const wonVal = summary?.quotationStats?.accepted 
    ? summary.quotationStats.totalValue 
    : recentOpportunities.filter(o => o.stage === 'Closed Won' || o.stage === 'Won').reduce((s, o) => s + (Number(o.dealValue || o.amount) || 0), 0);

  const totalOppsCount = recentOpportunities.length || totalLeadsCount;
  const winRatePercent = totalOppsCount > 0 ? Math.round((recentOpportunities.filter(o => o.stage === 'Closed Won' || o.stage === 'Won').length / totalOppsCount) * 100) : (summary?.winRate || 0);

  // Stage breakdown calculated dynamically
  const getStageStats = (stageName) => {
    const opps = recentOpportunities.filter(o => String(o.stage || '').toLowerCase().includes(stageName.toLowerCase()));
    const count = opps.length;
    const value = opps.reduce((s, o) => s + (Number(o.dealValue || o.amount) || 0), 0);
    const percent = totalPipelineVal > 0 ? Math.round((value / totalPipelineVal) * 100) : 0;
    return { count, value, percent };
  };

  const discoveryStats = getStageStats('discovery');
  const proposalStats = getStageStats('proposal');
  const negotiationStats = getStageStats('negotiation');
  const wonStats = getStageStats('won');

  const stagesBreakdown = [
    { label: 'Discovery & Intake', count: discoveryStats.count, value: discoveryStats.value, color: '#be123c', percent: discoveryStats.percent },
    { label: 'Proposal Presented', count: proposalStats.count, value: proposalStats.value, color: '#e11d48', percent: proposalStats.percent },
    { label: 'In Negotiation', count: negotiationStats.count, value: negotiationStats.value, color: '#d97706', percent: negotiationStats.percent },
    { label: 'Closed Won', count: wonStats.count, value: wonStats.value, color: '#15803d', percent: wonStats.percent },
  ];

  const quotaTarget = 5000000;
  const quotaPercent = Math.min(100, Math.round((totalPipelineVal / quotaTarget) * 100));
  const quotaRemaining = Math.max(0, quotaTarget - totalPipelineVal);

  if (error) {
    return (
      <div className="executive-dashboard-container">
        <ErrorState
          title="Executive Dashboard Unavailable"
          message={error}
          onRetry={fetchDashboardData}
        />
      </div>
    );
  }

  return (
    <div className="executive-dashboard-container">
      {/* =================================================================
          1. LUXURY EXECUTIVE HEADER BANNER
         ================================================================= */}
      <header className="executive-hero-banner">
        <div className="hero-banner-content">
          <div className="hero-welcome-badge">
            <Sparkles size={14} className="hero-sparkle-icon" />
            <span>Executive Command Center</span>
          </div>

          <h1 className="hero-title">
            Welcome back, <span className="highlight">{user?.name || 'Partner'}</span>
          </h1>

          <p className="hero-subtitle">
            {isAdmin 
              ? 'Tech Academy Command Center — Full visibility across Ongoing Trainees, Placement Rates, Fee Collections & Courses.'
              : 'Academic Operations Deck — Real-time student progress telemetry, course durations, and placement drives.'}
          </p>
        </div>

        {/* Action Controls */}
        <div className="hero-banner-controls">
          <div className="hero-quick-actions">
            <Button
              variant="primary"
              size="md"
              icon={Plus}
              onClick={() => navigate('/students')}
            >
              Enroll Student
            </Button>
            <Button
              variant="outline"
              size="md"
              icon={GraduationCap}
              onClick={() => navigate('/courses')}
            >
              Course Catalog
            </Button>
          </div>
        </div>
      </header>

      {/* =================================================================
          2. TOP EXECUTIVE TELEMETRY KPI CARDS (INSTITUTE METRICS)
         ================================================================= */}
      <section className="executive-kpi-grid">
        {/* KPI 1: Ongoing Trainees */}
        <div className="kpi-card crimson-accent" style={{ cursor: 'pointer' }} onClick={() => navigate('/ongoing-students')}>
          <div className="kpi-top-row">
            <span className="kpi-label">Ongoing Trainees</span>
            <div className="kpi-icon-box crimson">
              <Clock size={20} />
            </div>
          </div>
          <div className="kpi-val-row">
            <h2 className="kpi-value">{isLoading ? <Skeleton width="80px" height="28px" /> : `${studentStats?.ongoing_count ?? 0} Active`}</h2>
            <span className="kpi-trend positive">
              <ArrowUpRight size={14} /> Active
            </span>
          </div>
          <p className="kpi-footer-text">Students in active training allocation</p>
        </div>

        {/* KPI 2: Finishing Soon Alert (≤ 10 Days Left) */}
        <div className="kpi-card amber-accent" style={{ cursor: 'pointer' }} onClick={() => navigate('/ongoing-students')}>
          <div className="kpi-top-row">
            <span className="kpi-label">Finishing Soon (≤ 10d Left)</span>
            <div className="kpi-icon-box amber">
              <Zap size={20} />
            </div>
          </div>
          <div className="kpi-val-row">
            <h2 className="kpi-value">{isLoading ? <Skeleton width="80px" height="28px" /> : `${studentStats?.finishing_soon_count ?? 0} Students`}</h2>
            <span className="kpi-urgent-pill">Action Required</span>
          </div>
          <p className="kpi-footer-text">Identify & mark completed soon</p>
        </div>

        {/* KPI 3: Completed Students */}
        <div className="kpi-card gold-accent" style={{ cursor: 'pointer' }} onClick={() => navigate('/completed-students')}>
          <div className="kpi-top-row">
            <span className="kpi-label">Course Completed</span>
            <div className="kpi-icon-box green">
              <Award size={20} />
            </div>
          </div>
          <div className="kpi-val-row">
            <h2 className="kpi-value">{isLoading ? <Skeleton width="80px" height="28px" /> : `${studentStats?.completed_count ?? 0} Students`}</h2>
            <span className="kpi-badge-pill">Ready for Drives</span>
          </div>
          <p className="kpi-footer-text">Finished duration & awaiting placement</p>
        </div>

        {/* KPI 4: Placed Students */}
        <div className="kpi-card beige-accent" style={{ cursor: 'pointer' }} onClick={() => navigate('/placed-students')}>
          <div className="kpi-top-row">
            <span className="kpi-label">Placed Candidates</span>
            <div className="kpi-icon-box purple">
              <Briefcase size={20} />
            </div>
          </div>
          <div className="kpi-val-row">
            <h2 className="kpi-value">{isLoading ? <Skeleton width="80px" height="28px" /> : `${studentStats?.placed_count ?? 0} Placed`}</h2>
            <span className="kpi-badge-pill">{studentStats?.placement_rate ?? 0}% Rate</span>
          </div>
          <p className="kpi-footer-text">Hired by partner corporate recruiters</p>
        </div>
      </section>

      {/* =================================================================
          3. FINISHING SOON ALERT WIDGET & INSTANT ACTION QUEUE
         ================================================================= */}
      <section className="operations-split-grid">
        {/* Left Wing (60%): Students Finishing Soon Widget (≤ 10 Days Remaining) */}
        <div className="op-panel op-panel-main">
          <div className="op-panel-header">
            <div>
              <h2 className="op-panel-title" style={{ color: '#d97706' }}>
                <Zap size={18} className="panel-title-icon" color="#d97706" />
                Finishing Soon Alert Queue (≤ 10 Days Left)
              </h2>
              <p className="op-panel-sub">Students reaching their training end date. Review and mark completed or extend duration.</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              icon={ArrowRight}
              onClick={() => navigate('/ongoing-students')}
            >
              View Ongoing Tracker
            </Button>
          </div>

          <div className="high-deals-list">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="high-deal-skeleton">
                  <Skeleton width="40%" height="16px" />
                  <Skeleton width="20%" height="16px" />
                </div>
              ))
            ) : (studentStats?.finishing_soon_students || []).length === 0 ? (
              <div className="empty-deals-box" style={{ padding: '32px', textAlign: 'center' }}>
                <CheckCircle2 size={36} color="#16a34a" style={{ margin: '0 auto 8px' }} />
                <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#1e293b' }}>No Urgent Completions Pending</h4>
                <p style={{ fontSize: '13px', color: '#64748b' }}>All ongoing trainees have more than 10 days remaining in their duration allocation.</p>
              </div>
            ) : (
              (studentStats?.finishing_soon_students || []).map((std) => (
                <div key={std.id} className="high-deal-card" style={{ borderLeft: '4px solid #f59e0b' }}>
                  <div className="deal-info-col">
                    <h4 className="deal-title">{std.full_name}</h4>
                    <span className="deal-client">{std.enrollment_id} • {std.course_title}</span>
                  </div>

                  <div className="deal-stage-badge" style={{ background: '#fef3c7', color: '#92400e' }}>
                    <Clock size={12} />
                    {std.days_remaining === 0 ? '✓ Time Finished Today' : `${std.days_remaining} Days Left`}
                  </div>

                  <div className="deal-val-col">
                    <span className="deal-amount" style={{ fontSize: '13px' }}>Day {std.days_elapsed} of {std.total_duration_days}</span>
                    <span className="deal-prob">Ends {std.expected_end_date}</span>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        await studentService.updateStudent(std.id, { status: 'completed' });
                        showToast(`🏆 ${std.full_name} marked as Course Completed!`, 'success');
                        fetchDashboardData();
                      } catch (err) {
                        showToast(err.message || 'Failed to update status.', 'error');
                      }
                    }}
                  >
                    Mark Completed
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Wing (40%): Fee Revenue & Financial Quick Snapshot */}
        <div className="op-panel op-panel-side">
          <div className="op-panel-header">
            <div>
              <h2 className="op-panel-title">
                <IndianRupee size={18} className="panel-title-icon" />
                Fee Ledger & Dues Summary
              </h2>
              <p className="op-panel-sub">Collected course fees and outstanding balances</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              icon={ArrowRight}
              onClick={() => navigate('/student-payments')}
            >
              Fee Receipts
            </Button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px' }}>
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Total Fee Revenue Collected</span>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#16a34a', margin: '4px 0' }}>
                {formatCurrency(studentStats?.total_revenue ?? 0)}
              </h2>
              <span style={{ fontSize: '12px', color: '#059669' }}>✓ Verified Installments Logged</span>
            </div>

            <div style={{ background: '#fff7ed', padding: '16px', borderRadius: '12px', border: '1px solid #ffedd5' }}>
              <span style={{ fontSize: '12px', color: '#c2410c', fontWeight: 600 }}>Outstanding Balance Dues</span>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#ea580c', margin: '4px 0' }}>
                {formatCurrency(studentStats?.pending_dues ?? 0)}
              </h2>
              <span style={{ fontSize: '12px', color: '#c2410c' }}>Installment Collections Pending</span>
            </div>

            <Button
              variant="primary"
              size="md"
              icon={FileText}
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => navigate('/student-payments')}
            >
              Download PDF Statements & Receipts
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;
