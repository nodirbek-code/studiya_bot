import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useQuery } from '@tanstack/react-query';
import { studioApi } from '@/api/endpoints';
import { Card, Skeleton } from '@/components/ui';
import { useTelegram } from '@/hooks/useTelegram';
export default function AboutPage() {
    const { openLink, tg } = useTelegram();
    const { data: info, isLoading } = useQuery({
        queryKey: ['studio-info'],
        queryFn: studioApi.getInfo,
    });
    const openMap = () => {
        if (info?.latitude && info?.longitude) {
            tg?.openLink(`https://maps.google.com/?q=${info.latitude},${info.longitude}`);
        }
    };
    return (_jsxs("div", { className: "pb-24 page-enter", children: [_jsxs("div", { className: "relative", children: [_jsx("div", { className: "h-36 bg-bg-secondary flex items-center justify-center", children: info?.cover_url
                            ? _jsx("img", { src: info.cover_url, alt: "cover", className: "w-full h-full object-cover" })
                            : _jsx("span", { className: "text-6xl", children: "\uD83D\uDCF7" }) }), _jsx("div", { className: "absolute -bottom-6 left-4", children: _jsx("div", { className: "w-14 h-14 rounded-xl bg-bg-tertiary border-2 border-bg-primary\n                          flex items-center justify-center text-2xl overflow-hidden shadow-xl", children: info?.logo_url
                                ? _jsx("img", { src: info.logo_url, alt: "logo", className: "w-full h-full object-cover" })
                                : '📸' }) })] }), _jsx("div", { className: "px-4 pt-10 pb-2", children: isLoading
                    ? _jsxs(_Fragment, { children: [_jsx(Skeleton, { className: "h-6 w-40 mb-2" }), _jsx(Skeleton, { className: "h-4 w-full mb-1" }), _jsx(Skeleton, { className: "h-4 w-3/4" })] })
                    : _jsxs(_Fragment, { children: [_jsx("h1", { className: "text-[19px] font-bold", children: info?.name ?? 'Studio' }), info?.bio && (_jsx("p", { className: "text-[13px] text-text-secondary mt-2 leading-relaxed", children: info.bio }))] }) }), _jsx("div", { className: "px-4 mt-2", children: _jsxs(Card, { className: "divide-y divide-white/5", children: [info?.phone && (_jsx(ContactRow, { icon: "\uD83D\uDCDE", label: "Telefon", value: info.phone, onClick: () => tg?.openLink(`tel:${info.phone}`) })), info?.instagram && (_jsx(ContactRow, { icon: "\uD83D\uDCF8", label: "Instagram", value: `@${info.instagram}`, onClick: () => openLink(`https://instagram.com/${info.instagram}`) })), (info?.default_open_time || info?.default_close_time) && (_jsx(ContactRow, { icon: "\uD83D\uDD50", label: "Ish vaqti", value: `${info.default_open_time?.slice(0, 5) ?? '09:00'} – ${info.default_close_time?.slice(0, 5) ?? '22:00'}` })), info?.address && (_jsx(ContactRow, { icon: "\uD83D\uDCCD", label: "Manzil", value: info.address, onClick: openMap }))] }) }), info?.latitude && info?.longitude && (_jsx("div", { className: "px-4 mt-3", children: _jsxs("button", { onClick: openMap, className: "w-full h-32 bg-bg-secondary rounded-card border border-white/5\n                       flex flex-col items-center justify-center gap-2 active:opacity-80", children: [_jsx("span", { className: "text-3xl", children: "\uD83D\uDDFA\uFE0F" }), _jsx("span", { className: "text-[13px] text-text-secondary", children: "Xaritada ko'rish" }), _jsx("span", { className: "text-[11px] text-text-muted", children: info.address })] }) })), _jsx("div", { className: "px-4 mt-3", children: _jsx("div", { className: "flex flex-wrap gap-2", children: ['Portret', 'To\'y', 'Video', 'Korporativ', 'Bola', 'Retuching'].map(tag => (_jsx("span", { className: "px-3 py-1 bg-bg-secondary border border-white/5 rounded-chip\n                         text-[12px] text-text-secondary", children: tag }, tag))) }) })] }));
}
function ContactRow({ icon, label, value, onClick, }) {
    return (_jsxs("button", { onClick: onClick, disabled: !onClick, className: "w-full flex items-center gap-3 p-3 text-left\n                 active:bg-bg-tertiary transition-colors disabled:cursor-default", children: [_jsx("div", { className: "w-9 h-9 rounded-lg bg-bg-tertiary flex items-center justify-center\n                      text-base flex-shrink-0", children: icon }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("div", { className: "text-[10px] text-text-muted", children: label }), _jsx("div", { className: "text-[13px] text-text-primary font-medium truncate", children: value })] }), onClick && _jsx("span", { className: "text-text-muted text-sm", children: "\u203A" })] }));
}
