import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useKeystrokeDynamics } from '../../hooks/useKeystrokeDynamics';
import { enrollmentAPI } from '../../api/endpoints';
import { Shield, Keyboard, Camera, Eye, MousePointer, CheckCircle, ChevronRight, AlertCircle } from 'lucide-react';

export default function EnrollmentPage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(user?.consent_accepted ? 1 : 0); // 0=consent, 1=typing, 2=face, 3=done
  const [passage, setPassage] = useState('');
  const [typedText, setTypedText] = useState('');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const startTimeRef = useRef(null);
  const { keystrokes, handleKeyDown, handleKeyUp, reset: resetKeystrokes } = useKeystrokeDynamics();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    enrollmentAPI.getPassage().then(({ data }) => setPassage(data.passage));
    enrollmentAPI.getStatus().then(({ data }) => {
      setStatus(data);
      if (data.is_complete) setStep(3);
      else if (data.has_face_photo && data.has_keystroke_baseline) setStep(3);
      else if (data.has_keystroke_baseline) setStep(2);
    }).catch(() => {});
  }, []);

  // ─── Step 0: Consent ───
  const handleConsent = async () => {
    setLoading(true);
    try {
      await enrollmentAPI.acceptConsent();
      await refreshUser();
      setStep(1);
    } catch (err) {
      setError('Failed to record consent');
    }
    setLoading(false);
  };

  // ─── Step 1: Typing Baseline ───
  const handleTypingChange = (e) => {
    if (!startTimeRef.current) startTimeRef.current = Date.now();
    setTypedText(e.target.value);
  };

  const submitBaseline = async () => {
    if (keystrokes.length < 20) {
      setError('Please type more of the passage to build a reliable baseline.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const duration = (Date.now() - startTimeRef.current) / 1000;
      await enrollmentAPI.submitBaseline({
        keystrokes,
        passage_text: typedText,
        duration_seconds: duration,
      });
      setStep(2);
      resetKeystrokes();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit baseline');
    }
    setLoading(false);
  };

  // ─── Step 2: Face Capture ───
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      setError('Camera access denied. Please allow camera access to continue.');
    }
  }, []);

  useEffect(() => {
    if (step === 2) startCamera();
    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      }
    };
  }, [step, startCamera]);

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setLoading(true);
    setError('');
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = 640;
    canvas.height = 480;
    ctx.drawImage(videoRef.current, 0, 0, 640, 480);

    canvas.toBlob(async (blob) => {
      try {
        const file = new File([blob], 'face_reference.jpg', { type: 'image/jpeg' });
        await enrollmentAPI.uploadFacePhoto(file);
        // Send a dummy embedding (in production, MediaPipe would extract this)
        await enrollmentAPI.submitFaceEmbedding(Array(128).fill(0).map(() => Math.random() * 0.2));
        videoRef.current.srcObject?.getTracks().forEach((t) => t.stop());
        setStep(3);
        await refreshUser();
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to upload photo');
      }
      setLoading(false);
    }, 'image/jpeg', 0.9);
  };

  const progress = passage ? Math.min(100, Math.round((typedText.length / passage.length) * 100)) : 0;

  return (
    <div className="page-container" style={{ maxWidth: 800 }}>
      <div className="page-header">
        <h1 className="page-title">Enrollment</h1>
        <p className="page-subtitle">Complete these steps before taking exams</p>
      </div>

      {/* Progress Steps */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
        {['Consent', 'Typing Baseline', 'Face Capture', 'Complete'].map((label, i) => (
          <div key={i} style={{
            flex: 1,
            textAlign: 'center',
          }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              margin: '0 auto 6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.8rem',
              fontWeight: 600,
              background: i <= step ? 'var(--gradient-primary)' : 'var(--bg-elevated)',
              color: i <= step ? 'white' : 'var(--text-muted)',
              transition: 'all 0.3s ease',
            }}>
              {i < step ? <CheckCircle size={16} /> : i + 1}
            </div>
            <div style={{ fontSize: '0.75rem', color: i <= step ? 'var(--text-primary)' : 'var(--text-muted)' }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 14px', borderRadius: 'var(--radius-md)',
          background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
          color: '#F87171', fontSize: '0.85rem', marginBottom: 20,
        }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Step 0: Consent */}
      {step === 0 && (
        <div className="glass-card-elevated animate-fade-in" style={{ padding: 32 }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 600, marginBottom: 20 }}>Data Collection Consent</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.7 }}>
            SentinelExam collects the following data during exams to verify identity and detect anomalies.
            We do <strong style={{ color: 'var(--text-primary)' }}>not</strong> record continuous video.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
            {[
              { icon: <Keyboard size={20} />, title: 'Typing Rhythm', desc: 'How long you hold each key and the time between keypresses', color: '#3B82F6' },
              { icon: <MousePointer size={20} />, title: 'Mouse Movement', desc: 'Movement path, speed, and idle periods', color: '#7C3AED' },
              { icon: <Camera size={20} />, title: 'Periodic Webcam Snapshots', desc: 'A brief photo every 30–60 seconds for face verification', color: '#06B6D4' },
              { icon: <Eye size={20} />, title: 'Tab/Window Activity', desc: 'Whether you switch away from the exam tab', color: '#F59E0B' },
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 14,
                padding: '14px 16px', borderRadius: 'var(--radius-md)',
                background: 'var(--bg-surface)',
              }}>
                <div style={{ color: item.color, marginTop: 2 }}>{item.icon}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.title}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 20 }}>
            All data is stored securely and auto-deleted after the configured retention period.
            You can request data deletion at any time.
          </p>
          <button className="btn-primary" onClick={handleConsent} disabled={loading}
            style={{ width: '100%', padding: 14, fontSize: '1rem' }}>
            {loading ? 'Recording...' : 'I Understand & Consent'}
          </button>
        </div>
      )}

      {/* Step 1: Typing Baseline */}
      {step === 1 && (
        <div className="glass-card-elevated animate-fade-in" style={{ padding: 32 }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 600, marginBottom: 8 }}>Typing Baseline</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20, fontSize: '0.9rem' }}>
            Type the passage below naturally. This captures your unique typing rhythm for later comparison.
          </p>

          <div style={{
            padding: 16,
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-glass)',
            marginBottom: 16,
            fontSize: '0.95rem',
            lineHeight: 1.8,
            color: 'var(--text-secondary)',
          }}>
            {passage}
          </div>

          {/* Progress bar */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>
              <span>{keystrokes.length} keystrokes captured</span>
              <span>{progress}%</span>
            </div>
            <div style={{ height: 4, borderRadius: 2, background: 'var(--bg-elevated)', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${progress}%`,
                background: 'var(--gradient-primary)',
                borderRadius: 2,
                transition: 'width 0.3s ease',
              }} />
            </div>
          </div>

          <textarea
            className="input-field"
            rows={5}
            placeholder="Start typing the passage above..."
            value={typedText}
            onChange={handleTypingChange}
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyUp}
            style={{ resize: 'none', marginBottom: 16, fontSize: '0.95rem', lineHeight: 1.7 }}
          />

          <button className="btn-primary" onClick={submitBaseline} disabled={loading || keystrokes.length < 20}
            style={{ width: '100%', padding: 14, fontSize: '1rem', opacity: keystrokes.length < 20 ? 0.5 : 1 }}>
            {loading ? 'Saving baseline...' : 'Submit Typing Baseline'} <ChevronRight size={18} style={{ display: 'inline', verticalAlign: 'middle' }} />
          </button>
        </div>
      )}

      {/* Step 2: Face Capture */}
      {step === 2 && (
        <div className="glass-card-elevated animate-fade-in" style={{ padding: 32 }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 600, marginBottom: 8 }}>Face Reference Photo</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20, fontSize: '0.9rem' }}>
            Center your face in the frame and click capture. This photo will be used for periodic face verification.
          </p>

          <div style={{
            position: 'relative',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            marginBottom: 16,
            background: 'var(--bg-surface)',
            aspectRatio: '4/3',
          }}>
            <video ref={videoRef} autoPlay playsInline muted style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }} />
            {/* Face guide overlay */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 200,
              height: 260,
              border: '2px dashed rgba(59, 130, 246, 0.5)',
              borderRadius: '50%',
              pointerEvents: 'none',
            }} />
          </div>

          <canvas ref={canvasRef} style={{ display: 'none' }} />

          <button className="btn-primary" onClick={capturePhoto} disabled={loading}
            style={{ width: '100%', padding: 14, fontSize: '1rem' }}>
            <Camera size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8 }} />
            {loading ? 'Processing...' : 'Capture Photo'}
          </button>
        </div>
      )}

      {/* Step 3: Complete */}
      {step === 3 && (
        <div className="glass-card-elevated animate-fade-in" style={{ padding: 48, textAlign: 'center' }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            <CheckCircle size={32} style={{ color: 'var(--success)' }} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 8 }}>Enrollment Complete!</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>
            Your behavioral baseline has been recorded. You're ready to take exams.
          </p>
          <button className="btn-primary" onClick={() => navigate('/student/exams')}
            style={{ padding: '14px 32px', fontSize: '1rem' }}>
            Browse Exams <ChevronRight size={18} style={{ display: 'inline', verticalAlign: 'middle' }} />
          </button>
        </div>
      )}
    </div>
  );
}
