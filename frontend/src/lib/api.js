const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const TOKEN_KEY = "mockroom_token";
const USER_KEY = "mockroom_user";

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setStoredToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}
export function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}
export function setStoredUser(user) {
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  else localStorage.removeItem(USER_KEY);
}

async function request(path, options = {}) {
  const token = getStoredToken();
  const isFormData = options.body instanceof FormData;

  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      message = data.message || message;
    } catch {
      // ignore parse errors
    }
    if (res.status === 401) {
      setStoredToken(null);
      setStoredUser(null);
    }
    throw new Error(message);
  }

  return res.json();
}

export const authApi = {
  google: (credential) =>
    request("/auth/google", { method: "POST", body: JSON.stringify({ credential }) }),

  requestOtp: (email) =>
    request("/auth/otp/request", { method: "POST", body: JSON.stringify({ email }) }),

  verifyOtp: (email, code) =>
    request("/auth/otp/verify", { method: "POST", body: JSON.stringify({ email, code }) }),

  me: () => request("/auth/me"),
};

export const api = {
  // { role, difficulty, persona, mode, practiceMode, resumeFile }
  startInterview: ({ role, difficulty, persona, mode, practiceMode, resumeFile }) => {
    const form = new FormData();
    form.append("role", role);
    form.append("difficulty", difficulty);
    form.append("persona", persona);
    form.append("mode", mode);
    form.append("practiceMode", String(Boolean(practiceMode)));
    if (resumeFile) form.append("resume", resumeFile);

    return request("/interviews/start", { method: "POST", body: form });
  },

  submitAnswer: (interviewId, questionIndex, answerText) =>
    request(`/interviews/${interviewId}/answer`, {
      method: "POST",
      body: JSON.stringify({ questionIndex, answerText }),
    }),

  retryQuestion: (interviewId, questionIndex) =>
    request(`/interviews/${interviewId}/retry-question`, {
      method: "POST",
      body: JSON.stringify({ questionIndex }),
    }),

  finishInterview: (interviewId) =>
    request(`/interviews/${interviewId}/finish`, { method: "POST" }),

  shareInterview: (interviewId) =>
    request(`/interviews/${interviewId}/share`, { method: "POST" }),

  unshareInterview: (interviewId) =>
    request(`/interviews/${interviewId}/unshare`, { method: "POST" }),

  getHistory: () => request(`/interviews`),

  getInterview: (interviewId) => request(`/interviews/${interviewId}`),
};

export const publicApi = {
  getSharedReport: (shareId) => request(`/public/reports/${shareId}`),
};
