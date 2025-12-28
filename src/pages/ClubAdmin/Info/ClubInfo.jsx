import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../services/api';
import { MapPin, Phone, Mail, Users, Calendar, Award, User, DollarSign } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import Modal from '../../../components/common/Modal';
import ConfirmationModal from '../../../components/common/ConfirmationModal';
import Button from '../../../components/common/Button';
import './ClubInfo.css';

const ClubInfo = () => {
    const { user } = useAuth();
    const [clubData, setClubData] = useState(null);
    const [entrenadores, setEntrenadores] = useState([]);
    const [loading, setLoading] = useState(true);

    // Estados para pagos/afiliación
    const [pagos, setPagos] = useState([]);
    const [afiliacionStatus, setAfiliacionStatus] = useState('PENDIENTE');
    const [isPaymentLoading, setIsPaymentLoading] = useState(false);

    // QR Modal State
    const [showQRModal, setShowQRModal] = useState(false);
    const [qrLink, setQrLink] = useState('');

    // Feedback Modal State
    const [feedbackModal, setFeedbackModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });

    useEffect(() => {
        if (user?.idClub) {
            fetchClubData();
            fetchPayments();
        }
    }, [user.idClub]);

    const fetchPayments = async () => {
        try {
            const response = await api.get(`/PagoTransaccion/club/${user.idClub}`);
            setPagos(response);
            checkAfiliacionStatus(response);
        } catch (error) {
            console.error('Error al cargar pagos:', error);
        }
    };

    const checkAfiliacionStatus = (pagosList) => {
        const currentYear = new Date().getFullYear();
        const conceptoAfiliacion = `Afiliación Anual Club ${currentYear}`;

        // Verifica si existe un pago APROBADO con el concepto
        const pagoAfiliacion = pagosList.find(p =>
            p.concepto && p.concepto.includes(conceptoAfiliacion) && p.estado === 1 // 1 = Aprobado
        );
        // NOTA: Verifica si 'estado' viene como string ("Aprobado") o numero (1). 
        // El DTO dice Generic Enum usually comes as int unless configured otherwise. 
        // Controller returns PagoTransaccionDto with 'Estado' (enum) and 'EstadoDescripcion' (string).
        // Let's check 'EstadoDescripcion' strictly or handle both.

        const isPaid = pagosList.some(p =>
            p.concepto && p.concepto.includes(conceptoAfiliacion) &&
            (p.estado === 1 || p.estadoDescripcion === 'Aprobado')
        );

        if (isPaid) {
            setAfiliacionStatus('PAGADO');
        } else {
            setAfiliacionStatus('PENDIENTE');
        }
    };

    const handlePagarAfiliacion = async () => {
        try {
            setIsPaymentLoading(true);
            const currentYear = new Date().getFullYear();

            // Validar que tenemos los datos necesarios
            console.log('🔍 DEBUG - Usuario completo:', user);
            console.log('🔍 DEBUG - user.idClub:', user?.idClub);
            console.log('🔍 DEBUG - user.idPersona:', user?.idPersona);

            if (!user?.idClub) {
                setFeedbackModal({
                    isOpen: true,
                    title: 'Error',
                    message: 'No se pudo obtener el ID del club. Por favor, intenta cerrar sesión y volver a ingresar.',
                    type: 'danger'
                });
                setIsPaymentLoading(false);
                return;
            }

            // Para pagos de membresía del club, usamos idClub como idPersona si no existe
            const pagoData = {
                concepto: `Afiliación Anual Club ${currentYear}`,
                monto: 150000,
                idClub: parseInt(user.idClub),
                idPersona: user.idPersona ? parseInt(user.idPersona) : parseInt(user.idClub),
                estado: 0 // Pendiente
            };

            console.log('📤 Enviando datos de pago:', pagoData);

            const response = await api.post('/PagoTransaccion/preferencia', pagoData);

            if (response.paymentUrl) {
                setQrLink(response.paymentUrl);
                setShowQRModal(true);
            } else {
                setFeedbackModal({
                    isOpen: true,
                    title: 'Error',
                    message: 'No se pudo generar el link de pago',
                    type: 'danger'
                });
            }
        } catch (error) {
            console.error('Error al iniciar pago:', error);
            setFeedbackModal({
                isOpen: true,
                title: 'Error',
                message: 'Error al iniciar el proceso de pago',
                type: 'danger'
            });
        } finally {
            setIsPaymentLoading(false);
        }
    };

    const fetchClubData = async () => {
        try {
            setLoading(true);

            const club = await api.get(`/Club/${user.idClub}`);

            const atletas = await api.get('/Atleta');
            const atletasDelClub = atletas.filter(a => a.idClub === user.idClub);

            let entrenadoresDelClub = [];
            try {

                const todosEntrenadores = await api.get('/Entrenador');

                entrenadoresDelClub = todosEntrenadores.filter(e => e.idClub === user.idClub);

                const entrenadoresConPersona = await Promise.all(
                    entrenadoresDelClub.map(async (entrenador) => {
                        try {
                            const persona = await api.get(`/Persona/${entrenador.idPersona}`);
                            return {
                                ...entrenador,
                                persona: persona
                            };
                        } catch (error) {
                            console.error(`Error obteniendo persona para entrenador ${entrenador.idPersona}:`, error);
                            return {
                                ...entrenador,
                                persona: null
                            };
                        }
                    })
                );

                setEntrenadores(entrenadoresConPersona);
            } catch (error) {
                console.error('Error al cargar entrenadores:', error);
                setEntrenadores([]);
            }

            setClubData({
                ...club,
                totalAtletas: atletasDelClub.length,
                totalEntrenadores: entrenadoresDelClub.length,
                logros: club.logros || []
            });
        } catch (error) {
            console.error('Error al cargar información del club:', error);

            setClubData({
                id: user.idClub,
                nombre: user.clubNombre || user.nombre,
                direccion: user.clubData?.direccion || 'No especificada',
                telefono: user.clubData?.telefono || 'No especificado',
                email: user.email,
                totalAtletas: 0,
                totalEntrenadores: 0,
                logros: []
            });
            setEntrenadores([]);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Cargando información del club...</p>
            </div>
        );
    }

    return (
        <div className="club-info">
            <div className="page-header">
                <h1 className="text-gradient">Información del Club</h1>
                <p className="page-subtitle">Detalles y datos de tu club deportivo</p>
            </div>

            <div className="club-info-grid">
                {/* Sección de Membresía */}
                <div className="info-section glass-panel">
                    <h2>Estado de Membresía</h2>
                    <div className="afiliacion-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <div className="afiliacion-info">
                            <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: afiliacionStatus === 'PAGADO' ? 'var(--success)' : 'var(--danger)' }}>
                                {afiliacionStatus === 'PAGADO' ? 'AFILIACIÓN ACTIVA' : 'MEMBRESÍA PENDIENTE'}
                            </p>
                            <p className="text-muted">
                                {afiliacionStatus === 'PAGADO'
                                    ? `Vencimiento: 31/12/${new Date().getFullYear()}`
                                    : 'Tu club debe regularizar la cuota anual para participar en eventos.'}
                            </p>
                        </div>
                        {afiliacionStatus !== 'PAGADO' && (
                            <button
                                className="button-primary"
                                onClick={handlePagarAfiliacion}
                                disabled={isPaymentLoading}
                                style={{
                                    backgroundColor: 'var(--primary)',
                                    color: 'white',
                                    border: 'none',
                                    padding: '0.75rem 1.5rem',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                {isPaymentLoading ? 'Procesando...' : 'Pagar Cuota Anual ($150.000)'}
                                {!isPaymentLoading && <DollarSign size={18} />}
                            </button>
                        )}
                    </div>
                </div>

                {/* QR Modal */}
                <Modal
                    isOpen={showQRModal}
                    onClose={() => setShowQRModal(false)}
                    title="Escanear QR para Pagar"
                >
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem', gap: '1.5rem' }}>
                        <p style={{ textAlign: 'center', color: '#ccc' }}>
                            Escanea este código QR con la App de Mercado Pago o tu billetera virtual favorita.
                        </p>

                        <div style={{ background: 'white', padding: '1rem', borderRadius: '12px' }}>
                            {qrLink && <QRCodeCanvas value={qrLink} size={250} />}
                        </div>

                        <div style={{ width: '100%', textAlign: 'center' }}>
                            <p style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>¿Prefieres pagar en el navegador?</p>
                            <Button
                                variant="primary"
                                onClick={() => window.open(qrLink, '_blank')}
                                style={{ width: '100%' }}
                            >
                                Ir a Mercado Pago
                            </Button>
                        </div>
                    </div>
                </Modal>

                {/* Datos Principales */}
                <div className="info-section glass-panel">
                    <h2>Datos Principales</h2>
                    <div className="info-list">
                        <div className="info-item">
                            <div className="info-icon">
                                <Award size={20} />
                            </div>
                            <div className="info-content">
                                <span className="info-label">Nombre del Club</span>
                                <span className="info-value">{clubData.nombre}</span>
                            </div>
                        </div>

                        <div className="info-item">
                            <div className="info-icon">
                                <MapPin size={20} />
                            </div>
                            <div className="info-content">
                                <span className="info-label">Dirección</span>
                                <span className="info-value">{clubData.direccion}</span>
                            </div>
                        </div>

                        <div className="info-item">
                            <div className="info-icon">
                                <Phone size={20} />
                            </div>
                            <div className="info-content">
                                <span className="info-label">Teléfono</span>
                                <span className="info-value">{clubData.telefono}</span>
                            </div>
                        </div>

                        <div className="info-item">
                            <div className="info-icon">
                                <Mail size={20} />
                            </div>
                            <div className="info-content">
                                <span className="info-label">Email</span>
                                <span className="info-value">{clubData.email}</span>
                            </div>
                        </div>
                    </div>
                </div>

                { }
                <div className="info-section glass-panel">
                    <h2>Entrenadores</h2>
                    <div className="entrenadores-list">
                        {entrenadores.length > 0 ? (
                            entrenadores.map((entrenador) => (
                                <div key={entrenador.idPersona} className="entrenador-item">
                                    <div className="entrenador-avatar">
                                        <User size={24} />
                                    </div>
                                    <div className="entrenador-info">
                                        <span className="entrenador-nombre">
                                            {entrenador.persona
                                                ? `${entrenador.persona.nombre} ${entrenador.persona.apellido}`
                                                : 'Entrenador'
                                            }
                                        </span>
                                        <div className="entrenador-details">
                                            <span className="entrenador-licencia">
                                                Licencia: {entrenador.licencia || 'No especificada'}
                                            </span>
                                            {entrenador.persona && (
                                                <span className="entrenador-contacto">
                                                    {entrenador.persona.telefono && `Tel: ${entrenador.persona.telefono}`}
                                                    {entrenador.persona.email && ` | Email: ${entrenador.persona.email}`}
                                                </span>
                                            )}
                                        </div>
                                        <div className="entrenador-estado">
                                            {entrenador.perteneceSeleccion && (
                                                <span className="badge seleccion">Selección Nacional</span>
                                            )}
                                            {entrenador.becadoEnard && (
                                                <span className="badge beca-enard">Beca ENARD</span>
                                            )}
                                            {entrenador.becadoSdn && (
                                                <span className="badge beca-sdn">Beca SDN</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="no-entrenadores">
                                <User size={32} color="var(--text-secondary)" />
                                <p>No hay entrenadores asignados a este club</p>
                            </div>
                        )}
                    </div>
                </div>

                { }
                <div className="info-section glass-panel">
                    <h2>Estadísticas</h2>
                    <div className="stats-list">
                        <div className="stat-box">
                            <div className="stat-icon-wrapper">
                                <Users size={32} color="var(--primary)" />
                            </div>
                            <div className="stat-info">
                                <span className="stat-number">{clubData.totalAtletas}</span>
                                <span className="stat-label">Atletas Activos</span>
                            </div>
                        </div>

                        <div className="stat-box">
                            <div className="stat-icon-wrapper">
                                <User size={32} color="var(--success)" />
                            </div>
                            <div className="stat-info">
                                <span className="stat-number">{clubData.totalEntrenadores}</span>
                                <span className="stat-label">Entrenadores</span>
                            </div>
                        </div>
                    </div>
                </div>

                { }
                {clubData.logros && clubData.logros.length > 0 && (
                    <div className="info-section glass-panel logros-section">
                        <h2>Logros y Reconocimientos</h2>
                        <div className="logros-list">
                            {clubData.logros.map((logro, index) => (
                                <div key={index} className="logro-item">
                                    <Award size={18} color="var(--warning)" />
                                    <span>{logro}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Feedback Modal */}
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

export default ClubInfo;
