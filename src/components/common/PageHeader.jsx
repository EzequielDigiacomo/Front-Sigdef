import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import './PageHeader.css';

/**
 * Header compartido de módulos.
 * Desktop: [←] [título/leyenda] ........ [acciones]
 * Móvil: título + leyenda arriba; flecha y botones en la fila de abajo.
 */
const PageHeader = ({
    title,
    subtitle,
    icon: Icon,
    actions,
    backTo = '/dashboard',
    backLabel = 'Volver',
    className = '',
}) => {
    const navigate = useNavigate();
    const showBack = backTo !== false && backTo != null;

    const handleBack = () => {
        if (typeof backTo === 'number') {
            navigate(backTo);
            return;
        }
        if (typeof backTo === 'string' && backTo) {
            navigate(backTo);
            return;
        }
        navigate(-1);
    };

    return (
        <div
            className={`module-page-header ${showBack ? 'has-back' : ''} ${actions ? 'has-actions' : ''} ${className}`.trim()}
        >
            {showBack ? (
                <button
                    type="button"
                    className="module-back-btn"
                    onClick={handleBack}
                    aria-label={backLabel}
                    title={backLabel}
                >
                    <ArrowLeft size={18} />
                    <span className="module-back-label">{backLabel}</span>
                </button>
            ) : null}

            <div className="module-page-header-titles">
                <h1 className="module-page-title">
                    {Icon ? <Icon size={20} className="module-page-title-icon" aria-hidden /> : null}
                    {title}
                </h1>
                {subtitle ? <p className="module-page-subtitle">{subtitle}</p> : null}
            </div>

            {actions ? <div className="module-page-header-actions">{actions}</div> : null}
        </div>
    );
};

export default PageHeader;
