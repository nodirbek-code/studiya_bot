import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingsApi, reviewsApi } from '@/api/endpoints';
import { useTelegram } from '@/hooks/useTelegram';
import { Card, Skeleton, Stars, Badge, EmptyState, Spinner, } from '@/components/ui';
import { formatPrice, STATUS_LABELS, formatDate } from '@/utils';
export default function ProfilePage() {
    const { user, haptic, tg } = useTelegram();
    const qc = useQueryClient();
    const { data: bookings = [], isLoading } = useQuery({
        queryKey: ['my-bookings'],
        queryFn: bookingsApi.getMyBookings,
    });
    const completedWithoutReview = bookings.filter(b => b.status === 'completed');
    // Loyalty: tasdiqlangan bronlar
    const confirmedCount = bookings.filter(b => b.status === 'confirmed' || b.status === 'completed').length;
    const loyaltyTarget = 5;
    const loyaltyPct = Math.min((confirmedCount % loyaltyTarget) / loyaltyTarget * 100, 100);
    return (_jsxs("div", { className: "pb-24 page-enter", children: [_jsxs("div", { className: "px-4 pt-5 pb-2 text-center", children: [_jsx("div", { className: "w-16 h-16 rounded-full bg-bg-secondary border border-accent/20\n                        flex items-center justify-center text-3xl mx-auto mb-3", children: user?.first_name?.[0]?.toUpperCase() ?? '👤' }), _jsx("h2", { className: "text-[17px] font-semibold", children: user ? `${user.first_name} ${user.last_name ?? ''}`.trim() : 'Mehmon' }), user?.username && (_jsxs("p", { className: "text-[13px] text-text-secondary mt-0.5", children: ["@", user.username] }))] }), _jsx("div", { className: "px-4 mb-4", children: _jsxs(Card, { className: "p-4", style: {
                        background: 'linear-gradient(135deg,#1a1200,#2a1e08)',
                        borderColor: '#3d3020',
                    }, children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-lg", children: "\uD83C\uDF81" }), _jsx("span", { className: "text-[13px] font-semibold text-accent", children: "Sadoqat bonusi" })] }), _jsxs("span", { className: "text-[12px] text-text-secondary", children: [confirmedCount % loyaltyTarget, " / ", loyaltyTarget] })] }), _jsx("div", { className: "h-2 bg-bg-tertiary rounded-full overflow-hidden", children: _jsx("div", { className: "h-full bg-accent rounded-full transition-all duration-700", style: { width: `${loyaltyPct}%` } }) }), _jsxs("p", { className: "text-[11px] text-text-muted mt-2", children: [loyaltyTarget - (confirmedCount % loyaltyTarget), " ta brondan keyin \u2014 bepul 1 soat foto sessiya!"] })] }) }), _jsx("div", { className: "px-4 grid grid-cols-3 gap-2 mb-4", children: [
                    { val: bookings.length, label: 'Jami bron' },
                    { val: bookings.filter(b => b.status === 'confirmed' || b.status === 'completed').length, label: 'Bajarildi' },
                    { val: formatPrice(bookings.reduce((s, b) => b.status === 'confirmed' || b.status === 'completed' ? s + b.deposit_amount : s, 0)).replace(' so\'m', ''),
                        label: "To'landi" },
                ].map(({ val, label }) => (_jsxs(Card, { className: "p-3 text-center", children: [_jsx("div", { className: "text-[16px] font-bold text-accent", children: val }), _jsx("div", { className: "text-[10px] text-text-muted mt-0.5", children: label })] }, label))) }), completedWithoutReview.slice(0, 1).map(b => (_jsx(ReviewPrompt, { booking: b, onSuccess: () => qc.invalidateQueries({ queryKey: ['my-bookings'] }) }, b.id))), _jsxs("div", { className: "px-4", children: [_jsx("h3", { className: "text-[14px] font-semibold mb-3", children: "Bronlar tarixi" }), isLoading
                        ? Array(3).fill(0).map((_, i) => _jsx(Skeleton, { className: "h-20 rounded-card mb-2" }, i))
                        : bookings.length === 0
                            ? _jsx(EmptyState, { icon: "\uD83D\uDCC5", title: "Bronlar yo'q", subtitle: "Birinchi broningizni qiling!" })
                            : bookings.map(b => _jsx(BookingCard, { booking: b }, b.id))] })] }));
}
// ── Booking card ──────────────────────────────────────────────
function BookingCard({ booking: b }) {
    return (_jsx(Card, { className: "p-3 mb-2", children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("div", { className: "text-[13px] font-semibold truncate", children: formatDate(b.start_time) }), _jsxs("div", { className: "text-[12px] text-text-secondary mt-0.5", children: [b.duration_hours, "h \u00B7 ", formatPrice(b.total_price)] })] }), _jsx(Badge, { variant: b.status === 'confirmed' ? 'success'
                        : b.status === 'cancelled' ? 'error'
                            : b.status === 'pending_payment' ? 'warning'
                                : 'default', className: "ml-2 flex-shrink-0", children: STATUS_LABELS[b.status] ?? b.status })] }) }));
}
// ── Review prompt ─────────────────────────────────────────────
function ReviewPrompt({ booking, onSuccess, }) {
    const [rating, setRating] = useState(0);
    const [text, setText] = useState('');
    const { haptic, tg } = useTelegram();
    const mutation = useMutation({
        mutationFn: () => reviewsApi.create({
            booking_id: booking.id,
            rating,
            text: text.trim() || undefined,
        }),
        onSuccess: () => {
            haptic('success');
            tg?.showAlert('Sharhingiz qabul qilindi! Admin tasdiqlashidan so\'ng ko\'rinadi.');
            onSuccess();
        },
        onError: (e) => tg?.showAlert(e.message),
    });
    return (_jsx("div", { className: "px-4 mb-4", children: _jsxs(Card, { className: "p-4", children: [_jsx("div", { className: "text-[13px] font-semibold mb-1", children: "Sessiyani baholang \u2B50" }), _jsx("div", { className: "text-[11px] text-text-secondary mb-3", children: formatDate(booking.start_time) }), _jsx(Stars, { rating: rating, interactive: true, onChange: r => { haptic('light'); setRating(r); } }), rating > 0 && (_jsxs(_Fragment, { children: [_jsx("textarea", { value: text, onChange: e => setText(e.target.value), placeholder: "Fikr-mulohazangizni yozing... (ixtiyoriy)", rows: 3, className: "w-full mt-3 bg-bg-tertiary border border-white/5 rounded-lg\n                         p-3 text-[13px] text-text-primary placeholder:text-text-muted\n                         resize-none outline-none focus:border-accent/50 transition-colors" }), _jsx("button", { onClick: () => rating > 0 && mutation.mutate(), disabled: mutation.isPending, className: "w-full h-10 bg-accent text-bg-primary font-semibold rounded-btn\n                         mt-2 text-[13px] disabled:opacity-50 flex items-center\n                         justify-center gap-2 active:opacity-85", children: mutation.isPending ? _jsx(Spinner, { size: "sm" }) : 'Sharh yuborish' })] }))] }) }));
}
