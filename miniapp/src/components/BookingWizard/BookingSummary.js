import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import { bookingsApi, paymentsApi } from '@/api/endpoints';
import { useBookingStore } from '@/store/bookingStore';
import { Spinner, Divider } from '@/components/ui';
import { formatPrice, formatDateShort } from '@/utils';
import { useTelegram } from '@/hooks/useTelegram';
export function BookingSummary() {
    const { draft, reset } = useBookingStore();
    const { haptic, openLink, tg } = useTelegram();
    const [bookingId, setBookingId] = useState(null);
    const [paymentUrl, setPaymentUrl] = useState(null);
    const [provider, setProvider] = useState('payme');
    const [countdown, setCountdown] = useState(600); // 10 daqiqa
    const [timerActive, setTimerActive] = useState(false);
    const [done, setDone] = useState(false);
    // ── Countdown timer ─────────────────────────────────────────
    useEffect(() => {
        if (!timerActive || countdown <= 0)
            return;
        const t = setInterval(() => {
            setCountdown(c => {
                if (c <= 1) {
                    clearInterval(t);
                    setTimerActive(false);
                    tg?.showAlert('To\'lov vaqti tugadi. Bron bekor qilindi.');
                    reset();
                    return 0;
                }
                return c - 1;
            });
        }, 1000);
        return () => clearInterval(t);
    }, [timerActive, countdown, tg, reset]);
    const timerColor = countdown < 120
        ? 'text-status-error'
        : countdown < 300
            ? 'text-status-warning'
            : 'text-accent';
    const timerStr = `${String(Math.floor(countdown / 60)).padStart(2, '0')}:${String(countdown % 60).padStart(2, '0')}`;
    // ── Create booking mutation ─────────────────────────────────
    const createMutation = useMutation({
        mutationFn: () => bookingsApi.create({
            staff_id: draft.staff?.id,
            service_id: draft.service?.id,
            package_id: draft.pkg?.id,
            start_time: draft.timeSlot.time,
            duration_hours: draft.durationH,
        }),
        onSuccess: async (booking) => {
            haptic('success');
            setBookingId(booking.id);
            // To'lov URL olish
            const payment = await paymentsApi.init(booking.id, provider);
            setPaymentUrl(payment.payment_url);
            setTimerActive(true);
        },
        onError: (err) => {
            haptic('error');
            tg?.showAlert(err.message);
        },
    });
    const totalPrice = draft.pkg
        ? draft.pkg.final_price
        : (draft.service?.price_per_hour ?? 0) * draft.durationH;
    const deposit = totalPrice * 0.3;
    // ── If booking done waiting payment ─────────────────────────
    if (bookingId && paymentUrl) {
        return (_jsxs("div", { className: "px-4 flex flex-col gap-4", children: [_jsxs("div", { className: "bg-bg-secondary rounded-card p-4 text-center", children: [_jsx("div", { className: "text-[12px] text-text-secondary mb-1", children: "To'lov uchun vaqt" }), _jsx("div", { className: `text-[40px] font-bold font-mono ${timerColor}`, children: timerStr }), _jsx("div", { className: "text-[11px] text-text-muted mt-1", children: "Vaqt tugasa bron avtomatik bekor qilinadi" })] }), _jsxs("div", { className: "flex flex-col gap-2", children: [_jsxs("button", { onClick: () => openLink(paymentUrl), className: "w-full h-12 bg-accent text-bg-primary font-semibold rounded-btn\n                       flex items-center justify-center gap-2 active:opacity-85", children: ["\uD83D\uDCB3 ", provider === 'payme' ? 'Payme' : 'Click', " orqali to'lash"] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: () => setProvider('payme'), className: `flex-1 h-10 rounded-btn text-[13px] border transition-all
                ${provider === 'payme'
                                        ? 'bg-accent-muted border-accent text-accent'
                                        : 'bg-bg-secondary border-white/5 text-text-secondary'}`, children: "Payme" }), _jsx("button", { onClick: () => setProvider('click'), className: `flex-1 h-10 rounded-btn text-[13px] border transition-all
                ${provider === 'click'
                                        ? 'bg-accent-muted border-accent text-accent'
                                        : 'bg-bg-secondary border-white/5 text-text-secondary'}`, children: "Click" })] })] }), _jsx("p", { className: "text-[11px] text-text-muted text-center", children: "To'lovdan keyin bot orqali tasdiqlash xabari keladi" })] }));
    }
    return (_jsxs("div", { className: "px-4", children: [_jsx("p", { className: "text-[13px] text-text-secondary mb-4", children: "Ma'lumotlarni tekshiring va bronni tasdiqlang" }), _jsxs("div", { className: "bg-bg-secondary rounded-card p-4 mb-4 flex flex-col gap-3", children: [_jsx(Row, { label: "Xodim", value: draft.staff?.name ?? 'Istalgan' }), _jsx(Divider, {}), _jsx(Row, { label: "Sana", value: draft.date ? formatDateShort(draft.date) : '—' }), _jsx(Row, { label: "Vaqt", value: draft.timeSlot ? format(new Date(draft.timeSlot.time), 'HH:mm') : '—' }), _jsx(Divider, {}), _jsx(Row, { label: "Xizmat", value: draft.pkg?.name ?? draft.service?.name ?? '—' }), draft.service && (_jsx(Row, { label: "Davomiylik", value: `${draft.durationH} soat` })), _jsx(Divider, {}), _jsx(Row, { label: "Jami narx", value: formatPrice(totalPrice), valueClass: "text-text-primary font-semibold" }), _jsx(Row, { label: "Oldindan to'lov (30%)", value: formatPrice(deposit), valueClass: "text-accent font-bold text-[15px]" })] }), _jsxs("div", { className: "mb-4", children: [_jsx("p", { className: "text-[12px] text-text-secondary mb-2", children: "To'lov tizimi" }), _jsx("div", { className: "flex gap-2", children: ['payme', 'click'].map(p => (_jsx("button", { onClick: () => setProvider(p), className: `flex-1 h-10 rounded-btn text-[13px] font-medium border transition-all
                ${provider === p
                                ? 'bg-accent-muted border-accent text-accent'
                                : 'bg-bg-secondary border-white/5 text-text-secondary'}`, children: p === 'payme' ? '💳 Payme' : '💳 Click' }, p))) })] }), _jsx("button", { onClick: () => createMutation.mutate(), disabled: createMutation.isPending, className: "w-full h-12 bg-accent text-bg-primary font-bold rounded-btn\n                   disabled:opacity-50 active:opacity-85 transition-opacity\n                   flex items-center justify-center gap-2", children: createMutation.isPending
                    ? _jsxs(_Fragment, { children: [_jsx(Spinner, { size: "sm" }), " Bron qilinmoqda..."] })
                    : '✅ Bron qilish' }), _jsx("p", { className: "text-[11px] text-text-muted text-center mt-3", children: "Bron qilgandan so'ng 10 daqiqa ichida to'lov qilishingiz kerak" })] }));
}
function Row({ label, value, valueClass, }) {
    return (_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-[13px] text-text-secondary", children: label }), _jsx("span", { className: `text-[13px] text-text-primary ${valueClass ?? ''}`, children: value })] }));
}
