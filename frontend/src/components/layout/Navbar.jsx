import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Shield, LogOut, User, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout, isInstructor, isStudent } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinks = isInstructor
    ? [
        { to: '/dashboard', label: 'Dashboard' },
        { to: '/dashboard/exams', label: 'Exams' },
        { to: '/dashboard/settings', label: 'Settings' },
      ]
    : [
        { to: '/student/exams', label: 'Exams' },
        { to: '/student/enrollment', label: 'Enrollment' },
        { to: '/student/sessions', label: 'My Sessions' },
      ];

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 40,
      borderBottom: '1px solid var(--border-glass)',
      background: 'rgba(11, 17, 32, 0.85)',
      backdropFilter: 'blur(20px)',
    }}>
      <div style={{
        maxWidth: 1400,
        margin: '0 auto',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 64,
      }}>
        {/* Logo */}
        <Link to={isInstructor ? '/dashboard' : '/student/exams'} style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          textDecoration: 'none',
          color: 'inherit',
        }}>
          <Shield size={28} style={{ color: 'var(--accent-blue)' }} />
          <span style={{
            fontSize: '1.2rem',
            fontWeight: 700,
            background: 'var(--gradient-primary)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            SentinelExam
          </span>
        </Link>

        {/* Desktop Links */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            className="nav-links-desktop"
          >
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  textDecoration: 'none',
                  color: location.pathname.startsWith(link.to)
                    ? 'var(--accent-blue)'
                    : 'var(--text-secondary)',
                  background: location.pathname.startsWith(link.to)
                    ? 'rgba(59, 130, 246, 0.1)'
                    : 'transparent',
                  transition: 'all 0.2s ease',
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {user && (
            <>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 12px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-elevated)',
                fontSize: '0.85rem',
              }}>
                <User size={16} style={{ color: 'var(--text-muted)' }} />
                <span style={{ color: 'var(--text-secondary)' }}>{user.name}</span>
                <span className={`badge ${isInstructor ? 'badge-active' : 'badge-low'}`}
                  style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                  {user.role}
                </span>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: 'transparent',
                  border: '1px solid var(--border-glass)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  transition: 'all 0.2s ease',
                }}
              >
                <LogOut size={16} />
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
