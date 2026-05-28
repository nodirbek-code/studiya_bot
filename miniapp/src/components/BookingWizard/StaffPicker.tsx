import { useQuery } from '@tanstack/react-query'
import { catalogApi } from '@/api/endpoints'
import { useBookingStore } from '@/store/bookingStore'
import { Skeleton } from '@/components/ui'
import { clsx } from '@/utils'
import { useTelegram } from '@/hooks/useTelegram'

export function StaffPicker() {
  const { data: staff = [], isLoading } = useQuery({
    queryKey: ['staff'],
    queryFn: catalogApi.getStaff,
  })
  const { draft, setStaff, setStep } = useBookingStore()
  const { haptic } = useTelegram()

  const handleSelect = (member: typeof staff[0]) => {
    haptic('light')
    setStaff(member)
  }

  const handleNext = () => {
    if (!draft.staff) return
    haptic('medium')
    setStep(2)
  }

  return (
    <div className="px-4">
      <p className="text-[13px] text-text-secondary mb-4">
        Xodim tanlang yoki "Istalgan" bosing
      </p>

      {/* "Any staff" option */}
      <button
        onClick={() => { setStaff(null); setStep(2) }}
        className={clsx(
          'w-full flex items-center gap-3 p-3 rounded-card border mb-3 transition-all',
          !draft.staff
            ? 'bg-accent-muted border-accent/50'
            : 'bg-bg-secondary border-white/5',
        )}
      >
        <div className="w-12 h-12 rounded-full bg-bg-tertiary flex items-center
                        justify-center text-xl">👥</div>
        <div className="text-left">
          <div className="text-[14px] font-medium">Istalgan xodim</div>
          <div className="text-[12px] text-text-secondary">Bo'sh xodim tanlanadi</div>
        </div>
        {!draft.staff && (
          <div className="ml-auto w-5 h-5 rounded-full bg-accent flex items-center
                          justify-center text-bg-primary text-xs">✓</div>
        )}
      </button>

      {/* Staff list */}
      {isLoading
        ? Array(3).fill(0).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 mb-2">
              <Skeleton className="w-12 h-12 rounded-full" />
              <div className="flex-1"><Skeleton className="h-4 w-24 mb-1" /><Skeleton className="h-3 w-16" /></div>
            </div>
          ))
        : staff.map(member => (
            <button
              key={member.id}
              onClick={() => handleSelect(member)}
              className={clsx(
                'w-full flex items-center gap-3 p-3 rounded-card border mb-2 transition-all',
                draft.staff?.id === member.id
                  ? 'bg-accent-muted border-accent/50'
                  : 'bg-bg-secondary border-white/5',
              )}
            >
              <div className="w-12 h-12 rounded-full bg-bg-tertiary overflow-hidden flex-shrink-0">
                {member.photo_url
                  ? <img src={member.photo_url} alt={member.name}
                         className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-xl">👤</div>}
              </div>
              <div className="text-left flex-1">
                <div className="text-[14px] font-semibold">{member.name}</div>
                <div className="text-[12px] text-text-secondary">{member.role}</div>
                {member.avg_rating && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-accent text-[11px]">★ {member.avg_rating}</span>
                  </div>
                )}
              </div>
              {draft.staff?.id === member.id && (
                <div className="w-5 h-5 rounded-full bg-accent flex items-center
                                justify-center text-bg-primary text-xs">✓</div>
              )}
            </button>
          ))
      }

      {/* Next button */}
      <button
        onClick={handleNext}
        className="w-full h-12 bg-accent text-bg-primary font-semibold rounded-btn mt-4
                   active:opacity-85 transition-opacity"
      >
        Davom etish →
      </button>
    </div>
  )
}
