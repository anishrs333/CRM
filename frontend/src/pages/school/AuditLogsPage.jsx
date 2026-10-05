import React, { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, Search, Clock, User, Loader2 } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../hooks/useToast';
import './SchoolPages.css';

export const AuditLogsPage = () => {
  const { showToast } = useToast();
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/audit/logs/');
      const list = Array.isArray(res?.results) ? res.results : Array.isArray(res) ? res : [];
      setLogs(list);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
      showToast(err.message || 'Failed to load audit logs.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filtered = logs.filter((l) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (l.action_type || '').toLowerCase().includes(q) ||
      (l.target_model || '').toLowerCase().includes(q) ||
      (l.username || '').toLowerCase().includes(q) ||
      (l.details || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="learning-page-container">
      <div className="page-header">
        <div>
          <div className="page-title-wrap">
            <ShieldCheck className="text-emerald-600" size={28} />
            <h1 className="page-title">Audit & Security Activity Logs</h1>
          </div>
          <p className="page-subtitle">
            System audit trail recording user actions, timestamps, target models, and security events.
          </p>
        </div>
      </div>

      <div className="table-controls-bar">
        <div className="search-box-wrap" style={{ width: '100%' }}>
          <Search size={18} className="search-icon" />
          <input 
            type="text"
            className="search-input"
            placeholder="Search audit logs by user, action type, model, or details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="loading-state">
          <Loader2 size={32} className="animate-spin text-emerald-600" />
          <p>Loading security audit logs...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state-card">
          <ShieldCheck size={48} className="text-slate-400 mb-2" />
          <h3>No audit log entries found</h3>
          <p>System activities and sensitive user actions will automatically be recorded here.</p>
        </div>
      ) : (
        <div className="table-card">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Action Type</th>
                <th>Target Model</th>
                <th>Target ID</th>
                <th>Details</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log) => (
                <tr key={log.id}>
                  <td className="font-mono text-xs text-slate-500">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td>
                    <div className="font-bold text-slate-900">{log.user_full_name}</div>
                    <div className="text-xs text-slate-400 font-mono">@{log.username}</div>
                  </td>
                  <td>
                    <span className="badge badge-primary font-mono text-xs">{log.action_type}</span>
                  </td>
                  <td>
                    <span className="font-semibold text-slate-700">{log.target_model}</span>
                  </td>
                  <td>
                    <span className="font-mono text-xs text-slate-500">{log.target_id || '-'}</span>
                  </td>
                  <td>
                    <div className="text-xs text-slate-600 max-w-xs truncate">{log.details || 'N/A'}</div>
                  </td>
                  <td>
                    <span className="font-mono text-xs text-slate-400">{log.ip_address || '127.0.0.1'}</span>
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

export default AuditLogsPage;
