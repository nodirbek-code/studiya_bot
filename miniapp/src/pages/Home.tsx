import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { studioApi, catalogApi } from '@/api/endpoints'
import { Card, SectionHeader, Skeleton, Stars, Badge } from '@/components/ui'
import { formatPrice } from '@/utils'

export default function HomePage() {
  const navigate = useNavigate()

  const { data: info } = useQuery({
    queryKey: ['studio-info'],
    queryFn: studioApi.getInfo,
  })
  const { data: stats } = useQuery({
    queryKey: ['public-stats'],
    queryFn: studioApi.getStats,
  })
  const { data: services, isLoading: servicesLoading } = useQuery({
    queryKey: ['services'],
    queryFn: () => catalogApi.getServices(),
  })
  const { data: portfolio, isLoading: portfolioLoading } = useQuery({
    queryKey: ['portfolio', 4],
    queryFn: () => catalogApi.getPortfolio({ limit: 4 }),
  })
  const { data: reviews } = useQuery({
    queryKey: ['reviews', 3],
    queryFn: () => catalogApi.getReviews(3),
  })

  return (
    <div className="pb-24 page-enter">

      {/* ── Studio header ──────────────────────────────────────── */}
      <div className="px-4 pt-4">
        <Card className="p-4">
          <div className="flex gap-3 items-start">
            {/* Logo */}
            <div className="w-14 h-14 rounded-xl bg-bg-tertiary flex items-center justify-center
                            text-2xl border border-accent/20 flex-shrink-0">
              {info?.logo_url
                ? <img src={info.logo_url} alt="logo" className="w-full h-full rounded-xl object-cover" />
                : '📷'}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-[17px] font-semibold truncate">
                {info?.name ?? <Skeleton className="h-5 w-32" />}
              </h1>
              <p className="text-[12px] text-text-secondary mt-0.5 line-clamp-1">
                {info?.bio ?? 'Professional foto va video studiya'}
              </p>
              {stats && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <Stars rating={stats.avg_rating} />
                  <span className="text-[11px] text-accent font-medium">
                    {stats.avg_rating} · {stats.review_count} ta sharh
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Stats chips */}
          <div className="grid grid-cols-4 gap-2 mt-3">
            {[
              { val: stats?.staff_count ?? '—',   label: 'Xodim' },
              { val: stats?.service_count ?? '—', label: 'Xizmat' },
              { val: info?.default_open_time?.slice(0,5) ?? '9:00',  label: 'Ochilish' },
              { val: info?.default_close_time?.slice(0,5) ?? '22:00',label: 'Yopilish' },
            ].map(({ val, label }) => (
              <div key={label} className="bg-bg-tertiary rounded-lg py-2 text-center">
                <div className="text-[14px] font-semibold text-accent">{val}</div>
                <div className="text-[10px] text-text-muted mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── News / Promo banner ────────────────────────────────── */}
      <div className="px-4 mt-3">
        <div
          onClick={() => navigate('/catalog')}
          className="rounded-card p-4 cursor-pointer active:opacity-90 transition-opacity"
          style={{ background: 'linear-gradient(135deg,#1e1500,#2a1e08)',
                   border: '0.5px solid #3d3020' }}
        >
          <div className="text-[10px] font-bold tracking-wider text-accent uppercase mb-1">
            📣 Yangilik
          </div>
          <div className="text-[15px] font-semibold">Sentyabr aksiyasi boshlandi!</div>
          <div className="text-[12px] text-text-secondary mt-1">
            Oilaviy foto sessiyada
          </div>
          <div className="text-[26px] font-bold text-accent-light mt-1">-20% chegirma</div>
        </div>
      </div>

      {/* ── Services ──────────────────────────────────────────── */}
      <SectionHeader
        title="Mashhur xizmatlar"
        action="Barchasi"
        onAction={() => navigate('/catalog')}
      />
      <div className="flex gap-3 px-4 pb-1 overflow-x-auto no-scrollbar">
        {servicesLoading
          ? Array(4).fill(0).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-32">
                <Skeleton className="h-[90px] w-32 rounded-t-card" />
                <Skeleton className="h-10 w-32 rounded-b-card mt-0.5" />
              </div>
            ))
          : services?.slice(0, 6).map(svc => (
              <Card
                key={svc.id}
                onClick={() => navigate('/booking')}
                className="flex-shrink-0 w-32 overflow-hidden"
              >
                <div className="h-[90px] bg-bg-tertiary flex items-center justify-center
                                text-3xl relative">
                  {svc.photo_url
                    ? <img src={svc.photo_url} alt={svc.name}
                           className="w-full h-full object-cover" />
                    : SERVICE_EMOJI[svc.category] ?? '🎬'}
                  <Badge variant="accent" className="absolute top-1.5 right-1.5 text-[9px]">
                    TOP
                  </Badge>
                </div>
                <div className="p-2">
                  <div className="text-[12px] font-semibold line-clamp-1">{svc.name}</div>
                  <div className="text-[11px] text-accent mt-0.5">
                    {formatPrice(svc.price_per_hour)}/soat
                  </div>
                </div>
              </Card>
            ))
        }
      </div>

      {/* ── Latest portfolio ──────────────────────────────────── */}
      <SectionHeader
        title="So'nggi ishlar"
        action="Ko'rish"
        onAction={() => navigate('/catalog')}
      />
      <div className="px-4 grid grid-cols-2 gap-2">
        {portfolioLoading
          ? Array(4).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-36 rounded-card" />
            ))
          : portfolio?.slice(0, 4).map(item => (
              <Card
                key={item.id}
                onClick={() => navigate('/catalog')}
                className="overflow-hidden"
              >
                <div className="h-36 bg-bg-tertiary flex items-center justify-center
                                text-4xl relative">
                  {item.thumbnail_url
                    ? <img src={item.thumbnail_url} alt={item.title}
                           className="w-full h-full object-cover" />
                    : '🖼️'}
                  {item.media_type === 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-black/50 flex items-center
                                      justify-center">
                        <span className="text-white text-lg ml-0.5">▶</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <div className="text-[12px] font-medium line-clamp-1">{item.title}</div>
                </div>
              </Card>
            ))
        }
      </div>

      {/* ── Latest reviews ────────────────────────────────────── */}
      {reviews && reviews.length > 0 && (
        <>
          <SectionHeader title="Sharhlar" />
          <div className="px-4 flex flex-col gap-2 mb-2">
            {reviews.map(r => (
              <Card key={r.id} className="p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[13px] font-medium">{r.user_name}</span>
                  <Stars rating={r.rating} />
                </div>
                {r.text && (
                  <p className="text-[12px] text-text-secondary line-clamp-2">{r.text}</p>
                )}
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

const SERVICE_EMOJI: Record<string, string> = {
  'Portret': '📸', 'Video': '🎬', "To'y": '💍',
  'Bola': '👶', 'Korporativ': '🏢', 'Oilaviy': '👨‍👩‍👧',
}
