import React, { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import { DollarSign, CheckCircle2, TrendingUp, AlertTriangle } from 'lucide-react';
import { fetchSuscripcionesData } from '../../services/saasService';
import { getApiBaseUrl } from '../../services/api';

const Suscripciones = () => {
    const [facturas, setFacturas] = useState([]);
    const [stats, setStats] = useState({
        totalFacturado: 0,
        montoPendiente: 0,
        porcentajeCobro: 0,
    });
    const [planes, setPlanes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                setError('');
                const data = await fetchSuscripcionesData();
                setFacturas(data.facturas);
                setStats(data.stats);
                setPlanes(data.planes);
            } catch (err) {
                console.error('Error cargando suscripciones:', err);
                setError(
                    `${err.message || 'Error al cargar datos'}. API: ${getApiBaseUrl()}`
                );
                setFacturas([]);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    if (loading) {
        return (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                Cargando facturación...
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div>
                <h2 className="text-gradient" style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.25rem' }}>Facturación y Suscripciones</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Estado de suscripciones SaaS según federaciones registradas en la base de datos.</p>
            </div>

            {error && (
                <div style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    color: 'var(--danger)',
                    fontSize: '0.9rem',
                }}>
                    {error}
                </div>
            )}

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '1.5rem'
            }}>
                <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '600' }}>Total Cobrado (activas al día)</span>
                        <h3 style={{ fontSize: '1.8rem', fontWeight: '800', margin: '0.25rem 0 0 0', color: 'var(--text-primary)' }}>
                            ${stats.totalFacturado.toLocaleString('es-AR')}
                        </h3>
                    </div>
                    <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', padding: '0.6rem', borderRadius: '50%' }}>
                        <CheckCircle2 size={24} />
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '600' }}>Pendiente de Cobro</span>
                        <h3 style={{ fontSize: '1.8rem', fontWeight: '800', margin: '0.25rem 0 0 0', color: 'var(--text-primary)' }}>
                            ${stats.montoPendiente.toLocaleString('es-AR')}
                        </h3>
                    </div>
                    <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', padding: '0.6rem', borderRadius: '50%' }}>
                        <AlertTriangle size={24} />
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '600' }}>Efectividad de Cobros</span>
                        <h3 style={{ fontSize: '1.8rem', fontWeight: '800', margin: '0.25rem 0 0 0', color: 'var(--text-primary)' }}>
                            {stats.porcentajeCobro}%
                        </h3>
                    </div>
                    <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', padding: '0.6rem', borderRadius: '50%' }}>
                        <TrendingUp size={24} />
                    </div>
                </div>
            </div>

            <Card>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '1.25rem' }}>Estado de Suscripciones por Federación</h3>
                {facturas.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)' }}>No hay federaciones registradas.</p>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                    <th style={{ padding: '1rem 0.5rem' }}>REFERENCIA</th>
                                    <th style={{ padding: '1rem 0.5rem' }}>FEDERACIÓN</th>
                                    <th style={{ padding: '1rem 0.5rem' }}>PLAN</th>
                                    <th style={{ padding: '1rem 0.5rem' }}>MONTO</th>
                                    <th style={{ padding: '1rem 0.5rem' }}>ALTA PLAN</th>
                                    <th style={{ padding: '1rem 0.5rem' }}>VENCIMIENTO</th>
                                    <th style={{ padding: '1rem 0.5rem' }}>ESTADO</th>
                                </tr>
                            </thead>
                            <tbody>
                                {facturas.map((fac) => (
                                    <tr key={fac.id} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                                        <td style={{ padding: '1rem 0.5rem', fontWeight: 'bold' }}>{fac.id}</td>
                                        <td style={{ padding: '1rem 0.5rem' }}>{fac.fed}</td>
                                        <td style={{ padding: '1rem 0.5rem' }}>{fac.plan}</td>
                                        <td style={{ padding: '1rem 0.5rem', fontWeight: '600' }}>${fac.monto.toLocaleString('es-AR')}</td>
                                        <td style={{ padding: '1rem 0.5rem' }}>{fac.fechaEmision}</td>
                                        <td style={{ padding: '1rem 0.5rem' }}>{fac.fechaVencimiento}</td>
                                        <td style={{ padding: '1rem 0.5rem' }}>
                                            <span style={{
                                                backgroundColor: fac.estado === 'Cobrado' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                                color: fac.estado === 'Cobrado' ? 'var(--success)' : 'var(--warning)',
                                                fontSize: '0.75rem',
                                                padding: '0.2rem 0.5rem',
                                                borderRadius: '10px',
                                                fontWeight: 'bold'
                                            }}>
                                                {fac.estado}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {planes.length > 0 && (
                <Card>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '1.25rem' }}>Planes SaaS en Base de Datos</h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                    <th style={{ padding: '0.75rem' }}>PLAN</th>
                                    <th style={{ padding: '0.75rem' }}>PRECIO MENSUAL</th>
                                    <th style={{ padding: '0.75rem' }}>MÁX. ATLETAS</th>
                                    <th style={{ padding: '0.75rem' }}>MÁX. TORNEOS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {planes.map((p) => (
                                    <tr key={p.id ?? p.Id} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
                                        <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{p.nombre ?? p.Nombre}</td>
                                        <td style={{ padding: '0.75rem' }}>${Number(p.precio ?? p.Precio ?? 0).toLocaleString('es-AR')}</td>
                                        <td style={{ padding: '0.75rem' }}>{p.maxAtletas ?? p.MaxAtletas ?? '—'}</td>
                                        <td style={{ padding: '0.75rem' }}>{p.maxTorneosActivos ?? p.MaxTorneosActivos ?? '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
        </div>
    );
};

export default Suscripciones;
