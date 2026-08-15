import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { examAPI } from '../../api/endpoints';
import { BookOpen, Clock, FileText, ChevronRight, AlertCircle } from 'lucide-react';

export default function ExamListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    examAPI.list()
      .then(({ data }) => setExams(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!user?.is_enrolled) {
    return (
      <div className="page-container" style={{ maxWidth: 600, textAlign: 'center', paddingTop: 80 }}>
        <AlertCircle size={48} style={{ color: 'var(--warning)', marginBottom: 16 }} />
        <h2 style={{ fontSize: '1.3rem', fontWeight: 600, marginBottom: 8 }}>Enrollment Required</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
          Complete your enrollment (typing baseline + face capture) before taking exams.
        </p>
        <Link to="/student/enrollment" className="btn-primary" style={{ textDecoration: 'none', padding: '12px 28px' }}>
          Go to Enrollment
        </Link>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Available Exams</h1>
        <p className="page-subtitle">Select an exam to begin. Your integrity will be monitored using behavioral biometrics.</p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: 120 }} />
          ))}
        </div>
      ) : exams.length === 0 ? (
        <div className="glass-card" style={{ padding: 48, textAlign: 'center' }}>
          <BookOpen size={48} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
          <p style={{ color: 'var(--text-secondary)' }}>No published exams available yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {exams.map((exam, i) => (
            <div
              key={exam.id}
              className="glass-card animate-fade-in"
              style={{
                padding: 24,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                animationDelay: `${i * 80}ms`,
                opacity: 0,
              }}
              onClick={() => navigate(`/student/exam/${exam.id}`)}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                e.currentTarget.style.transform = 'translateX(4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-glass)';
                e.currentTarget.style.transform = 'translateX(0)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 6 }}>{exam.title}</h3>
                  {exam.description && (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 12, lineHeight: 1.6 }}>
                      {exam.description.slice(0, 150)}{exam.description.length > 150 ? '...' : ''}
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: 20, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={14} /> {exam.duration_minutes} min
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <FileText size={14} /> {exam.question_count} questions
                    </span>
                  </div>
                </div>
                <ChevronRight size={20} style={{ color: 'var(--text-muted)', marginTop: 4 }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
