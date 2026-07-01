import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import FormField from '../../components/forms/FormField';
import { Save, ArrowLeft, ShieldAlert } from 'lucide-react';

const FederacionesForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = !!id;

    const [form, setForm] = useState({
        nombre: '',
        cuit: '',
        direccion: '',
        email: '',
        telefono: '',
        plan: 'Premium',
        costoMensual: 95000,
        estado: 'Activo',
        adminUsername: '',
        adminPassword: '',
        confirmAdminPassword: ''
    });

    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isEditMode) {
            loadFederacion();
        }
    }, [id]);

    const loadFederacion = async () => {
        try {
            const data = await api.get(`/Clubes/${id}`);
            if (data) {
                setForm({
                    nombre: data.nombre || data.razonSocial || data.Nombre || '',
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
        if (!form.cuit.trim()) newErrors.cuit = 'El CUIT es obligatorio';
        if (!form.email.trim()) {
            newErrors.email = 'El email es obligatorio';
        } else if (!/\S+@\S+\.\S+/.test(form.email)) {
            newErrors.email = 'Email inválido';
        }

        if (!isEditMode) {
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

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setSubmitting(true);
        try {
            const payload = {
                nombre: form.nombre,
                siglas: form.nombre.substring(0, 3).toUpperCase(),
                direccion: form.direccion,
                email: form.email,
                telefono: form.telefono,
                idFederacion: null
            };

            if (isEditMode) {
                await api.put(`/Clubes/${id}`, payload);
            } else {
                // 1. Crear la federación en la BD
                const createdFed = await api.post('/Clubes', payload);
                const newFedId = createdFed?.id || createdFed?.idFederacion || createdFed?.IdFederacion;

                if (!newFedId) {
                    throw new Error("No se pudo obtener el ID de la federación creada.");
                }

                // 2. Crear la cuenta de usuario Administrador Principal para esta federación
                const userPayload = {
                    username: form.adminUsername,
                    password: form.adminPassword,
                    email: form.email,
                    rol: "Admin",
                    clubId: parseInt(newFedId)
                };
                await api.post('/Auth/register', userPayload);
            }
            navigate('/superadmin/federaciones');
        } catch (error) {
            console.error("Error guardando federación y usuario:", error);
            alert(error.message || "Ocurrió un error al guardar la federación y su usuario. Intente nuevamente.");
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
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                        <div className="form-group">
                            <label htmlFor="nombre">Nombre de la Federación *</label>
                            <input
                                type="text"
                                id="nombre"
                                className="form-input"
                                value={form.nombre}
                                onChange={(e) => setForm(prev => ({ ...prev, nombre: e.target.value }))}
                                placeholder="Ej. Federación Deportiva de Canotaje"
                                required
                            />
                            {errors.nombre && <span style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>{errors.nombre}</span>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="cuit">CUIT *</label>
                            <input
                                type="text"
                                id="cuit"
                                className="form-input"
                                value={form.cuit}
                                onChange={(e) => setForm(prev => ({ ...prev, cuit: e.target.value }))}
                                placeholder="Ej. 30-12345678-9"
                                required
                            />
                            {errors.cuit && <span style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>{errors.cuit}</span>}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div className="form-group">
                            <label htmlFor="email">Correo Electrónico de Contacto *</label>
                            <input
                                type="email"
                                id="email"
                                className="form-input"
                                value={form.email}
                                onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                                placeholder="contacto@federacion.org"
                                required
                            />
                            {errors.email && <span style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>{errors.email}</span>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="telefono">Teléfono Administrativo</label>
                            <input
                                type="text"
                                id="telefono"
                                className="form-input"
                                value={form.telefono}
                                onChange={(e) => setForm(prev => ({ ...prev, telefono: e.target.value }))}
                                placeholder="Ej. +54 11 4455 6677"
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div className="form-group">
                            <label htmlFor="direccion">Dirección / Ubicación</label>
                            <input
                                type="text"
                                id="direccion"
                                className="form-input"
                                value={form.direccion}
                                onChange={(e) => setForm(prev => ({ ...prev, direccion: e.target.value }))}
                                placeholder="Ej. Av. de Mayo 1234, CABA"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="estado">Estado de Cuenta</label>
                            <select
                                id="estado"
                                className="form-input"
                                value={form.estado}
                                onChange={(e) => setForm(prev => ({ ...prev, estado: e.target.value }))}
                                style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                            >
                                <option value="Activo">Activo (Acceso Completo)</option>
                                <option value="Suspendido">Suspendido (Acceso Bloqueado)</option>
                            </select>
                        </div>
                    </div>

                    <div style={{
                        padding: '1.5rem',
                        borderRadius: 'var(--radius-lg)',
                        backgroundColor: 'rgba(59, 130, 246, 0.05)',
                        border: '1px dashed var(--border-color)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem'
                    }}>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                            <ShieldAlert size={18} />
                            Configuración de Plan SaaS
                        </h4>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div className="form-group">
                                <label htmlFor="plan">Plan Seleccionado</label>
                                <select
                                    id="plan"
                                    className="form-input"
                                    value={form.plan}
                                    onChange={handlePlanChange}
                                    style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                                >
                                    <option value="Enterprise">Enterprise ($150.000 / mes)</option>
                                    <option value="Premium">Premium ($95.000 / mes)</option>
                                    <option value="Básico">Básico ($50.000 / mes)</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="costo">Costo Mensual Personalizado (ARS)</label>
                                <input
                                    type="number"
                                    id="costo"
                                    className="form-input"
                                    value={form.costoMensual}
                                    onChange={(e) => setForm(prev => ({ ...prev, costoMensual: e.target.value }))}
                                />
                            </div>
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
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
                                <div className="form-group">
                                    <label htmlFor="adminUsername">Usuario Admin *</label>
                                    <input
                                        type="text"
                                        id="adminUsername"
                                        className="form-input"
                                        value={form.adminUsername}
                                        onChange={(e) => setForm(prev => ({ ...prev, adminUsername: e.target.value }))}
                                        placeholder="Ej. admin_fac"
                                        required
                                    />
                                    {errors.adminUsername && <span style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>{errors.adminUsername}</span>}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="adminPassword">Contraseña *</label>
                                    <input
                                        type="password"
                                        id="adminPassword"
                                        className="form-input"
                                        value={form.adminPassword}
                                        onChange={(e) => setForm(prev => ({ ...prev, adminPassword: e.target.value }))}
                                        placeholder="Mínimo 6 caracteres"
                                        required
                                    />
                                    {errors.adminPassword && <span style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>{errors.adminPassword}</span>}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="confirmAdminPassword">Confirmar Contraseña *</label>
                                    <input
                                        type="password"
                                        id="confirmAdminPassword"
                                        className="form-input"
                                        value={form.confirmAdminPassword}
                                        onChange={(e) => setForm(prev => ({ ...prev, confirmAdminPassword: e.target.value }))}
                                        placeholder="Repetir contraseña"
                                        required
                                    />
                                    {errors.confirmAdminPassword && <span style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>{errors.confirmAdminPassword}</span>}
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
