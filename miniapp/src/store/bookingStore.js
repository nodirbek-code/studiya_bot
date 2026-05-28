import { create } from 'zustand';
const initialDraft = {
    staff: null,
    date: null,
    timeSlot: null,
    serviceType: 'service',
    service: null,
    pkg: null,
    durationH: 1,
};
export const useBookingStore = create((set) => ({
    draft: initialDraft,
    step: 1,
    setStaff: (staff) => set(s => ({ draft: { ...s.draft, staff } })),
    setDate: (date) => set(s => ({ draft: { ...s.draft, date, timeSlot: null } })),
    setSlot: (timeSlot) => set(s => ({ draft: { ...s.draft, timeSlot } })),
    setService: (service) => set(s => ({ draft: { ...s.draft, service } })),
    setPackage: (pkg) => set(s => ({ draft: { ...s.draft, pkg } })),
    setServiceType: (serviceType) => set(s => ({
        draft: { ...s.draft, serviceType, service: null, pkg: null }
    })),
    setDuration: (durationH) => set(s => ({ draft: { ...s.draft, durationH } })),
    setStep: (step) => set({ step }),
    reset: () => set({ draft: initialDraft, step: 1 }),
}));
