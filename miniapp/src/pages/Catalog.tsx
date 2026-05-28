import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { catalogApi } from '@/api/endpoints'
import { Skeleton, EmptyState, Stars, Badge } from '@/components/ui'
import { clsx } from '@/utils'

export default function CatalogPage() {
  const navigate = useNavigate()
  const [activeCategory, setActiveCategory] = useState<string | undefined>()
  const [activeStaff, setActiveStaff]       = useState<number | undefined>()

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn:  catalogApi.getCategories,
  })
  const { data: staff = [] } = useQuery({
    queryKey: ['staff'],
    queryFn:  catalogApi.getStaff,
  })
  const { data: portfolio = [], isLoading } = useQuery({
    queryKey: ['portfolio', activeCategory, activeStaff],
    queryFn:  () => catalogApi.getPortfolio({
      category: activeCategory,
      staff_id: activeStaff,
      limit: 30,
    }),
  })

  return (
    <div className="pb-24 page-enter">

      {/* ── Category filter ──────────────────────────────────── */}
      <div className="sticky top-0 z-10 bg-bg-primary pt-3 pb-2">
        <div className="flex gap-2 px-4 overflow-x-auto no-scrollbar">
          <Chip
            active={!activeCategory}
            onClick={() => setActiveCategory(undefined)}
          >
            Barchasi
          </Chip>
          {categories.map(cat => (
            <Chip
              key={cat}
              active={activeCategory === cat}
              onClick={() => setActiveCategory(cat === activeCategory ? undefined : cat)}
            >
              {cat}
            </Chip>
          ))}
        </div>

        {/* ── Staff filter ─────────────────────────────────── */}
        <div className="flex gap-3 px-4 mt-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveStaff(undefined)}
            className={clsx(
              'flex-shrink-0 flex flex-col items-center gap-1',
              !activeStaff ? 'opacity-100' : 'opacity-40',
            )}
          >
            <div className="w-10 h-10 rounded-full bg-bg-tertiary flex items-center
                            justify-center text-base border-2 border-transparent
                            transition-all" style={!activeStaff ? {borderColor:'#C8A96E'} : {}}>
              👥
            </div>
            <span className="text-[9px] text-text-secondary">Barchasi</span>
          </button>
          {staff.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveStaff(s.id === activeStaff ? undefined : s.id)}
              className="flex-shrink-0 flex flex-col items-center gap-1"
            >
              <div className={clsx(
                'w-10 h-10 rounded-full bg-bg-tertiary flex items-center justify-center',
                'text-lg border-2 transition-all',
                activeStaff === s.id ? 'border-accent' : 'border-transparent opacity-50',
              )}>
                {s.photo_url
                  ? <img src={s.photo_url} alt={s.name}
                         className="w-full h-full rounded-full object-cover" />
                  : '👤'}
              </div>
              <span className="text-[9px] text-text-secondary w-12 text-center line-clamp-1">
                {s.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Portfolio grid ────────────────────────────────────── */}
      <div className="px-4 pt-2">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-2">
            {Array(6).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-card" />
            ))}
          </div>
        ) : portfolio.length === 0 ? (
          <EmptyState
            icon="🖼️"
            title="Portfolio bo'sh"
            subtitle="Bu bo'lim uchun hali ishlar qo'shilmagan"
          />
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {portfolio.map(item => (
              <PortfolioCard
                key={item.id}
                item={item}
                onClick={() => navigate('/booking')}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Portfolio card ────────────────────────────────────────────
function PortfolioCard({
  item, onClick,
}: {
  item: { id:number; title:string; media_url:string; media_type:string;
          thumbnail_url:string|null; service_id:number|null }
  onClick: () => void
}) {
  return (
    <div
      onClick={onClick}
      className="bg-bg-secondary rounded-card overflow-hidden border border-white/5
                 active:scale-[0.97] transition-transform cursor-pointer"
    >
      <div className="h-36 bg-bg-tertiary flex items-center justify-center relative">
        {item.thumbnail_url
          ? <img src={item.thumbnail_url} alt={item.title}
                 className="w-full h-full object-cover" />
          : <span className="text-4xl">🖼️</span>}

        {/* Video play overlay */}
        {item.media_type === 'video' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm
                            flex items-center justify-center">
              <span className="text-white text-base ml-0.5">▶</span>
            </div>
          </div>
        )}

        {/* Type badge */}
        <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5
                        bg-gradient-to-t from-black/70 to-transparent">
          <Badge variant="accent" className="text-[9px]">
            {item.media_type === 'video' ? '🎬 Video' : '📸 Foto'}
          </Badge>
        </div>
      </div>
      <div className="p-2.5">
        <p className="text-[12px] font-medium line-clamp-1">{item.title}</p>
      </div>
    </div>
  )
}

// ── Chip component ────────────────────────────────────────────
function Chip({ children, active, onClick }: {
  children: React.ReactNode; active: boolean; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'flex-shrink-0 px-3.5 py-1.5 rounded-chip text-[12px] font-medium',
        'transition-all border',
        active
          ? 'bg-accent-muted border-accent/50 text-accent'
          : 'bg-bg-secondary border-white/5 text-text-secondary',
      )}
    >
      {children}
    </button>
  )
}
