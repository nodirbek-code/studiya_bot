import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { BottomNav } from '@/components/BottomNav'
import HomePage    from '@/pages/Home'
import CatalogPage from '@/pages/Catalog'
import BookingPage from '@/pages/Booking'
import ProfilePage from '@/pages/Profile'
import AboutPage   from '@/pages/About'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:  1000 * 60 * 2,   // 2 daqiqa
      retry:      1,
      refetchOnWindowFocus: false,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen bg-bg-primary text-text-primary">
          <Routes>
            <Route path="/"        element={<HomePage />} />
            <Route path="/catalog" element={<CatalogPage />} />
            <Route path="/booking" element={<BookingPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/about"   element={<AboutPage />} />
            <Route path="*"        element={<Navigate to="/" replace />} />
          </Routes>
          <BottomNav />
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
