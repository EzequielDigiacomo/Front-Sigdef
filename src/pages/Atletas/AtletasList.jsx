import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { Plus, Edit, Trash2, Search, FileText } from 'lucide-react';
import { getCategoriaLabel, getEstadoPagoLabel, getEstadoPagoColor } from '../../utils/enums';
import './Atletas.css';
import Modal from '../../components/common/Modal';

const AtletasList = () => {
    const [atletas, setAtletas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedAtleta, setSelectedAtleta] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        loadAtletas();
    }, []);

    const loadAtletas = async () => {
        try {
            const data = await api.get('/Atleta');
            // Enriquecer cada atleta con datos de Persona y tutor (si es menor)
            const atletasEnriquecidos = await Promise.all(
                data.map(async (atleta) => {
                    // Obtener datos de Persona para DNI (si no viene en el DTO)
                    let personaData = null;
                    try {
                        personaData = await api.get(`/Persona/${atleta.idPersona}`);
                    } catch (err) {
                        console.error('Error obteniendo Persona', err);
                    }

                    // Calcular edad para saber si necesita tutor
                    // Calcular edad para saber si necesita tutor
                    const fechaNac = personaData?.fechaNacimiento || atleta.fechaNacimiento;
                    let edad = null;
                    let tutorInfo = null;
                    if (fechaNac) {
                        const hoy = new Date();
                        const nacimiento = new Date(fechaNac);
                        edad = hoy.getFullYear() - nacimiento.getFullYear();
                        const mes = hoy.getMonth() - nacimiento.getMonth();
                        if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
                            edad--;
                        }
                        if (edad < 18) {
                            try {
                                const relaciones = await api.get(`/AtletaTutor/atleta/${atleta.idPersona}`);
                                if (relaciones && relaciones.length > 0) {
                                    const tutorId = relaciones[0].idTutor;
                                    const tutorPersona = await api.get(`/Persona/${tutorId}`);
                                    tutorInfo = {
                                        nombre: tutorPersona.nombre || '',
                                        apellido: tutorPersona.apellido || '',
                                        documento: tutorPersona.documento || '',
                                        telefono: tutorPersona.telefono || ''
                                    };
                                }
                            } catch (err) {
                                console.error('Error obteniendo tutor', err);
                            }
                        }
                    }

                    return {
                        ...atleta,
                        documento: personaData?.documento || atleta.documento || '-',
                        fechaNacimiento: personaData?.fechaNacimiento || atleta.fechaNacimiento || null,
                        edad: edad,
                        fechaCreacion: atleta.fechaCreacion || personaData?.fechaCreacion || new Date().toISOString(),
                        tutorInfo
                    };
                })
            );

            // Ordenar por ID descendente (más reciente primero)
            atletasEnriquecidos.sort((a, b) => b.idPersona - a.idPersona);
            setAtletas(atletasEnriquecidos);
        } catch (error) {
            console.error('Error cargando atletas:', error);
        } finally {
            setLoading(false);
        }
    };

    const getEntrenadorSeleccion = (atleta) => {
        if (atleta.perteneceSeleccion && atleta.categoria) {
            return `Entrenador ${getCategoriaLabel(atleta.categoria)}`;
        }
        return '-';
    };

    const handleRowClick = (atleta) => {
        setSelectedAtleta(atleta);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedAtleta(null);
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h2 className="page-title">Gestión de Atletas</h2>
                <Button onClick={() => navigate('/atletas/nuevo')}>
                    <Plus size={20} /> Nuevo Atleta
                </Button>
            </div>

            <Card>
                <div className="filters-bar">
                    <div className="search-input-wrapper">
                        <Search size={18} className="search-icon" />
                        <input type="text" placeholder="Buscar por nombre..." className="search-input" />
                    </div>
                </div>

                <div className="table-responsive">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Nombre Completo</th>
                                <th>DNI</th>
                                <th>Edad</th>
                                <th>Club</th>
                                <th>Categoría</th>
                                <th>Fecha Alta</th>
                                <th>Tutor</th>
                                <th>Selección</th>
                                <th>Estado Pago</th>
                                <th>Documentación</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="11" className="text-center">Cargando...</td></tr>
                            ) : atletas.length === 0 ? (
                                <tr><td colSpan="11" className="text-center">No hay atletas registrados</td></tr>
                            ) : (
                                atletas.map((atleta) => (
                                    <tr
                                        key={atleta.idPersona}
                                        onClick={() => handleRowClick(atleta)}
                                        style={{ cursor: 'pointer' }}
                                        className="hover:bg-gray-50"
                                    >
                                        <td>{atleta.nombrePersona || '-'}</td>
                                        <td>{atleta.documento}</td>
                                        <td>{atleta.edad !== null ? `${atleta.edad} ` : '-'}</td>
                                        <td>{atleta.nombreClub || '-'}</td>
                                        <td>{atleta.categoria != null ? getCategoriaLabel(atleta.categoria) : '-'}</td>
                                        <td>
                                            {atleta.fechaCreacion ? (
                                                <div style={{ fontSize: '0.85rem' }}>
                                                    {new Date(atleta.fechaCreacion).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                    <br />
                                                    {new Date(atleta.fechaCreacion).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            ) : '-'}
                                        </td>
                                        <td>
                                            {atleta.tutorInfo ? (
                                                <div style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>
                                                    <div><strong>{atleta.tutorInfo.nombre} {atleta.tutorInfo.apellido}</strong></div>
                                                    <div>DNI: {atleta.tutorInfo.documento}</div>
                                                    <div>Tel: {atleta.tutorInfo.telefono || 'N/A'}</div>
                                                </div>
                                            ) : (
                                                <span className="text-muted">-</span>
                                            )}
                                        </td>
                                        <td>
                                            {atleta.perteneceSeleccion ? (
                                                <span className="badge badge-success">Sí</span>
                                            ) : (
                                                <span className="badge badge-secondary">No</span>
                                            )}
                                        </td>
                                        <td>
                                            <span className={`badge badge-${getEstadoPagoColor(atleta.estadoPago)}`}> {getEstadoPagoLabel(atleta.estadoPago)} </span>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <FileText size={18} style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
                                        </td>
                                        <td>
                                            <div className="actions-cell" onClick={(e) => e.stopPropagation()}>
                                                <Button variant="ghost" size="sm" onClick={() => navigate(`/atletas/editar/${atleta.idPersona}`)}>
                                                    <Edit size={18} />
                                                </Button>
                                                <Button variant="ghost" size="sm" className="text-danger">
                                                    <Trash2 size={18} />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Modal
                isOpen={showModal}
                onClose={handleCloseModal}
                title="Detalle del Atleta"
                footer={
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                        <Button variant="secondary" onClick={handleCloseModal}>Cerrar</Button>
                        {selectedAtleta && (
                            <Button
                                variant="primary"
                                onClick={() => {
                                    handleCloseModal();
                                    navigate(`/atletas/editar/${selectedAtleta.idPersona}`);
                                }}
                            >
                                <Edit size={18} /> Editar Atleta
                            </Button>
                        )}
                    </div>
                }
            >
                {selectedAtleta && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div>
                            <label className="detail-label">Nombre Completo</label>
                            <div className="detail-value">{selectedAtleta.nombrePersona}</div>
                        </div>
                        <div>
                            <label className="detail-label">Documento</label>
                            <div className="detail-value">{selectedAtleta.documento}</div>
                        </div>
                        <div>
                            <label className="detail-label">Club</label>
                            <div className="detail-value">{selectedAtleta.nombreClub}</div>
                        </div>
                        <div>
                            <label className="detail-label">Categoría</label>
                            <div className="detail-value">{getCategoriaLabel(selectedAtleta.categoria)}</div>
                        </div>
                        {selectedAtleta.tutorInfo && (
                            <>
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label className="detail-label">Tutor</label>
                                    <div className="detail-value">
                                        {selectedAtleta.tutorInfo.nombre} {selectedAtleta.tutorInfo.apellido}<br />
                                        DNI: {selectedAtleta.tutorInfo.documento}<br />
                                        Tel: {selectedAtleta.tutorInfo.telefono || 'N/A'}
                                    </div>
                                </div>
                            </>
                        )}
                        <div>
                            <label className="detail-label">Selección Nacional</label>
                            <div className="detail-value">
                                {selectedAtleta.perteneceSeleccion ? (
                                    <span className="badge badge-success">Sí</span>
                                ) : (
                                    <span className="badge badge-secondary">No</span>
                                )}
                            </div>
                        </div>
                        {selectedAtleta.perteneceSeleccion && (
                            <div>
                                <label className="detail-label">Entrenador de Selección</label>
                                <div className="detail-value highlight">{getEntrenadorSeleccion(selectedAtleta)}</div>
                            </div>
                        )}
                        <div>
                            <label className="detail-label">Estado de Pago</label>
                            <div>
                                <span className={`badge badge-${getEstadoPagoColor(selectedAtleta.estadoPago)}`}> {getEstadoPagoLabel(selectedAtleta.estadoPago)} </span>
                            </div>
                        </div>
                        <div>
                            <label className="detail-label">Fecha de Nacimiento</label>
                            <div className="detail-value">{selectedAtleta.fechaNacimiento ? new Date(selectedAtleta.fechaNacimiento).toLocaleDateString() : '-'}</div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default AtletasList;