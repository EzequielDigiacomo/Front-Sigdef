import React, { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import { Activity, ShieldAlert, Key, Globe, Search } from 'lucide-react';
import SearchInput from '../../components/common/SearchInput';

const Auditoria = () => {
    const [logs, setLogs] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        // Datos mock de auditoría premium
        setLogs([
            { id: 1, tipo: 'Seguridad', accion: 'Alta de Federación', detalle: 'Creada Federación Brasilera (CBCa)', fecha: '2026-05-20 10:45:22', usuario: 'superadmin', ip: '190.111.45.22' },
            { id: 2, tipo: 'Configuración', accion: 'Suscripción Actualizada', detalle: 'FAC migró al plan Enterprise', fecha: '2026-05-19 14:32:10', usuario: 'superadmin', ip: '190.111.45.22' },
            { id: 3, tipo: 'Seguridad', accion: 'Bloqueo de Cuenta', detalle: 'Federación de Remo (Inactiva) suspendida por impago', fecha: '2026-05-17 08:00:00', usuario: 'system', ip: '127.0.0.1' },
            { id: 4, tipo: 'Acceso', accion: 'Inicio de Sesión Exitoso', detalle: 'Superadmin logueado en la plataforma', fecha: '2026-05-20 07:11:45', usuario: 'superadmin', ip: '186.22.105.80' },
            { id: 5, tipo: 'Acceso', accion: 'Fallo de Autenticación', detalle: 'Intento fallido de login con usuario "superadmin_test"', fecha: '2026-05-20 07:10:02', usuario: 'unknown', ip: '186.22.105.80' },
            { id: 6, tipo: 'Seguridad', accion: 'Edición de Federación', detalle: 'Modificados detalles de contacto de FUC', fecha: '2026-05-16 11:24:55', usuario: 'superadmin', ip: '190.111.45.22' }
        ]);
    }, []);

    const filteredLogs = logs.filter(log => 
        log.accion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.detalle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.usuario.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getIcon = (tipo) => {
        switch (tipo) {
            case 'Seguridad': return <ShieldAlert size={16} />;
            case 'Acceso': return <Key size={16} />;
            default: return <Globe size={16} />;
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div>
                <h2 className="text-gradient" style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.25rem' }}>Bitácora de Auditoría</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Historial detallado de operaciones de seguridad y accesos al ecosistema SaaS.</p>
            </div>

            <Card>
                <div style={{ marginBottom: '1.5rem' }}>
                    <SearchInput 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                        placeholder="Buscar registros de auditoría por acción, detalle o usuario..." 
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {filteredLogs.map((log) => (
                        <div key={log.id} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            padding: '1rem',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: 'var(--bg-primary)'
                        }}>
                            <div style={{
                                color: log.accion.includes('Bloqueo') || log.accion.includes('Fallo') ? 'var(--danger)' : 'var(--primary)',
                                backgroundColor: log.accion.includes('Bloqueo') || log.accion.includes('Fallo') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                                padding: '0.5rem',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                {getIcon(log.tipo)}
                            </div>
                            
                            <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ minWidth: '250px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{log.accion}</h4>
                                        <span style={{
                                            fontSize: '0.7rem',
                                            padding: '0.1rem 0.4rem',
                                            borderRadius: '4px',
                                            backgroundColor: 'var(--border-color)',
                                            color: 'var(--text-secondary)',
                                            fontWeight: '600'
                                        }}>
                                            {log.tipo}
                                        </span>
                                    </div>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                                        {log.detalle}
                                    </p>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontSize: '0.8rem', color: 'var(--text-secondary)', minWidth: '150px' }}>
                                    <span>Usuario: <strong style={{ color: 'var(--primary)' }}>{log.usuario}</strong></span>
                                    <span>IP: {log.ip}</span>
                                    <span style={{ fontSize: '0.75rem', marginTop: '0.1rem' }}>{log.fecha}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
};

export default Auditoria;
