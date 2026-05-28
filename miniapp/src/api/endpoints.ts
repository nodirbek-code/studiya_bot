import api from './client'
import type {
  StudioInfo, Service, Package, StaffMember,
  PortfolioItem, TimeSlot, Booking, Review, PublicStats,
} from '@/types'

// ── Studio ─────────────────────────────────────────────────────
export const studioApi = {
  getInfo: () =>
    api.get<StudioInfo>('/catalog/info').then(r => r.data),

  getStats: () =>
    api.get<PublicStats>('/catalog/stats').then(r => r.data),
}

// ── Catalog ────────────────────────────────────────────────────
export const catalogApi = {
  getServices: (category?: string) =>
    api.get<Service[]>('/catalog/services', { params: { category } }).then(r => r.data),

  getCategories: () =>
    api.get<{ categories: string[] }>('/catalog/services/categories').then(r => r.data.categories),

  getPackages: () =>
    api.get<Package[]>('/catalog/packages').then(r => r.data),

  getPortfolio: (params?: { category?: string; staff_id?: number; limit?: number; offset?: number }) =>
    api.get<PortfolioItem[]>('/catalog/portfolio', { params }).then(r => r.data),

  getStaff: () =>
    api.get<StaffMember[]>('/catalog/staff').then(r => r.data),

  getReviews: (limit = 10) =>
    api.get<Review[]>('/catalog/reviews', { params: { limit } }).then(r => r.data),
}

// ── Bookings ───────────────────────────────────────────────────
export const bookingsApi = {
  getSlots: (date: string, staff_id?: number) =>
    api.get<{ date: string; slots: TimeSlot[] }>('/bookings/slots', {
      params: { date, staff_id },
    }).then(r => r.data.slots),

  create: (data: {
    staff_id?: number
    service_id?: number
    package_id?: number
    start_time: string
    duration_hours: number
  }) => api.post<Booking>('/bookings', data).then(r => r.data),

  getMyBookings: () =>
    api.get<Booking[]>('/bookings/my').then(r => r.data),

  getOne: (id: string) =>
    api.get<Booking>(`/bookings/${id}`).then(r => r.data),

  cancel: (id: string) =>
    api.delete(`/bookings/${id}`).then(r => r.data),
}

// ── Payments ───────────────────────────────────────────────────
export const paymentsApi = {
  init: (bookingId: string, provider: 'payme' | 'click') =>
    api.post<{
      payment_id: string
      payment_url: string
      amount: number
      expires_in_minutes: number
    }>(`/payments/init/${bookingId}`, null, { params: { provider } }).then(r => r.data),
}

// ── Reviews ────────────────────────────────────────────────────
export const reviewsApi = {
  create: (data: { booking_id: string; rating: number; text?: string }) =>
    api.post('/reviews', data).then(r => r.data),

  getMy: () =>
    api.get('/reviews/my').then(r => r.data),
}
