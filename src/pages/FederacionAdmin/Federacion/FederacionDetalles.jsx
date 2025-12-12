import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import Card from '../../../components/common/Card';
import { Shield, MapPin, Phone, Mail, Globe } from 'lucide-react';

const FederacionDetalles = () => {
    const [federacion, setFederacion] = useState(null);
    const [loading, setLoading] = useState(true);

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
        </div>
    );
};

export default FederacionDetalles;
