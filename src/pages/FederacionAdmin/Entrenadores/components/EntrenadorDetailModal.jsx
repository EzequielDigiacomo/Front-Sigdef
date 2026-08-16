import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Edit,
    Mail,
    Phone,
    FileText,
    Building2,
    Award,
    BadgeCheck,
    HeartPulse,
    X,
} from 'lucide-react';
import Button from '../../../../components/common/Button';
import { getCategoriaLabel } from '../../../../utils/enums';
import './EntrenadorDetailModal.css';

const Field = ({ icon: Icon, label, value, mono }) => (
    <div className="edm-field">
        <span className="edm-field-icon" aria-hidden>
            {Icon ? <Icon size={14} /> : null}
        </span>
        <div className="edm-field-body">
            <span className="edm-field-label">{label}</span>
            <span className={`edm-field-value${mono ? ' is-mono' : ''}`}>{value || '—'}</span>
        </div>
    </div>
);

const Chip = ({ ok, children }) => (
    <span className={`edm-chip${ok ? ' is-ok' : ' is-no'}`}>{children}</span>
);

const EntrenadorDetailModal = ({
    isOpen,
    onClose,
    entrenador,
    fedId,
    returnPath,
}) => {
    const navigate = useNavigate();
    if (!isOpen || !entrenador) return null;

    const id = entrenador.idPersona || entrenador.id;
    const nombre =
        entrenador.nombrePersona ||
        `${entrenador.nombre || ''} ${entrenador.apellido || ''}`.trim() ||
        'Entrenador';

    const initials = nombre
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase())
        .join('');

    const editPath = fedId
        ? `/superadmin/federacion/${fedId}/entrenadores/editar/${id}`
        : `/dashboard/entrenadores/editar/${id}`;

    const inSeleccion = !!(entrenador.perteneceSeleccion ?? entrenador.PerteneceSeleccion);
    const clubName = entrenador.nombreClub || entrenador.NombreClub || 'Agente Libre';
    const categoria = inSeleccion
        ? getCategoriaLabel(entrenador.categoriaSeleccion ?? entrenador.CategoriaSeleccion)
        : null;
    const licencia = entrenador.licencia || entrenador.Licencia || '—';
    const becadoEnard = !!(entrenador.becadoEnard ?? entrenador.BecadoEnard);
    const becadoSdn = !!(entrenador.becadoSdn ?? entrenador.BecadoSdn);
    const apto = !!(entrenador.presentoAptoMedico ?? entrenador.PresentoAptoMedico);

    return (
        <div className="edm-overlay" onClick={onClose}>
            <div
                className="edm-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="edm-title"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="edm-header">
                    <div className="edm-identity">
                        <div className="edm-avatar" aria-hidden>{initials || 'E'}</div>
                        <div className="edm-identity-text">
                            <h3 id="edm-title" className="edm-title">{nombre}</h3>
                            <div className="edm-subrow">
                                <span className="edm-muted">{clubName}</span>
                                {inSeleccion ? (
                                    <Chip ok>Selección · {categoria || '—'}</Chip>
                                ) : (
                                    <Chip>Sin selección</Chip>
                                )}
                            </div>
                        </div>
                    </div>
                    <button type="button" className="edm-close" onClick={onClose} aria-label="Cerrar">
                        <X size={18} />
                    </button>
                </header>

                <div className="edm-body">
                    <section className="edm-section">
                        <h4 className="edm-section-title">Contacto</h4>
                        <div className="edm-grid">
                            <Field icon={FileText} label="DNI" value={entrenador.documento || entrenador.Documento} mono />
                            <Field icon={Mail} label="Email" value={entrenador.email || entrenador.Email} />
                            <Field icon={Phone} label="Teléfono" value={entrenador.telefono || entrenador.Telefono} />
                            <Field icon={Building2} label="Club" value={clubName} />
                        </div>
                    </section>

                    <section className="edm-section">
                        <h4 className="edm-section-title">Datos deportivos</h4>
                        <div className="edm-grid">
                            <Field icon={BadgeCheck} label="Licencia" value={licencia} />
                            <Field
                                icon={Award}
                                label="Selección"
                                value={inSeleccion ? `Sí — ${categoria || '—'}` : 'No'}
                            />
                            <div className="edm-field edm-field-span">
                                <span className="edm-field-icon" aria-hidden>
                                    <HeartPulse size={14} />
                                </span>
                                <div className="edm-field-body">
                                    <span className="edm-field-label">Estado</span>
                                    <div className="edm-chips">
                                        <Chip ok={becadoEnard}>ENARD {becadoEnard ? 'Sí' : 'No'}</Chip>
                                        <Chip ok={becadoSdn}>SND {becadoSdn ? 'Sí' : 'No'}</Chip>
                                        <Chip ok={apto}>Apto {apto ? 'Sí' : 'No'}</Chip>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                <footer className="edm-footer">
                    <Button variant="secondary" size="sm" onClick={onClose}>
                        Cerrar
                    </Button>
                    <Button
                        variant="primary"
                        size="sm"
                        icon={Edit}
                        onClick={() => {
                            onClose();
                            navigate(editPath, {
                                state: { returnPath, entrenador },
                            });
                        }}
                    >
                        Editar
                    </Button>
                </footer>
            </div>
        </div>
    );
};

export default EntrenadorDetailModal;
