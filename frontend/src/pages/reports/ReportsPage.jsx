import React, { useState, useEffect } from 'react';
import { useToast } from '../../hooks/useToast';
import { formatCurrency, getInitials } from '../../utils/formatters';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import { DashboardCard } from '../../components/common/DashboardCard';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { userService } from '../../services/userService';
import { opportunityService } from '../../services/opportunityService';
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  Users, 
  IndianRupee, 
  Download,
  Building2
} from 'lucide-react';
import { exportToCsv } from '../../utils/exportToCsv';
import './ReportsPage.css';

export const ReportsPage = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [repPerformance, setRepPerformance] = useState([]);
  const [metrics, setMetrics] = useState({
    arr: 0,
    avgDealSize: 0,
    cac: 0,
    churn: 0
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const [usersRes, oppsRes] = await Promise.all([
          userService.getUsers({ limit: 100 }).catch(() => ({ data: [] })),
          opportunityService.getOpportunities({ limit: 100 }).catch(() => ({ data: [] })),
        ]);

        const employees = (usersRes.data || []).filter(
          (u) => u.username !== 'crm_admin' && u.username !== 'admin' && u.role !== 'Administrator' && u.role !== 'admin'
        );

        const opps = oppsRes.data || oppsRes.results || (Array.isArray(oppsRes) ? oppsRes : []);

        let totalRevenue = 0;
        let wonDealsCount = 0;

        const repData = employees.map((emp) => {
          const empOpps = opps.filter((o) => o.assignedTo === emp.name || o.assigned_to === emp.id);
          const wonOpps = empOpps.filter((o) => o.stage === 'Closed Won' || o.stage === 'Won');
          const revenue = wonOpps.reduce((sum, o) => sum + (Number(o.dealValue || o.amount) || 0), 0);
          const dealsWon = wonOpps.length;
          const winRate = empOpps.length > 0 ? Math.round((dealsWon / empOpps.length) * 100) : 0;

          totalRevenue += revenue;
          wonDealsCount += dealsWon;

          return {
            name: emp.name,
            role: emp.role || 'Sales Representative',
            dealsWon,
            revenue,
            winRate,
          };
        });

        setRepPerformance(repData);
        setMetrics({
          arr: totalRevenue,
          avgDealSize: wonDealsCount > 0 ? Math.round(totalRevenue / wonDealsCount) : 0,
          cac: 0,
          churn: 0,
        });
      } catch (err) {
        console.error('Failed to load reports telemetry:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const handleExport = (format) => {
    if (format === 'csv') {
      const exportRows = repPerformance.length > 0 ? repPerformance.map(r => ({
        Representative: r.name,
        Role: r.role,
        DealsWon: r.dealsWon,
        Revenue: r.revenue,
        WinRate: `${r.winRate}%`,
      })) : [{ ARR: metrics.arr, AvgDealSize: metrics.avgDealSize, CAC: metrics.cac, Churn: `${metrics.churn}%` }];
      
      exportToCsv('CRM_Analytics_Report', exportRows);
      showToast('CSV report exported and downloaded.', 'success');
    } else if (format === 'pdf') {
      showToast('Opening print/PDF save dialog...', 'info', 2000);
      setTimeout(() => {
        window.print();
      }, 300);
    }
  };

  return (
    <div className="reports-container">
      <div className="reports-header">
        <div className="reports-title-area">
          <h1>Analytics & Reports</h1>
          <p>Comprehensive breakdown of revenue, sales pipeline velocity, and team performance.</p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button
            variant="outline"
            icon={Download}
            onClick={() => handleExport('csv')}
          >
            Export CSV
          </Button>
          <Button
            variant="primary"
            icon={Download}
            onClick={() => handleExport('pdf')}
          >
            Download PDF Report
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="reports-metrics-grid">
        <DashboardCard
          title="Annual Run Rate (ARR)"
          value={formatCurrency(metrics.arr)}
          icon={TrendingUp}
          variant="success"
          trend={metrics.arr > 0 ? "+0%" : "₹ 0"}
          trendType="positive"
        />
        <DashboardCard
          title="Avg. Deal Size"
          value={formatCurrency(metrics.avgDealSize)}
          icon={IndianRupee}
          variant="primary"
          trend={metrics.avgDealSize > 0 ? "+0%" : "₹ 0"}
          trendType="positive"
        />
        <DashboardCard
          title="Customer Acq. Cost"
          value={formatCurrency(metrics.cac)}
          icon={Target}
          variant="info"
          trend="₹ 0"
          trendType="positive"
          subtitle="lower is better"
        />
        <DashboardCard
          title="Gross Revenue Churn"
          value={`${metrics.churn}%`}
          icon={Users}
          variant="warning"
          trend="0%"
          trendType="positive"
          subtitle="industry benchmark 2.5%"
        />
      </div>

      {/* Sales Rep Performance Leaderboard */}
      <Card>
        <CardHeader
          title="Sales Representative Performance"
          subtitle="Closed deals, total revenue contribution, and conversion efficiency"
        />
        <CardBody noPadding>
          <div className="crm-table-responsive">
            <table className="crm-table">
              <thead>
                <tr>
                  <th>Representative</th>
                  <th>Deals Won</th>
                  <th>Total Pipeline Won</th>
                  <th>Win Rate</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {repPerformance.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      No employee performance data recorded yet.
                    </td>
                  </tr>
                ) : (
                  repPerformance.map((rep) => (
                    <tr key={rep.name}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div className="rep-avatar">{getInitials(rep.name)}</div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                              {rep.name}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              {rep.role}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontWeight: 600 }}>{rep.dealsWon} deals</td>
                      <td style={{ fontWeight: 700, color: 'var(--success-solid)' }}>
                        {formatCurrency(rep.revenue)}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div
                            style={{
                              width: '100px',
                              height: '6px',
                              backgroundColor: 'var(--bg-subtle)',
                              borderRadius: '999px',
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                width: `${rep.winRate}%`,
                                height: '100%',
                                backgroundColor: 'var(--primary-600)',
                              }}
                            />
                          </div>
                          <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                            {rep.winRate}%
                          </span>
                        </div>
                      </td>
                      <td>
                        <Badge variant={rep.winRate >= 70 ? 'success' : 'info'}>
                          {rep.winRate >= 70 ? 'Top Performer' : 'On Track'}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default ReportsPage;
