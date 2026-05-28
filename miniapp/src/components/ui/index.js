import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { clsx } from '@/utils';
// в”Ђв”Ђ Skeleton в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
export function Skeleton({ className }) {
    return _jsx("div", { className: clsx('skeleton', className) });
}
// в”Ђв”Ђ Card в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
export function Card({ children, className, onClick, style, }) {
    return (_jsx("div", { onClick: onClick, style: style, className: clsx('bg-bg-secondary border border-white/5 rounded-card', onClick && 'active:scale-[0.98] transition-transform cursor-pointer', className), children: children }));
}
// в”Ђв”Ђ Badge в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
export function Badge({ children, variant = 'default', className, }) {
    const variants = {
        default: 'bg-bg-tertiary text-text-secondary',
        accent: 'bg-accent-muted text-accent border border-accent/30',
        success: 'bg-status-success/10 text-status-success',
        error: 'bg-status-error/10 text-status-error',
        warning: 'bg-status-warning/10 text-status-warning',
    };
    return (_jsx("span", { className: clsx('inline-flex items-center px-2.5 py-0.5 rounded-chip text-[11px] font-medium', variants[variant], className), children: children }));
}
// в”Ђв”Ђ Button в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
export function Button({ children, onClick, variant = 'primary', disabled, loading, className, fullWidth, }) {
    const variants = {
        primary: 'bg-accent text-bg-primary font-semibold active:opacity-85',
        secondary: 'bg-bg-tertiary text-text-primary border border-white/10 active:bg-bg-hover',
        ghost: 'text-accent active:opacity-70',
    };
    return (_jsx("button", { onClick: onClick, disabled: disabled || loading, className: clsx('h-12 px-5 rounded-btn text-sm transition-all flex items-center justify-center gap-2', 'disabled:opacity-40 disabled:cursor-not-allowed', variants[variant], fullWidth && 'w-full', className), children: loading ? _jsx(Spinner, { size: "sm" }) : children }));
}
// в”Ђв”Ђ Spinner в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
export function Spinner({ size = 'md' }) {
    const s = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' };
    return (_jsxs("svg", { className: clsx('animate-spin text-accent', s[size]), viewBox: "0 0 24 24", fill: "none", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "3" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" })] }));
}
// в”Ђв”Ђ Stars в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
export function Stars({ rating, max = 5, interactive, onChange, }) {
    return (_jsx("div", { className: "flex gap-1", children: Array.from({ length: max }, (_, i) => i + 1).map(star => (_jsx("span", { onClick: () => interactive && onChange?.(star), className: clsx('text-xl transition-colors', star <= rating ? 'text-accent' : 'text-text-muted', interactive && 'cursor-pointer active:scale-110'), children: "\u0432\u0098\u2026" }, star))) }));
}
// в”Ђв”Ђ Section header в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
export function SectionHeader({ title, action, onAction, }) {
    return (_jsxs("div", { className: "flex items-center justify-between px-4 pt-5 pb-2", children: [_jsx("h2", { className: "text-[15px] font-semibold text-text-primary", children: title }), action && (_jsx("button", { onClick: onAction, className: "text-[12px] text-accent", children: action }))] }));
}
// в”Ђв”Ђ Empty state в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
export function EmptyState({ icon, title, subtitle }) {
    return (_jsxs("div", { className: "flex flex-col items-center justify-center py-16 gap-3", children: [_jsx("span", { className: "text-5xl", children: icon }), _jsx("p", { className: "text-text-primary font-medium", children: title }), subtitle && _jsx("p", { className: "text-text-secondary text-sm text-center px-8", children: subtitle })] }));
}
// в”Ђв”Ђ Divider в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
export function Divider({ className }) {
    return _jsx("div", { className: clsx('h-px bg-white/5', className) });
}
