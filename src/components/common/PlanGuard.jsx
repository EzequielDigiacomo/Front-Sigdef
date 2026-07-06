import React from 'react';
import { ShieldOff, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { normalizePlan } from '../../utils/planHelpers';

/**
 * PlanGuard: bloquea acceso si el plan SaaS no incluye el módulo requerido.
 */
const PlanGuard = ({ children, requiereSigdef, requiereSportTrack, requiereControlesLive, user }) => {
    const plan = normalizePlan(user?.plan);
    const rol = user?.role || user?.rol || '';
    const isSuperAdmin = rol === 'SUPERADMIN' || rol === 'SuperAdmin';

    if (isSuperAdmin) return children;

    if (!plan) {
        return <PlanBloqueado motivo="Tu cuenta no tiene un plan SaaS asignado. Contactá al administrador." />;
    }

    if (requiereSigdef && !plan.accesoSigdef) {
        return (
            <PlanBloqueado
                motivo={`Tu plan actual (${plan.nombre}) no incluye acceso a SIGDEF. Necesitás un plan SIGDEF o Pack Dúo.`}
            />
        );
    }

    if (requiereSportTrack && !plan.accesoSportTrack) {
        return <PlanBloqueado motivo="Tu plan actual no incluye acceso al sistema SportTrack. Actualizá tu plan." />;
    }

    if (requiereControlesLive && !plan.accesoControlesLive) {
        return <PlanBloqueado motivo="Los paneles de control en vivo están disponibles únicamente en planes de nivel L." />;
    }

    return children;
};

const PlanBloqueado = ({ motivo }) => {
    const { logout } = useAuth();
    return (
    <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary, #0a0c12)',
        padding: '2rem'
    }}>
        <div style={{
            maxWidth: '480px',
            width: '100%',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '20px',
            padding: '3rem 2.5rem',
            textAlign: 'center',
            backdropFilter: 'blur(12px)'
        }}>
            <div style={{
                width: 72, height: 72,
                borderRadius: '50%',
                background: 'rgba(239,68,68,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1.5rem'
            }}>
                <ShieldOff size={36} color="#ef4444" />
            </div>
            <h2 style={{
                margin: '0 0 0.75rem',
                fontSize: '1.5rem',
                fontWeight: 700,
                color: '#f1f5f9'
            }}>
                Acceso no disponible
            </h2>
            <p style={{
                color: '#94a3b8',
                fontSize: '0.95rem',
                lineHeight: 1.6,
                margin: '0 0 2rem'
            }}>
                {motivo}
            </p>
            <div style={{
                padding: '0.75rem 1rem',
                background: 'rgba(239,68,68,0.08)',
                borderRadius: '10px',
                border: '1px solid rgba(239,68,68,0.2)',
                fontSize: '0.8rem',
                color: '#fca5a5'
            }}>
                💡 Planes disponibles: <strong>S</strong>, <strong>M</strong> y <strong>L</strong> — tanto para SIGDEF, SportTrack o Pack Dúo (acceso a ambos).
            </div>
            
            <button 
                onClick={logout}
                style={{ marginTop: '2rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontWeight: 500, transition: 'background 0.2s' }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            >
                <LogOut size={18} /> Cerrar Sesión
            </button>
        </div>
    </div>
    );
};

export default PlanGuard;
