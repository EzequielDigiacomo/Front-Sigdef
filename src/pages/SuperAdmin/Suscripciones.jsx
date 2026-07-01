import React, { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import { DollarSign, CheckCircle2, TrendingUp, AlertTriangle } from 'lucide-react';

const Suscripciones = () => {
    const [facturas, setFacturas] = useState([]);
    const [stats, setStats] = useState({
        totalFacturado: 445000,
        montoPendiente: 150000,
        porcentajeCobro: 74.8
    });

    useEffect(() => {
        // Datos mock de facturación premium
        setFacturas([
            { id: 'FAC-0526', fed: 'Federación Argentina de Canoas', plan: 'Enterprise', monto: 150000, fechaEmision: '2026-05-01', fechaVencimiento: '2026-05-15', estado: 'Cobrado' },
            { id: 'FUC-0526', fed: 'Federación Uruguaya de Canotaje', plan: 'Premium', monto: 95000, fechaEmision: '2026-05-01', fechaVencimiento: '2026-05-15', estado: 'Cobrado' },
            { id: 'FDC-0526', fed: 'Federación Chilena de Canotaje', plan: 'Básico', monto: 50000, fechaEmision: '2026-05-01', fechaVencimiento: '2026-05-15', estado: 'Cobrado' },
            { id: 'CBCa-0526', fed: 'Federación Brasilera de Canotaje', plan: 'Enterprise', monto: 150000, fechaEmision: '2026-05-01', fechaVencimiento: '2026-05-15', estado: 'Pendiente' }
        ]);
    }, []);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div>
                <h2 className="text-gradient" style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.25rem' }}>Facturación y Suscripciones</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Control de ingresos recurrentes, membresías SaaS y estados de pago mensuales.</p>
            </div>

            {/* Fila de Tarjetas KPI de Pagos */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '1.5rem'
            }}>
                <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '600' }}>Total Cobrado (Mes Actual)</span>
                        <h3 style={{ fontSize: '1.8rem', fontWeight: '800', margin: '0.25rem 0 0 0', color: 'var(--text-primary)' }}>
                            $295.000 ARS
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
                            $150.000 ARS
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

            {/* Listado de Facturas Emitidas */}
            <Card>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '1.25rem' }}>Registro de Facturas Emitidas</h3>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                <th style={{ padding: '1rem 0.5rem' }}>ID FACTURA</th>
                                <th style={{ padding: '1rem 0.5rem' }}>FEDERACIÓN</th>
                                <th style={{ padding: '1rem 0.5rem' }}>PLAN</th>
                                <th style={{ padding: '1rem 0.5rem' }}>MONTO</th>
                                <th style={{ padding: '1rem 0.5rem' }}>EMISIÓN</th>
                                <th style={{ padding: '1rem 0.5rem' }}>ESTADO</th>
                            </tr>
                        </thead>
                        <tbody>
                            {facturas.map((fac) => (
                                <tr key={fac.id} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                                    <td style={{ padding: '1rem 0.5rem', fontWeight: 'bold' }}>{fac.id}</td>
                                    <td style={{ padding: '1rem 0.5rem' }}>{fac.fed}</td>
                                    <td style={{ padding: '1rem 0.5rem' }}>{fac.plan}</td>
                                    <td style={{ padding: '1rem 0.5rem', fontWeight: '600' }}>${fac.monto.toLocaleString()} ARS</td>
                                    <td style={{ padding: '1rem 0.5rem' }}>{fac.fechaEmision}</td>
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
            </Card>
        </div>
    );
};

export default Suscripciones;
