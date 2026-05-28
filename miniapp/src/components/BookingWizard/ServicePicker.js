import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useQuery } from '@tanstack/react-query';
import { catalogApi } from '@/api/endpoints';
import { useBookingStore } from '@/store/bookingStore';
import { Skeleton, Badge } from '@/components/ui';
import { clsx, formatPrice } from '@/utils';
import { useTelegram } from '@/hooks/useTelegram';
export function ServicePicker() {
    const { draft, setService, setPackage, setServiceType, setDuration, setStep } = useBookingStore();
    const { haptic } = useTelegram();
    const { data: services = [], isLoading: svcLoading } = useQuery({
        queryKey: ['services'],
        queryFn: () => catalogApi.getServices(),
    });
    const { data: packages = [], isLoading: pkgLoading } = useQuery({
        queryKey: ['packages'],
        queryFn: catalogApi.getPackages,
    });
    const handleNext = () => {
        if (!draft.service && !draft.pkg)
            return;
        haptic('medium');
        setStep(4);
    };
    const totalPrice = draft.pkg
        ? draft.pkg.final_price
        : (draft.service?.price_per_hour ?? 0) * draft.durationH;
    const deposit = totalPrice * 0.3;
    return (_jsxs("div", { className: "px-4", children: [_jsx("div", { className: "flex gap-2 bg-bg-secondary rounded-lg p-1 mb-4", children: ['service', 'package'].map(type => (_jsx("button", { onClick: () => { haptic('light'); setServiceType(type); }, className: clsx('flex-1 h-9 rounded-md text-[13px] font-medium transition-all', draft.serviceType === type
                        ? 'bg-accent text-bg-primary'
                        : 'text-text-secondary'), children: type === 'service' ? '⏰ Soatlik' : '📦 Paket' }, type))) }), draft.serviceType === 'service' && (_jsxs(_Fragment, { children: [_jsx("div", { className: "flex flex-col gap-2 mb-4", children: svcLoading
                            ? Array(3).fill(0).map((_, i) => _jsx(Skeleton, { className: "h-16 rounded-card" }, i))
                            : services.map(svc => (_jsxs("button", { onClick: () => { haptic('light'); setService(svc); }, className: clsx('w-full flex items-center gap-3 p-3 rounded-card border text-left transition-all', draft.service?.id === svc.id
                                    ? 'bg-accent-muted border-accent/50'
                                    : 'bg-bg-secondary border-white/5'), children: [_jsx("div", { className: "w-10 h-10 rounded-lg bg-bg-tertiary flex items-center\n                                    justify-center text-xl flex-shrink-0", children: svc.photo_url
                                            ? _jsx("img", { src: svc.photo_url, alt: svc.name, className: "w-full h-full rounded-lg object-cover" })
                                            : '📸' }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("div", { className: "text-[13px] font-semibold", children: svc.name }), _jsxs("div", { className: "text-[12px] text-accent mt-0.5", children: [formatPrice(svc.price_per_hour), "/soat"] })] }), draft.service?.id === svc.id && (_jsx("div", { className: "w-5 h-5 rounded-full bg-accent flex items-center\n                                      justify-center text-bg-primary text-xs", children: "\u2713" }))] }, svc.id))) }), draft.service && (_jsxs("div", { className: "bg-bg-secondary rounded-card p-3 mb-4", children: [_jsx("p", { className: "text-[12px] text-text-secondary mb-2", children: "Necha soat?" }), _jsx("div", { className: "flex gap-2", children: [1, 2, 3, 4].map(h => (_jsxs("button", { onClick: () => { haptic('light'); setDuration(h); }, className: clsx('flex-1 h-10 rounded-lg text-[13px] font-medium border transition-all', draft.durationH === h
                                        ? 'bg-accent-muted border-accent text-accent'
                                        : 'bg-bg-tertiary border-white/5 text-text-secondary'), children: [h, " soat"] }, h))) })] }))] })), draft.serviceType === 'package' && (_jsx("div", { className: "flex flex-col gap-2 mb-4", children: pkgLoading
                    ? Array(2).fill(0).map((_, i) => _jsx(Skeleton, { className: "h-24 rounded-card" }, i))
                    : packages.map(pkg => (_jsxs("button", { onClick: () => { haptic('light'); setPackage(pkg); }, className: clsx('w-full p-3 rounded-card border text-left transition-all', draft.pkg?.id === pkg.id
                            ? 'bg-accent-muted border-accent/50'
                            : 'bg-bg-secondary border-white/5'), children: [_jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "text-[14px] font-semibold", children: pkg.name }), pkg.description && (_jsx("div", { className: "text-[12px] text-text-secondary mt-1 line-clamp-2", children: pkg.description }))] }), pkg.discount_percent > 0 && (_jsxs(Badge, { variant: "accent", className: "ml-2 flex-shrink-0", children: ["-", pkg.discount_percent, "%"] }))] }), _jsxs("div", { className: "flex items-center gap-2 mt-2", children: [_jsx("span", { className: "text-[15px] font-bold text-accent", children: formatPrice(pkg.final_price) }), pkg.discount_percent > 0 && (_jsx("span", { className: "text-[12px] text-text-muted line-through", children: formatPrice(pkg.original_price) }))] })] }, pkg.id))) })), (draft.service || draft.pkg) && (_jsxs("div", { className: "bg-bg-secondary rounded-card p-3 mb-4", children: [_jsxs("div", { className: "flex justify-between text-[13px] text-text-secondary mb-1", children: [_jsx("span", { children: "Jami narx" }), _jsx("span", { className: "text-text-primary font-medium", children: formatPrice(totalPrice) })] }), _jsxs("div", { className: "flex justify-between text-[13px]", children: [_jsx("span", { className: "text-text-secondary", children: "Oldindan to'lov (30%)" }), _jsx("span", { className: "text-accent font-semibold", children: formatPrice(deposit) })] })] })), _jsx("button", { onClick: handleNext, disabled: !draft.service && !draft.pkg, className: "w-full h-12 bg-accent text-bg-primary font-semibold rounded-btn\n                   disabled:opacity-40 active:opacity-85 transition-opacity", children: "Davom etish \u2192" })] }));
}
