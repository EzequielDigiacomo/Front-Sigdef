import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';
import DataTable from '../../../components/common/DataTable';
import Button from '../../../components/common/Button';
import PageHeader from '../../../components/common/PageHeader';
import { Plus, Trash2, Edit, Eye, UserCog, X, Award, Users } from 'lucide-react';
import { getCategoriaLabel, normalizeCategoriaId } from '../../../utils/enums';
import { withFederationScope } from '../../../utils/apiHelpers';
import AddAtletaSeleccionModal from './components/AddAtletaSeleccionModal';
import AssignCoachModal from './components/AssignCoachModal';

import DocumentUploadModal from '../../../components/common/DocumentUploadModal';
import DocumentViewerModal from '../../../components/common/DocumentViewerModal';
import ConfirmationModal from '../../../components/common/ConfirmationModal';
import './SeleccionCategoriaDetalle.css';
import './EntrenadorSeleccion.css';

const SeleccionCategoriaDetalle = () => {
    const { categoryId, fedId } = useParams();
    const navigate = useNavigate();
    const [athletes, setAthletes] = useState([]);
    const [coaches, setCoaches] = useState([]);
    const [loadingAthletes, setLoadingAthletes] = useState(true);
    const [loadingCoaches, setLoadingCoaches] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showCoachModal, setShowCoachModal] = useState(false);

    // New state for Upload Modal
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedAthleteForUpload, setSelectedAthleteForUpload] = useState(null);

    // New state for Document Viewer Modal
    const [showViewerModal, setShowViewerModal] = useState(false);
    const [selectedAthleteForViewer, setSelectedAthleteForViewer] = useState(null);

    // Confirmation Modal State
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [confirmationConfig, setConfirmationConfig] = useState({
        type: 'danger',
        title: '',
        message: '',
        onConfirm: () => { }
    });

    const categoryLabel = getCategoriaLabel(parseInt(categoryId, 10));
    const categoryIdNum = parseInt(categoryId, 10);
    const baseSelecciones = fedId
        ? `/superadmin/federacion/${fedId}/selecciones`
        : '/dashboard/selecciones';

    useEffect(() => {
        fetchData();
    }, [categoryId, fedId]);

    const mapCoachesForCategory = (coachesData) =>
        (Array.isArray(coachesData) ? coachesData : [])
            .filter((c) => {
                const inSeleccion = !!(c.perteneceSeleccion ?? c.PerteneceSeleccion ?? true);
                const cat = normalizeCategoriaId(c.categoriaSeleccion ?? c.CategoriaSeleccion);
                return inSeleccion && cat === categoryIdNum;
            })
            .map((c) => {
                const id = c.participanteId ?? c.ParticipanteId ?? c.idPersona ?? c.IdPersona;
                return {
                    id,
                    nombre: c.nombrePersona || c.NombrePersona || 'Entrenador',
                    email: c.email || c.Email || '-',
                    telefono: c.telefono || c.Telefono || '-',
                    idClub: c.idClub ?? c.IdClub ?? null,
                    licencia: c.licencia ?? c.Licencia ?? '',
                    becadoEnard: !!(c.becadoEnard ?? c.BecadoEnard),
                    becadoSdn: !!(c.becadoSdn ?? c.BecadoSdn),
                    montoBeca: c.montoBeca ?? c.MontoBeca ?? 0,
                    presentoAptoMedico: !!(c.presentoAptoMedico ?? c.PresentoAptoMedico),
                };
            });

    const mapAthletesForCategory = (allAthletes) =>
        (allAthletes || [])
            .filter((a) => {
                const inSeleccion = !!(a.perteneceSeleccion ?? a.PerteneceSeleccion);
                const cat = normalizeCategoriaId(a.categoria ?? a.Categoria);
                return inSeleccion && cat === categoryIdNum;
            })
            .map((athlete) => {
                const persona = athlete.participante || athlete.Participante || {};
                const idReal =
                    athlete.idPersona ||
                    athlete.IdPersona ||
                    athlete.participanteId ||
                    athlete.ParticipanteId;
                const nombreFromPersona = persona.nombre || persona.Nombre
                    ? `${persona.nombre || persona.Nombre} ${persona.apellido || persona.Apellido || ''}`.trim()
                    : '';

                return {
                    ...athlete,
                    idPersona: idReal,
                    documento:
                        athlete.documento ||
                        athlete.Documento ||
                        persona.documento ||
                        persona.Documento ||
                        '-',
                    email: athlete.email || athlete.Email || persona.email || persona.Email || '-',
                    nombrePersona:
                        athlete.nombrePersona ||
                        athlete.NombrePersona ||
                        nombreFromPersona ||
                        '-',
                    telefono:
                        athlete.telefono ||
                        athlete.Telefono ||
                        persona.telefono ||
                        persona.Telefono ||
                        '-',
                    direccion: persona.direccion || persona.Direccion || '-',
                    nombreClub:
                        athlete.nombreClub ||
                        athlete.NombreClub ||
                        athlete.club?.nombre ||
                        athlete.Club?.Nombre ||
                        'Sin Club',
                };
            });

    const refreshCoaches = async () => {
        try {
            setLoadingCoaches(true);
            const coachesData = await api
                .get(withFederationScope('/Entrenador/seleccion', fedId))
                .catch(() => api.get(withFederationScope('/Entrenador', fedId)));
            setCoaches(mapCoachesForCategory(coachesData));
        } catch (error) {
            console.error('Error refreshing coaches:', error);
        } finally {
            setLoadingCoaches(false);
        }
    };

    const refreshAthletes = async () => {
        try {
            setLoadingAthletes(true);
            const allAthletes = await api.get(withFederationScope('/Atleta', fedId));
            setAthletes(mapAthletesForCategory(allAthletes));
        } catch (error) {
            console.error('Error refreshing athletes:', error);
        } finally {
            setLoadingAthletes(false);
        }
    };

    const fetchData = () => {
        setLoadingAthletes(true);
        setLoadingCoaches(true);

        api.get(withFederationScope('/Entrenador/seleccion', fedId))
            .catch(() => api.get(withFederationScope('/Entrenador', fedId)))
            .then((coachesData) => setCoaches(mapCoachesForCategory(coachesData)))
            .catch((error) => {
                console.error('Error fetching coaches:', error);
                setCoaches([]);
            })
            .finally(() => setLoadingCoaches(false));

        api.get(withFederationScope('/Atleta', fedId))
            .then((allAthletes) => setAthletes(mapAthletesForCategory(allAthletes)))
            .catch((error) => {
                console.error('Error fetching athletes:', error);
                setAthletes([]);
            })
            .finally(() => setLoadingAthletes(false));
    };

    const handleRemoveAthlete = (athlete) => {
        setConfirmationConfig({
            type: 'danger',
            title: 'Confirmar eliminación',
            message: `¿Estás seguro de que deseas quitar a ${athlete.nombrePersona} de la selección?`,
            onConfirm: async () => {
                const athleteId = athlete.idPersona ?? athlete.IdPersona ?? athlete.participanteId;
                setShowConfirmation(false);
                setAthletes((prev) =>
                    prev.filter((a) => String(a.idPersona ?? a.IdPersona ?? a.participanteId) !== String(athleteId))
                );

                try {
                    await api.put('/Atleta', {
                        ...athlete,
                        perteneceSeleccion: false,
                        categoria: 0,
                    });
                } catch (error) {
                    console.error('Error removing athlete:', error);
                    setAthletes((prev) =>
                        prev.some((a) => String(a.idPersona ?? a.IdPersona ?? a.participanteId) === String(athleteId))
                            ? prev
                            : [...prev, athlete]
                    );
                    setConfirmationConfig({
                        type: 'danger',
                        title: 'Error',
                        message: 'Hubo un error al quitar el atleta de la selección.',
                        onConfirm: () => setShowConfirmation(false),
                        showCancel: false,
                        confirmText: 'Entendido'
                    });
                    setShowConfirmation(true);
                }
            },
            showCancel: true,
            confirmText: 'Quitar',
            cancelText: 'Cancelar'
        });
        setShowConfirmation(true);
    };

    const handleRemoveCoach = (coach) => {
        setConfirmationConfig({
            type: 'danger',
            title: 'Quitar entrenador',
            message: `¿Deseas quitar a ${coach.nombre} del cuerpo técnico de esta categoría? Quedará libre para reasignar.`,
            onConfirm: async () => {
                setShowConfirmation(false);
                setCoaches((prev) => prev.filter((c) => String(c.id) !== String(coach.id)));

                try {
                    await api.put(`/Entrenador/${coach.id}`, {
                        participanteId: coach.id,
                        ParticipanteId: coach.id,
                        idPersona: coach.id,
                        idClub: coach.idClub || null,
                        licencia: coach.licencia || '',
                        perteneceSeleccion: false,
                        categoriaSeleccion: '0',
                        becadoEnard: coach.becadoEnard || false,
                        becadoSdn: coach.becadoSdn || false,
                        montoBeca: coach.montoBeca || 0,
                        presentoAptoMedico: coach.presentoAptoMedico || false,
                    });
                } catch (error) {
                    console.error('Error removing coach:', error);
                    setCoaches((prev) =>
                        prev.some((c) => String(c.id) === String(coach.id))
                            ? prev
                            : [...prev, coach]
                    );
                    setConfirmationConfig({
                        type: 'danger',
                        title: 'Error',
                        message: 'No se pudo quitar al entrenador de la categoría.',
                        onConfirm: () => setShowConfirmation(false),
                        showCancel: false,
                        confirmText: 'Entendido',
                    });
                    setShowConfirmation(true);
                }
            },
            showCancel: true,
            confirmText: 'Quitar',
            cancelText: 'Cancelar',
        });
        setShowConfirmation(true);
    };

    const columns = [
        {
            label: 'Nombre y Apellido',
            key: 'nombrePersona',
            render: (value, row) => <span className="font-medium text-primary">{row.nombrePersona}</span>
        },
        { label: 'Documento', key: 'documento' },
        { label: 'Club', key: 'nombreClub', render: (val) => val || 'Sin Club' },
        { label: 'Email', key: 'email', render: (val) => val || '-' },
        {
            label: 'Beca ENARD',
            key: 'becadoEnard',
            render: (val) => val ? (
                <span className="badge badge-success">SÍ</span>
            ) : (
                <span className="badge badge-secondary">NO</span>
            )
        },
        {
            label: 'Beca SND',
            key: 'becadoSdn',
            render: (val) => val ? (
                <span className="badge badge-success">SÍ</span>
            ) : (
                <span className="badge badge-secondary">NO</span>
            )
        },
        {
            label: 'Monto',
            key: 'montoBeca',
            render: (val) => val ? `$${val.toLocaleString()}` : '$0'
        },
        {
            label: 'Apto Médico',
            key: 'presentoAptoMedico',
            render: (val) => val ? (
                <span className="badge badge-success">SÍ</span>
            ) : (
                <span className="badge badge-danger">NO</span>
            )
        },
        {
            label: 'Documentación',
            key: 'documentacion',
            render: (val, row) => {
                return (
                    <div className="flex items-center justify-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="p-1 h-auto"
                            title="Subir documentos"
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedAthleteForUpload(row);
                                setShowUploadModal(true);
                            }}
                        >
                            <Plus size={18} className="text-primary" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="p-1 h-auto"
                            title="Ver documentos"
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedAthleteForViewer(row);
                                setShowViewerModal(true);
                            }}
                        >
                            <Eye size={18} className="text-primary" />
                        </Button>
                    </div>
                );
            }
        },
        {
            label: 'Acciones',
            key: 'actions',
            render: (value, row) => {
                return (
                    <div className="flex gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (row.idPersona) {
                                    /* alert('DEBUG: Navegando a editar ID ' + row.idPersona); // Uncomment for extreme debug */
                                    navigate(`/dashboard/atletas/editar/${row.idPersona}`);
                                } else {
                                    setConfirmationConfig({
                                        type: 'danger',
                                        title: 'Error',
                                        message: 'No se encontró el ID del atleta para editar.',
                                        onConfirm: () => setShowConfirmation(false),
                                        showCancel: false,
                                        confirmText: 'Entendido'
                                    });
                                    setShowConfirmation(true);
                                    console.error('Fila sin ID:', row);
                                }
                            }}
                            title="Editar Atleta"
                        >
                            <Edit size={18} className="text-primary" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-danger action-btn"
                            onClick={(e) => { e.stopPropagation(); handleRemoveAthlete(row); }}
                            title="Quitar de la selección"
                        >
                            <Trash2 size={18} />
                        </Button>
                    </div>
                );
            }
        }
    ];

    return (
        <div className="sel-page sel-detail-page fade-in">
            <PageHeader
                title={`Categoría ${categoryLabel}`}
                subtitle="Plantel y cuerpo técnico de la selección"
                icon={Award}
                backTo={baseSelecciones}
                backLabel="Selecciones"
                actions={(
                    <div className="sel-detail-actions">
                        <Button variant="secondary" size="sm" icon={UserCog} onClick={() => setShowCoachModal(true)}>
                            Asignar entrenador
                        </Button>
                        <Button variant="primary" size="sm" icon={Plus} onClick={() => setShowAddModal(true)}>
                            Agregar atleta
                        </Button>
                    </div>
                )}
            />

            <div className="sel-detail-summary">
                <div className="sel-kpi">
                    <span className="sel-kpi-label">Atletas</span>
                    <span className="sel-kpi-value">{athletes.length}</span>
                </div>
                <div className="sel-kpi">
                    <span className="sel-kpi-label">Cuerpo técnico</span>
                    <span className="sel-kpi-value">{coaches.length}</span>
                </div>
            </div>

            <section className="sel-staff-panel">
                <div className="sel-staff-panel-head">
                    <h3>
                        <UserCog size={15} />
                        Cuerpo técnico
                    </h3>
                    <span>{coaches.length} asignado{coaches.length !== 1 ? 's' : ''}</span>
                </div>
                {loadingCoaches ? (
                    <p className="sel-staff-empty">Cargando...</p>
                ) : coaches.length === 0 ? (
                    <p className="sel-staff-empty">
                        Sin entrenadores en esta categoría. Usá «Asignar entrenador».
                    </p>
                ) : (
                    <div className="sel-staff-grid">
                        {coaches.map((coach) => (
                            <div key={coach.id} className="sel-staff-chip">
                                <div className="sel-staff-chip-info">
                                    <strong>{coach.nombre}</strong>
                                    <span>{coach.email}</span>
                                    <span>{coach.telefono}</span>
                                </div>
                                <button
                                    type="button"
                                    className="sel-staff-remove"
                                    title="Quitar de la categoría"
                                    aria-label={`Quitar a ${coach.nombre}`}
                                    onClick={() => handleRemoveCoach(coach)}
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <section className="sel-athletes-panel">
                <div className="sel-athletes-panel-head">
                    <h3>
                        <Users size={15} />
                        Plantel
                    </h3>
                    <span>{athletes.length} atleta{athletes.length !== 1 ? 's' : ''}</span>
                </div>
                <DataTable
                    columns={columns}
                    data={athletes}
                    loading={loadingAthletes}
                    pagination={true}
                    itemsPerPage={10}
                    emptyMessage="No hay atletas en esta categoría de selección."
                />
            </section>

            {showAddModal && (
                <AddAtletaSeleccionModal
                    isOpen={showAddModal}
                    onClose={() => setShowAddModal(false)}
                    onSuccess={() => {
                        setShowAddModal(false);
                        refreshAthletes();
                    }}
                    categoryId={categoryIdNum}
                />
            )}

            {showCoachModal && (
                <AssignCoachModal
                    isOpen={showCoachModal}
                    onClose={() => setShowCoachModal(false)}
                    onSuccess={() => {
                        setShowCoachModal(false);
                        refreshCoaches();
                    }}
                    categoryId={categoryIdNum}
                    categoryLabel={categoryLabel}
                />
            )}

            {showUploadModal && selectedAthleteForUpload && (
                <DocumentUploadModal
                    isOpen={showUploadModal}
                    onClose={() => {
                        setShowUploadModal(false);
                        setSelectedAthleteForUpload(null);
                    }}
                    onSuccess={() => {
                        refreshAthletes();
                    }}
                    personName={selectedAthleteForUpload.nombrePersona}
                    personId={selectedAthleteForUpload.idPersona || selectedAthleteForUpload.IdPersona}
                />
            )}

            {showViewerModal && selectedAthleteForViewer && (
                <DocumentViewerModal
                    isOpen={showViewerModal}
                    onClose={() => {
                        setShowViewerModal(false);
                        setSelectedAthleteForViewer(null);
                    }}
                    personName={selectedAthleteForViewer.nombrePersona}
                    personDocumento={selectedAthleteForViewer.documento}
                    personId={selectedAthleteForViewer.idPersona || selectedAthleteForViewer.IdPersona}
                />
            )}

            <ConfirmationModal
                isOpen={showConfirmation}
                onClose={() => setShowConfirmation(false)}
                onConfirm={confirmationConfig.onConfirm}
                title={confirmationConfig.title}
                message={confirmationConfig.message}
                type={confirmationConfig.type}
                confirmText={confirmationConfig.confirmText || 'Confirmar'}
                cancelText={confirmationConfig.cancelText || 'Cancelar'}
                showCancel={confirmationConfig.showCancel !== false}
            />
        </div>
    );
};

export default SeleccionCategoriaDetalle;
