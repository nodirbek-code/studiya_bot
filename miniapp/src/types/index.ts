// ── Telegram WebApp global type ────────────────────────────────
declare global {
  interface Window {
    Telegram: {
      WebApp: TelegramWebApp
    }
  }
}

export interface TelegramWebApp {
  initData:         string
  initDataUnsafe:   TelegramInitData
  version:          string
  colorScheme:      'light' | 'dark'
  themeParams:      Record<string, string>
  isExpanded:       boolean
  viewportHeight:   number
  viewportStableHeight: number
  MainButton:       TelegramMainButton
  BackButton:       TelegramBackButton
  HapticFeedback:   TelegramHapticFeedback
  expand():         void
  close():          void
  ready():          void
  showAlert(msg: string, cb?: () => void): void
  showConfirm(msg: string, cb: (ok: boolean) => void): void
  openTelegramLink(url: string): void
  openLink(url: string): void
}

export interface TelegramInitData {
  user?: {
    id: number
    first_name: string
    last_name?: string
    username?: string
    language_code?: string
  }
  auth_date: number
  hash: string
}

export interface TelegramMainButton {
  text:     string
  color:    string
  textColor:string
  isVisible:boolean
  isActive: boolean
  isProgressVisible: boolean
  setText(text: string): this
  onClick(fn: () => void): this
  offClick(fn: () => void): this
  show(): this
  hide(): this
  enable(): this
  disable(): this
  showProgress(leaveActive?: boolean): this
  hideProgress(): this
}

export interface TelegramBackButton {
  isVisible: boolean
  onClick(fn: () => void): this
  offClick(fn: () => void): this
  show(): this
  hide(): this
}

export interface TelegramHapticFeedback {
  impactOccurred(style: 'light'|'medium'|'heavy'|'rigid'|'soft'): this
  notificationOccurred(type: 'error'|'success'|'warning'): this
  selectionChanged(): this
}

// ── Domain types ───────────────────────────────────────────────
export interface StudioInfo {
  name:               string
  bio:                string | null
  phone:              string | null
  instagram:          string | null
  address:            string | null
  latitude:           number | null
  longitude:          number | null
  logo_url:           string | null
  cover_url:          string | null
  default_open_time:  string | null
  default_close_time: string | null
}

export interface Service {
  id:                 number
  name:               string
  description:        string | null
  category:           string
  price_per_hour:     number
  min_duration_hours: number
  photo_url:          string | null
}

export interface Package {
  id:               number
  name:             string
  description:      string | null
  original_price:   number
  discount_percent: number
  final_price:      number
  photo_url:        string | null
}

export interface StaffMember {
  id:         number
  name:       string
  role:       string
  bio:        string | null
  photo_url:  string | null
  instagram:  string | null
  avg_rating: number | null
}

export interface PortfolioItem {
  id:            number
  title:         string
  description:   string | null
  media_url:     string
  media_type:    'photo' | 'video'
  thumbnail_url: string | null
  service_id:    number | null
  staff_id:      number | null
}

export interface TimeSlot {
  time:      string   // ISO string
  available: boolean
}

export interface Booking {
  id:             string
  user_id:        number
  staff_id:       number | null
  service_id:     number | null
  package_id:     number | null
  start_time:     string
  end_time:       string
  duration_hours: number
  total_price:    number
  deposit_amount: number
  status:         BookingStatus
  created_at:     string
}

export type BookingStatus =
  | 'pending_payment'
  | 'confirmed'
  | 'cancelled'
  | 'completed'
  | 'no_show'

export interface Review {
  id:         number
  rating:     number
  text:       string | null
  user_name:  string
  created_at: string
}

export interface LoyaltyProgress {
  current_count:   number
  total_bookings:  number
  redeemed_count:  number
}

export interface PublicStats {
  staff_count:  number
  service_count:number
  avg_rating:   number
  review_count: number
}

// ── Booking wizard state ───────────────────────────────────────
export interface BookingDraft {
  staff:       StaffMember | null
  date:        Date | null
  timeSlot:    TimeSlot | null
  serviceType: 'service' | 'package'
  service:     Service | null
  pkg:         Package | null
  durationH:   number
}
