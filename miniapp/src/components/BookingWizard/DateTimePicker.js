import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isBefore, isToday, isSameDay, } from 'date-fns';
import { uz } from 'date-fns/locale';
import { bookingsApi } from '@/api/endpoints';
import { useBookingStore } from '@/store/bookingStore';
import { Skeleton } from '@/components/ui';
import { clsx, formatTime } from '@/utils';
import { useTelegram } from '@/hooks/useTelegram';
export function DateTimePicker() {
    const { draft, setDate, setSlot, setStep } = useBookingStore();
    const { haptic } = useTelegram();
    const [viewMonth, setViewMonth] = useState(new Date());
    // Tanlangan sana uchun slotlar
    const { data: slots = [], isLoading: slotsLoading } = useQuery({
        queryKey: ['slots', draft.date?.toISOString(), draft.staff?.id],
        queryFn: () => bookingsApi.getSlots(format(draft.date, 'yyyy-MM-dd'), draft.staff?.id),
        enabled: !!draft.date,
    });
    const handleDayClick = (day) => {
        haptic('light');
        setDate(day);
        setSlot(null);
    };
    const handleSlotClick = (slot) => {
        if (!slot.available)
            return;
        haptic('light');
        setSlot(slot);
    };
    const handleNext = () => {
        if (!draft.date || !draft.timeSlot)
            return;
        haptic('medium');
        setStep(3);
    };
    // Kalendar kunlari
    const monthStart = startOfMonth(viewMonth);
    const monthEnd = endOfMonth(viewMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startPad = (getDay(monthStart) + 6) % 7; // Dushanba = 0
    const DAY_LABELS = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'];
    return (_jsxs("div", { className: "px-4", children: [_jsxs("div", { className: "bg-bg-secondary rounded-card p-3 mb-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsx("button", { onClick: () => setViewMonth(m => subMonths(m, 1)), className: "w-8 h-8 rounded-full bg-bg-tertiary flex items-center justify-center\n                       text-text-secondary active:bg-bg-hover", children: "\u2039" }), _jsx("span", { className: "text-[14px] font-semibold capitalize", children: format(viewMonth, 'LLLL yyyy', { locale: uz }) }), _jsx("button", { onClick: () => setViewMonth(m => addMonths(m, 1)), className: "w-8 h-8 rounded-full bg-bg-tertiary flex items-center justify-center\n                       text-text-secondary active:bg-bg-hover", children: "\u203A" })] }), _jsx("div", { className: "grid grid-cols-7 mb-1", children: DAY_LABELS.map(d => (_jsx("div", { className: "text-center text-[10px] text-text-muted py-1", children: d }, d))) }), _jsxs("div", { className: "grid grid-cols-7 gap-0.5", children: [Array(startPad).fill(0).map((_, i) => _jsx("div", {}, `p${i}`)), days.map(day => {
                                const past = isBefore(day, new Date()) && !isToday(day);
                                const selected = draft.date && isSameDay(day, draft.date);
                                const today = isToday(day);
                                return (_jsx("button", { onClick: () => !past && handleDayClick(day), disabled: past, className: clsx('h-9 rounded-lg text-[13px] transition-all flex items-center justify-center', past && 'opacity-20 cursor-not-allowed', selected && 'bg-accent text-bg-primary font-bold', today && !selected && 'text-accent font-semibold', !past && !selected && 'active:bg-bg-hover'), children: format(day, 'd') }, day.toISOString()));
                            })] })] }), draft.date && (_jsxs("div", { className: "mb-4", children: [_jsxs("p", { className: "text-[13px] text-text-secondary mb-2", children: [format(draft.date, 'd MMMM', { locale: uz }), " uchun soatlar:"] }), slotsLoading ? (_jsx("div", { className: "grid grid-cols-4 gap-2", children: Array(8).fill(0).map((_, i) => _jsx(Skeleton, { className: "h-10 rounded-lg" }, i)) })) : slots.length === 0 ? (_jsx("div", { className: "text-center py-6 text-text-muted text-[13px]", children: "\uD83D\uDE34 Bu kun dam olish kuni" })) : (_jsx("div", { className: "grid grid-cols-4 gap-2", children: slots.map(slot => {
                            const selected = draft.timeSlot?.time === slot.time;
                            return (_jsx("button", { onClick: () => handleSlotClick(slot), disabled: !slot.available, className: clsx('h-10 rounded-lg text-[12px] font-medium transition-all border', slot.available
                                    ? selected
                                        ? 'bg-accent-muted border-accent text-accent font-semibold'
                                        : 'bg-bg-secondary border-white/5 text-text-secondary active:bg-bg-tertiary'
                                    : 'bg-bg-tertiary border-white/5 text-text-muted line-through cursor-not-allowed'), children: formatTime(slot.time) }, slot.time));
                        }) }))] })), _jsx("button", { onClick: handleNext, disabled: !draft.date || !draft.timeSlot, className: "w-full h-12 bg-accent text-bg-primary font-semibold rounded-btn\n                   disabled:opacity-40 active:opacity-85 transition-opacity", children: "Davom etish \u2192" })] }));
}
