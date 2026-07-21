import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../services/api';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Search, Edit, Trash2, Phone, Mail, MapPin, User, Award, Eye, FileText, CheckCircle2, RotateCcw } from 'lucide-react';
import Button from '../../../components/common/Button';
import Card from '../../../components/common/Card';
import FormField from '../../../components/forms/FormField';
import Modal from '../../../components/common/Modal';
import ConfirmationModal from '../../../components/common/ConfirmationModal';
import DataTable from '../../../components/common/DataTable';
import { useDevice } from '../../../hooks/useDevice';
import MobileCard from '../../../components/common/MobileCard';
import DocumentUploadModal from '../../../components/common/DocumentUploadModal';
import DocumentViewerModal from '../../../components/common/DocumentViewerModal';
import { getEstadoPagoLabel, getEstadoPagoColor, getCategoriaLabel, PARENTESCO_MAP } from '../../../utils/enums';
import { TutorStatusCell, calcEdad } from '../../../components/common/TutorStatusCell';
import { buildAtletaUpdatePayload, getParticipanteId } from '../../../utils/atletaUtils';
import { matchesSearch } from '../../../utils/searchUtils';
import './ClubAtletas.css';

const ESTADO_PAGO_PAGADO = 1;
const ESTADO_PAGO_PENDIENTE = 0;

/** Misma fuente que SportTrack / admin: nombre de catálogo; fallback al enum. */
const formatCategoria = (atleta) => {
    const nombre = atleta?.categoriaNombre ?? atleta?.CategoriaNombre;
    if (nombre) return nombre;
    const categoria = atleta?.categoria ?? atleta?.Categoria;
    if (categoria != null && categoria !== '' && categoria !== 0) {
        return getCategoriaLabel(categoria);
    }
    const categoriaId = atleta?.categoriaId ?? atleta?.CategoriaId;
    if (categoriaId != null && categoriaId !== 0) {
        return getCategoriaLabel(categoriaId);
    }
    return '-';
};

