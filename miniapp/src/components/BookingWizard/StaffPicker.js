import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useQuery } from '@tanstack/react-query';
import { catalogApi } from '@/api/endpoints';
import { useBookingStore } from '@/store/bookingStore';
import { Skeleton } from '@/components/ui';
import { clsx } from '@/utils';
import { useTelegram } from '@/hooks/useTelegram';
export function StaffPicker() {
    const { data: staff = [], isLoading } = useQuery({
        queryKey: ['staff'],
        queryFn: catalogApi.getStaff,
    });
    const { draft, setStaff, setStep } = useBookingStore();
    const { haptic } = useTelegram();
    const handleSelect = (member) => {
        haptic('light');
        setStaff(member);
    };
    const handleNext = () => {
        if (!draft.staff)
            return;
        haptic('medium');
        setStep(2);
    };
    return (_jsxs("div", { className: "px-4", children: [_jsx("p", { className: "text-[13px] text-text-secondary mb-4", children: "Xodim tanlang yoki \"Istalgan\" bosing" }), _jsxs("button", { onClick: () => { setStaff(null); setStep(2); }, className: clsx('w-full flex items-center gap-3 p-3 rounded-card border mb-3 transition-all', !draft.staff
                    ? 'bg-accent-muted border-accent/50'
                    : 'bg-bg-secondary border-white/5'), children: [_jsx("div", { className: "w-12 h-12 rounded-full bg-bg-tertiary flex items-center\n                        justify-center text-xl", children: "\uD83D\uDC65" }), _jsxs("div", { className: "text-left", children: [_jsx("div", { className: "text-[14px] font-medium", children: "Istalgan xodim" }), _jsx("div", { className: "text-[12px] text-text-secondary", children: "Bo'sh xodim tanlanadi" })] }), !draft.staff && (_jsx("div", { className: "ml-auto w-5 h-5 rounded-full bg-accent flex items-center\n                          justify-center text-bg-primary text-xs", children: "\u2713" }))] }), isLoading
                ? Array(3).fill(0).map((_, i) => (_jsxs("div", { className: "flex items-center gap-3 p-3 mb-2", children: [_jsx(Skeleton, { className: "w-12 h-12 rounded-full" }), _jsxs("div", { className: "flex-1", children: [_jsx(Skeleton, { className: "h-4 w-24 mb-1" }), _jsx(Skeleton, { className: "h-3 w-16" })] })] }, i)))
                : staff.map(member => (_jsxs("button", { onClick: () => handleSelect(member), className: clsx('w-full flex items-center gap-3 p-3 rounded-card border mb-2 transition-all', draft.staff?.id === member.id
                        ? 'bg-accent-muted border-accent/50'
                        : 'bg-bg-secondary border-white/5'), children: [_jsx("div", { className: "w-12 h-12 rounded-full bg-bg-tertiary overflow-hidden flex-shrink-0", children: member.photo_url
                                ? _jsx("img", { src: member.photo_url, alt: member.name, className: "w-full h-full object-cover" })
                                : _jsx("div", { className: "w-full h-full flex items-center justify-center text-xl", children: "\uD83D\uDC64" }) }), _jsxs("div", { className: "text-left flex-1", children: [_jsx("div", { className: "text-[14px] font-semibold", children: member.name }), _jsx("div", { className: "text-[12px] text-text-secondary", children: member.role }), member.avg_rating && (_jsx("div", { className: "flex items-center gap-1 mt-0.5", children: _jsxs("span", { className: "text-accent text-[11px]", children: ["\u2605 ", member.avg_rating] }) }))] }), draft.staff?.id === member.id && (_jsx("div", { className: "w-5 h-5 rounded-full bg-accent flex items-center\n                                justify-center text-bg-primary text-xs", children: "\u2713" }))] }, member.id))), _jsx("button", { onClick: handleNext, className: "w-full h-12 bg-accent text-bg-primary font-semibold rounded-btn mt-4\n                   active:opacity-85 transition-opacity", children: "Davom etish \u2192" })] }));
}
