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

            // Robust Club ID detection
            const clubId = user?.IdClub || user?.idClub || user?.club?.id || user?.clubId;
            if (!clubId) {
                console.error("No Club ID found for user");
                setLoading(false);
                return;
            }

            console.log("Cargando tutores para Club ID:", clubId);

            // Fetch essential data in parallel
            const [allTutores, allAtletas, allRelaciones, allPersonas] = await Promise.all([
                api.get('/Tutor'),
                api.get('/Atleta'),
                api.get('/AtletaTutor'),
                api.get('/Persona')
            ]);

            // 1. Identify Athletes belonging to this Club
            const myClubAtletas = allAtletas.filter(a => {
                const aClubId = a.idClub || a.clubId || a.IdClub;
                return aClubId && String(aClubId) === String(clubId);
            });
            const myClubAtletaIds = new Set(myClubAtletas.map(a => a.idPersona));

            // Map for Athlete Names: ID -> Name
            const personaMap = new Map(allPersonas.map(p => [p.idPersona, p]));
            const atletaNameMap = new Map();
            myClubAtletas.forEach(a => {
                const persona = personaMap.get(a.idPersona);
                const nombre = persona ? `${persona.nombre} ${persona.apellido}` : (a.nombrePersona || 'Desconocido');
                atletaNameMap.set(a.idPersona, nombre);
            });

            // 2. Identify Relationships involving my Club's Athletes
            // Filter relationships where the athlete is in my club
            const myClubRelaciones = allRelaciones.filter(r => myClubAtletaIds.has(r.idAtleta));

            // Create a Map: TutorID -> Array of Athlete Names
            const tutorAtletasMap = new Map();
            myClubRelaciones.forEach(r => {
                const atletaNombre = atletaNameMap.get(r.idAtleta);
                if (atletaNombre) {
                    if (!tutorAtletasMap.has(r.idTutor)) {
                        tutorAtletasMap.set(r.idTutor, []);
                    }
                    tutorAtletasMap.get(r.idTutor).push(atletaNombre);
                }
            });

            // 3. Filter Tutors who are in that relationship set
            // Tutors who are linked to AT LEAST one athlete of my club
            const myClubTutorIds = new Set(myClubRelaciones.map(r => r.idTutor));

            const tutoresFiltrados = allTutores
                .filter(t => myClubTutorIds.has(t.idPersona)) // Strict filtering
                .map(t => {
                    // Enrich with Persona data if missing
                    const persona = personaMap.get(t.idPersona);
                    // Enrich with Assigned Athletes
                    const atletasAsignados = tutorAtletasMap.get(t.idPersona) || [];

                    return {
                        ...t,
                        nombrePersona: persona ? `${persona.nombre} ${persona.apellido}` : (t.nombrePersona || ''),
                        email: persona ? persona.email : t.email,
                        telefono: persona ? persona.telefono : t.telefono,
                        direccion: persona ? persona.direccion : t.direccion,
                        atletaVinculado: atletasAsignados.join(', ') // Display as string
                    };
                });

            console.log(`Filtrados ${tutoresFiltrados.length} tutores para el club.`);
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
