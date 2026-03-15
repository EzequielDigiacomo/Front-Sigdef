import { useState, useEffect } from 'react';

export const useDevice = () => {
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [isNative, setIsNative] = useState(
        window.Capacitor && window.Capacitor.getPlatform() !== 'web'
    );

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        window.addEventListener('resize', handleResize);
        
        // Verificación adicional de Capacitor
        if (window.Capacitor) {
            setIsNative(window.Capacitor.getPlatform() !== 'web');
        }

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return {
        isMobile,
        isNative,
        isDesktop: !isMobile && !isNative
    };
};
