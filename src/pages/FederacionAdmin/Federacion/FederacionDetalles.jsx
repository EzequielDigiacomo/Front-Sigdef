import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import Card from '../../../components/common/Card';
import { Shield, MapPin, Phone, Mail, Globe, RefreshCcw, AlertTriangle } from 'lucide-react';
import Button from '../../../components/common/Button';
import ConfirmationModal from '../../../components/common/ConfirmationModal';

const FederacionDetalles = () => {
    const [federacion, setFederacion] = useState(null);
    const [loading, setLoading] = useState(true);
    const [reseting, setReseting] = useState(false);
    const [resetProgress, setResetProgress] = useState({ current: 0, total: 0 });
    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'danger',
        onConfirm: null,
        showCancel: true,
        confirmText: 'Confirmar'
    });

    useEffect(() => {
        const loadFederacion = async () => {
            try {
                // Intentamos obtener la lista de federaciones (generalmente hay una sola)
                const response = await api.get('/Federacion');

                if (Array.isArray(response) && response.length > 0) {
                    setFederacion(response[0]);
                } else if (response && response.idFederacion) {
                    setFederacion(response);
                } else {
                    // Fallback: intentar ID 1 por defecto si devuelve vacío
                    try {
                        const single = await api.get('/Federacion/1');
                        setFederacion(single);
                    } catch (e) {
                        console.warn('No se pudo cargar federación ID 1');
                    }
                }
            } catch (error) {
                console.error('Error cargando federacion:', error);
            } finally {
                setLoading(false);
            }
        };
        loadFederacion();
    }, []);

    const executeReset = async () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        setReseting(true);
        try {
            // 1. Resetear Clubes (LocalStorage)
            const clubes = await api.get('/Club');
            clubes.forEach(c => {
                localStorage.setItem(`club_membresia_${c.idClub || c.IdClub}`, 'false');
            });

            // 2. Resetear Atletas (API)
            const atletas = await api.get('/Atleta');
            setResetProgress({ current: 0, total: atletas.length });

            for (let i = 0; i < atletas.length; i++) {
                const atleta = atletas[i];
                const id = atleta.idPersona || atleta.IdPersona;

                try {
                    const fullAtleta = await api.get(`/Atleta/${id}`);
                    const payload = {
                        ...fullAtleta,
                        estadoPago: 2 // Vencido
                    };
                    await api.put(`/Atleta/${id}`, payload);
                } catch (err) {
                    console.error(`Error reseteando atleta ${id}:`, err);
                }

                setResetProgress(prev => ({ ...prev, current: i + 1 }));
            }

            setModalConfig({
                isOpen: true,
                title: '¡Operación Exitosa!',
                message: 'El proceso de reinicio anual se ha completado con éxito.',
                type: 'success',
                showCancel: false,
                confirmText: 'Entendido',
                onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
            });

        } catch (error) {
            console.error('Error en el reinicio global:', error);
            setModalConfig({
                isOpen: true,
                title: 'Error',
                message: 'Hubo un error durante el proceso de reinicio.',
                type: 'danger',
                showCancel: false,
                confirmText: 'Cerrar',
                onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
            });
        } finally {
            setReseting(false);
            setResetProgress({ current: 0, total: 0 });
        }
    };

    const handleResetPagos = () => {
        setModalConfig({
            isOpen: true,
            title: '¿Confirmar Reinicio Anual?',
            message: "Esta acción reseteará el estado de pago de TODOS los atletas a 'VENCIDO' y la membresía de TODOS los clubes a 'PENDIENTE'. Esta acción no se puede deshacer.",
            type: 'danger',
            confirmText: 'Sí, Reiniciar Todo',
            onConfirm: executeReset
        });
    };

    if (loading) return <div className="p-4">Cargando información...</div>;

    if (!federacion) {
        return (
            <div className="page-container">
                <h2 className="page-title">Federación</h2>
                <Card>
                    <div className="text-center p-4">
                        <Shield size={48} className="mx-auto mb-2 text-gray-400" />
                        <p>No se encontró información de la federación registrada.</p>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="page-container">
            <h2 className="page-title">Detalles de la Federación</h2>
            <Card>
                <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '300px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                            <div style={{
                                padding: '1.5rem',
                                borderRadius: '12px',
                                backgroundColor: 'var(--primary-light)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyItems: 'center'
                            }}>
                                <Shield size={48} color="var(--primary)" />
                            </div>
                            <div>
                                <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 'bold' }}>{federacion.nombre || 'Federación'}</h1>
                                {federacion.sigla && (
                                    <span className="badge badge-primary" style={{ fontSize: '1rem', marginTop: '0.5rem' }}>
                                        {federacion.sigla}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
                            <div className="info-section">
                                <h3 style={{
                                    borderBottom: '1px solid var(--border-color)',
                                    paddingBottom: '0.75rem',
                                    marginBottom: '1rem',
                                    color: 'var(--text-primary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}>
                                    Información de Contacto
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                                        <MapPin size={20} className="text-primary mt-1" />
                                        <div>
                                            <span style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Dirección</span>
                                            <span>{federacion.direccion || 'No registrada'}</span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                                        <Phone size={20} className="text-primary mt-1" />
                                        <div>
                                            <span style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Teléfono</span>
                                            <span>{federacion.telefono || 'No registrado'}</span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                                        <Mail size={20} className="text-primary mt-1" />
                                        <div>
                                            <span style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Email</span>
                                            <span>{federacion.email || 'No registrado'}</span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                                        <Globe size={20} className="text-primary mt-1" />
                                        <div>
                                            <span style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Sitio Web</span>
                                            <span>{federacion.web || 'No registrado'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="info-section">
                                <h3 style={{
                                    borderBottom: '1px solid var(--border-color)',
                                    paddingBottom: '0.75rem',
                                    marginBottom: '1rem',
                                    color: 'var(--text-primary)'
                                }}>
                                    Datos Legales
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div>
                                        <span style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>CUIT</span>
                                        <span style={{ fontSize: '1.1rem', fontWeight: '500' }}>{federacion.cuit || '-'}</span>
                                    </div>
                                    <div>
                                        <span style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Personería Jurídica</span>
                                        <span>{federacion.personeriaJuridica || '-'}</span>
                                    </div>
                                    {federacion.presidente && (
                                        <div>
                                            <span style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Presidente</span>
                                            <span>{federacion.presidente}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            <Card style={{ marginTop: '2rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <h3 style={{
                    color: 'var(--danger)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '1rem'
                }}>
                    <AlertTriangle size={20} /> Acciones Globales de Temporada
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                    Utiliza esta opción al finalizar el año o la temporada para resetear todos los estados de pago.
                    Esto marcará a todos los atletas con pago <strong>Vencido</strong> y a los clubes como <strong>Pendiente</strong>.
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                    <Button
                        variant="danger"
                        onClick={handleResetPagos}
                        isLoading={reseting}
                        disabled={reseting}
                    >
                        <RefreshCcw size={18} /> Reiniciar Pagos (Anual)
                    </Button>

                    {reseting && (
                        <div style={{ flex: 1, minWidth: '200px' }}>
                            <div style={{ fontSize: '0.85rem', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                                <span>Procesando atletas...</span>
                                <span>{resetProgress.current} / {resetProgress.total}</span>
                            </div>
                            <div style={{
                                width: '100%',
                                height: '8px',
                                backgroundColor: 'var(--border-color)',
                                borderRadius: '4px',
                                overflow: 'hidden'
                            }}>
                                <div style={{
                                    width: `${(resetProgress.current / resetProgress.total) * 100}%`,
                                    height: '100%',
                                    backgroundColor: 'var(--danger)',
                                    transition: 'width 0.3s ease'
                                }}></div>
                            </div>
                        </div>
                    )}
                </div>
            </Card>

            <ConfirmationModal
                isOpen={modalConfig.isOpen}
                onClose={() => !reseting && setModalConfig(prev => ({ ...prev, isOpen: false }))}
                onConfirm={modalConfig.onConfirm}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
                confirmText={modalConfig.confirmText}
                showCancel={modalConfig.showCancel}
                isLoading={reseting}
            />
        </div>
    );
};

export default FederacionDetalles;
