import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, Search, Award, CheckCircle2, TrendingUp, AlertTriangle, Loader2, BookOpen, User } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../hooks/useToast';

export const StudentPerformancePage = () => {
  const { showToast } = useToast();
  const [performances, setPerformances] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchPerformance = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/learning/performance/');
      const list = Array.isArray(res) ? res : Array.isArray(res?.results) ? res.results : [];
      setPerformances(list);
    } catch (err) {
      console.error('Failed to load performance metrics:', err);
      showToast(err.message || 'Failed to load performance metrics.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchPerformance();
  }, [fetchPerformance]);

  const filtered = performances.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (p.student_name || '').toLowerCase().includes(q) || (p.enrollment_id || '').toLowerCase().includes(q);
  });

  return (
    <div className="learning-page-container">
      <div className="page-header">
        <div>
          <div className="page-title-wrap">
            <Sparkles className="text-indigo" size={28} />
            <h1 className="page-title">Student Performance System</h1>
          </div>
          <p className="page-subtitle">
            Real database metrics combining assessment results, attendance, and learning path progress.
          </p>
        </div>
      </div>

      <div className="table-controls-bar">
        <div className="search-box-wrap" style={{ width: '100%' }}>
          <Search size={18} className="search-icon" />
          <input 
            type="text"
            className="search-input"
            placeholder="Search student performance by name or enrollment ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="loading-state">
          <Loader2 size={32} className="animate-spin text-indigo" />
          <p>Calculating database performance metrics...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state-card">
          <Award size={48} className="text-slate-400 mb-2" />
          <h3>No student performance data available</h3>
          <p>Performance analytics will appear automatically as students take assessments and attend classes.</p>
        </div>
      ) : (
        <div className="table-card">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Enrolled Course</th>
                <th>Avg. Assessment Score</th>
                <th>Assessments Passed</th>
                <th>Learning Progress</th>
                <th>Live Attendance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.student_id}>
                  <td>
                    <div>
                      <div className="font-bold text-slate-900">{item.student_name}</div>
                      <div className="text-xs font-mono text-slate-400">{item.enrollment_id}</div>
                    </div>
                  </td>

                  <td>
                    <div className="text-sm font-medium text-slate-700">{item.course_name}</div>
                  </td>

                  <td>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${item.average_assessment_score >= 75 ? 'text-green-600' : 'text-indigo-600'}`}>
                        {item.average_assessment_score}%
                      </span>
                    </div>
                  </td>

                  <td>
                    <div className="text-sm">
                      <span className="font-bold text-slate-800">{item.assessments_passed}</span> / {item.assessments_taken}
                    </div>
                  </td>

                  <td>
                    <div className="w-32 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className="bg-indigo-600 h-2.5 rounded-full" 
                        style={{ width: `${item.learning_path_progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500 font-mono mt-1 inline-block">{item.learning_path_progress}%</span>
                  </td>

                  <td>
                    <span className={`badge ${item.live_class_attendance_rate >= 80 ? 'badge-success' : 'badge-warning'}`}>
                      {item.live_class_attendance_rate}% Attended
                    </span>
                  </td>

                  <td>
                    <span className="badge badge-primary uppercase text-xs">{item.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StudentPerformancePage;
