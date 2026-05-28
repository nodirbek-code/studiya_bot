import { useQuery } from '@tanstack/react-query'
import { catalogApi } from '@/api/endpoints'
import { useBookingStore } from '@/store/bookingStore'
import { Skeleton, Badge } from '@/components/ui'
import { clsx, formatPrice } from '@/utils'
import { useTelegram } from '@/hooks/useTelegram'

export function ServicePicker() {
  const { draft, setService, setPackage, setServiceType, setDuration, setStep } = useBookingStore()
  const { haptic } = useTelegram()

  const { data: services = [], isLoading: svcLoading } = useQuery({
    queryKey: ['services'],
    queryFn: () => catalogApi.getServices(),
  })
  const { data: packages = [], isLoading: pkgLoading } = useQuery({
    queryKey: ['packages'],
    queryFn: catalogApi.getPackages,
  })

  const handleNext = () => {
    if (!draft.service && !draft.pkg) return
    haptic('medium')
    setStep(4)
  }

  const totalPrice = draft.pkg
    ? draft.pkg.final_price
    : (draft.service?.price_per_hour ?? 0) * draft.durationH

  const deposit = totalPrice * 0.3

  return (
    <div className="px-4">

      {/* ── Type toggle ───────────────────────────────────────── */}
      <div className="flex gap-2 bg-bg-secondary rounded-lg p-1 mb-4">
        {(['service', 'package'] as const).map(type => (
          <button
            key={type}
            onClick={() => { haptic('light'); setServiceType(type) }}
            className={clsx(
              'flex-1 h-9 rounded-md text-[13px] font-medium transition-all',
              draft.serviceType === type
                ? 'bg-accent text-bg-primary'
                : 'text-text-secondary',
            )}
          >
            {type === 'service' ? '⏰ Soatlik' : '📦 Paket'}
          </button>
        ))}
      </div>

      {/* ── Services ──────────────────────────────────────────── */}
      {draft.serviceType === 'service' && (
        <>
          <div className="flex flex-col gap-2 mb-4">
            {svcLoading
              ? Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-16 rounded-card" />)
              : services.map(svc => (
                  <button
                    key={svc.id}
                    onClick={() => { haptic('light'); setService(svc) }}
                    className={clsx(
                      'w-full flex items-center gap-3 p-3 rounded-card border text-left transition-all',
                      draft.service?.id === svc.id
                        ? 'bg-accent-muted border-accent/50'
                        : 'bg-bg-secondary border-white/5',
                    )}
                  >
                    <div className="w-10 h-10 rounded-lg bg-bg-tertiary flex items-center
                                    justify-center text-xl flex-shrink-0">
                      {svc.photo_url
                        ? <img src={svc.photo_url} alt={svc.name}
                               className="w-full h-full rounded-lg object-cover" />
                        : '📸'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold">{svc.name}</div>
                      <div className="text-[12px] text-accent mt-0.5">
                        {formatPrice(svc.price_per_hour)}/soat
                      </div>
                    </div>
                    {draft.service?.id === svc.id && (
                      <div className="w-5 h-5 rounded-full bg-accent flex items-center
                                      justify-center text-bg-primary text-xs">✓</div>
                    )}
                  </button>
                ))
            }
          </div>

          {/* Duration picker */}
          {draft.service && (
            <div className="bg-bg-secondary rounded-card p-3 mb-4">
              <p className="text-[12px] text-text-secondary mb-2">Necha soat?</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map(h => (
                  <button
                    key={h}
                    onClick={() => { haptic('light'); setDuration(h) }}
                    className={clsx(
                      'flex-1 h-10 rounded-lg text-[13px] font-medium border transition-all',
                      draft.durationH === h
                        ? 'bg-accent-muted border-accent text-accent'
                        : 'bg-bg-tertiary border-white/5 text-text-secondary',
                    )}
                  >
                    {h} soat
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Packages ──────────────────────────────────────────── */}
      {draft.serviceType === 'package' && (
        <div className="flex flex-col gap-2 mb-4">
          {pkgLoading
            ? Array(2).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-card" />)
            : packages.map(pkg => (
                <button
                  key={pkg.id}
                  onClick={() => { haptic('light'); setPackage(pkg) }}
                  className={clsx(
                    'w-full p-3 rounded-card border text-left transition-all',
                    draft.pkg?.id === pkg.id
                      ? 'bg-accent-muted border-accent/50'
                      : 'bg-bg-secondary border-white/5',
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-[14px] font-semibold">{pkg.name}</div>
                      {pkg.description && (
                        <div className="text-[12px] text-text-secondary mt-1 line-clamp-2">
                          {pkg.description}
                        </div>
                      )}
                    </div>
                    {pkg.discount_percent > 0 && (
                      <Badge variant="accent" className="ml-2 flex-shrink-0">
                        -{pkg.discount_percent}%
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[15px] font-bold text-accent">
                      {formatPrice(pkg.final_price)}
                    </span>
                    {pkg.discount_percent > 0 && (
                      <span className="text-[12px] text-text-muted line-through">
                        {formatPrice(pkg.original_price)}
                      </span>
                    )}
                  </div>
                </button>
              ))
          }
        </div>
      )}

      {/* ── Price summary ─────────────────────────────────────── */}
      {(draft.service || draft.pkg) && (
        <div className="bg-bg-secondary rounded-card p-3 mb-4">
          <div className="flex justify-between text-[13px] text-text-secondary mb-1">
            <span>Jami narx</span>
            <span className="text-text-primary font-medium">{formatPrice(totalPrice)}</span>
          </div>
          <div className="flex justify-between text-[13px]">
            <span className="text-text-secondary">Oldindan to'lov (30%)</span>
            <span className="text-accent font-semibold">{formatPrice(deposit)}</span>
          </div>
        </div>
      )}

      <button
        onClick={handleNext}
        disabled={!draft.service && !draft.pkg}
        className="w-full h-12 bg-accent text-bg-primary font-semibold rounded-btn
                   disabled:opacity-40 active:opacity-85 transition-opacity"
      >
        Davom etish →
      </button>
    </div>
  )
}
