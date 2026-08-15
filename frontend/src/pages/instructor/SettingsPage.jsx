import { useState } from 'react';
import { Settings as SettingsIcon, Sliders, Trash2, Download, Save } from 'lucide-react';

export default function SettingsPage() {
  const [weights, setWeights] = useState({
    keystroke: 0.35,
    face: 0.40,
    gaze: 0.25,
  });
  const [thresholds, setThresholds] = useState({
    low: 0.3,
    medium: 0.6,
    high: 0.8,
  });
  const [retention, setRetention] = useState(30);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // In production, this would call the backend settings API
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

  return (
    <div className="page-container" style={{ maxWidth: 800 }}>
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Configure scoring weights, thresholds, and data retention</p>
      </div>

      {/* Scoring Weights */}
      <div className="glass-card-elevated" style={{ padding: 28, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <Sliders size={20} style={{ color: 'var(--accent-blue)' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Scoring Weights</h3>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 20 }}>
          Adjust how much each signal contributes to the composite risk score. Weights should sum to 1.0.
        </p>

        {Object.entries(weights).map(([key, val]) => (
          <div key={key} style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <label className="input-label" style={{ textTransform: 'capitalize' }}>{key}</label>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-blue)' }}>
                {val.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={val}
              onChange={(e) => setWeights({ ...weights, [key]: parseFloat(e.target.value) })}
              style={{ width: '100%', accentColor: 'var(--accent-blue)' }}
            />
          </div>
        ))}

        <div style={{
          padding: '8px 14px',
          borderRadius: 'var(--radius-md)',
          background: Math.abs(totalWeight - 1.0) < 0.01 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          border: `1px solid ${Math.abs(totalWeight - 1.0) < 0.01 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
          fontSize: '0.8rem',
          color: Math.abs(totalWeight - 1.0) < 0.01 ? 'var(--success)' : 'var(--danger)',
        }}>
          Total: {totalWeight.toFixed(2)} {Math.abs(totalWeight - 1.0) < 0.01 ? '✓' : '(should be 1.00)'}
        </div>
      </div>

      {/* Risk Thresholds */}
      <div className="glass-card" style={{ padding: 28, marginBottom: 24 }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 20 }}>Risk Thresholds</h3>

        {Object.entries(thresholds).map(([key, val]) => {
          const colors = { low: 'var(--success)', medium: 'var(--warning)', high: 'var(--danger)' };
          return (
            <div key={key} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <label className="input-label" style={{ textTransform: 'capitalize' }}>{key}</label>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: colors[key] }}>
                  {Math.round(val * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={val}
                onChange={(e) => setThresholds({ ...thresholds, [key]: parseFloat(e.target.value) })}
                style={{ width: '100%', accentColor: colors[key] }}
              />
            </div>
          );
        })}
      </div>

      {/* Data Retention */}
      <div className="glass-card" style={{ padding: 28, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Trash2 size={20} style={{ color: 'var(--warning)' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Snapshot Retention</h3>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 16 }}>
          Webcam snapshots are automatically deleted after this many days.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <input
            className="input-field"
            type="number"
            min={1}
            max={365}
            value={retention}
            onChange={(e) => setRetention(Number(e.target.value))}
            style={{ maxWidth: 100 }}
          />
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>days</span>
        </div>
      </div>

      {/* Save */}
      <button className="btn-primary" onClick={handleSave}
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 28px', fontSize: '1rem' }}>
        <Save size={18} />
        {saved ? '✓ Settings Saved' : 'Save Settings'}
      </button>
    </div>
  );
}
