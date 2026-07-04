import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import SearchInput from '../../components/common/SearchInput';
import { Plus, Edit, Trash2, Globe, Mail, Phone, ShieldCheck, ShieldAlert, Award, LogIn, Settings, X, XCircle, Check, Calendar } from 'lucide-react';
import Modal from '../../components/common/Modal';

const FederacionesManagement = () => {
    const navigate = useNavigate();
    const [federaciones, setFederaciones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFed, setSelectedFed] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    
    // SaaS Detail state
    const [selectedFedConfig, setSelectedFedConfig] = useState(null);
    const [planes, setPlanes] = useState([]);
    const [updatingSaaS, setUpdatingSaaS] = useState(false);

    const formatDate = (dateStr) => {
        if (!dateStr) return 'Sin fecha';
        try {
            const parts = dateStr.split('T')[0].split('-');
            if (parts.length === 3) {
                return `${parts[2]}/${parts[1]}/${parts[0]}`;
            }
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return 'Sin fecha';
            return d.toLocaleDateString('es-AR');
        } catch {
            return 'Sin fecha';
        }
    };

    useEffect(() => {
        loadPlanes();
        loadFederaciones();
    }, []);

    const getSigla = (nombre) => {
        if (!nombre) return 'FED';
        const words = nombre.trim().toUpperCase().split(/\s+/);
        if (words.length === 1) return words[0].substring(0, 3);
        const filtered = words.filter(w => w.length > 2);
        if (filtered.length === 0) return words.map(w => w[0]).join('').substring(0, 3);
        return filtered.map(w => w[0]).join('').substring(0, 4);
    };

    const loadPlanes = async () => {
        try {
            const data = await api.get('/SaaS/planes') || [];
            setPlanes(data);
        } catch (error) {
            console.error('Error cargando planes SaaS:', error);
        }
    };

    const loadFederaciones = async () => {
        try {
            setLoading(true);
            const allFeds = await api.get('/Federaciones') || [];
            
            // Get plans if not loaded yet
            let currentPlanes = planes;
            if (currentPlanes.length === 0) {
                try {
                    const data = await api.get('/SaaS/planes') || [];
                    setPlanes(data);
                    currentPlanes = data;
                } catch (err) {
                    console.error('Error fetching planes inside loadFederaciones:', err);
                }
            }

            const finalFeds = allFeds.map((f) => {
                const plan = currentPlanes.find(p => p.id === f.planSaaSId) || currentPlanes[0] || { nombre: 'Básico', precio: 50000 };
                return {
                    idFederacion: f.idFederacion,
                    nombre: f.nombre || 'Federación Deportiva',
                    sigla: f.sigla || getSigla(f.nombre),
                    email: f.email || 'contacto@federacion.org',
                    telefono: f.telefono || 'Sin teléfono',
                    planSaaSId: f.planSaaSId || 1,
                    plan: plan.nombre,
                    estado: f.activo ? 'Activo' : 'Suspendido',
                    costoMensual: plan.precio,
                    pais: f.direccion || 'Argentina',
                    fechaAltaPlan: f.fechaAltaPlan,
                    fechaVencimientoPlan: f.fechaVencimientoPlan,
                    frecuenciaPago: f.frecuenciaPago || 'Mensual',
                    bloqueadaPorFaltaDePago: f.bloqueadaPorFaltaDePago || false,
                    activo: f.activo,
                    cuit: f.cuit || '',
                    bancoNombre: f.bancoNombre || '',
                    tipoCuenta: f.tipoCuenta || '',
                    numeroCuenta: f.numeroCuenta || '',
                    titularCuenta: f.titularCuenta || '',
                    emailCobro: f.emailCobro || ''
                };
            });

            setFederaciones(finalFeds);

            // Update selected config ref if open
            if (selectedFedConfig) {
                const updated = finalFeds.find(x => x.idFederacion === selectedFedConfig.idFederacion);
                if (updated) setSelectedFedConfig(updated);
            }
        } catch (error) {
            console.error('Error cargando federaciones:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleActivo = async (fedId) => {
        setUpdatingSaaS(true);
        try {
            await api.patch(`/SaaS/clubes/${fedId}/toggle-activo`);
            await loadFederaciones();
        } catch (err) {
            console.error("Error al cambiar estado activo:", err);
            alert("Error al cambiar el estado de acceso de la federación.");
        } finally {
            setUpdatingSaaS(false);
        }
    };

    const handleAsignarPlan = async (fedId, planId) => {
        setUpdatingSaaS(true);
        try {
            await api.post(`/SaaS/asignar-plan?clubId=${fedId}&planId=${planId}`);
            await loadFederaciones();
        } catch (err) {
            console.error("Error asignando plan:", err);
            alert("Error al cambiar el plan de la federación.");
        } finally {
            setUpdatingSaaS(false);
        }
    };

    const handleUpdateInlineField = async (fedId, fieldName, value) => {
        const fed = federaciones.find(f => f.idFederacion === fedId);
        if (!fed) return;

        setUpdatingSaaS(true);
        try {
            const updatedFed = {
                ...fed,
                [fieldName]: value
            };

            if (fieldName === 'frecuenciaPago' || fieldName === 'fechaAltaPlan') {
                const freq = fieldName === 'frecuenciaPago' ? value : fed.frecuenciaPago;
                const alta = fieldName === 'fechaAltaPlan' ? value : fed.fechaAltaPlan;

                if (alta) {
                    const altaDate = new Date(alta);
                    if (!isNaN(altaDate.getTime())) {
                        const vencDate = new Date(altaDate);
                        if (freq === 'Anual') {
                            vencDate.setFullYear(vencDate.getFullYear() + 1);
                        } else {
                            vencDate.setMonth(vencDate.getMonth() + 1);
                        }
                        updatedFed.fechaVencimientoPlan = vencDate.toISOString().split('T')[0];
                    }
                }
            }

            const updatePayload = {
                nombre: updatedFed.nombre,
                cuit: updatedFed.cuit,
                email: updatedFed.email,
                telefono: updatedFed.telefono,
                direccion: updatedFed.pais,
                bancoNombre: updatedFed.bancoNombre,
                tipoCuenta: updatedFed.tipoCuenta,
                numeroCuenta: updatedFed.numeroCuenta,
                titularCuenta: updatedFed.titularCuenta,
                emailCobro: updatedFed.emailCobro,
                planSaaSId: updatedFed.planSaaSId,
                fechaAltaPlan: updatedFed.fechaAltaPlan ? new Date(updatedFed.fechaAltaPlan).toISOString() : null,
                fechaVencimientoPlan: updatedFed.fechaVencimientoPlan ? new Date(updatedFed.fechaVencimientoPlan).toISOString() : null,
                frecuenciaPago: updatedFed.frecuenciaPago,
                bloqueadaPorFaltaDePago: updatedFed.bloqueadaPorFaltaDePago
            };

            await api.put(`/Federaciones/${fedId}`, updatePayload);
            await loadFederaciones();
        } catch (err) {
            console.error("Error updating SaaS field:", err);
            alert("No se pudo actualizar la configuración. Intente nuevamente.");
        } finally {
            setUpdatingSaaS(false);
        }
    };

    const handleDeleteClick = (fed) => {
        setSelectedFed(fed);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        try {
            await api.delete(`/Federaciones/${selectedFed.idFederacion}`);
            setShowDeleteModal(false);
            setSelectedFed(null);
            if (selectedFedConfig?.idFederacion === selectedFed.idFederacion) {
                setSelectedFedConfig(null);
            }
            loadFederaciones();
        } catch (error) {
            console.error('Error eliminando federación:', error);
            alert('No se pudo eliminar la federación. Asegúrese de que no tenga clubes o atletas vinculados.');
        }
    };

    const filteredFeds = federaciones.filter(fed =>
        fed.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fed.sigla.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fed.pais.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 className="text-gradient" style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.25rem' }}>Gestión de Federaciones</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Da de alta, edita, audita o suspende las federaciones inquilinas del ecosistema.</p>
                </div>
                <Button variant="primary" onClick={() => navigate('/superadmin/federaciones/nueva')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Plus size={18} />
                    Alta de Federación
                </Button>
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', width: '100%', alignItems: 'flex-start' }}>
                {/* Left side: Search & Cards List */}
                <div style={{ flex: selectedFedConfig ? '1 1 65%' : '1 1 100%', minWidth: 0, transition: 'all 0.3s ease' }}>
                    <Card>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
                            <SearchInput 
                                value={searchTerm} 
                                onChange={(e) => setSearchTerm(e.target.value)} 
                                placeholder="Buscar federaciones por nombre, sigla o país..." 
                                style={{ flex: 1, minWidth: '300px' }}
                            />
                        </div>

                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>Cargando federaciones...</div>
                        ) : filteredFeds.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                                <p style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>No se encontraron federaciones</p>
                                <p style={{ fontSize: '0.9rem' }}>Intente buscar con otro término o cree una nueva federación.</p>
                            </div>
                        ) : (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: selectedFedConfig ? 'repeat(auto-fill, minmax(280px, 1fr))' : 'repeat(auto-fill, minmax(340px, 1fr))',
                                gap: '1.2rem',
                                transition: 'all 0.3s ease'
                            }}>
                                {filteredFeds.map((fed) => (
                                    <div key={fed.idFederacion} className="glass-panel" 
                                        onClick={() => setSelectedFedConfig(selectedFedConfig?.idFederacion === fed.idFederacion ? null : fed)}
                                        style={{
                                            padding: '1.2rem',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'space-between',
                                            minHeight: '230px',
                                            border: selectedFedConfig?.idFederacion === fed.idFederacion ? '1.5px solid var(--primary)' : '1.5px solid var(--border-color)',
                                            boxShadow: selectedFedConfig?.idFederacion === fed.idFederacion ? '0 0 15px rgba(59, 130, 246, 0.2)' : 'none',
                                            position: 'relative',
                                            transition: 'all 0.3s ease',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {/* Badge de Plan */}
                                        <div style={{
                                            position: 'absolute',
                                            top: '1rem',
                                            right: '1rem',
                                            display: 'flex',
                                            gap: '0.5rem',
                                            alignItems: 'center'
                                        }}>
                                            <span style={{
                                                backgroundColor: fed.plan.includes('L') || fed.plan.includes('Enterprise') ? 'rgba(59, 130, 246, 0.1)' : (fed.plan.includes('M') || fed.plan.includes('Premium') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)'),
                                                color: fed.plan.includes('L') || fed.plan.includes('Enterprise') ? 'var(--primary)' : (fed.plan.includes('M') || fed.plan.includes('Premium') ? 'var(--success)' : 'var(--warning)'),
                                                fontSize: '0.75rem',
                                                padding: '0.2rem 0.6rem',
                                                borderRadius: '20px',
                                                fontWeight: 'bold',
                                                border: '1px solid rgba(var(--primary-rgb), 0.2)'
                                            }}>
                                                {fed.plan}
                                            </span>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{
                                                    width: '45px',
                                                    height: '45px',
                                                    borderRadius: 'var(--radius-md)',
                                                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                                    color: 'var(--primary)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontWeight: 'bold',
                                                    fontSize: '1.1rem'
                                                }}>
                                                    {fed.sigla}
                                                </div>
                                                <div>
                                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-primary)', paddingRight: '5rem' }}>
                                                        {fed.nombre}
                                                    </h3>
                                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{fed.pais}</p>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <Mail size={16} />
                                                    <span>{fed.email}</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <Phone size={16} />
                                                    <span>{fed.telefono}</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <Award size={16} />
                                                    <span>Costo: ${fed.costoMensual?.toLocaleString()} ARS/mes</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <Calendar size={16} />
                                                    <span>Inicio: {formatDate(fed.fechaAltaPlan)}</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <Calendar size={16} />
                                                    <span>Vence: {formatDate(fed.fechaVencimientoPlan)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            marginTop: '1.5rem',
                                            paddingTop: '1rem',
                                            borderTop: '1px solid var(--border-color)'
                                        }}>
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleToggleActivo(fed.idFederacion);
                                                }}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.35rem',
                                                    fontSize: '0.8rem',
                                                    fontWeight: 'bold',
                                                    color: fed.activo ? 'var(--success)' : 'var(--danger)',
                                                    cursor: 'pointer',
                                                    background: 'none',
                                                    border: 'none'
                                                }}
                                            >
                                                {fed.activo ? <ShieldCheck size={16} /> : <ShieldAlert size={16} />}
                                                <span>{fed.activo ? 'Activo' : 'Suspendido'}</span>
                                            </button>

                                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                                                {/* Botón principal: Ingresar al dashboard de la federación */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/superadmin/federacion/${fed.idFederacion}`);
                                                    }}
                                                    title="Ver dashboard de esta federación"
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.35rem',
                                                        padding: '0.4rem 0.85rem',
                                                        borderRadius: '8px',
                                                        background: 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(139,92,246,0.1) 100%)',
                                                        border: '1px solid rgba(59,130,246,0.4)',
                                                        color: '#60a5fa',
                                                        fontWeight: '700',
                                                        fontSize: '0.8rem',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.25)'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(139,92,246,0.1) 100%)'; }}
                                                >
                                                    <LogIn size={14} />
                                                    Ingresar
                                                </button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    onClick={() => navigate(`/superadmin/federaciones/editar/${fed.idFederacion}`)}
                                                    style={{ padding: '0.4rem' }}
                                                >
                                                    <Edit size={16} />
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    onClick={() => handleDeleteClick(fed)}
                                                    style={{ padding: '0.4rem', color: 'var(--danger)' }}
                                                >
                                                    <Trash2 size={16} />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>

                {/* Right side: SaaS Detail Config Panel */}
                {selectedFedConfig && (
                    <div className="glass-panel" style={{
                        flex: '0 0 350px',
                        padding: '1.5rem',
                        position: 'sticky',
                        top: '1.5rem',
                        border: '1px solid var(--border-color)',
                        borderRadius: '12px',
                        background: 'rgba(30, 41, 59, 0.4)',
                        backdropFilter: 'blur(12px)',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1.2rem',
                        maxHeight: 'calc(100vh - 120px)',
                        overflowY: 'auto',
                        animation: 'slideInRight 0.3s ease'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Settings size={18} style={{ color: 'var(--primary)' }} />
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: 0, color: 'var(--text-primary)' }}>Configuración SaaS</h3>
                            </div>
                            <button 
                                onClick={() => setSelectedFedConfig(null)}
                                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', borderRadius: '50%' }}
                                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div>
                            <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{selectedFedConfig.nombre}</h4>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{selectedFedConfig.sigla} • {selectedFedConfig.pais}</span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Plan de Suscripción</label>
                                <select 
                                    value={selectedFedConfig.planSaaSId || 1} 
                                    onChange={(e) => handleAsignarPlan(selectedFedConfig.idFederacion, parseInt(e.target.value))}
                                    disabled={updatingSaaS}
                                    style={{
                                        width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid var(--border-color)',
                                        backgroundColor: 'rgba(0,0,0,0.3)', color: 'var(--text-primary)', fontSize: '0.85rem'
                                    }}
                                >
                                    {planes.map(p => (
                                        <option key={p.id} value={p.id}>{p.nombre}</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Frecuencia de Pago</label>
                                <select 
                                    value={selectedFedConfig.frecuenciaPago || 'Mensual'} 
                                    onChange={(e) => handleUpdateInlineField(selectedFedConfig.idFederacion, 'frecuenciaPago', e.target.value)}
                                    disabled={updatingSaaS}
                                    style={{
                                        width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid var(--border-color)',
                                        backgroundColor: 'rgba(0,0,0,0.3)', color: 'var(--text-primary)', fontSize: '0.85rem'
                                    }}
                                >
                                    <option value="Mensual">Mensual</option>
                                    <option value="Anual">Anual</option>
                                </select>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Inicio de Suscripción</label>
                                <input 
                                    type="date"
                                    value={selectedFedConfig.fechaAltaPlan ? selectedFedConfig.fechaAltaPlan.split('T')[0] : ''}
                                    onChange={(e) => handleUpdateInlineField(selectedFedConfig.idFederacion, 'fechaAltaPlan', e.target.value)}
                                    disabled={updatingSaaS}
                                    style={{
                                        width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid var(--border-color)',
                                        backgroundColor: 'rgba(0,0,0,0.3)', color: 'var(--text-primary)', fontSize: '0.85rem'
                                    }}
                                />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Vencimiento de Suscripción</label>
                                <input 
                                    type="date"
                                    value={selectedFedConfig.fechaVencimientoPlan ? selectedFedConfig.fechaVencimientoPlan.split('T')[0] : ''}
                                    onChange={(e) => handleUpdateInlineField(selectedFedConfig.idFederacion, 'fechaVencimientoPlan', e.target.value)}
                                    disabled={updatingSaaS}
                                    style={{
                                        width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid var(--border-color)',
                                        backgroundColor: 'rgba(0,0,0,0.3)', color: 'var(--text-primary)', fontSize: '0.85rem'
                                    }}
                                />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Estado de Pago / Acceso</label>
                                <select 
                                    value={selectedFedConfig.bloqueadaPorFaltaDePago ? 'Bloqueado' : 'AlDia'} 
                                    onChange={(e) => handleUpdateInlineField(selectedFedConfig.idFederacion, 'bloqueadaPorFaltaDePago', e.target.value === 'Bloqueado')}
                                    disabled={updatingSaaS}
                                    style={{
                                        width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid var(--border-color)',
                                        backgroundColor: 'rgba(0,0,0,0.3)', fontSize: '0.85rem',
                                        color: selectedFedConfig.bloqueadaPorFaltaDePago ? '#EF4444' : '#10B981',
                                        fontWeight: 'bold'
                                    }}
                                >
                                     <option value="AlDia" style={{ color: '#10B981' }}>Habilitado (Al día)</option>
                                     <option value="Bloqueado" style={{ color: '#EF4444' }}>Suspendido por Falta de Pago</option>
                                </select>
                            </div>

                            {/* Control de Acceso Panel */}
                            <div style={{ 
                                background: 'rgba(255, 255, 255, 0.02)', 
                                padding: '12px', 
                                borderRadius: '8px', 
                                border: '1px solid var(--border-color, rgba(255, 255, 255, 0.05))',
                                marginTop: '10px'
                            }}>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', display: 'block' }}>
                                    Control de Acceso
                                </label>
                                
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-primary, #ffffff)' }}>
                                        Estado Actual:
                                    </span>
                                    <span style={{ 
                                        fontSize: '0.85rem', 
                                        fontWeight: 'bold', 
                                        color: selectedFedConfig.activo ? '#10B981' : '#EF4444',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}>
                                        <span style={{ 
                                            width: '8px', 
                                            height: '8px', 
                                            borderRadius: '50%', 
                                            backgroundColor: selectedFedConfig.activo ? '#10B981' : '#EF4444',
                                            display: 'inline-block',
                                            boxShadow: selectedFedConfig.activo ? '0 0 8px #10B981' : '0 0 8px #EF4444'
                                        }} />
                                        {selectedFedConfig.activo ? 'ACCESO PERMITIDO' : 'ACCESO SUSPENDIDO'}
                                    </span>
                                </div>

                                <button 
                                    onClick={() => handleToggleActivo(selectedFedConfig.idFederacion)}
                                    disabled={updatingSaaS}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        borderRadius: '6px',
                                        border: '1px solid',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        fontWeight: 'bold',
                                        fontSize: '0.8rem',
                                        transition: 'all 0.2s ease',
                                        backgroundColor: selectedFedConfig.activo ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                        color: selectedFedConfig.activo ? '#EF4444' : '#10B981',
                                        borderColor: selectedFedConfig.activo ? '#EF444444' : '#10B98144',
                                    }}
                                >
                                    {selectedFedConfig.activo ? (
                                        <>
                                            <XCircle size={16} />
                                            <span>SUSPENDER ACCESO</span>
                                        </>
                                    ) : (
                                        <>
                                            <Check size={16} />
                                            <span>HABILITAR ACCESO</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Alerta de expiración / bloqueo */}
                            {(() => {
                                const isExpired = selectedFedConfig.fechaVencimientoPlan && new Date(selectedFedConfig.fechaVencimientoPlan) < new Date();
                                const isBlocked = selectedFedConfig.bloqueadaPorFaltaDePago;
                                if (selectedFedConfig.activo && (isExpired || isBlocked)) {
                                    return (
                                        <div style={{
                                            padding: '10px',
                                            borderRadius: '8px',
                                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                            border: '1px solid rgba(239, 68, 68, 0.3)',
                                            color: '#EF4444',
                                            fontSize: '0.75rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            fontWeight: '500'
                                        }}>
                                            <XCircle size={14} style={{ flexShrink: 0 }} />
                                            <span>
                                                {isBlocked 
                                                    ? "El acceso está bloqueado manualmente por falta de pago." 
                                                    : "El acceso está suspendido automáticamente porque la suscripción ha vencido."}
                                            </span>
                                        </div>
                                    );
                                }
                                return null;
                            })()}
                        </div>

                        <div style={{ marginTop: 'auto', display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                            <button
                                onClick={() => navigate(`/superadmin/federacion/${selectedFedConfig.idFederacion}`)}
                                style={{
                                    flex: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.4rem',
                                    padding: '0.6rem 0.85rem',
                                    borderRadius: '8px',
                                    background: 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(139,92,246,0.1) 100%)',
                                    border: '1px solid rgba(59,130,246,0.4)',
                                    color: '#60a5fa',
                                    fontWeight: '700',
                                    fontSize: '0.8rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <LogIn size={14} />
                                Ingresar Dashboard
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {showDeleteModal && selectedFed && (
                <Modal
                    isOpen={showDeleteModal}
                    onClose={() => setShowDeleteModal(false)}
                    title="Confirmar Eliminación"
                    footer={
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>Cancelar</Button>
                            <Button variant="danger" onClick={confirmDelete}>Eliminar</Button>
                        </div>
                    }
                >
                    <p style={{ color: 'var(--text-primary)', lineHeight: '1.6' }}>
                        ¿Está seguro que desea eliminar por completo la federación <strong>{selectedFed.nombre}</strong> ({selectedFed.sigla})?
                    </p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                        Esta acción es irreversible y cortará de forma permanente el acceso de todos los clubes y atletas asociados a este inquilino.
                    </p>
                </Modal>
            )}
        </div>
    );
};

export default FederacionesManagement;
