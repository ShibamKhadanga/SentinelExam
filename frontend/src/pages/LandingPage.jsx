import { Link } from 'react-router-dom';
import { Shield, Keyboard, MousePointer, Camera, BarChart3, Eye, Lock, Zap, Users, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  const features = [
    {
      icon: <Keyboard size={28} />,
      title: 'Keystroke Dynamics',
      desc: 'Captures typing rhythm — dwell time and flight time — to build a unique behavioral fingerprint per student.',
      color: '#3B82F6',
    },
    {
      icon: <MousePointer size={28} />,
      title: 'Mouse Movement Analysis',
      desc: 'Tracks path patterns, velocity, and idle periods to detect anomalous behavior during exams.',
      color: '#7C3AED',
    },
    {
      icon: <Camera size={28} />,
      title: 'Periodic Snapshots',
      desc: 'Brief webcam captures every 30–60s for face-match verification — never continuous video.',
      color: '#06B6D4',
    },
    {
      icon: <Eye size={28} />,
      title: 'Gaze Direction',
      desc: 'Eye-landmark analysis estimates where the student is looking, flagging sustained off-screen gazing.',
      color: '#10B981',
    },
    {
      icon: <BarChart3 size={28} />,
      title: 'Risk Score Fusion',
      desc: 'Three signals fused into one composite integrity score per time window, shown in a live timeline.',
      color: '#F59E0B',
    },
    {
      icon: <Users size={28} />,
      title: 'Human-in-the-Loop',
      desc: 'Sessions are flagged for instructor review with full evidence — the system never auto-fails a student.',
      color: '#EF4444',
    },
  ];

  return (
    <div style={{ minHeight: '100vh', overflow: 'hidden' }}>
      {/* Hero */}
      <section style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '40px 24px',
        position: 'relative',
      }}>
        {/* Background gradient orbs */}
        <div style={{
          position: 'absolute',
          top: '-20%',
          left: '-10%',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15), transparent 70%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-20%',
          right: '-10%',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124, 58, 237, 0.12), transparent 70%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
        }} />

        <div className="animate-fade-in" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            borderRadius: 100,
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            marginBottom: 32,
            fontSize: '0.85rem',
            color: 'var(--accent-blue)',
            fontWeight: 500,
          }}>
            <Lock size={14} />
            Privacy-Preserving Exam Integrity
          </div>

          <h1 style={{
            fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
            fontWeight: 800,
            lineHeight: 1.1,
            maxWidth: 800,
            margin: '0 auto 20px',
          }}>
            <span style={{
              background: 'var(--gradient-primary)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>Sentinel</span>
            <span style={{ color: 'var(--text-primary)' }}>Exam</span>
          </h1>

          <p style={{
            fontSize: 'clamp(1rem, 2vw, 1.25rem)',
            color: 'var(--text-secondary)',
            maxWidth: 640,
            margin: '0 auto 40px',
            lineHeight: 1.7,
          }}>
            Replace invasive continuous video proctoring with lightweight behavioral biometrics.
            Detect anomalies through typing rhythm, mouse patterns, and periodic snapshots — not surveillance.
          </p>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn-primary" style={{
              padding: '14px 32px',
              fontSize: '1rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              textDecoration: 'none',
            }}>
              Get Started <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="btn-secondary" style={{
              padding: '14px 32px',
              fontSize: '1rem',
              textDecoration: 'none',
            }}>
              Sign In
            </Link>
          </div>

          {/* Stats */}
          <div style={{
            display: 'flex',
            gap: 48,
            justifyContent: 'center',
            marginTop: 64,
            flexWrap: 'wrap',
          }}>
            {[
              { value: '~95%', label: 'Less Bandwidth' },
              { value: '3', label: 'Signal Fusion' },
              { value: '0', label: 'Auto-Fails' },
            ].map((stat, i) => (
              <div key={i} className="animate-fade-in" style={{ animationDelay: `${(i + 2) * 150}ms`, opacity: 0 }}>
                <div style={{
                  fontSize: '2rem',
                  fontWeight: 800,
                  background: 'var(--gradient-accent)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section style={{ padding: '80px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <h2 style={{
          textAlign: 'center',
          fontSize: '2rem',
          fontWeight: 700,
          marginBottom: 12,
        }}>
          How It Works
        </h2>
        <p style={{
          textAlign: 'center',
          color: 'var(--text-secondary)',
          marginBottom: 48,
          maxWidth: 600,
          margin: '0 auto 48px',
        }}>
          Three low-bandwidth signals are captured, scored, and fused into a single integrity metric — all with full transparency and human oversight.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 24,
        }}>
          {features.map((f, i) => (
            <div
              key={i}
              className="glass-card animate-slide-up"
              style={{
                padding: 28,
                opacity: 0,
                animationDelay: `${i * 100}ms`,
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                cursor: 'default',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = `0 0 30px ${f.color}20`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: `${f.color}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: f.color,
                marginBottom: 16,
              }}>
                {f.icon}
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 8 }}>
                {f.title}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison Banner */}
      <section style={{
        padding: '60px 24px',
        maxWidth: 900,
        margin: '0 auto',
      }}>
        <div className="glass-card-elevated" style={{ padding: 40, textAlign: 'center' }}>
          <Zap size={32} style={{ color: 'var(--warning)', marginBottom: 16 }} />
          <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 12 }}>
            Privacy vs. Accuracy Tradeoff
          </h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 600, margin: '0 auto 24px', lineHeight: 1.7 }}>
            SentinelExam demonstrates that you can achieve effective integrity monitoring
            at a fraction of the bandwidth and storage cost of continuous video — while
            generating fewer false positives through personalized behavioral baselines.
          </p>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 32,
            flexWrap: 'wrap',
          }}>
            <div style={{ padding: '12px 20px', borderRadius: 'var(--radius-md)', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--danger)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Video Proctoring</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>~2 GB/hr</div>
            </div>
            <div style={{ padding: '12px 20px', borderRadius: 'var(--radius-md)', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>SentinelExam</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>~5 MB/hr</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '24px',
        textAlign: 'center',
        borderTop: '1px solid var(--border-glass)',
        color: 'var(--text-muted)',
        fontSize: '0.8rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 4 }}>
          <Shield size={14} />
          SentinelExam
        </div>
        Privacy-preserving behavioral-biometric exam integrity platform
      </footer>
    </div>
  );
}
