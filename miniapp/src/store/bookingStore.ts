import { create } from 'zustand'
import type { BookingDraft, StaffMember, TimeSlot, Service, Package } from '@/types'

interface BookingStore {
  draft:     BookingDraft
  step:      1 | 2 | 3 | 4
  setStaff:  (staff: StaffMember | null) => void
  setDate:   (date: Date | null) => void
  setSlot:   (slot: TimeSlot | null) => void
  setService:(service: Service | null) => void
  setPackage:(pkg: Package | null) => void
  setServiceType: (t: 'service' | 'package') => void
  setDuration:(h: number) => void
  setStep:   (s: 1 | 2 | 3 | 4) => void
  reset:     () => void
}

const initialDraft: BookingDraft = {
  staff:       null,
  date:        null,
  timeSlot:    null,
  serviceType: 'service',
  service:     null,
  pkg:         null,
  durationH:   1,
}

export const useBookingStore = create<BookingStore>((set) => ({
  draft: initialDraft,
  step:  1,

  setStaff:       (staff)   => set(s => ({ draft: { ...s.draft, staff } })),
  setDate:        (date)    => set(s => ({ draft: { ...s.draft, date, timeSlot: null } })),
  setSlot:        (timeSlot)=> set(s => ({ draft: { ...s.draft, timeSlot } })),
  setService:     (service) => set(s => ({ draft: { ...s.draft, service } })),
  setPackage:     (pkg)     => set(s => ({ draft: { ...s.draft, pkg } })),
  setServiceType: (serviceType) => set(s => ({
    draft: { ...s.draft, serviceType, service: null, pkg: null }
  })),
  setDuration:    (durationH) => set(s => ({ draft: { ...s.draft, durationH } })),
  setStep:        (step)    => set({ step }),
  reset:          ()        => set({ draft: initialDraft, step: 1 }),
}))
