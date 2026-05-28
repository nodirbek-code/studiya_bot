import { useQuery } from '@tanstack/react-query'
import { studioApi } from '@/api/endpoints'
import { Card, Skeleton } from '@/components/ui'
import { useTelegram } from '@/hooks/useTelegram'

export default function AboutPage() {
  const { openLink, tg } = useTelegram()

  const { data: info, isLoading } = useQuery({
    queryKey: ['studio-info'],
    queryFn: studioApi.getInfo,
  })

  const openMap = () => {
    if (info?.latitude && info?.longitude) {
      tg?.openLink(
        `https://maps.google.com/?q=${info.latitude},${info.longitude}`
      )
    }
  }

  return (
    <div className="pb-24 page-enter">

      {/* ── Cover + logo ─────────────────────────────────────── */}
      <div className="relative">
        <div className="h-36 bg-bg-secondary flex items-center justify-center">
          {info?.cover_url
            ? <img src={info.cover_url} alt="cover"
                   className="w-full h-full object-cover" />
            : <span className="text-6xl">📷</span>}
        </div>
        <div className="absolute -bottom-6 left-4">
          <div className="w-14 h-14 rounded-xl bg-bg-tertiary border-2 border-bg-primary
                          flex items-center justify-center text-2xl overflow-hidden shadow-xl">
            {info?.logo_url
              ? <img src={info.logo_url} alt="logo" className="w-full h-full object-cover" />
              : '📸'}
          </div>
        </div>
      </div>

      {/* ── Studio name + bio ─────────────────────────────────── */}
      <div className="px-4 pt-10 pb-2">
        {isLoading
          ? <>
              <Skeleton className="h-6 w-40 mb-2" />
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-3/4" />
            </>
          : <>
              <h1 className="text-[19px] font-bold">{info?.name ?? 'Studio'}</h1>
              {info?.bio && (
                <p className="text-[13px] text-text-secondary mt-2 leading-relaxed">
                  {info.bio}
                </p>
              )}
            </>
        }
      </div>

      {/* ── Contacts ─────────────────────────────────────────── */}
      <div className="px-4 mt-2">
        <Card className="divide-y divide-white/5">
          {info?.phone && (
            <ContactRow
              icon="📞"
              label="Telefon"
              value={info.phone}
              onClick={() => tg?.openLink(`tel:${info.phone}`)}
            />
          )}
          {info?.instagram && (
            <ContactRow
              icon="📸"
              label="Instagram"
              value={`@${info.instagram}`}
              onClick={() => openLink(`https://instagram.com/${info.instagram}`)}
            />
          )}
          {(info?.default_open_time || info?.default_close_time) && (
            <ContactRow
              icon="🕐"
              label="Ish vaqti"
              value={`${info.default_open_time?.slice(0,5) ?? '09:00'} – ${info.default_close_time?.slice(0,5) ?? '22:00'}`}
            />
          )}
          {info?.address && (
            <ContactRow
              icon="📍"
              label="Manzil"
              value={info.address}
              onClick={openMap}
            />
          )}
        </Card>
      </div>

      {/* ── Map placeholder ──────────────────────────────────── */}
      {info?.latitude && info?.longitude && (
        <div className="px-4 mt-3">
          <button
            onClick={openMap}
            className="w-full h-32 bg-bg-secondary rounded-card border border-white/5
                       flex flex-col items-center justify-center gap-2 active:opacity-80"
          >
            <span className="text-3xl">🗺️</span>
            <span className="text-[13px] text-text-secondary">Xaritada ko'rish</span>
            <span className="text-[11px] text-text-muted">{info.address}</span>
          </button>
        </div>
      )}

      {/* ── Tags ─────────────────────────────────────────────── */}
      <div className="px-4 mt-3">
        <div className="flex flex-wrap gap-2">
          {['Portret', 'To\'y', 'Video', 'Korporativ', 'Bola', 'Retuching'].map(tag => (
            <span
              key={tag}
              className="px-3 py-1 bg-bg-secondary border border-white/5 rounded-chip
                         text-[12px] text-text-secondary"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function ContactRow({
  icon, label, value, onClick,
}: { icon: string; label: string; value: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className="w-full flex items-center gap-3 p-3 text-left
                 active:bg-bg-tertiary transition-colors disabled:cursor-default"
    >
      <div className="w-9 h-9 rounded-lg bg-bg-tertiary flex items-center justify-center
                      text-base flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] text-text-muted">{label}</div>
        <div className="text-[13px] text-text-primary font-medium truncate">{value}</div>
      </div>
      {onClick && <span className="text-text-muted text-sm">›</span>}
    </button>
  )
}
