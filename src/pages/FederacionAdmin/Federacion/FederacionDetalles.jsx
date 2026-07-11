import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import { Shield, MapPin, Phone, Mail, CreditCard, Edit, Check, X, Building, User } from 'lucide-react';
import './FederacionDetalles.css';

const display = (value, fallback = '—') => {
    if (value == null || String(value).trim() === '') return fallback;
    return value;
};

const FieldRow = ({ icon: Icon, label, value }) => (
    <div className="fed-field">
        {Icon ? <Icon size={18} className="fed-field-icon" /> : <span className="fed-field-icon" />}
        <div className="fed-field-body">
            <span className="fed-field-label">{label}</span>
            <span className="fed-field-value">{display(value)}</span>
        </div>
    </div>
);

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
        emailCobro: '',
    });

    useEffect(() => {
        loadFederacion();
    }, []);

    const loadFederacion = async () => {
        try {
            setLoading(true);
            const response = await api.get('/Federaciones');

            let data = null;
            if (response && Array.isArray(response) && response.length > 0) {
                data = response[0];
            } else if (response && (response.id || response.idFederacion)) {
                data = response;
            } else {
                try {
                    data = await api.get('/Federaciones/1');
                } catch {
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
                    emailCobro: data.emailCobro || '',
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
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSave = async (e) => {
        if (e) e.preventDefault();
        setSaving(true);
        try {
            const payload = { ...formData };
            const fedId = federacion.id || federacion.idFederacion;
            await api.put(`/Federaciones/${fedId}`, payload);
            setFederacion((prev) => ({ ...prev, ...payload }));
            setIsEditing(false);
        } catch (error) {
            console.error('Error guardando federación:', error);
            alert('Ocurrió un error al intentar guardar los cambios.');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
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
            emailCobro: federacion.emailCobro || '',
        });
        setIsEditing(false);
    };

    if (loading) {
        return (
            <div className="page-container fed-page">
                <p className="fed-loading">Cargando...</p>
            </div>
        );
    }

    if (!federacion) {
        return (
            <div className="page-container fed-page">
                <div className="page-header">
                    <h1 className="page-title">
                        <Shield size={28} className="text-primary" /> Federación
                    </h1>
                </div>
                <Card className="fed-card">
                    <p className="fed-empty">No se encontró información de la federación.</p>
                </Card>
            </div>
        );
    }

    return (
        <div className="page-container fed-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">
                        <Shield size={22} className="text-primary" /> Federación
                    </h1>
                </div>
                {!isEditing ? (
                    <Button onClick={() => setIsEditing(true)} size="sm">
                        <Edit size={16} /> Editar
                    </Button>
                ) : (
                    <div className="fed-header-actions">
                        <Button variant="ghost" size="sm" onClick={handleCancel} disabled={saving}>
                            <X size={16} /> Cancelar
                        </Button>
                        <Button size="sm" onClick={handleSave} isLoading={saving} disabled={saving}>
                            <Check size={16} /> Guardar
                        </Button>
                    </div>
                )}
            </div>

            <Card className={`fed-card${isEditing ? ' fed-card--edit' : ''}`}>
                {isEditing ? (
                    <form className="fed-form" onSubmit={handleSave}>
                        <div className="fed-identity fed-identity--edit">
                            <div className="fed-avatar">
                                <Shield size={22} />
                            </div>
                            <div className="form-group fed-name-field">
                                <label>Nombre</label>
                                <input
                                    type="text"
                                    name="nombre"
                                    className="form-input"
                                    value={formData.nombre}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="fed-sections">
                            <section>
                                <h3 className="fed-section-title">Contacto</h3>
                                <div className="fed-form-grid">
                                    <div className="form-group">
                                        <label>Dirección</label>
                                        <input
                                            type="text"
                                            name="direccion"
                                            className="form-input"
                                            value={formData.direccion}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Teléfono</label>
                                        <input
                                            type="text"
                                            name="telefono"
                                            className="form-input"
                                            value={formData.telefono}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Email</label>
                                        <input
                                            type="email"
                                            name="email"
                                            className="form-input"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>CUIT</label>
                                        <input
                                            type="text"
                                            name="cuit"
                                            className="form-input"
                                            value={formData.cuit}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                </div>
                            </section>

                            <section>
                                <h3 className="fed-section-title">Datos bancarios</h3>
                                <div className="fed-form-grid">
                                    <div className="form-group">
                                        <label>Banco</label>
                                        <input
                                            type="text"
                                            name="bancoNombre"
                                            className="form-input"
                                            value={formData.bancoNombre}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Tipo de cuenta</label>
                                        <select
                                            name="tipoCuenta"
                                            className="form-input"
                                            value={formData.tipoCuenta}
                                            onChange={handleInputChange}
                                        >
                                            <option value="">Seleccione...</option>
                                            <option value="Caja de Ahorros">Caja de Ahorros</option>
                                            <option value="Cuenta Corriente">Cuenta Corriente</option>
                                            <option value="Otro">Otro</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Nº cuenta / CBU</label>
                                        <input
                                            type="text"
                                            name="numeroCuenta"
                                            className="form-input"
                                            value={formData.numeroCuenta}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Titular</label>
                                        <input
                                            type="text"
                                            name="titularCuenta"
                                            className="form-input"
                                            value={formData.titularCuenta}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="form-group fed-form-span">
                                        <label>Email de cobro</label>
                                        <input
                                            type="email"
                                            name="emailCobro"
                                            className="form-input"
                                            value={formData.emailCobro}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                </div>
                            </section>
                        </div>
                    </form>
                ) : (
                    <>
                        <div className="fed-identity">
                            <div className="fed-avatar">
                                <Shield size={22} />
                            </div>
                            <div className="fed-identity-text">
                                <h2>{federacion.nombre || 'Federación'}</h2>
                                <span className="badge badge-primary">Activa</span>
                            </div>
                        </div>

                        <div className="fed-grid">
                            <section>
                                <h3 className="fed-section-title">Contacto</h3>
                                <div className="fed-fields">
                                    <FieldRow icon={MapPin} label="Dirección" value={federacion.direccion} />
                                    <FieldRow icon={Phone} label="Teléfono" value={federacion.telefono} />
                                    <FieldRow icon={Mail} label="Email" value={federacion.email} />
                                    <FieldRow icon={Building} label="CUIT" value={federacion.cuit} />
                                </div>
                            </section>

                            <section>
                                <h3 className="fed-section-title">Datos bancarios</h3>
                                <div className="fed-fields">
                                    <FieldRow icon={Building} label="Banco" value={federacion.bancoNombre} />
                                    <FieldRow icon={CreditCard} label="Tipo de cuenta" value={federacion.tipoCuenta} />
                                    <FieldRow icon={CreditCard} label="Nº cuenta / CBU" value={federacion.numeroCuenta} />
                                    <FieldRow icon={User} label="Titular" value={federacion.titularCuenta} />
                                    <FieldRow icon={Mail} label="Email cobro" value={federacion.emailCobro} />
                                </div>
                            </section>
                        </div>
                    </>
                )}
            </Card>
        </div>
    );
};

export default FederacionDetalles;