const ClubAtletas = () => {
    const { isNative } = useDevice();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [atletas, setAtletas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAtleta, setSelectedAtleta] = useState(null);
    const [atletaDetails, setAtletaDetails] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [atletaToDelete, setAtletaToDelete] = useState(null);
    const [feedbackModal, setFeedbackModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });

    // Documentation State
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showViewerModal, setShowViewerModal] = useState(false);
    const [selectedAtletaForDocs, setSelectedAtletaForDocs] = useState(null);
    const [updatingPagoId, setUpdatingPagoId] = useState(null);

    // States for "Assign Existing Tutor"
    const [showSelectTutorModal, setShowSelectTutorModal] = useState(false);
    const [existingTutores, setExistingTutores] = useState([]);
    const [selectedTutorIdToAssign, setSelectedTutorIdToAssign] = useState('');
    const [loadingTutores, setLoadingTutores] = useState(false);

    useEffect(() => {
        const clubId = user?.IdClub || user?.idClub || user?.clubId || user?.club?.id;
        if (clubId) fetchAtletas(clubId);
    }, [user]);

    const fetchAtletas = async (clubId) => {
        try {
            setLoading(true);
            let data = [];
            try {
                data = await api.get(`/Atleta/club/${clubId}`, { silentErrors: true });
            } catch (e1) {
                data = [];
            }

            const needsEnrichment =
                !Array.isArray(data) ||
                data.length === 0 ||
                data.every(
                    (a) =>
                        !a.fechaNacimiento &&
                        !a.FechaNacimiento &&
                        !a.participante &&
                        !a.Participante
                );

            if (needsEnrichment) {
                const all = await api.get('/Atleta').catch(() => []);
                data = (Array.isArray(all) ? all : []).filter((a) => {
                    const athleteClubId = a.idClub ?? a.IdClub ?? a.clubId ?? a.ClubId;
                    return String(athleteClubId) === String(clubId);
                });
            } else {
                data = (data || []).filter((a) => {
                    const athleteClubId = a.idClub ?? a.IdClub ?? a.clubId ?? a.ClubId;
                    return !athleteClubId || String(athleteClubId) === String(clubId);
                });
            }

            const mapAtletas = (list, conTutor = new Set()) =>
                (list || []).map((atleta) => {
                    const athleteId =
                        atleta.idPersona ??
                        atleta.IdPersona ??
                        atleta.participanteId ??
                        atleta.ParticipanteId;
                    const persona = atleta.participante || atleta.Participante || {};

                    const firstName = persona?.nombre ?? persona?.Nombre ?? '';
                    const lastName = persona?.apellido ?? persona?.Apellido ?? '';
                    const doc =
                        atleta.documento ||
                        atleta.Documento ||
                        persona?.documento ||
                        persona?.Documento ||
                        persona?.dni ||
                        persona?.Dni ||
                        '';
                    const fechaNacimiento =
                        atleta.fechaNacimiento ||
                        atleta.FechaNacimiento ||
                        persona?.fechaNacimiento ||
                        persona?.FechaNacimiento ||
                        null;
                    const edadRaw = atleta.edad ?? atleta.Edad;
                    const edad =
                        edadRaw != null && Number(edadRaw) >= 0 && Number(edadRaw) <= 120
                            ? Number(edadRaw)
                            : calcEdad(fechaNacimiento);
                    const idNum = Number(athleteId);

                    return {
                        ...atleta,
                        idPersona: athleteId,
                        nombrePersona:
                            atleta.nombrePersona ||
                            atleta.NombrePersona ||
                            (firstName || lastName ? `${firstName} ${lastName}`.trim() : '-'),
                        documento: doc || '-',
                        categoria: atleta.categoria ?? atleta.Categoria ?? null,
                        categoriaId: atleta.categoriaId ?? atleta.CategoriaId ?? null,
                        categoriaNombre: atleta.categoriaNombre ?? atleta.CategoriaNombre ?? null,
                        fechaNacimiento,
                        edad,
                        tieneTutor:
                            conTutor.has(idNum) ||
                            (Array.isArray(atleta.tutores) && atleta.tutores.length > 0) ||
                            (Array.isArray(atleta.Tutores) && atleta.Tutores.length > 0),
                    };
                });

            // Pintar grilla sin esperar AtletaTutor
            setAtletas(mapAtletas(data));
            setLoading(false);

            const relaciones = await api.get('/AtletaTutor').catch(() => []);
            const conTutor = new Set(
                (Array.isArray(relaciones) ? relaciones : [])
                    .map((r) =>
                        Number(r.idAtleta ?? r.IdAtleta ?? r.participanteId ?? r.ParticipanteId)
                    )
                    .filter((id) => Number.isFinite(id))
            );
            setAtletas(mapAtletas(data, conTutor));
        } catch (error) {
            console.error('Error cargando atletas:', error);
            setLoading(false);
        }
    };

    const fetchClubTutores = async () => {
        setLoadingTutores(true);
        try {
            const allTutores = await api.get('/Tutor');
            const mapped = (allTutores || []).map(t => ({
                idPersona: t.idPersona ?? t.participanteId ?? t.ParticipanteId,
                nombreCompleto: t.nombrePersona || t.NombrePersona || 'Sin nombre',
                documento: t.documento || t.Documento || t.dni || ''
            }));
            setExistingTutores(mapped);
        } catch (error) {
            console.error('Error fetching tutores:', error);
        } finally {
            setLoadingTutores(false);
        }
    };

    const handleAssignTutor = async () => {
        if (!selectedTutorIdToAssign || !atletaDetails) return;
        try {
            await api.post('/AtletaTutor', {
                ParticipanteId: atletaDetails.idPersona,
                IdTutor: parseInt(selectedTutorIdToAssign, 10),
                Parentesco: 1,
            });
            setShowSelectTutorModal(false);
            setSelectedTutorIdToAssign('');

            const clubId = user?.IdClub || user?.idClub || user?.clubId || user?.club?.id;
            if (clubId) {
                await fetchAtletas(clubId);
            }

            const refreshedAtleta = await api.get(`/Atleta/${atletaDetails.idPersona}`);
            if (refreshedAtleta) {
                handleCardClick({
                    ...refreshedAtleta,
                    idPersona:
                        refreshedAtleta.idPersona ??
                        refreshedAtleta.participanteId ??
                        refreshedAtleta.ParticipanteId ??
                        atletaDetails.idPersona,
                });
            } else {
                setShowModal(false);
            }
        } catch (error) {
            console.error('Error assigning tutor:', error);
            alert('Error al asignar el tutor. Verifica si ya está asignado.');
        }
    };

    const handleUnlinkTutor = async () => {
        if (!atletaDetails || !atletaDetails.tutor) return;
        const idTutor = atletaDetails.tutor.idPersona;
        const idRelacion = atletaDetails.tutor.idRelacion;
        
        setFeedbackModal({
            isOpen: true,
            title: 'Desvincular Tutor',
            message: '¿Estás seguro de desvincular este tutor del atleta?',
            type: 'info',
            confirmText: 'Desvincular',
            onConfirm: async () => {
                setFeedbackModal(prev => ({ ...prev, isOpen: false }));
                setLoading(true);
                try {
                    if (idRelacion) {
                        await api.delete(`/AtletaTutor/${idRelacion}`);
                    } else {
                        await api.delete(`/AtletaTutor/${atletaDetails.idPersona}/${idTutor}`);
                    }
                    
                    const clubId = user?.IdClub || user?.idClub || user?.clubId || user?.club?.id;
                    if (clubId) {
                        await fetchAtletas(clubId);
                        setShowModal(false);
                    }
                    
                    setFeedbackModal({
                        isOpen: true,
                        title: 'Éxito',
                        message: 'Tutor desvinculado correctamente.',
                        type: 'success',
                        showCancel: false
                    });
                } catch (error) {
                    console.error('Error desvinculando tutor:', error);
                    setFeedbackModal({
                        isOpen: true,
                        title: 'Error',
                        message: 'No se pudo desvincular el tutor.',
                        type: 'danger',
                        showCancel: false
                    });
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    const handleToggleEstadoPago = async (atleta, e) => {
        e?.stopPropagation?.();
        const id = atleta.idPersona ?? atleta.participanteId;
        if (!id) return;

        const current = atleta.estadoPago ?? atleta.EstadoPago ?? ESTADO_PAGO_PENDIENTE;
        const nextStatus = current === ESTADO_PAGO_PAGADO ? ESTADO_PAGO_PENDIENTE : ESTADO_PAGO_PAGADO;

        setUpdatingPagoId(id);
        try {
            await api.put(`/Atleta/${id}`, buildAtletaUpdatePayload(atleta, { estadoPago: nextStatus }));
            setAtletas((prev) =>
                prev.map((a) =>
                    String(a.idPersona) === String(id) ? { ...a, estadoPago: nextStatus } : a
                )
            );
            if (atletaDetails && String(atletaDetails.idPersona) === String(id)) {
                setAtletaDetails((prev) => ({ ...prev, estadoPago: nextStatus }));
            }
            if (selectedAtleta && String(selectedAtleta.idPersona) === String(id)) {
                setSelectedAtleta((prev) => ({ ...prev, estadoPago: nextStatus }));
            }
        } catch (error) {
            console.error('Error actualizando estado de pago:', error);
            setFeedbackModal({
                isOpen: true,
                title: 'Error',
                message: error.message || 'No se pudo actualizar el estado de pago.',
                type: 'danger',
                showCancel: false,
            });
        } finally {
            setUpdatingPagoId(null);
        }
    };

    const renderEstadoPagoCell = (atleta) => {
        const estado = atleta.estadoPago ?? ESTADO_PAGO_PENDIENTE;
        const isPagado = estado === ESTADO_PAGO_PAGADO;
        const id = atleta.idPersona;
        const busy = updatingPagoId === id;

        return (
            <div className="estado-pago-cell" onClick={(e) => e.stopPropagation()}>
                <span className={`badge badge-${getEstadoPagoColor(estado)}`}>
                    {getEstadoPagoLabel(estado)}
                </span>
                <button
                    type="button"
                    className={`estado-pago-toggle ${isPagado ? 'is-pagado' : 'is-pendiente'}`}
                    title={isPagado ? 'Marcar como pendiente' : 'Marcar como pagado'}
                    disabled={busy}
                    onClick={(e) => handleToggleEstadoPago(atleta, e)}
                >
                    {busy ? '…' : isPagado ? <RotateCcw size={12} /> : <CheckCircle2 size={12} />}
                </button>
            </div>
        );
    };

    const handleBulkUpdate = async () => {
        const clubId = user?.IdClub || user?.idClub || user?.club?.id;
        if (!clubId) return;

        setFeedbackModal({
            isOpen: true,
            title: 'Confirmar Actualización',
            message: '¿Estás seguro de marcar a TODOS los atletas de tu club como PAGADO?',
            type: 'info',
            confirmText: 'Sí, Actualizar',
            onConfirm: async () => {
                setFeedbackModal(prev => ({ ...prev, isOpen: false }));
                setLoading(true);
                try {
                    for (const atleta of atletas) {
                        if (atleta.estadoPago !== ESTADO_PAGO_PAGADO) {
                            await api.put(`/Atleta/${atleta.idPersona}`, buildAtletaUpdatePayload(atleta, { estadoPago: ESTADO_PAGO_PAGADO }));
                        }
                    }
                    setFeedbackModal({
                        isOpen: true,
                        title: 'Éxito',
                        message: 'Se han actualizado los estados de pago correctamente.',
                        type: 'success',
                        showCancel: false
                    });
                    fetchAtletas(clubId);
                } catch (error) {
                    console.error('Error en actualización masiva:', error);
                    setFeedbackModal({
                        isOpen: true,
                        title: 'Error',
                        message: 'No se pudieron actualizar algunos atletas.',
                        type: 'danger',
                        showCancel: false
                    });
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    const handleDeleteClick = (atleta) => {
        setAtletaToDelete(atleta);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!atletaToDelete) return;
        try {
            await api.delete(`/Atleta/${atletaToDelete.idPersona}`);
            setAtletas(atletas.filter(a => a.idPersona !== atletaToDelete.idPersona));
            setShowDeleteModal(false);
        } catch (error) {
            console.error('Error al eliminar:', error);
        }
    };

    const handleCardClick = async (atleta) => {
        setSelectedAtleta(atleta);
        setShowModal(true);
        setLoadingDetails(true);
        try {
            const athleteId = Number(
                atleta.idPersona ?? atleta.IdPersona ?? atleta.participanteId ?? atleta.ParticipanteId
            );

            // Preferir detalle de atleta (ya trae participante) antes que dump Persona
            let persona = atleta.participante || atleta.Participante || null;
            try {
                const detail = await api.get(`/Atleta/${athleteId}`, { silentErrors: true });
                persona =
                    detail?.participante ||
                    detail?.Participante ||
                    detail ||
                    persona;
            } catch {
                /* usar datos de fila */
            }

            const relaciones = await api.get('/AtletaTutor').catch(() => []);
            let tutorDetailsObj = null;

            const relacion = (Array.isArray(relaciones) ? relaciones : []).find((r) => {
                const relAtletaId = Number(
                    r.idAtleta ?? r.IdAtleta ?? r.participanteId ?? r.ParticipanteId
                );
                return relAtletaId === athleteId;
            });

            const tutorInfo =
                relacion || (atleta.tutores || atleta.Tutores)?.[0] || null;

            if (tutorInfo) {
                const tutorId = tutorInfo.idTutor || tutorInfo.IdTutor;
                if (tutorId) {
                    try {
                        const tutorRes = await api.get(`/Tutor/${tutorId}`, { silentErrors: true });
                        const tutorPersona =
                            tutorRes?.participante || tutorRes?.Participante || tutorRes || {};
                        tutorDetailsObj = {
                            idPersona: tutorId,
                            idRelacion:
                                tutorInfo.id ||
                                tutorInfo.idAtletaTutor ||
                                tutorInfo.IdAtletaTutor ||
                                null,
                            nombre:
                                tutorRes?.nombrePersona ||
                                tutorRes?.NombrePersona ||
                                `${tutorPersona.nombre || tutorPersona.Nombre || ''} ${
                                    tutorPersona.apellido || tutorPersona.Apellido || ''
                                }`.trim() ||
                                tutorInfo.nombreTutor ||
                                tutorInfo.NombreTutor ||
                                'Tutor',
                            telefono:
                                tutorRes?.telefono ||
                                tutorRes?.Telefono ||
                                tutorPersona?.telefono ||
                                tutorPersona?.Telefono ||
                                '',
                            email:
                                tutorRes?.email ||
                                tutorRes?.Email ||
                                tutorPersona?.email ||
                                tutorPersona?.Email ||
                                '',
                        };
                    } catch (tutorError) {
                        console.error('Error fetching tutor details:', tutorError);
                        tutorDetailsObj = {
                            idPersona: tutorId,
                            nombre:
                                tutorInfo.nombreTutor || tutorInfo.NombreTutor || 'Tutor',
                            telefono: '',
                            email: '',
                        };
                    }
                }
            }

            setAtletaDetails({
                ...atleta,
                idPersona: athleteId,
                personaCompleta: persona,
                tutor: tutorDetailsObj,
            });
        } catch (err) {
            console.error('Error loading athlete details:', err);
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedAtleta(null);
        setAtletaDetails(null);
    };

    const getCategoriaTexto = (atletaOrCategoria) => {
        if (atletaOrCategoria != null && typeof atletaOrCategoria === 'object') {
            return formatCategoria(atletaOrCategoria);
        }
        return formatCategoria({ categoria: atletaOrCategoria });
    };

    const filteredAtletas = atletas.filter((atleta) =>
        matchesSearch(
            searchTerm,
            atleta.nombrePersona,
            atleta.documento,
            atleta.categoriaNombre,
            formatCategoria(atleta),
        )
    );

    if (loading) return <div className="loading-container"><div className="spinner"></div></div>;

    return (
        <div className={`club-atletas ${isNative ? 'mobile-view' : ''}`}>
            <div className="page-header">
                <div>
                    <h1 className="text-gradient">Atletas</h1>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <Button variant="secondary" onClick={handleBulkUpdate} disabled={loading}>
                        Marcar Pagados
                    </Button>
                    <Button variant="primary" icon={Plus} onClick={() => navigate('/club/atletas/nuevo')}>
                        {isNative ? 'Nuevo' : 'Agregar Atleta'}
                    </Button>
                </div>
            </div>

            <Card>
                <div className="filters-bar">
                    <FormField icon={Search} placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} variant="dark-focused" />
                </div>

                {isNative ? (
                    <div className="mobile-list-container">
                        {filteredAtletas.length === 0 ? (
                            <p className="text-center">Sin resultados</p>
                        ) : (
                            filteredAtletas.map(atleta => (
                                <MobileCard 
                                    key={atleta.idPersona}
                                    title={atleta.nombrePersona}
                                    subtitle={atleta.documento}
                                    badge={renderEstadoPagoCell(atleta)}
                                    details={[
                                        { label: 'Categoría', value: formatCategoria(atleta) },
                                        {
                                            label: 'Tutor',
                                            value: (
                                                <TutorStatusCell
                                                    edad={atleta.edad}
                                                    tieneTutor={atleta.tieneTutor}
                                                    fechaNacimiento={atleta.fechaNacimiento}
                                                    categoria={atleta.categoria}
                                                    categoriaId={atleta.categoriaId}
                                                    categoriaNombre={atleta.categoriaNombre}
                                                />
                                            ),
                                        },
                                        { label: 'Apto', value: atleta.presentoAptoMedico ? '✅' : '❌' }
                                    ]}
                                    actions={
                                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                icon={Eye}
                                                title="Ver documentos"
                                                onClick={() => {
                                                    setSelectedAtletaForDocs(atleta);
                                                    setShowViewerModal(true);
                                                }}
                                            />
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                icon={FileText}
                                                title="Subir documento"
                                                onClick={() => {
                                                    setSelectedAtletaForDocs(atleta);
                                                    setShowUploadModal(true);
                                                }}
                                            />
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                icon={Edit}
                                                title="Editar"
                                                onClick={() => navigate(`/club/atletas/editar/${atleta.idPersona}`)}
                                            />
                                        </div>
                                    }
                                    onClick={() => handleCardClick(atleta)}
                                />
                            ))
                        )}
                    </div>
                ) : (
                    <DataTable
                        columns={[
                            { key: 'nombrePersona', label: 'Nombre' },
                            { key: 'documento', label: 'DNI' },
                            { key: 'categoria', label: 'Categoría', render: (_value, row) => formatCategoria(row) },
                            {
                                key: 'estadoPago', label: 'Estado Pago',
                                render: (_value, row) => renderEstadoPagoCell(row)
                            },
                            { key: 'perteneceSeleccion', label: 'Selección', render: (value) => value ? '⭐ Sí' : 'No' },
                            {
                                key: 'tutor',
                                label: 'Tutor',
                                align: 'center',
                                render: (_value, row) => (
                                    <TutorStatusCell
                                        edad={row.edad}
                                        tieneTutor={row.tieneTutor}
                                        fechaNacimiento={row.fechaNacimiento}
                                        categoria={row.categoria}
                                        categoriaId={row.categoriaId}
                                        categoriaNombre={row.categoriaNombre}
                                    />
                                ),
                            },
                            { key: 'presentoAptoMedico', label: 'Apto Médico', render: (value) => value ? '✅ Presentado' : '❌ Pendiente' },
                            {
                                key: 'documentacion',
                                label: 'Documentación',
                                align: 'center',
                                render: (_value, atleta) => (
                                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            icon={Eye}
                                            title="Ver documentos"
                                            onClick={() => {
                                                setSelectedAtletaForDocs(atleta);
                                                setShowViewerModal(true);
                                            }}
                                        />
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            icon={Plus}
                                            title="Subir documento"
                                            onClick={() => {
                                                setSelectedAtletaForDocs(atleta);
                                                setShowUploadModal(true);
                                            }}
                                        />
                                    </div>
                                )
                            },
                        ]}
                        data={filteredAtletas}
                        loading={loading}
                        onRowClick={handleCardClick}
                        actions={(atleta) => (
                            <div className="flex gap-2 atleta-grid-actions">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    icon={Edit}
                                    title="Editar"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/club/atletas/editar/${atleta.idPersona}`);
                                    }}
                                />
                                <Button
                                    variant="danger"
                                    size="sm"
                                    icon={Trash2}
                                    title="Eliminar"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteClick(atleta);
                                    }}
                                />
                            </div>
                        )}
                    />
                )}
            </Card>

            {/* Modal de detalles */}
            <Modal
                isOpen={showModal}
                onClose={handleCloseModal}
                title={`Detalles de ${selectedAtleta?.nombrePersona || 'Atleta'}`}
            >
                {loadingDetails ? (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <div className="spinner"></div>
                        <p>Cargando detalles...</p>
                    </div>
                ) : atletaDetails ? (
                    <div className="atleta-details-modal">
                        <div className="detail-section">
                            <h4><User size={18} /> Información Personal</h4>
                            <div className="detail-grid">
                                <div className="detail-row">
                                    <span className="label">Nombre Completo:</span>
                                    <span className="value">{atletaDetails.nombrePersona}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">DNI:</span>
                                    <span className="value">
                                        {atletaDetails.documento
                                            || atletaDetails.personaCompleta?.documento
                                            || atletaDetails.personaCompleta?.Documento
                                            || atletaDetails.personaCompleta?.dni
                                            || atletaDetails.personaCompleta?.Dni
                                            || 'No especificado'}
                                    </span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">Fecha de Nacimiento:</span>
                                    <span className="value">
                                        {atletaDetails.personaCompleta?.fechaNacimiento
                                            ? new Date(atletaDetails.personaCompleta.fechaNacimiento).toLocaleDateString('es-AR')
                                            : 'No especificada'}
                                    </span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">Sexo:</span>
                                    <span className="value">
                                        {atletaDetails.personaCompleta?.sexo?.nombre || atletaDetails.personaCompleta?.sexo?.Nombre || atletaDetails.personaCompleta?.sexo || 'No especificado'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="detail-section">
                            <h4><Phone size={18} /> Contacto</h4>
                            <div className="detail-grid">
                                <div className="detail-row">
                                    <Phone size={16} />
                                    <span className="value">{atletaDetails.personaCompleta?.telefono || 'No especificado'}</span>
                                </div>
                                <div className="detail-row">
                                    <Mail size={16} />
                                    <span className="value">{atletaDetails.personaCompleta?.email || 'No especificado'}</span>
                                </div>
                                <div className="detail-row">
                                    <MapPin size={16} />
                                    <span className="value">{atletaDetails.personaCompleta?.direccion || 'No especificada'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="detail-section">
                            <h4><Award size={18} /> Información Deportiva</h4>
                            <div className="detail-grid">
                                <div className="detail-row">
                                    <span className="label">Categoría:</span>
                                    <span className="value">{formatCategoria(atletaDetails)}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">Pertenece a Selección:</span>
                                    <span className="value">{atletaDetails.perteneceSeleccion ? '⭐ Sí' : 'No'}</span>
                                </div>
                                <div className="detail-row" style={{ alignItems: 'center' }}>
                                    <span className="label">Estado de Pago:</span>
                                    {renderEstadoPagoCell(atletaDetails)}
                                </div>
                                <div className="detail-row">
                                    <span className="label">Apto Médico:</span>
                                    <span className="value">
                                        {atletaDetails.presentoAptoMedico
                                            ? `✅ Presentado (${new Date(atletaDetails.fechaAptoMedico).toLocaleDateString('es-AR')})`
                                            : '❌ Pendiente'}
                                    </span>
                                </div>
                                {atletaDetails.montoBeca > 0 && (
                                    <div className="detail-row">
                                        <span className="label">Beca:</span>
                                        <span className="value">
                                            ${atletaDetails.montoBeca}
                                            {atletaDetails.becadoEnard && ' (ENARD)'}
                                            {atletaDetails.becadoSdn && ' (SDN)'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="detail-section">
                            <h4><FileText size={18} /> Documentación</h4>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    icon={Eye}
                                    onClick={() => {
                                        setSelectedAtletaForDocs(atletaDetails);
                                        setShowViewerModal(true);
                                    }}
                                    style={{ flex: 1 }}
                                >
                                    Ver Documentos
                                </Button>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    icon={Plus}
                                    onClick={() => {
                                        setSelectedAtletaForDocs(atletaDetails);
                                        setShowUploadModal(true);
                                    }}
                                    style={{ flex: 1 }}
                                >
                                    Subir Nuevo
                                </Button>
                            </div>
                        </div>

                        <div className="detail-section">
                            <h4 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span><Users size={18} /> Tutor</span>
                                {atletaDetails.tutor && (
                                    <Button
                                        variant="danger"
                                        size="sm"
                                        icon={Trash2}
                                        onClick={handleUnlinkTutor}
                                        title="Desvincular tutor"
                                        style={{ padding: '0.25rem 0.5rem' }}
                                    />
                                )}
                            </h4>
                            {atletaDetails.tutor ? (
                                <div className="detail-grid">
                                    <div className="detail-row">
                                        <span className="label">Nombre:</span>
                                        <span className="value">{atletaDetails.tutor.nombre || 'No especificado'}</span>
                                    </div>
                                    <div className="detail-row">
                                        <Phone size={16} />
                                        <span className="value">{atletaDetails.tutor.telefono || 'No especificado'}</span>
                                    </div>
                                    <div className="detail-row">
                                        <Mail size={16} />
                                        <span className="value">{atletaDetails.tutor.email || 'No especificado'}</span>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                                    <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                                        Este atleta no tiene tutor asignado
                                    </p>
                                    <Button
                                        variant="primary"
                                        icon={Plus}
                                        onClick={() => {
                                            handleCloseModal();
                                            navigate(`/club/tutores/nuevo?atletaId=${atletaDetails.idPersona}`);
                                        }}
                                    >
                                        Agregar Nuevo Tutor
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        icon={Users}
                                        onClick={() => {
                                            setShowSelectTutorModal(true);
                                            fetchClubTutores();
                                        }}
                                        style={{ marginLeft: '10px' }}
                                    >
                                        Asignar Existente
                                    </Button>
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                            <Button
                                variant="secondary"
                                icon={Edit}
                                onClick={() => {
                                    handleCloseModal();
                                    navigate(`/club/atletas/editar/${atletaDetails.idPersona}`);
                                }}
                            >
                                Editar Atleta
                            </Button>
                            <Button
                                variant="danger"
                                icon={Trash2}
                                onClick={() => {
                                    handleCloseModal();
                                    handleDeleteClick(atletaDetails);
                                }}
                            >
                                Eliminar
                            </Button>
                        </div>
                    </div>
                ) : null}
            </Modal>

            {/* Modal para Seleccionar Tutor Existente */}
            <Modal
                isOpen={showSelectTutorModal}
                onClose={() => setShowSelectTutorModal(false)}
                title="Asignar Tutor Existente"
            >
                <div className="p-4">
                    <p style={{ marginBottom: '1rem' }}>Selecciona un tutor de la lista (familiares de otros atletas del club):</p>

                    {loadingTutores ? (
                        <div className="spinner"></div>
                    ) : (
                        <select
                            className="form-input"
                            value={selectedTutorIdToAssign}
                            onChange={(e) => setSelectedTutorIdToAssign(e.target.value)}
                            style={{ width: '100%', marginBottom: '1rem' }}
                        >
                            <option value="">-- Seleccionar Tutor --</option>
                            {existingTutores.map(t => (
                                <option key={t.idPersona} value={t.idPersona}>
                                    {t.nombreCompleto} (DNI: {t.documento || '-'})
                                </option>
                            ))}
                        </select>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                        <Button variant="secondary" onClick={() => setShowSelectTutorModal(false)}>Cancelar</Button>
                        <Button variant="primary" onClick={handleAssignTutor} disabled={!selectedTutorIdToAssign}>Asignar</Button>
                    </div>
                </div>
            </Modal>

            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setAtletaToDelete(null);
                }}
                onConfirm={handleConfirmDelete}
                title="Eliminar Atleta"
                message={`¿Estás seguro de que deseas eliminar a ${atletaToDelete?.nombrePersona || 'este atleta'}?`}
                confirmText="Eliminar"
                cancelText="Cancelar"
                type="danger"
            />

             <ConfirmationModal
                isOpen={feedbackModal.isOpen}
                onClose={() => setFeedbackModal({ ...feedbackModal, isOpen: false })}
                onConfirm={() => {
                    if (feedbackModal.onConfirm) {
                        feedbackModal.onConfirm();
                    } else {
                        setFeedbackModal({ ...feedbackModal, isOpen: false });
                    }
                }}
                title={feedbackModal.title}
                message={feedbackModal.message}
                confirmText={feedbackModal.confirmText || "Entendido"}
                cancelText="Cancelar"
                showCancel={feedbackModal.showCancel !== false && !!feedbackModal.onConfirm}
                type={feedbackModal.type || 'info'}
            />

            {/* Modales de Documentación */}
            {showUploadModal && selectedAtletaForDocs && (
                <DocumentUploadModal
                    isOpen={showUploadModal}
                    onClose={() => {
                        setShowUploadModal(false);
                        setSelectedAtletaForDocs(null);
                    }}
                    onSuccess={() => {
                        const clubId = user?.IdClub || user?.idClub || user?.club?.id;
                        if (clubId) fetchAtletas(clubId);
                    }}
                    personName={selectedAtletaForDocs.nombrePersona}
                    personId={selectedAtletaForDocs.idPersona}
                />
            )}

            {showViewerModal && selectedAtletaForDocs && (
                <DocumentViewerModal
                    isOpen={showViewerModal}
                    onClose={() => {
                        setShowViewerModal(false);
                        setSelectedAtletaForDocs(null);
                    }}
                    personName={selectedAtletaForDocs.nombrePersona}
                    personDocumento={selectedAtletaForDocs.documento}
                    personId={selectedAtletaForDocs.idPersona}
                />
            )}
        </div >
    );
};

export default ClubAtletas;