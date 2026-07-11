import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit, Mail, Phone, FileText, Building2, Award } from 'lucide-react';
import Modal from '../../../../components/common/Modal';
import Button from '../../../../components/common/Button';
import { getCategoriaLabel } from '../../../../utils/enums';

const EntrenadorDetailModal = ({
    isOpen,
    onClose,
    entrenador,
    fedId,
    returnPath,
}) => {
    const navigate = useNavigate();
    if (!entrenador) return null;

    const id = entrenador.idPersona || entrenador.id;
    const nombre =
        entrenador.nombrePersona ||
        `${entrenador.nombre || ''} ${entrenador.apellido || ''}`.trim();

    const editPath = fedId
        ? `/superadmin/federacion/${fedId}/entrenadores/editar/${id}`
        : `/dashboard/entrenadores/editar/${id}`;

    const inSeleccion = !!(entrenador.perteneceSeleccion ?? entrenador.PerteneceSeleccion);
    const clubName = entrenador.nombreClub || entrenador.NombreClub;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={nombre}
            size="medium"
            footer={
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                    <Button variant="outline" onClick={onClose}>
                        Cerrar
                    </Button>
                    <Button
                        onClick={() => {
                            onClose();
                            navigate(editPath, {
                                state: { returnPath, entrenador },
                            });
                        }}
                        icon={Edit}
                    >
                        Editar
                    </Button>
                </div>
            }
        >
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.85rem',
                    fontSize: '0.9rem',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileText size={16} /> <strong>DNI:</strong> {entrenador.documento || '—'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Mail size={16} /> {entrenador.email || 'Sin email'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Phone size={16} /> {entrenador.telefono || 'Sin teléfono'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Building2 size={16} /> {clubName || 'Sin club'}
                </div>
                {entrenador.licencia && (
                    <div>
                        <strong>Licencia:</strong> {entrenador.licencia}
                    </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Award size={16} />
                    <strong>Selección:</strong>{' '}
                    {inSeleccion
                        ? `Sí — ${getCategoriaLabel(entrenador.categoriaSeleccion)}`
                        : 'No'}
                </div>
                {inSeleccion && (
                    <>
                        <div>
                            <strong>Beca ENARD:</strong> {entrenador.becadoEnard ? 'Sí' : 'No'}
                        </div>
                        <div>
                            <strong>Beca SND:</strong> {entrenador.becadoSdn ? 'Sí' : 'No'}
                        </div>
                        <div>
                            <strong>Apto médico:</strong>{' '}
                            {entrenador.presentoAptoMedico ? 'Sí' : 'No'}
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
};

export default EntrenadorDetailModal;
