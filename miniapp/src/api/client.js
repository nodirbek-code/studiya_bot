import axios from 'axios';
const tg = window.Telegram?.WebApp;
// ── Axios instance ─────────────────────────────────────────────
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
});
// ── Request interceptor — har so'rovga initData qo'shish ───────
api.interceptors.request.use((config) => {
    const initData = tg?.initData;
    if (initData) {
        config.headers['X-Init-Data'] = initData;
    }
    return config;
});
// ── Response interceptor — xatolarni qayta ishlash ────────────
api.interceptors.response.use((res) => res, (err) => {
    const msg = err.response?.data?.detail || 'Xatolik yuz berdi';
    if (err.response?.status === 401) {
        tg?.showAlert('Avtorizatsiya xatosi. Iltimos, qayta kiring.');
    }
    else if (err.response?.status === 429) {
        tg?.showAlert('Ko\'p so\'rov yuborildi. Biroz kuting.');
    }
    else if (err.response?.status === 409) {
        tg?.showAlert('Bu vaqt allaqachon band. Boshqa vaqt tanlang.');
    }
    return Promise.reject(new Error(msg));
});
export default api;
