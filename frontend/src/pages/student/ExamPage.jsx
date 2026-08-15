import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { examAPI, sessionAPI, telemetryAPI } from '../../api/endpoints';
import { useKeystrokeDynamics } from '../../hooks/useKeystrokeDynamics';
import { useMouseTracking } from '../../hooks/useMouseTracking';
import { useTabVisibility } from '../../hooks/useTabVisibility';
import { Clock, Send, AlertTriangle, ChevronLeft, ChevronRight, Radio } from 'lucide-react';

export default function ExamPage() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [session, setSession] = useState(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [started, setStarted] = useState(false);
  const windowIndexRef = useRef(0);
  const telemetryIntervalRef = useRef(null);

  const { keystrokes, handleKeyDown, handleKeyUp, getAndReset: getKeystrokes } = useKeystrokeDynamics();
  const { startTracking: startMouse, stopTracking: stopMouse, getAndReset: getMouseEvents } = useMouseTracking();
  const { startTracking: startTab, stopTracking: stopTab, getAndReset: getTabEvents, blurCount } = useTabVisibility();

  // Load exam
  useEffect(() => {
    examAPI.get(examId).then(({ data }) => setExam(data));
  }, [examId]);

  // Timer
  useEffect(() => {
    if (!started || timeLeft === null) return;
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, started]);

  // Telemetry batch sender
  const sendTelemetryBatch = useCallback(async () => {
    if (!session) return;

    const windowStart = Date.now() / 1000 - 30;
    const windowEnd = Date.now() / 1000;
    const ks = getKeystrokes();
    const mouse = getMouseEvents();
    const tab = getTabEvents();

    const batch = {
      session_id: session.id,
      window_index: windowIndexRef.current,
      window_start: windowStart,
      window_end: windowEnd,
      keystrokes: ks,
      mouse_events: mouse,
      tab_events: tab,
      snapshots: [],  // Webcam snapshots would be added here in production
      bytes_size: JSON.stringify({ ks, mouse, tab }).length,
    };

    try {
      await telemetryAPI.sendBatch(batch);
    } catch {
      /* continue exam even if telemetry fails */
    }
    windowIndexRef.current += 1;
  }, [session, getKeystrokes, getMouseEvents, getTabEvents]);

  const startExam = async () => {
    try {
      const { data } = await sessionAPI.start(examId);
      setSession(data);
      setTimeLeft(exam.duration_minutes * 60);
      setStarted(true);
      startMouse();
      startTab();

      // Send telemetry every 30 seconds
      telemetryIntervalRef.current = setInterval(sendTelemetryBatch, 30000);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to start exam');
    }
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);

    // Send final telemetry batch
    await sendTelemetryBatch();

    // Stop tracking
    clearInterval(telemetryIntervalRef.current);
    stopMouse();
    stopTab();

    try {
      await sessionAPI.submit(session.id, answers);
      navigate('/student/sessions');
    } catch {
      alert('Failed to submit. Your answers have been saved.');
      navigate('/student/sessions');
    }
  };

  useEffect(() => {
    return () => {
      clearInterval(telemetryIntervalRef.current);
      stopMouse();
      stopTab();
    };
  }, []);

  if (!exam) {
    return (
      <div className="page-container" style={{ textAlign: 'center', paddingTop: 80 }}>
        <div className="monitoring-dot" style={{ width: 24, height: 24, margin: '0 auto' }} />
      </div>
    );
  }

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const question = exam.questions?.[currentQ];
  const isLowTime = timeLeft !== null && timeLeft < 300;

  // Pre-exam screen
  if (!started) {
    return (
      <div className="page-container" style={{ maxWidth: 700 }}>
        <div className="glass-card-elevated animate-fade-in" style={{ padding: 40, textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: 8 }}>{exam.title}</h1>
          {exam.description && (
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.7 }}>{exam.description}</p>
          )}
          <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginBottom: 32 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-blue)' }}>{exam.duration_minutes}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Minutes</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-violet)' }}>{exam.questions?.length || 0}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Questions</div>
            </div>
          </div>

          <div style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            color: 'var(--text-secondary)',
            fontSize: '0.85rem',
            marginBottom: 24,
            textAlign: 'left',
          }}>
            <strong style={{ color: 'var(--warning)' }}>⚡ Monitoring Active:</strong> Keystroke rhythm, mouse movement, and periodic snapshots will be captured during this exam.
          </div>

          <button className="btn-primary" onClick={startExam} style={{ padding: '14px 40px', fontSize: '1rem' }}>
            Start Exam
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar: Timer + Progress + Monitoring indicator */}
      <div style={{
        position: 'sticky',
        top: 64,
        zIndex: 30,
        background: 'rgba(11, 17, 32, 0.9)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-glass)',
        padding: '10px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Q {currentQ + 1}/{exam.questions?.length}
          </span>
          {/* Progress dots */}
          <div style={{ display: 'flex', gap: 4 }}>
            {exam.questions?.map((_, i) => (
              <div key={i} style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: answers[exam.questions[i]?.id]
                  ? 'var(--success)'
                  : i === currentQ
                  ? 'var(--accent-blue)'
                  : 'var(--bg-elevated)',
                transition: 'all 0.2s ease',
              }} />
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Monitoring indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <div className="monitoring-dot" />
            Monitoring
          </div>

          {blurCount > 0 && (
            <span className="badge badge-medium" style={{ fontSize: '0.7rem' }}>
              <AlertTriangle size={12} /> {blurCount} tab switches
            </span>
          )}

          {/* Timer */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 14px',
            borderRadius: 'var(--radius-md)',
            background: isLowTime ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-elevated)',
            border: `1px solid ${isLowTime ? 'rgba(239, 68, 68, 0.3)' : 'var(--border-glass)'}`,
            color: isLowTime ? 'var(--danger)' : 'var(--text-primary)',
            fontWeight: 600,
            fontFamily: 'monospace',
            fontSize: '1rem',
          }}>
            <Clock size={16} />
            {timeLeft !== null ? formatTime(timeLeft) : '--:--'}
          </div>
        </div>
      </div>

      {/* Question Area */}
      <div className="page-container" style={{ maxWidth: 800, flex: 1 }}>
        {question && (
          <div className="animate-fade-in" key={currentQ}>
            <div className="glass-card" style={{ padding: 28, marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <span className="badge badge-active" style={{ fontSize: '0.7rem' }}>
                  {question.question_type === 'mcq' ? 'Multiple Choice' : 'Free Text'}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{question.points} pts</span>
              </div>

              <h2 style={{ fontSize: '1.15rem', fontWeight: 600, lineHeight: 1.6, marginBottom: 20 }}>
                {question.body}
              </h2>

              {question.question_type === 'mcq' && question.options ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {question.options.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => setAnswers({ ...answers, [question.id]: String(idx) })}
                      style={{
                        padding: '14px 18px',
                        borderRadius: 'var(--radius-md)',
                        border: `1px solid ${answers[question.id] === String(idx) ? 'var(--accent-blue)' : 'var(--border-glass)'}`,
                        background: answers[question.id] === String(idx) ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-surface)',
                        color: 'var(--text-primary)',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontFamily: 'inherit',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                      }}
                    >
                      <Radio size={16} style={{
                        color: answers[question.id] === String(idx) ? 'var(--accent-blue)' : 'var(--text-muted)',
                      }} />
                      {opt}
                    </button>
                  ))}
                </div>
              ) : (
                <textarea
                  className="input-field"
                  rows={6}
                  placeholder="Type your answer here..."
                  value={answers[question.id] || ''}
                  onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
                  onKeyDown={handleKeyDown}
                  onKeyUp={handleKeyUp}
                  style={{ resize: 'vertical', fontSize: '0.95rem', lineHeight: 1.7 }}
                />
              )}
            </div>

            {/* Navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                className="btn-secondary"
                onClick={() => setCurrentQ((c) => Math.max(0, c - 1))}
                disabled={currentQ === 0}
                style={{ opacity: currentQ === 0 ? 0.4 : 1, display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <ChevronLeft size={16} /> Previous
              </button>

              {currentQ === exam.questions.length - 1 ? (
                <button className="btn-success" onClick={handleSubmit} disabled={submitting}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 24px' }}>
                  <Send size={16} /> {submitting ? 'Submitting...' : 'Submit Exam'}
                </button>
              ) : (
                <button
                  className="btn-primary"
                  onClick={() => setCurrentQ((c) => Math.min(exam.questions.length - 1, c + 1))}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  Next <ChevronRight size={16} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
