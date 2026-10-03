const API_BASE = '/api';

function getAuthToken() {
  return localStorage.getItem('triai_token') || '';
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('triai_token', token);
  } else {
    localStorage.removeItem('triai_token');
  }
}

async function request(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // If not FormData, default to JSON
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.error || data.message || `Lỗi yêu cầu API (${response.status})`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // 1. Authentication
  auth: {
    login: (email, password) =>
      request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      }),
    register: (email, password, fullName) =>
      request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, fullName })
      }),
    googleLogin: (payload) =>
      request('/auth/google', {
        method: 'POST',
        body: JSON.stringify(payload)
      }),
    getMe: () => request('/auth/me'),
    logout: () => {
      setAuthToken('');
      localStorage.removeItem('triai_current_user');
    }
  },

  // 2. Agents
  agents: {
    getAll: () => request('/agents'),
    getById: (id) => request(`/agents/${id}`),
    upsert: (data) =>
      request('/agents', {
        method: 'POST',
        body: JSON.stringify(data)
      })
  },

  // 3. Skills
  skills: {
    getAll: (status = 'published') => request(`/skills?status=${status}`),
    getById: (id) => request(`/skills/${id}`),
    upsert: (data) =>
      request('/skills', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    uploadZip: (formData) =>
      request('/skills/upload-zip', {
        method: 'POST',
        body: formData
      })
  },

  // 4. Licenses & Trials
  licenses: {
    check: (skillId) => request(`/licenses/check/${skillId}`),
    startTrial: (skillId) =>
      request(`/licenses/trial/${skillId}`, {
        method: 'POST'
      }),
    getMyLicenses: () => request('/licenses/my'),
    grant: (data) =>
      request('/licenses/grant', {
        method: 'POST',
        body: JSON.stringify(data)
      })
  },

  // 5. Chat & AI Runtime
  chat: {
    getConversations: () => request('/chat/conversations'),
    getMessages: (conversationId) => request(`/chat/conversations/${conversationId}`),
    sendMessage: ({ conversationId, agentId, skillId, message, attachments = [] }) =>
      request('/chat/send', {
        method: 'POST',
        body: JSON.stringify({ conversationId, agentId, skillId, message, attachments })
      }),
    deleteConversation: (conversationId) =>
      request(`/chat/conversations/${conversationId}`, {
        method: 'DELETE'
      })
  },

  // 6. Files
  files: {
    upload: (file, { purpose = 'attachment', conversationId = null } = {}) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('purpose', purpose);
      if (conversationId) formData.append('conversationId', conversationId);
      return request('/files/upload', {
        method: 'POST',
        body: formData
      });
    },
    delete: (fileId) =>
      request(`/files/${fileId}`, {
        method: 'DELETE'
      })
  },

  // 7. Orders & Payments
  orders: {
    create: ({ items, note }) =>
      request('/orders', {
        method: 'POST',
        body: JSON.stringify({ items, note })
      }),
    requestPayment: (orderId, { transactionRef, note } = {}) =>
      request(`/orders/${orderId}/payment-request`, {
        method: 'POST',
        body: JSON.stringify({ transactionRef, note })
      }),
    getAll: () => request('/orders'),
    getById: (id) => request(`/orders/${id}`)
  },
  payments: {
    submitProof: ({ orderId, orderCode, transactionRef, note }) =>
      request('/payments/submit-proof', {
        method: 'POST',
        body: JSON.stringify({ orderId, orderCode, transactionRef, note })
      }),
    confirm: ({ orderId, orderCode, transactionRef }) =>
      request('/payments/confirm', {
        method: 'POST',
        body: JSON.stringify({ orderId, orderCode, transactionRef })
      })
  },

  // 8. Notifications
  notifications: {
    getAll: () => request('/notifications'),
    markRead: (id) =>
      request(`/notifications/${id}/read`, {
        method: 'POST'
      })
  },

  // 9. Admin Center
  admin: {
    getStats: () => request('/admin/stats'),
    getUsers: () => request('/admin/users'),
    updateUser: (id, data) =>
      request(`/admin/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    getOrders: () => request('/admin/orders'),
    getPayments: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/admin/payments${query ? '?' + query : ''}`);
    },
    verifyPayment: (orderId, data = {}) =>
      request(`/admin/orders/${orderId}/verify-payment`, {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    rejectPayment: (orderId, data = {}) =>
      request(`/admin/orders/${orderId}/reject-payment`, {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    getProviderStatus: () => request('/admin/provider-status'),
    getEmailLogs: () => request('/admin/email-logs'),
    retryEmailLog: (id) =>
      request(`/admin/email-logs/${id}/retry`, {
        method: 'POST'
      }),
    getNotifications: () => request('/admin/notifications'),
    markNotificationRead: (id) =>
      request(`/admin/notifications/${id}/read`, {
        method: 'PUT'
      }),
    getLicenses: () => request('/admin/licenses'),
    grantLicense: (data) =>
      request('/admin/licenses/grant', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    revokeLicense: (licenseId) =>
      request('/admin/licenses/revoke', {
        method: 'POST',
        body: JSON.stringify({ licenseId })
      })
  }
};

export default api;
