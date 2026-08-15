import client from './client';

// ─── Auth ───
export const authAPI = {
  register: (data) => client.post('/auth/register', data),
  login: (data) => client.post('/auth/login', data),
  refresh: (refreshToken) => client.post('/auth/refresh', { refresh_token: refreshToken }),
  getMe: () => client.get('/auth/me'),
};

// ─── Enrollment ───
export const enrollmentAPI = {
  getStatus: () => client.get('/enrollment/status'),
  getPassage: () => client.get('/enrollment/passage'),
  acceptConsent: () => client.post('/enrollment/consent', { accepted: true }),
  submitBaseline: (data) => client.post('/enrollment/baseline', data),
  uploadFacePhoto: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return client.post('/enrollment/face-photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  submitFaceEmbedding: (embedding) => client.post('/enrollment/face-embedding', { embedding }),
};

// ─── Exams ───
export const examAPI = {
  list: () => client.get('/exams/'),
  get: (id) => client.get(`/exams/${id}`),
  create: (data) => client.post('/exams/', data),
  update: (id, data) => client.put(`/exams/${id}`, data),
  delete: (id) => client.delete(`/exams/${id}`),
  addQuestion: (examId, data) => client.post(`/exams/${examId}/questions`, data),
};

// ─── Sessions ───
export const sessionAPI = {
  start: (examId) => client.post('/sessions/start', { exam_id: examId }),
  submit: (sessionId, answers) => client.post(`/sessions/${sessionId}/submit`, { answers }),
  getMySessions: () => client.get('/sessions/my-sessions'),
};

// ─── Telemetry ───
export const telemetryAPI = {
  sendBatch: (batch) => client.post('/telemetry/batch', batch),
};

// ─── Dashboard (Instructor) ───
export const dashboardAPI = {
  getSessions: (examId, status) => {
    const params = {};
    if (examId) params.exam_id = examId;
    if (status) params.status_filter = status;
    return client.get('/dashboard/sessions', { params });
  },
  getSessionDetail: (id) => client.get(`/dashboard/sessions/${id}`),
  getTimeline: (sessionId) => client.get(`/dashboard/sessions/${sessionId}/timeline`),
  reviewSession: (sessionId, data) => client.post(`/dashboard/sessions/${sessionId}/review`, data),
  getStats: () => client.get('/dashboard/stats'),
  getSnapshotUrl: (sessionId, snapshotId) => `/api/dashboard/snapshots/${sessionId}/${snapshotId}`,
};
