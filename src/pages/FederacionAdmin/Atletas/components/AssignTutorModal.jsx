import React, { useState, useEffect } from 'react';
import { Search, UserPlus, CheckCircle, XCircle } from 'lucide-react';
import { api } from '../../../../services/api';
import Modal from '../../../../components/common/Modal';
import Button from '../../../../components/common/Button';
import FormField from '../../../../components/forms/FormField';
import { PARENTESCO_MAP } from '../../../../utils/enums';

const AssignTutorModal = ({ isOpen, onClose, athlete, onSuccess }) => {
    const [tutors, setTutors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTutor, setSelectedTutor] = useState(null);
    const [idParentesco, setIdParentesco] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen) {
            loadTutors();
        }
    }, [isOpen]);

    const loadTutors = async () => {
        setLoading(true);
        try {
            // We fetch Persona joined with Tutor role if possible
            // For now, let's fetch all Tutors
            const tutorsData = await api.get('/Tutor');

            // Map to include Persona details if not present (usually Tutor endpoint returns them)
            setTutors(tutorsData || []);
        } catch (err) {
            console.error('Error loading tutors:', err);
            setError('No se pudieron cargar los tutores registrados.');
        } finally {
            setLoading(false);
        }
    };

    const filteredTutors = tutors.filter(t => {
        const search = searchTerm.toLowerCase();
        const fullNombre = `${t.nombrePersona || ''} ${t.apellido || ''}`.toLowerCase();
        const documento = (t.documento || t.Documento || '').toString();
        return fullNombre.includes(search) || documento.includes(search);
    });

    const handleAssign = async () => {
        if (!selectedTutor) return;

        setSubmitting(true);
        setError(null);
        try {
            const payload = {
                IdAtleta: athlete.idPersona,
                IdTutor: selectedTutor.idPersona || selectedTutor.IdPersona,
                IdParentesco: parseInt(idParentesco)
            };

            await api.post('/AtletaTutor', payload);
            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            console.error('Error assigning tutor:', err);
            setError('Hubo un problema al vincular el tutor. Es posible que ya esté vinculado.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Asignar Tutor a ${athlete?.nombrePersona}`}
            footer={
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                    <Button variant="secondary" onClick={onClose} disabled={submitting}>
                        Cancelar
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleAssign}
                        disabled={!selectedTutor || submitting}
                        isLoading={submitting}
                    >
                        <UserPlus size={18} /> Asignar Tutor
                    </Button>
                </div>
            }
        >
            <div style={{ padding: '1rem' }}>
                <div style={{ marginBottom: '1.5rem' }}>
                    <FormField
                        label="Buscar Tutor Existente"
                        icon={Search}
                        placeholder="Nombre o DNI del tutor..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {error && (
                    <div className="alert alert-danger" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <XCircle size={18} /> {error}
                    </div>
                )}

                <div className="tutor-list-container" style={{
                    maxHeight: '300px',
                    overflowY: 'auto',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    marginBottom: '1.5rem'
                }}>
                    {loading ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            Cargando tutores...
                        </div>
                    ) : filteredTutors.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            No se encontraron tutores que coincidan con la búsqueda.
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--bg-secondary)', zIndex: 1 }}>
                                <tr>
                                    <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>Nombre</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>Documento</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid var(--border-color)' }}>Seleccionar</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTutors.map(t => (
                                    <tr
                                        key={t.idPersona || t.IdPersona}
                                        onClick={() => setSelectedTutor(t)}
                                        style={{
                                            cursor: 'pointer',
                                            backgroundColor: selectedTutor?.idPersona === (t.idPersona || t.IdPersona) ? 'var(--primary-light)' : 'transparent'
                                        }}
                                    >
                                        <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                                            {t.nombrePersona || `${t.nombre} ${t.apellido}`}
                                        </td>
                                        <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                                            {t.documento || t.Documento}
                                        </td>
                                        <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-color)', textAlign: 'center' }}>
                                            <input
                                                type="radio"
                                                name="selectedTutor"
                                                checked={selectedTutor?.idPersona === (t.idPersona || t.IdPersona)}
                                                onChange={() => setSelectedTutor(t)}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="form-group">
                    <label className="detail-label">Parentesco / Relación</label>
                    <select
                        className="form-input"
                        value={idParentesco}
                        onChange={(e) => setIdParentesco(e.target.value)}
                        style={{ marginTop: '0.5rem' }}
                    >
                        {Object.entries(PARENTESCO_MAP).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                        ))}
                    </select>
                </div>
            </div>
        </Modal>
    );
};

export default AssignTutorModal;
