import { useState, useEffect } from 'react';
import { examAPI } from '../../api/endpoints';
import { Plus, Trash2, Edit, Globe, GlobeLock, ChevronDown, ChevronUp } from 'lucide-react';

export default function ExamManagePage() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', duration_minutes: 60, questions: [],
  });
  const [newQ, setNewQ] = useState({ question_type: 'mcq', body: '', options: ['', '', '', ''], correct_answer: '0', points: 1 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    examAPI.list().then(({ data }) => setExams(data)).finally(() => setLoading(false));
  }, []);

  const createExam = async () => {
    if (!form.title) return;
    setSaving(true);
    try {
      const { data } = await examAPI.create(form);
      setExams((prev) => [data, ...prev]);
      setShowCreate(false);
      setForm({ title: '', description: '', duration_minutes: 60, questions: [] });
    } catch {}
    setSaving(false);
  };

  const addQuestion = () => {
    const q = { ...newQ, order_index: form.questions.length };
    if (q.question_type === 'freetext') { q.options = null; q.correct_answer = null; }
    setForm({ ...form, questions: [...form.questions, q] });
    setNewQ({ question_type: 'mcq', body: '', options: ['', '', '', ''], correct_answer: '0', points: 1 });
  };

  const togglePublish = async (exam) => {
    await examAPI.update(exam.id, { is_published: !exam.is_published });
    setExams((prev) => prev.map((e) => e.id === exam.id ? { ...e, is_published: !e.is_published } : e));
  };

  const deleteExam = async (id) => {
    if (!confirm('Delete this exam?')) return;
    await examAPI.delete(id);
    setExams((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Exam Management</h1>
          <p className="page-subtitle">Create, edit, and publish exams</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(!showCreate)}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={16} /> Create Exam
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="glass-card-elevated animate-slide-up" style={{ padding: 28, marginBottom: 24 }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 16 }}>New Exam</h3>

          <div style={{ marginBottom: 14 }}>
            <label className="input-label">Title</label>
            <input className="input-field" placeholder="e.g., Midterm — Data Structures"
              value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label className="input-label">Description</label>
            <textarea className="input-field" rows={2} placeholder="Exam description..."
              value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label className="input-label">Duration (minutes)</label>
            <input className="input-field" type="number" min={5} max={480} style={{ maxWidth: 150 }}
              value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })} />
          </div>

          {/* Questions */}
          <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 12 }}>Questions ({form.questions.length})</h4>

          {form.questions.map((q, i) => (
            <div key={i} style={{
              padding: 12,
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface)',
              marginBottom: 8,
              fontSize: '0.85rem',
            }}>
              <span className="badge badge-active" style={{ marginRight: 8, fontSize: '0.65rem' }}>{q.question_type}</span>
              {q.body.slice(0, 80)}{q.body.length > 80 ? '...' : ''}
            </div>
          ))}

          {/* Add Question */}
          <div style={{
            padding: 16,
            borderRadius: 'var(--radius-md)',
            border: '1px dashed var(--border-glass)',
            marginBottom: 16,
          }}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              <select className="input-field" style={{ maxWidth: 150 }}
                value={newQ.question_type} onChange={(e) => setNewQ({ ...newQ, question_type: e.target.value })}>
                <option value="mcq">MCQ</option>
                <option value="freetext">Free Text</option>
              </select>
              <input className="input-field" type="number" min={1} max={10} style={{ maxWidth: 80 }}
                value={newQ.points} onChange={(e) => setNewQ({ ...newQ, points: Number(e.target.value) })}
                placeholder="Points" />
            </div>

            <textarea className="input-field" rows={2} placeholder="Question text..."
              value={newQ.body} onChange={(e) => setNewQ({ ...newQ, body: e.target.value })}
              style={{ marginBottom: 12 }} />

            {newQ.question_type === 'mcq' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                {newQ.options.map((opt, j) => (
                  <div key={j} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      type="radio"
                      name="correct"
                      checked={newQ.correct_answer === String(j)}
                      onChange={() => setNewQ({ ...newQ, correct_answer: String(j) })}
                    />
                    <input className="input-field" placeholder={`Option ${j + 1}`}
                      value={opt} onChange={(e) => {
                        const opts = [...newQ.options];
                        opts[j] = e.target.value;
                        setNewQ({ ...newQ, options: opts });
                      }} />
                  </div>
                ))}
              </div>
            )}

            <button className="btn-secondary" onClick={addQuestion} disabled={!newQ.body}
              style={{ fontSize: '0.85rem' }}>
              <Plus size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
              Add Question
            </button>
          </div>

          <button className="btn-primary" onClick={createExam} disabled={saving || !form.title}
            style={{ width: '100%', padding: 12 }}>
            {saving ? 'Creating...' : 'Create Exam'}
          </button>
        </div>
      )}

      {/* Exam List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading ? (
          [1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 80 }} />)
        ) : exams.length === 0 ? (
          <div className="glass-card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
            No exams yet. Create your first exam above.
          </div>
        ) : exams.map((exam) => (
          <div key={exam.id} className="glass-card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 4 }}>{exam.title}</h3>
                <div style={{ display: 'flex', gap: 12, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <span>{exam.duration_minutes} min</span>
                  <span>{exam.question_count} questions</span>
                  <span className={`badge ${exam.is_published ? 'badge-low' : 'badge-medium'}`} style={{ fontSize: '0.65rem' }}>
                    {exam.is_published ? 'Published' : 'Draft'}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-secondary" onClick={() => togglePublish(exam)}
                  style={{ padding: '4px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                  {exam.is_published ? <GlobeLock size={14} /> : <Globe size={14} />}
                  {exam.is_published ? 'Unpublish' : 'Publish'}
                </button>
                <button className="btn-danger" onClick={() => deleteExam(exam.id)}
                  style={{ padding: '4px 12px', fontSize: '0.8rem' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
