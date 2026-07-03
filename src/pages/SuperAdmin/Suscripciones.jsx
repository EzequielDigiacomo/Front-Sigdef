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

            {/* Tabla de Tarifas de Referencia (SaaS) */}
            <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <div>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>Grilla de Precios de Referencia (SaaS)</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Valores oficiales de suscripción mensual y pago anual con descuento del 20%.</p>
                    </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                <th style={{ padding: '1rem 0.5rem' }}>PLAN / MÓDULO</th>
                                <th style={{ padding: '1rem 0.5rem' }}>MENSUAL</th>
                                <th style={{ padding: '1rem 0.5rem' }}>ANUAL (PAGO ÚNICO)</th>
                                <th style={{ padding: '1rem 0.5rem' }}>EQUIV. MENSUAL EN ANUAL</th>
                                <th style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>AHORRO EFECTIVO</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                { name: 'SIGDEF (S)', mensual: 'USD 50', anual: 'USD 480', equiv: 'USD 40', ahorro: '20%' },
                                { name: 'SIGDEF (M)', mensual: 'USD 120', anual: 'USD 1.150', equiv: 'USD 95.8', ahorro: '20%' },
                                { name: 'SIGDEF (L)', mensual: 'USD 250', anual: 'USD 2.400', equiv: 'USD 200', ahorro: '20%' },
                                { name: 'SportTrack (S)', mensual: 'USD 40', anual: 'USD 380', equiv: 'USD 31.6', ahorro: '20%' },
                                { name: 'SportTrack (M)', mensual: 'USD 90', anual: 'USD 860', equiv: 'USD 71.6', ahorro: '20%' },
                                { name: 'SportTrack (L)', mensual: 'USD 190', anual: 'USD 1.800', equiv: 'USD 150', ahorro: '20%' },
                                { name: 'Pack Dúo (S)', mensual: 'USD 75', anual: 'USD 720', equiv: 'USD 60', ahorro: '20%' },
                                { name: 'Pack Dúo (M)', mensual: 'USD 170', anual: 'USD 1.600', equiv: 'USD 133.3', ahorro: '20%' },
                                { name: 'Pack Dúo (L)', mensual: 'USD 350', anual: 'USD 3.360', equiv: 'USD 280', ahorro: '20%' },
                            ].map((row, idx) => (
                                <tr key={idx} style={{ 
                                    borderBottom: '1px solid var(--border-color)', 
                                    fontSize: '0.9rem', 
                                    color: 'var(--text-primary)',
                                    backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.02)'
                                }}>
                                    <td style={{ padding: '1rem 0.5rem', fontWeight: 'bold' }}>{row.name}</td>
                                    <td style={{ padding: '1rem 0.5rem' }}>{row.mensual}</td>
                                    <td style={{ padding: '1rem 0.5rem', color: 'var(--success)', fontWeight: '600' }}>{row.anual}</td>
                                    <td style={{ padding: '1rem 0.5rem', color: 'var(--text-secondary)' }}>{row.equiv}</td>
                                    <td style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>
                                        <span style={{ 
                                            backgroundColor: 'rgba(16, 185, 129, 0.1)', 
                                            color: 'var(--success)', 
                                            fontSize: '0.75rem', 
                                            padding: '0.2rem 0.5rem', 
                                            borderRadius: '6px',
                                            fontWeight: 'bold' 
                                        }}>
                                            {row.ahorro}
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
