import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { catalogApi } from '@/api/endpoints';
import { Skeleton, EmptyState, Badge } from '@/components/ui';
import { clsx } from '@/utils';
export default function CatalogPage() {
    const navigate = useNavigate();
    const [activeCategory, setActiveCategory] = useState();
    const [activeStaff, setActiveStaff] = useState();
    const { data: categories = [] } = useQuery({
        queryKey: ['categories'],
        queryFn: catalogApi.getCategories,
    });
    const { data: staff = [] } = useQuery({
        queryKey: ['staff'],
        queryFn: catalogApi.getStaff,
    });
    const { data: portfolio = [], isLoading } = useQuery({
        queryKey: ['portfolio', activeCategory, activeStaff],
        queryFn: () => catalogApi.getPortfolio({
            category: activeCategory,
            staff_id: activeStaff,
            limit: 30,
        }),
    });
    return (_jsxs("div", { className: "pb-24 page-enter", children: [_jsxs("div", { className: "sticky top-0 z-10 bg-bg-primary pt-3 pb-2", children: [_jsxs("div", { className: "flex gap-2 px-4 overflow-x-auto no-scrollbar", children: [_jsx(Chip, { active: !activeCategory, onClick: () => setActiveCategory(undefined), children: "Barchasi" }), categories.map(cat => (_jsx(Chip, { active: activeCategory === cat, onClick: () => setActiveCategory(cat === activeCategory ? undefined : cat), children: cat }, cat)))] }), _jsxs("div", { className: "flex gap-3 px-4 mt-2 overflow-x-auto no-scrollbar", children: [_jsxs("button", { onClick: () => setActiveStaff(undefined), className: clsx('flex-shrink-0 flex flex-col items-center gap-1', !activeStaff ? 'opacity-100' : 'opacity-40'), children: [_jsx("div", { className: "w-10 h-10 rounded-full bg-bg-tertiary flex items-center\n                            justify-center text-base border-2 border-transparent\n                            transition-all", style: !activeStaff ? { borderColor: '#C8A96E' } : {}, children: "\uD83D\uDC65" }), _jsx("span", { className: "text-[9px] text-text-secondary", children: "Barchasi" })] }), staff.map(s => (_jsxs("button", { onClick: () => setActiveStaff(s.id === activeStaff ? undefined : s.id), className: "flex-shrink-0 flex flex-col items-center gap-1", children: [_jsx("div", { className: clsx('w-10 h-10 rounded-full bg-bg-tertiary flex items-center justify-center', 'text-lg border-2 transition-all', activeStaff === s.id ? 'border-accent' : 'border-transparent opacity-50'), children: s.photo_url
                                            ? _jsx("img", { src: s.photo_url, alt: s.name, className: "w-full h-full rounded-full object-cover" })
                                            : '👤' }), _jsx("span", { className: "text-[9px] text-text-secondary w-12 text-center line-clamp-1", children: s.name })] }, s.id)))] })] }), _jsx("div", { className: "px-4 pt-2", children: isLoading ? (_jsx("div", { className: "grid grid-cols-2 gap-2", children: Array(6).fill(0).map((_, i) => (_jsx(Skeleton, { className: "h-48 rounded-card" }, i))) })) : portfolio.length === 0 ? (_jsx(EmptyState, { icon: "\uD83D\uDDBC\uFE0F", title: "Portfolio bo'sh", subtitle: "Bu bo'lim uchun hali ishlar qo'shilmagan" })) : (_jsx("div", { className: "grid grid-cols-2 gap-2", children: portfolio.map(item => (_jsx(PortfolioCard, { item: item, onClick: () => navigate('/booking') }, item.id))) })) })] }));
}
// ── Portfolio card ────────────────────────────────────────────
function PortfolioCard({ item, onClick, }) {
    return (_jsxs("div", { onClick: onClick, className: "bg-bg-secondary rounded-card overflow-hidden border border-white/5\n                 active:scale-[0.97] transition-transform cursor-pointer", children: [_jsxs("div", { className: "h-36 bg-bg-tertiary flex items-center justify-center relative", children: [item.thumbnail_url
                        ? _jsx("img", { src: item.thumbnail_url, alt: item.title, className: "w-full h-full object-cover" })
                        : _jsx("span", { className: "text-4xl", children: "\uD83D\uDDBC\uFE0F" }), item.media_type === 'video' && (_jsx("div", { className: "absolute inset-0 flex items-center justify-center", children: _jsx("div", { className: "w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm\n                            flex items-center justify-center", children: _jsx("span", { className: "text-white text-base ml-0.5", children: "\u25B6" }) }) })), _jsx("div", { className: "absolute bottom-0 left-0 right-0 px-2 py-1.5\n                        bg-gradient-to-t from-black/70 to-transparent", children: _jsx(Badge, { variant: "accent", className: "text-[9px]", children: item.media_type === 'video' ? '🎬 Video' : '📸 Foto' }) })] }), _jsx("div", { className: "p-2.5", children: _jsx("p", { className: "text-[12px] font-medium line-clamp-1", children: item.title }) })] }));
}
// ── Chip component ────────────────────────────────────────────
function Chip({ children, active, onClick }) {
    return (_jsx("button", { onClick: onClick, className: clsx('flex-shrink-0 px-3.5 py-1.5 rounded-chip text-[12px] font-medium', 'transition-all border', active
            ? 'bg-accent-muted border-accent/50 text-accent'
            : 'bg-bg-secondary border-white/5 text-text-secondary'), children: children }));
}
