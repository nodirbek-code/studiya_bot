import api from './client';
// ── Studio ─────────────────────────────────────────────────────
export const studioApi = {
    getInfo: () => api.get('/catalog/info').then(r => r.data),
    getStats: () => api.get('/catalog/stats').then(r => r.data),
};
// ── Catalog ────────────────────────────────────────────────────
export const catalogApi = {
    getServices: (category) => api.get('/catalog/services', { params: { category } }).then(r => r.data),
    getCategories: () => api.get('/catalog/services/categories').then(r => r.data.categories),
    getPackages: () => api.get('/catalog/packages').then(r => r.data),
    getPortfolio: (params) => api.get('/catalog/portfolio', { params }).then(r => r.data),
    getStaff: () => api.get('/catalog/staff').then(r => r.data),
    getReviews: (limit = 10) => api.get('/catalog/reviews', { params: { limit } }).then(r => r.data),
};
// ── Bookings ───────────────────────────────────────────────────
export const bookingsApi = {
    getSlots: (date, staff_id) => api.get('/bookings/slots', {
        params: { date, staff_id },
    }).then(r => r.data.slots),
    create: (data) => api.post('/bookings', data).then(r => r.data),
    getMyBookings: () => api.get('/bookings/my').then(r => r.data),
    getOne: (id) => api.get(`/bookings/${id}`).then(r => r.data),
    cancel: (id) => api.delete(`/bookings/${id}`).then(r => r.data),
};
// ── Payments ───────────────────────────────────────────────────
export const paymentsApi = {
    init: (bookingId, provider) => api.post(`/payments/init/${bookingId}`, null, { params: { provider } }).then(r => r.data),
};
// ── Reviews ────────────────────────────────────────────────────
export const reviewsApi = {
    create: (data) => api.post('/reviews', data).then(r => r.data),
    getMy: () => api.get('/reviews/my').then(r => r.data),
};
