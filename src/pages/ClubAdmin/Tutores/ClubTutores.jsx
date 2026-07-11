import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../services/api';
import { UserCheck, Plus, Search, Edit, Trash2, Phone, Mail, MapPin } from 'lucide-react';
import Button from '../../../components/common/Button';
import Card from '../../../components/common/Card';
import FormField from '../../../components/forms/FormField';
import DataTable from '../../../components/common/DataTable';
import ConfirmationModal from '../../../components/common/ConfirmationModal';
import '../Atletas/ClubAtletas.css';

const ClubTutores = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [tutores, setTutores] = useState([]);
    const [loading, setLoading] = useState(true);

    const [searchTerm, setSearchTerm] = useState('');
    const [feedbackModal, setFeedbackModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });

    useEffect(() => {
        fetchTutores();
    }, []);

    const fetchTutores = async () => {
        try {
            setLoading(true);

            const clubId = user?.IdClub || user?.idClub || user?.club?.id || user?.clubId;
            if (!clubId) {
                console.error('No Club ID found for user');
                setLoading(false);
                return;
            }

            const [allTutores, allAtletas, allRelaciones] = await Promise.all([
                api.get('/Tutor').catch(() => []),
                api.get('/Atleta').catch(() => []),
                api.get('/AtletaTutor').catch(() => []),
            ]);

            const getAtletaId = (a) =>
                a.idPersona ?? a.IdPersona ?? a.participanteId ?? a.ParticipanteId;
            const getTutorId = (t) =>
                t.idPersona ?? t.IdPersona ?? t.participanteId ?? t.ParticipanteId;
            const getRelAtletaId = (r) =>
                r.idAtleta ?? r.IdAtleta ?? r.participanteId ?? r.ParticipanteId;
            const getRelTutorId = (r) => r.idTutor ?? r.IdTutor;

            const myClubAtletas = (Array.isArray(allAtletas) ? allAtletas : []).filter((a) => {
                const aClubId = a.idClub || a.clubId || a.IdClub;
                return aClubId && String(aClubId) === String(clubId);
            });

            const myClubAtletaIds = new Set(
                myClubAtletas.map((a) => Number(getAtletaId(a))).filter((id) => Number.isFinite(id))
            );

            const atletaNameMap = new Map();
            myClubAtletas.forEach((a) => {
                const id = Number(getAtletaId(a));
                const persona = a.participante || a.Participante || {};
                const nombreFromPersona =
                    persona.nombre || persona.Nombre
                        ? `${persona.nombre || persona.Nombre} ${persona.apellido || persona.Apellido || ''}`.trim()
                        : '';
                const nombre =
                    a.nombrePersona || a.NombrePersona || nombreFromPersona || 'Desconocido';
                atletaNameMap.set(id, nombre);
            });

            const myClubRelaciones = (Array.isArray(allRelaciones) ? allRelaciones : []).filter(
                (r) => myClubAtletaIds.has(Number(getRelAtletaId(r)))
            );

            const tutorAtletasMap = new Map();
            myClubRelaciones.forEach((r) => {
                const tutorId = Number(getRelTutorId(r));
                const atletaId = Number(getRelAtletaId(r));
                const atletaNombre = atletaNameMap.get(atletaId);
                if (!Number.isFinite(tutorId) || !atletaNombre) return;
                if (!tutorAtletasMap.has(tutorId)) tutorAtletasMap.set(tutorId, []);
                tutorAtletasMap.get(tutorId).push(atletaNombre);
            });

            const myClubTutorIds = new Set(
                myClubRelaciones.map((r) => Number(getRelTutorId(r))).filter((id) => Number.isFinite(id))
            );

            const tutoresFiltrados = (Array.isArray(allTutores) ? allTutores : [])
                .map((t) => {
                    const idPersona = Number(getTutorId(t));
                    return {
                        ...t,
                        idPersona,
                        nombrePersona: t.nombrePersona || t.NombrePersona || '',
                        email: t.email || t.Email || '',
                        telefono: t.telefono || t.Telefono || '',
                        direccion: t.direccion || t.Direccion || '',
                        atletaVinculado: (tutorAtletasMap.get(idPersona) || []).join(', '),
                    };
                })
                .filter((t) => myClubTutorIds.has(t.idPersona));

            setTutores(tutoresFiltrados);
        } catch (error) {
            console.error('Error al cargar tutores:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de que deseas eliminar este tutor?')) {
            try {
                await api.delete(`/Tutor/${id}`);
                setTutores(tutores.filter(t => t.idPersona !== id));
            } catch (error) {
                console.error('Error al eliminar tutor:', error);
                setFeedbackModal({
                    isOpen: true,
                    title: 'Error',
                    message: 'Error al eliminar el tutor. Por favor, intenta nuevamente.',
                    type: 'danger'
                });
            }
        }
    };

    const filteredTutores = tutores.filter(tutor => {
        const nombreCompleto = (tutor.nombrePersona || '').toLowerCase();
        return nombreCompleto.includes(searchTerm.toLowerCase());
    });

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Cargando tutores...</p>
            </div>
        );
    }

    return (
        <div className="club-atletas"> { }
            <div className="page-header">
                <div>
                    <h1 className="text-gradient">Mis Tutores</h1>
                    <p className="page-subtitle">Gestiona los tutores y responsables</p>
                </div>
                <Button
                    variant="primary"
                    icon={Plus}
                    onClick={() => navigate('/club/tutores/nuevo')}
                >
                    Agregar Tutor
                </Button>
            </div>

            <Card>
                <div className="filters-bar">
                    <FormField icon={Search} placeholder="Buscar por nombre..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} variant="dark-focused" />
                </div>
            </Card>

            <DataTable
                columns={[
                    {
                        key: 'nombrePersona',
                        label: 'Nombre',
                        render: (value, row) => value || 'Sin Nombre'
                    },
                    {
                        key: 'atletaVinculado',
                        label: 'Atleta Asignado',
                        render: (value) => value || '-' // New Column
                    },
                    {
                        key: 'telefono',
                        label: 'Teléfono',
                        render: (value) => value || '-'
                    },
                    {
                        key: 'email',
                        label: 'Email',
                        render: (value) => value || '-'
                    },
                    {
                        key: 'direccion',
                        label: 'Dirección',
                        render: (value) => value || '-'
                    }
                ]}
                data={filteredTutores}
                loading={loading}
                emptyMessage="No hay tutores registrados"
                actions={(tutor) => (
                    <div className="flex gap-2">
                        <Button
                            variant="secondary"
                            size="sm"
                            icon={Edit}
                            onClick={() => navigate(`/club/tutores/editar/${tutor.idPersona}`)}
                        />
                        <Button
                            variant="danger"
                            size="sm"
                            icon={Trash2}
                            onClick={() => handleDelete(tutor.idPersona)}
                        />
                    </div>
                )}
            />
            <ConfirmationModal
                isOpen={feedbackModal.isOpen}
                onClose={() => setFeedbackModal({ ...feedbackModal, isOpen: false })}
                onConfirm={() => setFeedbackModal({ ...feedbackModal, isOpen: false })}
                title={feedbackModal.title}
                message={feedbackModal.message}
                confirmText="Entendido"
                showCancel={false}
                type={feedbackModal.type || 'info'}
            />
        </div>
    );
};

export default ClubTutores;
