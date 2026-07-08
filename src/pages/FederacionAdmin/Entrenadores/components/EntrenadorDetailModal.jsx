import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit, Mail, Phone, FileText, Building2 } from 'lucide-react';
import Modal from '../../../../components/common/Modal';
import Button from '../../../../components/common/Button';
import { getCategoriaLabel } from '../../../../utils/enums';

const EntrenadorDetailModal = ({
    isOpen,
    onClose,
    entrenador,
    viewMode = 'club',
    fedId,
    returnPath,
}) => {
    const navigate = useNavigate();
    if (!entrenador) return null;

    const id = entrenador.idPersona || entrenador.id;
    const nombre = entrenador.nombrePersona || `${entrenador.nombre || ''} ${entrenador.apellido || ''}`.trim();

    const editPath = fedId
        ? (viewMode === 'seleccion'
            ? `/superadmin/federacion/${fedId}/entrenadores-seleccion/editar/${id}`
            : `/superadmin/federacion/${fedId}/entrenadores/editar/${id}`)
        : (viewMode === 'seleccion'
            ? `/dashboard/entrenadores-seleccion/editar/${id}`
            : `/dashboard/entrenadores/editar/${id}`);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={nombre}
            size="medium"
            footer={
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                    <Button variant="outline" onClick={onClose}>Cerrar</Button>
                    <Button onClick={() => { onClose(); navigate(editPath, { state: { returnPath } }); }} icon={Edit}>
                        Editar
                    </Button>
                </div>
            }
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileText size={16} /> <strong>DNI:</strong> {entrenador.documento || '—'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Mail size={16} /> {entrenador.email || 'Sin email'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Phone size={16} /> {entrenador.telefono || 'Sin teléfono'}
                </div>
                {viewMode === 'club' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Building2 size={16} /> {entrenador.nombreClub || 'Sin club'}
                    </div>
                )}
                {viewMode === 'seleccion' && (
                    <>
                        <div><strong>Categoría:</strong> {getCategoriaLabel(entrenador.categoriaSeleccion)}</div>
                        <div><strong>Beca ENARD:</strong> {entrenador.becadoEnard ? 'Sí' : 'No'}</div>
                        <div><strong>Beca SND:</strong> {entrenador.becadoSdn ? 'Sí' : 'No'}</div>
                        <div><strong>Apto médico:</strong> {entrenador.presentoAptoMedico ? 'Sí' : 'No'}</div>
                    </>
                )}
                {viewMode === 'club' && entrenador.licencia && (
                    <div><strong>Licencia:</strong> {entrenador.licencia}</div>
                )}
            </div>
        </Modal>
    );
};

export default EntrenadorDetailModal;
