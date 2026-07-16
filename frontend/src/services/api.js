import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  // Increased timeout to 60 seconds to allow backend threat scans and AI evaluation to complete
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to attach access token to headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  register: async (email, password) => {
    const response = await api.post('/auth/register', { email, password });
    return response.data;
  },
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  }
};

export const websiteService = {
  getAll: async () => {
    const response = await api.get(`/websites?t=${Date.now()}`);
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/websites/${id}?t=${Date.now()}`);
    return response.data;
  },
  create: async (name, url) => {
    const response = await api.post('/websites', { name, url });
    return response.data;
  },
  update: async (id, name, url) => {
    const response = await api.put(`/websites/${id}`, { name, url });
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/websites/${id}`);
    return response.data;
  }
};

export const scanService = {
  run: async (websiteId) => {
    const response = await api.post(`/scans/${websiteId}`);
    return response.data;
  },
  getByWebsite: async (websiteId) => {
    const response = await api.get(`/scans/website/${websiteId}?t=${Date.now()}`);
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/scans/${id}?t=${Date.now()}`);
    return response.data;
  }
};

export const dashboardService = {
  getStats: async () => {
    const response = await api.get(`/dashboard?t=${Date.now()}`);
    return response.data;
  }
};

export const alertService = {
  getAll: async () => {
    const response = await api.get(`/alerts?t=${Date.now()}`);
    return response.data;
  },
  resolve: async (id) => {
    const response = await api.put(`/alerts/${id}/resolve`);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/alerts/${id}`);
    return response.data;
  }
};

export const auditService = {
  getAll: async () => {
    const response = await api.get(`/audit?t=${Date.now()}`);
    return response.data;
  }
};

export const emailService = {
  sendAlert: async (data) => {
    const response = await api.post('/email/send-alert', data);
    return response.data;
  }
};

export default api;
