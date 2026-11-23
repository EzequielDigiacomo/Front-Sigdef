import React from 'react';
import './AtletasCupoBar.css';

/**
 * Barra de cupo de atletas del plan SaaS (actual / máximo).
 * maxAtletas = -1 → ilimitado.
 */
const AtletasCupoBar = ({
    actual = 0,
    maxAtletas = -1,
    planNombre = '',
    loading = false,
    className = '',
    style,
}) => {
    const actualN = Math.max(0, Number(actual) || 0);
    const maxN = Number(maxAtletas);
    const unlimited = !Number.isFinite(maxN) || maxN < 0;
    const pct = unlimited
        ? 0
        : Math.min(100, Math.round((actualN / Math.max(maxN, 1)) * 100));

    let tone = 'ok';
    if (!unlimited) {
        if (pct >= 100) tone = 'full';
        else if (pct >= 85) tone = 'warn';
    }

    const maxLabel = unlimited ? 'Ilimitado' : String(maxN);
    const subtitle = planNombre
        ? `Cupo del plan ${planNombre}`
        : 'Cupo de atletas del plan';

    return (
        <div className={`atletas-cupo ${className}`.trim()} data-tone={tone} style={style}>
            <div className="atletas-cupo-head">
                <div>
                    <p className="atletas-cupo-title">{subtitle}</p>
                    <p className="atletas-cupo-count">
                        {loading ? '…' : (
                            <>
                                <strong>{actualN.toLocaleString('es-AR')}</strong>
                                <span> / {maxLabel}</span>
                            </>
                        )}
                    </p>
                </div>
                <span className="atletas-cupo-pct">
                    {loading ? '…' : (unlimited ? 'Sin tope' : `${pct}%`)}
                </span>
            </div>
            <div className="atletas-cupo-track" aria-hidden={loading}>
                <div
                    className="atletas-cupo-fill"
                    style={{ width: loading ? '0%' : (unlimited ? '8%' : `${pct}%`) }}
                />
            </div>
            {!unlimited && pct >= 100 && (
                <p className="atletas-cupo-hint">
                    Límite alcanzado. Para cargar más atletas hay que subir de plan.
                </p>
            )}
            {!unlimited && pct >= 85 && pct < 100 && (
                <p className="atletas-cupo-hint">
                    Quedan {Math.max(0, maxN - actualN)} lugares disponibles.
                </p>
            )}
        </div>
    );
};

export default AtletasCupoBar;
