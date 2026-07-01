import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import { Shield, MapPin, Phone, Mail, Globe, CreditCard, Edit, Check, X, Building, Info } from 'lucide-react';

const FederacionDetalles = () => {
    const [federacion, setFederacion] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        nombre: '',
        cuit: '',
        email: '',
        telefono: '',
        direccion: '',
        bancoNombre: '',
        tipoCuenta: '',
        numeroCuenta: '',
        titularCuenta: '',
        emailCobro: ''
    });

    useEffect(() => {
        loadFederacion();
    }, []);

    const loadFederacion = async () => {
        try {
            setLoading(true);
            const response = await api.get('/Clubes');

            let data = null;
            if (Array.isArray(response) && response.length > 0) {
                // If it's an array, pick the first federation (parentClubId is null)
                data = response.find(c => !c.parentClubId) || response[0];
            } else if (response && (response.id || response.idFederacion)) {
                data = response;
            } else {
                try {
                    data = await api.get('/Clubes/1');
                } catch (e) {
                    console.warn('No se pudo cargar federación ID 1');
                }
            }

            if (data) {
                setFederacion(data);
                setFormData({
                    nombre: data.nombre || '',
                    cuit: data.cuit || '',
                    email: data.email || '',
                    telefono: data.telefono || '',
                    direccion: data.direccion || '',
                    bancoNombre: data.bancoNombre || '',
                    tipoCuenta: data.tipoCuenta || '',
                    numeroCuenta: data.numeroCuenta || '',
                    titularCuenta: data.titularCuenta || '',
                    emailCobro: data.emailCobro || ''
                });
            }
        } catch (error) {
            console.error('Error cargando federacion:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async (e) => {
        if (e) e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                nombre: formData.nombre,
                cuit: formData.cuit,
                email: formData.email,
                telefono: formData.telefono,
                direccion: formData.direccion,
                bancoNombre: formData.bancoNombre,
                tipoCuenta: formData.tipoCuenta,
                numeroCuenta: formData.numeroCuenta,
                titularCuenta: formData.titularCuenta,
                emailCobro: formData.emailCobro
            };

            const fedId = federacion.id || federacion.idFederacion;
            await api.put(`/Clubes/${fedId}`, payload);
            setFederacion(prev => ({ ...prev, ...payload }));
            setIsEditing(false);
        } catch (error) {
            console.error('Error guardando federación:', error);
            alert('Ocurrió un error al intentar guardar los cambios.');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        // Reset form data to current values
        setFormData({
            nombre: federacion.nombre || '',
            cuit: federacion.cuit || '',
            email: federacion.email || '',
            telefono: federacion.telefono || '',
            direccion: federacion.direccion || '',
            bancoNombre: federacion.bancoNombre || '',
            tipoCuenta: federacion.tipoCuenta || '',
            numeroCuenta: federacion.numeroCuenta || '',
            titularCuenta: federacion.titularCuenta || '',
            emailCobro: federacion.emailCobro || ''
        });
        setIsEditing(false);
    };

    if (loading) return <div className="p-4 text-center">Cargando información de la federación...</div>;

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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 className="page-title" style={{ margin: 0 }}>Detalles de la Federación</h2>
                {!isEditing && (
                    <Button onClick={() => setIsEditing(true)}>
                        <Edit size={18} /> Editar Datos
                    </Button>
                )}
            </div>

            <Card>
                {isEditing ? (
                    <form onSubmit={handleSave}>
                        {/* HEADER EDICION */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                            <div style={{ padding: '1rem', borderRadius: '12px', backgroundColor: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center' }}>
                                <Shield size={36} className="text-primary" />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div className="form-group">
                                    <label>Nombre de la Federación</label>
                                    <input 
                                        type="text" 
                                        name="nombre" 
                                        className="form-input" 
                                        value={formData.nombre} 
                                        onChange={handleInputChange} 
                                        required 
                                        style={{ fontSize: '1.25rem', fontWeight: 'bold' }} 
                                    />
                                </div>
                            </div>
                        </div>

                        {/* GRID EDICION */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
                            {/* CONTACTO */}
                            <div className="info-section">
                                <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1.25rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    Información de Contacto
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div className="form-group">
                                        <label>Dirección</label>
                                        <input type="text" name="direccion" className="form-input" value={formData.direccion} onChange={handleInputChange} />
                                    </div>
                                    <div className="form-group">
                                        <label>Teléfono</label>
                                        <input type="text" name="telefono" className="form-input" value={formData.telefono} onChange={handleInputChange} />
                                    </div>
                                    <div className="form-group">
                                        <label>Email</label>
                                        <input type="email" name="email" className="form-input" value={formData.email} onChange={handleInputChange} />
                                    </div>
                                </div>
                            </div>

                            {/* LEGALES */}
                            <div className="info-section">
                                <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1.25rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    Datos Legales
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div className="form-group">
                                        <label>CUIT</label>
                                        <input type="text" name="cuit" className="form-input" value={formData.cuit} onChange={handleInputChange} required />
                                    </div>
                                </div>
                            </div>

                            {/* BANCARIOS */}
                            <div className="info-section">
                                <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1.25rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    Datos Bancarios
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div className="form-group">
                                        <label>Nombre del Banco</label>
                                        <input type="text" name="bancoNombre" className="form-input" value={formData.bancoNombre} onChange={handleInputChange} placeholder="Ej. Banco Nación" />
                                    </div>
                                    <div className="form-group">
                                        <label>Tipo de Cuenta</label>
                                        <select name="tipoCuenta" className="form-input" value={formData.tipoCuenta} onChange={handleInputChange}>
                                            <option value="">Seleccione tipo...</option>
                                            <option value="Caja de Ahorros">Caja de Ahorros</option>
                                            <option value="Cuenta Corriente">Cuenta Corriente</option>
                                            <option value="Otro">Otro</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Número de Cuenta</label>
                                        <input type="text" name="numeroCuenta" className="form-input" value={formData.numeroCuenta} onChange={handleInputChange} placeholder="Nº de cuenta o CBU/CVU" />
                                    </div>
                                    <div className="form-group">
                                        <label>Titular de la Cuenta</label>
                                        <input type="text" name="titularCuenta" className="form-input" value={formData.titularCuenta} onChange={handleInputChange} />
                                    </div>
                                    <div className="form-group">
                                        <label>Email de Facturación / Cobro</label>
                                        <input type="email" name="emailCobro" className="form-input" value={formData.emailCobro} onChange={handleInputChange} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* BOTONES ACCION EDICION */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                            <Button variant="ghost" onClick={handleCancel} disabled={saving}>
                                <X size={18} /> Cancelar
                            </Button>
                            <Button type="submit" isLoading={saving} disabled={saving}>
                                <Check size={18} /> Guardar Cambios
                            </Button>
                        </div>
                    </form>
                ) : (
                    // VISTA LECTURA (NORMAL)
                    <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: '300px' }}>
                            {/* HEADER VISTA */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                                <div style={{
                                    padding: '1.25rem',
                                    borderRadius: '12px',
                                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyItems: 'center'
                                }}>
                                    <Shield size={40} className="text-primary" />
                                </div>
                                <div>
                                    <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 'bold' }}>{federacion.nombre || 'Federación'}</h1>
                                    <span className="badge badge-primary" style={{ fontSize: '0.85rem', marginTop: '0.4rem' }}>
                                        Activa
                                    </span>
                                </div>
                            </div>

                            {/* GRID 3 COLUMNAS LECTURA */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
                                {/* CONTACTO */}
                                <div className="info-section">
                                    <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        Información de Contacto
                                    </h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                                            <MapPin size={18} className="text-primary mt-1" />
                                            <div>
                                                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Dirección</span>
                                                <span style={{ fontSize: '0.95rem' }}>{federacion.direccion || 'No registrada'}</span>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                                            <Phone size={18} className="text-primary mt-1" />
                                            <div>
                                                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Teléfono</span>
                                                <span style={{ fontSize: '0.95rem' }}>{federacion.telefono || 'No registrado'}</span>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                                            <Mail size={18} className="text-primary mt-1" />
                                            <div>
                                                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Email</span>
                                                <span style={{ fontSize: '0.95rem' }}>{federacion.email || 'No registrado'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* LEGALES */}
                                <div className="info-section">
                                    <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        Datos Legales
                                    </h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        <div>
                                            <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>CUIT</span>
                                            <span style={{ fontSize: '1.05rem', fontWeight: '600' }}>{federacion.cuit || '-'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* BANCARIOS */}
                                <div className="info-section">
                                    <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        Datos Bancarios
                                    </h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                                            <Building size={18} className="text-primary mt-1" />
                                            <div>
                                                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Banco</span>
                                                <span style={{ fontSize: '0.95rem' }}>{federacion.bancoNombre || 'No registrado'}</span>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                                            <Info size={18} className="text-primary mt-1" />
                                            <div>
                                                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Tipo de Cuenta</span>
                                                <span style={{ fontSize: '0.95rem' }}>{federacion.tipoCuenta || 'No registrado'}</span>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                                            <CreditCard size={18} className="text-primary mt-1" />
                                            <div>
                                                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Número de Cuenta / CBU</span>
                                                <span style={{ fontSize: '0.95rem' }}>{federacion.numeroCuenta || 'No registrado'}</span>
                                            </div>
                                        </div>
                                        {federacion.titularCuenta && (
                                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                                                <div style={{ width: '18px' }}></div>
                                                <div>
                                                    <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Titular</span>
                                                    <span style={{ fontSize: '0.95rem' }}>{federacion.titularCuenta}</span>
                                                </div>
                                            </div>
                                        )}
                                        {federacion.emailCobro && (
                                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                                                <Mail size={18} className="text-primary mt-1" />
                                                <div>
                                                    <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Email Facturación</span>
                                                    <span style={{ fontSize: '0.95rem' }}>{federacion.emailCobro}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default FederacionDetalles;
