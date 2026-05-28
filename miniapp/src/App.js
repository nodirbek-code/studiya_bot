import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { BottomNav } from '@/components/BottomNav';
import HomePage from '@/pages/Home';
import CatalogPage from '@/pages/Catalog';
import BookingPage from '@/pages/Booking';
import ProfilePage from '@/pages/Profile';
import AboutPage from '@/pages/About';
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 2, // 2 daqiqa
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
});
export default function App() {
    return (_jsx(QueryClientProvider, { client: queryClient, children: _jsx(BrowserRouter, { children: _jsxs("div", { className: "min-h-screen bg-bg-primary text-text-primary", children: [_jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(HomePage, {}) }), _jsx(Route, { path: "/catalog", element: _jsx(CatalogPage, {}) }), _jsx(Route, { path: "/booking", element: _jsx(BookingPage, {}) }), _jsx(Route, { path: "/profile", element: _jsx(ProfilePage, {}) }), _jsx(Route, { path: "/about", element: _jsx(AboutPage, {}) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/", replace: true }) })] }), _jsx(BottomNav, {})] }) }) }));
}
