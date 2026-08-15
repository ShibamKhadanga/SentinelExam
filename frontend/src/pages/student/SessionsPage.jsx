import { useState, useEffect } from 'react';
import { sessionAPI } from '../../api/endpoints';
import { Clock, BarChart3, CheckCircle } from 'lucide-react';

export default function SessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sessionAPI.getMySessions()
      .then(({ data }) => setSessions(data))
      .finally(() => setLoading(false));
  }, []);

  const riskColor = (score) => {
    if (!score) return 'var(--text-muted)';
    if (score < 0.3) return 'var(--success)';
    if (score < 0.6) return 'var(--warning)';
    return 'var(--danger)';
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">My Sessions</h1>
        <p className="page-subtitle">Your exam history and results</p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 80 }} />)}
        </div>
      ) : sessions.length === 0 ? (
        <div className="glass-card" style={{ padding: 48, textAlign: 'center' }}>
          <BarChart3 size={48} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
          <p style={{ color: 'var(--text-secondary)' }}>No exam sessions yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {sessions.map((s, i) => (
            <div key={s.id} className="glass-card animate-fade-in"
              style={{ padding: 20, animationDelay: `${i * 60}ms`, opacity: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 4 }}>{s.exam_title || 'Exam'}</h3>
                  <div style={{ display: 'flex', gap: 16, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={12} /> {new Date(s.started_at).toLocaleDateString()}
                    </span>
                    <span className={`badge badge-${s.status === 'active' ? 'active' : s.status === 'flagged' ? 'high' : 'low'}`}>
                      {s.status}
                    </span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {s.overall_risk_score !== null && (
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: riskColor(s.overall_risk_score) }}>
                      {Math.round(s.overall_risk_score * 100)}%
                    </div>
                  )}
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>risk score</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
