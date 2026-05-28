import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useLocation, useNavigate } from 'react-router-dom';
import { clsx } from '@/utils';
const TABS = [
    { path: '/', icon: HomeIcon, label: 'Bosh' },
    { path: '/catalog', icon: GridIcon, label: 'Portfolio' },
    { path: '/booking', icon: CalendarIcon, label: 'Bron' },
    { path: '/profile', icon: UserIcon, label: 'Profil' },
    { path: '/about', icon: InfoIcon, label: 'Haqida' },
];
export function BottomNav() {
    const { pathname } = useLocation();
    const navigate = useNavigate();
    return (_jsx("nav", { className: "bottom-nav fixed bottom-0 left-0 right-0 bg-bg-secondary border-t border-white/5 flex z-50", children: TABS.map(({ path, icon: Icon, label }) => {
            const active = pathname === path || (path !== '/' && pathname.startsWith(path));
            return (_jsxs("button", { onClick: () => navigate(path), className: clsx('flex-1 flex flex-col items-center justify-center gap-1 py-2 transition-colors', active ? 'text-accent' : 'text-text-muted'), children: [_jsx(Icon, { active: active }), _jsx("span", { className: "text-[10px] font-medium", children: label })] }, path));
        }) }));
}
// ── Inline SVG icons ───────────────────────────────────────────
function HomeIcon({ active }) {
    return (_jsxs("svg", { width: "22", height: "22", viewBox: "0 0 24 24", fill: active ? 'currentColor' : 'none', stroke: "currentColor", strokeWidth: "1.8", children: [_jsx("path", { d: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" }), _jsx("polyline", { points: "9 22 9 12 15 12 15 22" })] }));
}
function GridIcon({ active }) {
    return (_jsxs("svg", { width: "22", height: "22", viewBox: "0 0 24 24", fill: active ? 'currentColor' : 'none', stroke: "currentColor", strokeWidth: "1.8", children: [_jsx("rect", { x: "3", y: "3", width: "7", height: "7", rx: "1" }), _jsx("rect", { x: "14", y: "3", width: "7", height: "7", rx: "1" }), _jsx("rect", { x: "3", y: "14", width: "7", height: "7", rx: "1" }), _jsx("rect", { x: "14", y: "14", width: "7", height: "7", rx: "1" })] }));
}
function CalendarIcon({ active }) {
    return (_jsxs("svg", { width: "22", height: "22", viewBox: "0 0 24 24", fill: active ? 'currentColor' : 'none', stroke: "currentColor", strokeWidth: "1.8", children: [_jsx("rect", { x: "3", y: "4", width: "18", height: "18", rx: "2" }), _jsx("line", { x1: "16", y1: "2", x2: "16", y2: "6" }), _jsx("line", { x1: "8", y1: "2", x2: "8", y2: "6" }), _jsx("line", { x1: "3", y1: "10", x2: "21", y2: "10" })] }));
}
function UserIcon({ active }) {
    return (_jsxs("svg", { width: "22", height: "22", viewBox: "0 0 24 24", fill: active ? 'currentColor' : 'none', stroke: "currentColor", strokeWidth: "1.8", children: [_jsx("path", { d: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" }), _jsx("circle", { cx: "12", cy: "7", r: "4" })] }));
}
function InfoIcon({ active }) {
    return (_jsxs("svg", { width: "22", height: "22", viewBox: "0 0 24 24", fill: active ? 'currentColor' : 'none', stroke: "currentColor", strokeWidth: "1.8", children: [_jsx("circle", { cx: "12", cy: "12", r: "10" }), _jsx("line", { x1: "12", y1: "8", x2: "12", y2: "8", strokeLinecap: "round", strokeWidth: "2.5" }), _jsx("line", { x1: "12", y1: "12", x2: "12", y2: "16", strokeLinecap: "round", strokeWidth: "2" })] }));
}
