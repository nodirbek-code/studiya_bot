import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { studioApi, catalogApi } from '@/api/endpoints';
import { Card, SectionHeader, Skeleton, Stars, Badge } from '@/components/ui';
import { formatPrice } from '@/utils';
export default function HomePage() {
    const navigate = useNavigate();
    const { data: info } = useQuery({
        queryKey: ['studio-info'],
        queryFn: studioApi.getInfo,
    });
    const { data: stats } = useQuery({
        queryKey: ['public-stats'],
        queryFn: studioApi.getStats,
    });
    const { data: services, isLoading: servicesLoading } = useQuery({
        queryKey: ['services'],
        queryFn: () => catalogApi.getServices(),
    });
    const { data: portfolio, isLoading: portfolioLoading } = useQuery({
        queryKey: ['portfolio', 4],
        queryFn: () => catalogApi.getPortfolio({ limit: 4 }),
    });
    const { data: reviews } = useQuery({
        queryKey: ['reviews', 3],
        queryFn: () => catalogApi.getReviews(3),
    });
    return (_jsxs("div", { className: "pb-24 page-enter", children: [_jsx("div", { className: "px-4 pt-4", children: _jsxs(Card, { className: "p-4", children: [_jsxs("div", { className: "flex gap-3 items-start", children: [_jsx("div", { className: "w-14 h-14 rounded-xl bg-bg-tertiary flex items-center justify-center\n                            text-2xl border border-accent/20 flex-shrink-0", children: info?.logo_url
                                        ? _jsx("img", { src: info.logo_url, alt: "logo", className: "w-full h-full rounded-xl object-cover" })
                                        : '📷' }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("h1", { className: "text-[17px] font-semibold truncate", children: info?.name ?? _jsx(Skeleton, { className: "h-5 w-32" }) }), _jsx("p", { className: "text-[12px] text-text-secondary mt-0.5 line-clamp-1", children: info?.bio ?? 'Professional foto va video studiya' }), stats && (_jsxs("div", { className: "flex items-center gap-1.5 mt-1.5", children: [_jsx(Stars, { rating: stats.avg_rating }), _jsxs("span", { className: "text-[11px] text-accent font-medium", children: [stats.avg_rating, " \u00B7 ", stats.review_count, " ta sharh"] })] }))] })] }), _jsx("div", { className: "grid grid-cols-4 gap-2 mt-3", children: [
                                { val: stats?.staff_count ?? '—', label: 'Xodim' },
                                { val: stats?.service_count ?? '—', label: 'Xizmat' },
                                { val: info?.default_open_time?.slice(0, 5) ?? '9:00', label: 'Ochilish' },
                                { val: info?.default_close_time?.slice(0, 5) ?? '22:00', label: 'Yopilish' },
                            ].map(({ val, label }) => (_jsxs("div", { className: "bg-bg-tertiary rounded-lg py-2 text-center", children: [_jsx("div", { className: "text-[14px] font-semibold text-accent", children: val }), _jsx("div", { className: "text-[10px] text-text-muted mt-0.5", children: label })] }, label))) })] }) }), _jsx("div", { className: "px-4 mt-3", children: _jsxs("div", { onClick: () => navigate('/catalog'), className: "rounded-card p-4 cursor-pointer active:opacity-90 transition-opacity", style: { background: 'linear-gradient(135deg,#1e1500,#2a1e08)',
                        border: '0.5px solid #3d3020' }, children: [_jsx("div", { className: "text-[10px] font-bold tracking-wider text-accent uppercase mb-1", children: "\uD83D\uDCE3 Yangilik" }), _jsx("div", { className: "text-[15px] font-semibold", children: "Sentyabr aksiyasi boshlandi!" }), _jsx("div", { className: "text-[12px] text-text-secondary mt-1", children: "Oilaviy foto sessiyada" }), _jsx("div", { className: "text-[26px] font-bold text-accent-light mt-1", children: "-20% chegirma" })] }) }), _jsx(SectionHeader, { title: "Mashhur xizmatlar", action: "Barchasi", onAction: () => navigate('/catalog') }), _jsx("div", { className: "flex gap-3 px-4 pb-1 overflow-x-auto no-scrollbar", children: servicesLoading
                    ? Array(4).fill(0).map((_, i) => (_jsxs("div", { className: "flex-shrink-0 w-32", children: [_jsx(Skeleton, { className: "h-[90px] w-32 rounded-t-card" }), _jsx(Skeleton, { className: "h-10 w-32 rounded-b-card mt-0.5" })] }, i)))
                    : services?.slice(0, 6).map(svc => (_jsxs(Card, { onClick: () => navigate('/booking'), className: "flex-shrink-0 w-32 overflow-hidden", children: [_jsxs("div", { className: "h-[90px] bg-bg-tertiary flex items-center justify-center\n                                text-3xl relative", children: [svc.photo_url
                                        ? _jsx("img", { src: svc.photo_url, alt: svc.name, className: "w-full h-full object-cover" })
                                        : SERVICE_EMOJI[svc.category] ?? '🎬', _jsx(Badge, { variant: "accent", className: "absolute top-1.5 right-1.5 text-[9px]", children: "TOP" })] }), _jsxs("div", { className: "p-2", children: [_jsx("div", { className: "text-[12px] font-semibold line-clamp-1", children: svc.name }), _jsxs("div", { className: "text-[11px] text-accent mt-0.5", children: [formatPrice(svc.price_per_hour), "/soat"] })] })] }, svc.id))) }), _jsx(SectionHeader, { title: "So'nggi ishlar", action: "Ko'rish", onAction: () => navigate('/catalog') }), _jsx("div", { className: "px-4 grid grid-cols-2 gap-2", children: portfolioLoading
                    ? Array(4).fill(0).map((_, i) => (_jsx(Skeleton, { className: "h-36 rounded-card" }, i)))
                    : portfolio?.slice(0, 4).map(item => (_jsxs(Card, { onClick: () => navigate('/catalog'), className: "overflow-hidden", children: [_jsxs("div", { className: "h-36 bg-bg-tertiary flex items-center justify-center\n                                text-4xl relative", children: [item.thumbnail_url
                                        ? _jsx("img", { src: item.thumbnail_url, alt: item.title, className: "w-full h-full object-cover" })
                                        : '🖼️', item.media_type === 'video' && (_jsx("div", { className: "absolute inset-0 flex items-center justify-center", children: _jsx("div", { className: "w-10 h-10 rounded-full bg-black/50 flex items-center\n                                      justify-center", children: _jsx("span", { className: "text-white text-lg ml-0.5", children: "\u25B6" }) }) }))] }), _jsx("div", { className: "p-2", children: _jsx("div", { className: "text-[12px] font-medium line-clamp-1", children: item.title }) })] }, item.id))) }), reviews && reviews.length > 0 && (_jsxs(_Fragment, { children: [_jsx(SectionHeader, { title: "Sharhlar" }), _jsx("div", { className: "px-4 flex flex-col gap-2 mb-2", children: reviews.map(r => (_jsxs(Card, { className: "p-3", children: [_jsxs("div", { className: "flex items-center justify-between mb-1.5", children: [_jsx("span", { className: "text-[13px] font-medium", children: r.user_name }), _jsx(Stars, { rating: r.rating })] }), r.text && (_jsx("p", { className: "text-[12px] text-text-secondary line-clamp-2", children: r.text }))] }, r.id))) })] }))] }));
}
const SERVICE_EMOJI = {
    'Portret': '📸', 'Video': '🎬', "To'y": '💍',
    'Bola': '👶', 'Korporativ': '🏢', 'Oilaviy': '👨‍👩‍👧',
};
