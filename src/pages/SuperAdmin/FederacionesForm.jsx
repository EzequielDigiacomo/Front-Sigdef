import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import FormField from '../../components/forms/FormField';
import { Save, ArrowLeft, ShieldAlert } from 'lucide-react';
import useFormFieldErrors from '../../hooks/useFormFieldErrors';
import FieldError from '../../components/forms/FieldError';
import FormErrorsBanner from '../../components/forms/FormErrorsBanner';
import '../../styles/CompactForm.css';

const FIELD_LABELS = {
    nombre: 'Nombre de la federación',
    sigla: 'Sigla',
    cuit: 'CUIT',
    direccion: 'Dirección',
    email: 'Email institucional',
    telefono: 'Teléfono',
    adminUsername: 'Usuario administrador',
    adminEmail: 'Email del administrador',
    adminPassword: 'Contraseña',
    confirmAdminPassword: 'Confirmar contraseña',
};

// Alias API -> clave del formulario
const API_FIELD_MAP = {
    siglas: 'sigla',
    Siglas: 'sigla',
    Sigla: 'sigla',
    sigla: 'sigla',
    Username: 'adminUsername',
    username: 'adminUsername',
    Password: 'adminPassword',
    password: 'adminPassword',
    AdminUsername: 'adminUsername',
    AdminEmail: 'adminEmail',
    AdminPassword: 'adminPassword',
};

const FederacionesForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = !!id;

    const [form, setForm] = useState({
        nombre: '',
        sigla: '',
        cuit: '',
        direccion: '',
        email: '',
        telefono: '',
        plan: 'Premium',
        costoMensual: 95000,
        estado: 'Activo',
        adminUsername: '',
        adminEmail: '',
        adminPassword: '',
        confirmAdminPassword: ''
    });

    const {
        fieldErrors: errors,
        clearFieldError,
        clearFieldErrors,
        applyApiError,
        applyErrors,
        hasFieldErrors,
    } = useFormFieldErrors(FIELD_LABELS);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isEditMode) {
            loadFederacion();
        }
    }, [id]);

    const loadFederacion = async () => {
        try {
            const data = await api.get(`/Federaciones/${id}`);
            if (data) {
                setForm({
                    nombre: data.nombre || data.razonSocial || data.Nombre || '',
                    sigla: data.sigla || data.Sigla || '',
                    cuit: data.cuit || data.Cuit || '',
                    direccion: data.direccion || data.Direccion || '',
                    email: data.email || data.Email || '',
                    telefono: data.telefono || data.Telefono || '',
                    plan: 'Premium',
                    costoMensual: 95000,
                    estado: 'Activo'
                });
            }
        } catch (e) {
            console.warn("Error cargando federación de la API:", e);
        }
    };

    const handlePlanChange = (e) => {
        const selectedPlan = e.target.value;
        let costo = 50000;
        if (selectedPlan === 'Enterprise') costo = 150000;
        else if (selectedPlan === 'Premium') costo = 95000;

        setForm(prev => ({
            ...prev,
            plan: selectedPlan,
            costoMensual: costo
        }));
    };

    const validate = () => {
        const newErrors = {};
        if (!form.nombre.trim()) newErrors.nombre = 'El nombre es obligatorio';
        
        if (isEditMode && !form.cuit?.trim()) {
            newErrors.cuit = 'El CUIT es obligatorio';
        }

        if (!form.email.trim()) {
            newErrors.email = 'El email es obligatorio';
        } else if (!/\S+@\S+\.\S+/.test(form.email)) {
            newErrors.email = 'Email inválido';
        }

        if (!isEditMode) {
            if (!form.adminEmail?.trim()) {
                newErrors.adminEmail = 'El email del administrador es obligatorio';
            } else if (!/\S+@\S+\.\S+/.test(form.adminEmail)) {
                newErrors.adminEmail = 'Email inválido';
            }
            if (!form.adminUsername.trim()) {
                newErrors.adminUsername = 'El usuario es obligatorio';
            } else if (form.adminUsername.length < 4) {
                newErrors.adminUsername = 'Mínimo 4 caracteres';
            }

            if (!form.adminPassword) {
                newErrors.adminPassword = 'La contraseña es obligatoria';
            } else if (form.adminPassword.length < 6) {
                newErrors.adminPassword = 'Mínimo 6 caracteres';
            }

            if (form.adminPassword !== form.confirmAdminPassword) {
                newErrors.confirmAdminPassword = 'Las contraseñas no coinciden';
            }
        }

        applyErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        clearFieldErrors();
        if (!validate()) return;

        setSubmitting(true);
        try {
            if (isEditMode) {
                const payload = {
                    nombre: form.nombre,
                    cuit: form.cuit,
                    siglas: form.sigla || form.nombre.substring(0, 3).toUpperCase(),
                    direccion: form.direccion,
                    email: form.email,
                    telefono: form.telefono,
                    idFederacion: id
                };
                await api.put(`/Federaciones/${id}`, payload);
            } else {
                const payload = {
                    nombre: form.nombre,
                    sigla: form.sigla || form.nombre.substring(0, 3).toUpperCase(),
                    email: form.email,
                    telefono: form.telefono,
                    direccion: form.direccion,
                    adminUsername: form.adminUsername,
                    adminEmail: form.adminEmail,
                    adminPassword: form.adminPassword
                };
                await api.post('/saas/create-federacion', payload);
            }
            navigate('/superadmin/federaciones');
        } catch (error) {
            console.error("Error guardando federación y usuario:", error);
            const mapped = applyApiError(error, API_FIELD_MAP);
            if (!Object.keys(mapped).length) {
                alert(error.message || "Ocurrió un error al guardar la federación y su usuario. Intente nuevamente.");
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Button variant="ghost" onClick={() => navigate('/superadmin/federaciones')} style={{ padding: '0.5rem' }}>
                    <ArrowLeft size={20} />
                </Button>
                <div>
                    <h2 className="text-gradient" style={{ fontSize: '1.8rem', fontWeight: '800' }}>
                        {isEditMode ? 'Editar Federación' : 'Nueva Federación Contratante'}
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        Configure los accesos, membresías y datos de contacto de la federación inquilina.
                    </p>
                </div>
            </div>

            <Card>
                <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {hasFieldErrors && (
                        <FormErrorsBanner errors={errors} labels={FIELD_LABELS} />
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                        <div className="form-group">
                            <label htmlFor="nombre">Nombre de la Federación *</label>
                            <input
                                type="text"
                                id="nombre"
                                className={`form-input ${errors.nombre ? 'error' : ''}`}
                                value={form.nombre}
                                onChange={(e) => { setForm(prev => ({ ...prev, nombre: e.target.value })); clearFieldError('nombre'); }}
                                placeholder="Ej. Federación Deportiva de Canotaje"
                                required
                            />
                            <FieldError message={errors.nombre} />
                        </div>

                        {isEditMode ? (
                            <div className="form-group">
                                <label htmlFor="cuit">CUIT *</label>
                                <input
                                    type="text"
                                    id="cuit"
                                    className={`form-input ${errors.cuit ? 'error' : ''}`}
                                    value={form.cuit}
                                    onChange={(e) => { setForm(prev => ({ ...prev, cuit: e.target.value })); clearFieldError('cuit'); }}
                                    placeholder="Ej. 30-12345678-9"
                                    required={isEditMode}
                                />
                                <FieldError message={errors.cuit} />
                            </div>
                        ) : (
                            <div className="form-group">
                                <label htmlFor="sigla">Sigla (e.g. FAF)</label>
                                <input
                                    type="text"
                                    id="sigla"
                                    className={`form-input ${errors.sigla ? 'error' : ''}`}
                                    value={form.sigla}
                                    onChange={(e) => { setForm(prev => ({ ...prev, sigla: e.target.value })); clearFieldError('sigla'); }}
                                    placeholder="Ej. FAF"
                                />
                                <FieldError message={errors.sigla} />
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div className="form-group">
                            <label htmlFor="email">Email Institucional *</label>
                            <input
                                type="email"
                                id="email"
                                className={`form-input ${errors.email ? 'error' : ''}`}
                                value={form.email}
                                onChange={(e) => { setForm(prev => ({ ...prev, email: e.target.value })); clearFieldError('email'); }}
                                placeholder="contacto@federacion.org"
                                required
                            />
                            <FieldError message={errors.email} />
                        </div>

                        <div className="form-group">
                            <label htmlFor="telefono">Teléfono</label>
                            <input
                                type="text"
                                id="telefono"
                                className={`form-input ${errors.telefono ? 'error' : ''}`}
                                value={form.telefono}
                                onChange={(e) => { setForm(prev => ({ ...prev, telefono: e.target.value })); clearFieldError('telefono'); }}
                                placeholder="Ej. +54 11 4455 6677"
                            />
                            <FieldError message={errors.telefono} />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                        <div className="form-group">
                            <label htmlFor="direccion">Dirección/País</label>
                            <input
                                type="text"
                                id="direccion"
                                className={`form-input ${errors.direccion ? 'error' : ''}`}
                                value={form.direccion}
                                onChange={(e) => { setForm(prev => ({ ...prev, direccion: e.target.value })); clearFieldError('direccion'); }}
                                placeholder="Ej. Av. de Mayo 1234, CABA"
                            />
                            <FieldError message={errors.direccion} />
                        </div>
                    </div>



                    {!isEditMode && (
                        <div style={{
                            padding: '1.5rem',
                            borderRadius: 'var(--radius-lg)',
                            backgroundColor: 'rgba(16, 185, 129, 0.05)',
                            border: '1px dashed var(--border-color)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1rem',
                            marginTop: '1.5rem'
                        }}>
                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', color: 'var(--success)' }}>
                                <ShieldAlert size={18} />
                                Cuenta de Administrador Principal
                            </h4>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div className="form-group">
                                    <label htmlFor="adminUsername">Nombre de Usuario *</label>
                                    <input
                                        type="text"
                                        id="adminUsername"
                                        className={`form-input ${errors.adminUsername ? 'error' : ''}`}
                                        value={form.adminUsername}
                                        onChange={(e) => { setForm(prev => ({ ...prev, adminUsername: e.target.value })); clearFieldError('adminUsername'); }}
                                        placeholder="Ej. admin_fac"
                                        required
                                    />
                                    <FieldError message={errors.adminUsername} />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="adminEmail">Email de Administrador *</label>
                                    <input
                                        type="email"
                                        id="adminEmail"
                                        className={`form-input ${errors.adminEmail ? 'error' : ''}`}
                                        value={form.adminEmail}
                                        onChange={(e) => { setForm(prev => ({ ...prev, adminEmail: e.target.value })); clearFieldError('adminEmail'); }}
                                        placeholder="admin@federacion.org"
                                        required
                                    />
                                    <FieldError message={errors.adminEmail} />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div className="form-group">
                                    <label htmlFor="adminPassword">Contraseña *</label>
                                    <input
                                        type="password"
                                        id="adminPassword"
                                        className={`form-input ${errors.adminPassword ? 'error' : ''}`}
                                        value={form.adminPassword}
                                        onChange={(e) => { setForm(prev => ({ ...prev, adminPassword: e.target.value })); clearFieldError('adminPassword'); }}
                                        placeholder="Mínimo 6 caracteres"
                                        required
                                    />
                                    <FieldError message={errors.adminPassword} />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="confirmAdminPassword">Confirmar Contraseña *</label>
                                    <input
                                        type="password"
                                        id="confirmAdminPassword"
                                        className={`form-input ${errors.confirmAdminPassword ? 'error' : ''}`}
                                        value={form.confirmAdminPassword}
                                        onChange={(e) => { setForm(prev => ({ ...prev, confirmAdminPassword: e.target.value })); clearFieldError('confirmAdminPassword'); }}
                                        placeholder="Repetir contraseña"
                                        required
                                    />
                                    <FieldError message={errors.confirmAdminPassword} />
                                </div>
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                        <Button variant="ghost" onClick={() => navigate('/superadmin/federaciones')} type="button">
                            Cancelar
                        </Button>
                        <Button variant="primary" type="submit" isLoading={submitting} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Save size={18} />
                            Guardar Federación
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default FederacionesForm;
