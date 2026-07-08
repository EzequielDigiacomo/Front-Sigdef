import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit, Mail, Phone, MapPin, Users, Target } from 'lucide-react';
import Modal from '../../../../components/common/Modal';
import Button from '../../../../components/common/Button';
import { getEstadoPagoLabel, getEstadoPagoColor } from '../../../../utils/enums';

const ClubDetailModal = ({ isOpen, onClose, club, fedId, returnPath }) => {
    const navigate = useNavigate();
    if (!club) return null;

    const editPath = fedId
        ? `/superadmin/federacion/${fedId}/clubes/editar/${club.idClub}`
        : `/dashboard/clubes/editar/${club.idClub}`;

    const detailPath = fedId
        ? `/superadmin/federacion/${fedId}/clubes/detalles/${club.idClub}`
        : `/dashboard/clubes/detalles/${club.idClub}`;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={club.nombre}
            size="medium"
            footer={
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    <Button variant="outline" onClick={onClose}>Cerrar</Button>
                    <Button variant="outline" onClick={() => { onClose(); navigate(detailPath); }}>
                        Ver página completa
                    </Button>
                    <Button onClick={() => { onClose(); navigate(editPath, { state: { returnPath } }); }} icon={Edit}>
                        Editar
                    </Button>
                </div>
            }
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span className="badge badge-info" style={{ fontSize: '0.85rem' }}>{club.siglas || '—'}</span>
                    <span className={`badge badge-${getEstadoPagoColor(club.estadoMatricula)}`}>
                        {getEstadoPagoLabel(club.estadoMatricula)}
                    </span>
                </div>

                <div style={{ display: 'grid', gap: '0.6rem', fontSize: '0.9rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                        <Mail size={16} /> {club.email || 'Sin email'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                        <Phone size={16} /> {club.telefono || 'Sin teléfono'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                        <MapPin size={16} /> {club.direccion || 'Sin dirección'}
                    </div>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '0.5rem',
                    marginTop: '0.5rem',
                }}>
                    <div className="glass-panel" style={{ padding: '0.75rem', textAlign: 'center' }}>
                        <Users size={16} style={{ color: 'var(--primary)', marginBottom: '4px' }} />
                        <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{club.cantidadAtletas ?? 0}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Atletas</div>
                    </div>
                    <div className="glass-panel" style={{ padding: '0.75rem', textAlign: 'center' }}>
                        <Target size={16} style={{ color: '#f59e0b', marginBottom: '4px' }} />
                        <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{club.cantidadEntrenadores ?? 0}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Entrenadores</div>
                    </div>
                    <div className="glass-panel" style={{ padding: '0.75rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{club.tieneDelegado ? '✓' : '—'}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Delegado</div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default ClubDetailModal;
