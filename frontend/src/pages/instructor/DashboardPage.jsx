import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI, examAPI } from '../../api/endpoints';
import { useWebSocket } from '../../hooks/useWebSocket';
import { BarChart3, Users, AlertTriangle, Shield, Activity, Eye, RefreshCw } from 'lucide-react';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const { messages, isConnected } = useWebSocket();

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, sessionsRes, examsRes] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getSessions(selectedExam || undefined, statusFilter || undefined),
        examAPI.list(),
      ]);
      setStats(statsRes.data);
      setSessions(sessionsRes.data);
      setExams(examsRes.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [selectedExam, statusFilter]);

  // Process WebSocket updates
  useEffect(() => {
    if (!messages.length) return;
    const last = messages[messages.length - 1];
    if (last?.type === 'score_update') {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === last.session_id
            ? { ...s, overall_risk_score: last.overall_risk_score, risk_level: last.risk_level }
            : s
        )
      );
    }
  }, [messages]);

  const riskBadge = (level) => {
    const map = { low: 'badge-low', medium: 'badge-medium', high: 'badge-high', critical: 'badge-critical' };
    return map[level] || 'badge-low';
  };

  const statCards = stats ? [
    { label: 'Total Exams', value: stats.total_exams, icon: <BarChart3 size={20} />, color: '#3B82F6' },
    { label: 'Total Sessions', value: stats.total_sessions, icon: <Users size={20} />, color: '#7C3AED' },
    { label: 'Active Now', value: stats.active_sessions, icon: <Activity size={20} />, color: '#10B981' },
    { label: 'Flagged', value: stats.flagged_sessions, icon: <AlertTriangle size={20} />, color: '#EF4444' },
  ] : [];

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Instructor Dashboard</h1>
          <p className="page-subtitle">Monitor exam integrity in real-time</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 12px', borderRadius: 'var(--radius-md)',
            background: isConnected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${isConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            fontSize: '0.8rem',
            color: isConnected ? 'var(--success)' : 'var(--danger)',
          }}>
            <div className={`monitoring-dot ${!isConnected ? 'monitoring-dot-danger' : ''}`} />
            {isConnected ? 'Live' : 'Disconnected'}
          </div>
          <button className="btn-secondary" onClick={loadData} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px' }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        {statCards.map((card, i) => (
          <div key={i} className="glass-card animate-slide-up" style={{
            padding: 20,
            animationDelay: `${i * 80}ms`,
            opacity: 0,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 6 }}>{card.label}</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>{card.value}</div>
              </div>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: `${card.color}15`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: card.color,
              }}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <select className="input-field" style={{ maxWidth: 250 }}
          value={selectedExam} onChange={(e) => setSelectedExam(e.target.value)}>
          <option value="">All Exams</option>
          {exams.map((e) => (
            <option key={e.id} value={e.id}>{e.title}</option>
          ))}
        </select>
        <select className="input-field" style={{ maxWidth: 180 }}
          value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="submitted">Submitted</option>
          <option value="flagged">Flagged</option>
          <option value="reviewed">Reviewed</option>
        </select>
      </div>

      {/* Sessions Table */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 24 }}>
            {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton" style={{ height: 48, marginBottom: 8 }} />)}
          </div>
        ) : sessions.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <Shield size={40} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
            <p style={{ color: 'var(--text-secondary)' }}>No sessions found.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Exam</th>
                <th>Started</th>
                <th>Risk Score</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{s.student_name || 'Unknown'}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.student_email}</div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{s.exam_title}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    {new Date(s.started_at).toLocaleString()}
                  </td>
                  <td>
                    {s.overall_risk_score !== null ? (
                      <span style={{
                        fontSize: '1rem',
                        fontWeight: 700,
                        color: s.overall_risk_score < 0.3 ? 'var(--success)' :
                               s.overall_risk_score < 0.6 ? 'var(--warning)' : 'var(--danger)',
                      }}>
                        {Math.round(s.overall_risk_score * 100)}%
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>—</span>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${riskBadge(s.risk_level || s.status)}`}>
                      {s.status}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn-secondary"
                      style={{ padding: '4px 12px', fontSize: '0.8rem' }}
                      onClick={() => navigate(`/dashboard/sessions/${s.id}`)}
                    >
                      <Eye size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
