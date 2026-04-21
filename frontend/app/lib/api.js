const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

const TOKEN_KEY = "careermate_token";
const USER_KEY = "careermate_user";

export function getToken() {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(TOKEN_KEY);
}

export function setAuth(token, user) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(TOKEN_KEY, token);
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
}

export function getStoredUser() {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

export async function apiFetch(path, options = {}) {
    const token = getToken();
    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {}),
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

    let data = {};
    try {
        data = await response.json();
    } catch {
        data = {};
    }

    if (!response.ok) {
        const err = new Error(data.detail || data.message || "Request failed");
        err.status = response.status;
        err.data = data;
        throw err;
    }
    return data;
}

export async function login(email, password) {
    return apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
    });
}

export async function register(fullName, email, password) {
    return apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({ full_name: fullName, email, password }),
    });
}

export async function fetchProfile() {
    return apiFetch("/user/profile");
}

export async function updateProfile(payload) {
    return apiFetch("/user/profile", {
        method: "PUT",
        body: JSON.stringify(payload),
    });
}

export async function updateCareer(payload) {
    return apiFetch("/user/career", {
        method: "PUT",
        body: JSON.stringify(payload),
    });
}

export async function updatePassword(payload) {
    return apiFetch("/user/password", {
        method: "PUT",
        body: JSON.stringify(payload),
    });
}

export async function submitOnboarding(payload) {
    return apiFetch("/onboarding", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export async function fetchOnboarding() {
    return apiFetch("/onboarding");
}

export async function fetchResumes() {
    return apiFetch("/resume");
}

export async function deleteResume(id) {
    return apiFetch(`/resume/${id}`, { method: "DELETE" });
}

export function resumeDownloadUrl(id) {
    return `${API_BASE_URL}/resume/${id}/download`;
}

export async function requestPasswordResetCode(email) {
    return apiFetch("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
    });
}

export async function verifyPasswordResetCode(email, code) {
    return apiFetch("/auth/verify-code", {
        method: "POST",
        body: JSON.stringify({ email, code }),
    });
}

export async function resetPassword(email, code, password, confirmPassword) {
    return apiFetch("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ email, code, password, confirm_password: confirmPassword }),
    });
}

export async function sendChatMessage(message, history = []) {
    return apiFetch("/chat", {
        method: "POST",
        body: JSON.stringify({ message, history }),
    });
}

export async function uploadResume(file) {
    const token = getToken();
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE_URL}/resume/upload`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
    });

    let data = {};
    try {
        data = await response.json();
    } catch {
        data = {};
    }

    if (!response.ok) {
        const err = new Error(data.detail || data.message || "Upload failed");
        err.status = response.status;
        err.data = data;
        throw err;
    }
    return data;
}
