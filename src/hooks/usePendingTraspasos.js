import { useCallback, useEffect, useState } from 'react';
import TraspasoService from '../services/traspasoService';
import { useAuth } from '../context/AuthContext';
import { normalizeSolicitud } from '../utils/traspasoUtils';

const POLL_MS = 90_000;

export default function usePendingTraspasos(enabled = true) {
    const { user, isAuthenticated } = useAuth();
    const [pendingCount, setPendingCount] = useState(0);

    const role = user?.role;
    const canUse =
        enabled &&
        isAuthenticated &&
        (role === 'FEDERACION' || role === 'CLUB');

    const refresh = useCallback(async () => {
        if (!canUse) {
            setPendingCount(0);
            return 0;
        }

        try {
            let count = 0;

            if (role === 'FEDERACION') {
                const data = await TraspasoService.getSolicitudes('PendienteFederacion');
                count = Array.isArray(data) ? data.length : 0;
            } else if (role === 'CLUB') {
                const idClub = user?.idClub ?? user?.IdClub;
                const data = await TraspasoService.getSolicitudes('PendienteOrigen');
                const list = (Array.isArray(data) ? data : []).map(normalizeSolicitud);
                count = list.filter((s) => String(s.idClubOrigen) === String(idClub)).length;
            }

            setPendingCount(count);
            return count;
        } catch {
            return 0;
        }
    }, [canUse, role, user?.idClub, user?.IdClub]);

    useEffect(() => {
        if (!canUse) {
            setPendingCount(0);
            return undefined;
        }

        let cancelled = false;

        const tick = async () => {
            if (cancelled) return;
            try {
                await refresh();
            } catch {
                // ignore
            }
        };

        tick();
        const id = setInterval(tick, POLL_MS);

        const onFocus = () => tick();
        const onVisibility = () => {
            if (document.visibilityState === 'visible') tick();
        };

        window.addEventListener('focus', onFocus);
        document.addEventListener('visibilitychange', onVisibility);
        window.addEventListener('traspasos:refresh-pending', tick);

        return () => {
            cancelled = true;
            clearInterval(id);
            window.removeEventListener('focus', onFocus);
            document.removeEventListener('visibilitychange', onVisibility);
            window.removeEventListener('traspasos:refresh-pending', tick);
        };
    }, [canUse, refresh]);

    return {
        pendingCount,
        hasPending: pendingCount > 0,
        refresh,
    };
}
