import { useBookingStore } from '@/store/bookingStore'
import { StaffPicker }    from '@/components/BookingWizard/StaffPicker'
import { DateTimePicker } from '@/components/BookingWizard/DateTimePicker'
import { ServicePicker }  from '@/components/BookingWizard/ServicePicker'
import { BookingSummary } from '@/components/BookingWizard/BookingSummary'
import { clsx } from '@/utils'

const STEPS = [
  { num: 1, label: 'Xodim' },
  { num: 2, label: 'Vaqt'  },
  { num: 3, label: 'Xizmat'},
  { num: 4, label: "To'lov"},
]

export default function BookingPage() {
  const { step, setStep, reset } = useBookingStore()

  return (
    <div className="pb-24 page-enter">

      {/* ── Progress steps ──────────────────────────────────── */}
      <div className="px-4 pt-4 pb-5">
        <div className="flex items-center">
          {STEPS.map(({ num, label }, idx) => (
            <div key={num} className="flex items-center flex-1 last:flex-none">
              {/* Step circle */}
              <div className="flex flex-col items-center gap-1">
                <button
                  onClick={() => num < step && setStep(num as 1|2|3|4)}
                  className={clsx(
                    'w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold',
                    'transition-all border-2',
                    num < step  && 'bg-accent border-accent text-bg-primary cursor-pointer',
                    num === step && 'bg-bg-tertiary border-accent text-accent',
                    num > step  && 'bg-bg-tertiary border-white/10 text-text-muted',
                  )}
                >
                  {num < step ? '✓' : num}
                </button>
                <span className={clsx(
                  'text-[9px] font-medium whitespace-nowrap',
                  num === step ? 'text-accent' : 'text-text-muted',
                )}>
                  {label}
                </span>
              </div>

              {/* Connector line */}
              {idx < STEPS.length - 1 && (
                <div className={clsx(
                  'flex-1 h-0.5 mx-1 mb-4 rounded-full transition-all',
                  num < step ? 'bg-accent' : 'bg-white/10',
                )} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Step content ────────────────────────────────────── */}
      <div className="page-enter" key={step}>
        {step === 1 && <StaffPicker />}
        {step === 2 && <DateTimePicker />}
        {step === 3 && <ServicePicker />}
        {step === 4 && <BookingSummary />}
      </div>

      {/* ── Reset button ────────────────────────────────────── */}
      {step > 1 && (
        <button
          onClick={() => {
            if (window.confirm('Bronni qaytadan boshlaysizmi?')) reset()
          }}
          className="mx-4 mt-4 text-[12px] text-text-muted underline"
        >
          Qaytadan boshlash
        </button>
      )}
    </div>
  )
}
