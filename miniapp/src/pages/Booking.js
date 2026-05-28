import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useBookingStore } from '@/store/bookingStore';
import { StaffPicker } from '@/components/BookingWizard/StaffPicker';
import { DateTimePicker } from '@/components/BookingWizard/DateTimePicker';
import { ServicePicker } from '@/components/BookingWizard/ServicePicker';
import { BookingSummary } from '@/components/BookingWizard/BookingSummary';
import { clsx } from '@/utils';
const STEPS = [
    { num: 1, label: 'Xodim' },
    { num: 2, label: 'Vaqt' },
    { num: 3, label: 'Xizmat' },
    { num: 4, label: "To'lov" },
];
export default function BookingPage() {
    const { step, setStep, reset } = useBookingStore();
    return (_jsxs("div", { className: "pb-24 page-enter", children: [_jsx("div", { className: "px-4 pt-4 pb-5", children: _jsx("div", { className: "flex items-center", children: STEPS.map(({ num, label }, idx) => (_jsxs("div", { className: "flex items-center flex-1 last:flex-none", children: [_jsxs("div", { className: "flex flex-col items-center gap-1", children: [_jsx("button", { onClick: () => num < step && setStep(num), className: clsx('w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold', 'transition-all border-2', num < step && 'bg-accent border-accent text-bg-primary cursor-pointer', num === step && 'bg-bg-tertiary border-accent text-accent', num > step && 'bg-bg-tertiary border-white/10 text-text-muted'), children: num < step ? '✓' : num }), _jsx("span", { className: clsx('text-[9px] font-medium whitespace-nowrap', num === step ? 'text-accent' : 'text-text-muted'), children: label })] }), idx < STEPS.length - 1 && (_jsx("div", { className: clsx('flex-1 h-0.5 mx-1 mb-4 rounded-full transition-all', num < step ? 'bg-accent' : 'bg-white/10') }))] }, num))) }) }), _jsxs("div", { className: "page-enter", children: [step === 1 && _jsx(StaffPicker, {}), step === 2 && _jsx(DateTimePicker, {}), step === 3 && _jsx(ServicePicker, {}), step === 4 && _jsx(BookingSummary, {})] }, step), step > 1 && (_jsx("button", { onClick: () => {
                    if (window.confirm('Bronni qaytadan boshlaysizmi?'))
                        reset();
                }, className: "mx-4 mt-4 text-[12px] text-text-muted underline", children: "Qaytadan boshlash" }))] }));
}
