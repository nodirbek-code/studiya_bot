import { useEffect, useCallback } from 'react';
const tg = window.Telegram?.WebApp;
export function useTelegram() {
    useEffect(() => {
        if (tg) {
            tg.ready();
            tg.expand();
        }
    }, []);
    const showMainButton = useCallback((text, onClick) => {
        if (!tg)
            return;
        tg.MainButton.setText(text).onClick(onClick).show().enable();
    }, []);
    const hideMainButton = useCallback((onClick) => {
        if (!tg)
            return;
        if (onClick)
            tg.MainButton.offClick(onClick);
        tg.MainButton.hide();
    }, []);
    const showBackButton = useCallback((onClick) => {
        if (!tg)
            return;
        tg.BackButton.onClick(onClick).show();
    }, []);
    const hideBackButton = useCallback((onClick) => {
        if (!tg)
            return;
        if (onClick)
            tg.BackButton.offClick(onClick);
        tg.BackButton.hide();
    }, []);
    const haptic = useCallback((type) => {
        if (!tg)
            return;
        if (type === 'success')
            tg.HapticFeedback.notificationOccurred('success');
        else if (type === 'error')
            tg.HapticFeedback.notificationOccurred('error');
        else
            tg.HapticFeedback.impactOccurred(type);
    }, []);
    const openLink = useCallback((url) => {
        tg?.openLink(url);
    }, []);
    return {
        tg,
        user: tg?.initDataUnsafe?.user,
        showMainButton,
        hideMainButton,
        showBackButton,
        hideBackButton,
        haptic,
        openLink,
    };
}
