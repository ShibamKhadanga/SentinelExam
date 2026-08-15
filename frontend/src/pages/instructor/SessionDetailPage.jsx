import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dashboardAPI } from '../../api/endpoints';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { ChevronLeft, AlertTriangle, CheckCircle, XCircle, ArrowUpRight, Clock, Keyboard, MousePointer, Eye, Camera } from 'lucide-react';

export default function SessionDetailPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [selectedWindow, setSelectedWindow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewing, setReviewing] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [sessionRes, timelineRes] = await Promise.all([
          dashboardAPI.getSessionDetail(sessionId),
          dashboardAPI.getTimeline(sessionId),
        ]);
        setSession(sessionRes.data);
        setTimeline(timelineRes.data);
      } catch {}
      setLoading(false);
    };
    load();
  }, [sessionId]);

  const handleReview = async (action) => {
    setReviewing(true);
    try {
      await dashboardAPI.reviewSession(sessionId, { action, notes: reviewNotes });
      const { data } = await dashboardAPI.getSessionDetail(sessionId);
      setSession(data);
    } catch {}
    setReviewing(false);
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="skeleton" style={{ height: 200, marginBottom: 16 }} />
        <div className="skeleton" style={{ height: 300 }} />
      </div>
    );
  }

  if (!session) return null;

  const chartData = timeline.map((w) => ({
    window: `W${w.window_index + 1}`,
    composite: w.composite_score ? Math.round(w.composite_score * 100) : 0,
    keystroke: w.keystroke_score ? Math.round(w.keystroke_score * 100) : 0,
    face: w.face_score ? Math.round(w.face_score * 100) : 0,
    gaze: w.gaze_score ? Math.round(w.gaze_score * 100) : 0,
    flagged: w.is_flagged,
  }));

  const riskColor = (score) => {
    if (!score) return 'var(--text-muted)';
    if (score < 0.3) return 'var(--success)';
    if (score < 0.6) return 'var(--warning)';
    return 'var(--danger)';
  };

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const data = payload[0].payload;
    return (
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-glass)',
        borderRadius: 'var(--radius-md)',
        padding: '12px 16px',
        fontSize: '0.8rem',
      }}>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>{data.window}</div>
        <div style={{ color: 'var(--accent-blue)' }}>Composite: {data.composite}%</div>
        <div style={{ color: '#7C3AED' }}>Keystroke: {data.keystroke}%</div>
        <div style={{ color: '#06B6D4' }}>Face: {data.face}%</div>
        <div style={{ color: '#10B981' }}>Gaze: {data.gaze}%</div>
        {data.flagged && <div style={{ color: 'var(--danger)', marginTop: 4 }}>⚠ Flagged</div>}
      </div>
    );
  };

  return (
    <div className="page-container">
      <button className="btn-secondary" onClick={() => navigate('/dashboard')}
        style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', fontSize: '0.85rem' }}>
        <ChevronLeft size={16} /> Back to Dashboard
      </button>

      {/* Session Header */}
      <div className="glass-card-elevated" style={{ padding: 28, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 4 }}>{session.student_name}</h1>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 8 }}>{session.student_email}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              <strong>{session.exam_title}</strong>
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <span><Clock size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> {new Date(session.started_at).toLocaleString()}</span>
              <span>{session.window_count} windows</span>
              <span style={{ color: 'var(--danger)' }}>{session.flagged_window_count} flagged</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontSize: '2.5rem',
              fontWeight: 800,
              color: riskColor(session.overall_risk_score),
              lineHeight: 1,
            }}>
              {session.overall_risk_score !== null ? `${Math.round(session.overall_risk_score * 100)}%` : '—'}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Overall Risk</div>
            <span className={`badge badge-${session.risk_level || 'low'}`} style={{ marginTop: 4 }}>
              {session.status}
            </span>
          </div>
        </div>
      </div>

      {/* Risk Timeline Chart */}
      <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 16 }}>Risk Score Timeline</h3>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData} onClick={(e) => {
              if (e?.activePayload) {
                const idx = chartData.indexOf(e.activePayload[0].payload);
                setSelectedWindow(timeline[idx] || null);
              }
            }}>
              <defs>
                <linearGradient id="colorComposite" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="window" stroke="var(--text-muted)" fontSize={12} />
              <YAxis stroke="var(--text-muted)" fontSize={12} domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="composite" stroke="#3B82F6" strokeWidth={2} fill="url(#colorComposite)" />
              <Area type="monotone" dataKey="keystroke" stroke="#7C3AED" strokeWidth={1} fill="transparent" strokeDasharray="4 4" />
              <Area type="monotone" dataKey="face" stroke="#06B6D4" strokeWidth={1} fill="transparent" strokeDasharray="4 4" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No telemetry data yet</div>
        )}
      </div>

      {/* Selected Window Evidence */}
      {selectedWindow && (
        <div className="glass-card-elevated animate-slide-in-right" style={{ padding: 24, marginBottom: 24 }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 16 }}>
            Window #{selectedWindow.window_index + 1} Evidence
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 16 }}>
            {[
              { label: 'Keystroke', score: selectedWindow.keystroke_score, icon: <Keyboard size={16} />, color: '#7C3AED' },
              { label: 'Face Match', score: selectedWindow.face_score, icon: <Camera size={16} />, color: '#06B6D4' },
              { label: 'Gaze', score: selectedWindow.gaze_score, icon: <Eye size={16} />, color: '#10B981' },
            ].map((scorer, i) => (
              <div key={i} style={{
                padding: 16,
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-surface)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: scorer.color }}>
                  {scorer.icon}
                  <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{scorer.label}</span>
                </div>
                <div style={{
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  color: riskColor(scorer.score),
                }}>
                  {scorer.score !== null ? `${Math.round(scorer.score * 100)}%` : '—'}
                </div>
              </div>
            ))}
          </div>

          {/* Evidence details */}
          {selectedWindow.evidence && (
            <details style={{ cursor: 'pointer' }}>
              <summary style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 8 }}>
                Raw Evidence Data
              </summary>
              <pre style={{
                padding: 16,
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-deep)',
                fontSize: '0.75rem',
                overflow: 'auto',
                maxHeight: 300,
                color: 'var(--text-secondary)',
              }}>
                {JSON.stringify(selectedWindow.evidence, null, 2)}
              </pre>
            </details>
          )}

          {/* Tab events */}
          {selectedWindow.tab_events?.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--warning)', marginBottom: 6 }}>
                <AlertTriangle size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                Tab Switch Events ({selectedWindow.tab_events.length})
              </div>
            </div>
          )}
        </div>
      )}

      {/* Review Actions */}
      {session.status !== 'reviewed' && session.status !== 'dismissed' && (
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 16 }}>Review Actions</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 16 }}>
            Review the evidence above and take an action. The system never auto-fails a student — this is your call.
          </p>
          <textarea
            className="input-field"
            rows={3}
            placeholder="Optional notes..."
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
            style={{ marginBottom: 16, resize: 'vertical' }}
          />
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button className="btn-success" onClick={() => handleReview('dismiss')} disabled={reviewing}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle size={16} /> Dismiss Flag
            </button>
            <button className="btn-primary" onClick={() => handleReview('escalate')} disabled={reviewing}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <ArrowUpRight size={16} /> Escalate
            </button>
            <button className="btn-danger" onClick={() => handleReview('confirm')} disabled={reviewing}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <XCircle size={16} /> Confirm Flag
            </button>
          </div>
        </div>
      )}

      {/* Previous review */}
      {session.review_action && (
        <div className="glass-card" style={{ padding: 20, marginTop: 16 }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Reviewed: <strong style={{ color: 'var(--text-primary)' }}>{session.review_action}</strong>
            {session.review_notes && ` — "${session.review_notes}"`}
          </div>
        </div>
      )}
    </div>
  );
}
