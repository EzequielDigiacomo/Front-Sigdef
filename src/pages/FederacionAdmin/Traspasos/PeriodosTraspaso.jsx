import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Plus, Edit, AlertCircle, CheckCircle2 } from 'lucide-react';
import TraspasoService from '../../../services/traspasoService';
import { normalizePeriodo, formatFecha, toDateInputValue } from '../../../utils/traspasoUtils';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Modal from '../../../components/common/Modal';
import FormField from '../../../components/forms/FormField';
import '../../Shared/Traspasos/Traspasos.css';

const emptyForm = () => ({
    fechaInicio: '',
    fechaFin: '',
    activo: true,
    observaciones: '',
});

const PeriodosTraspaso = () => {
    const { fedId } = useParams();
    const basePath = fedId ? `/superadmin/federacion/${fedId}/traspasos` : '/dashboard/traspasos';

    const [periodos, setPeriodos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(emptyForm());
    const [saving, setSaving] = useState(false);
    const [alert, setAlert] = useState(null);

    const showAlert = (type, message) => {
        setAlert({ type, message });
        setTimeout(() => setAlert(null), 3500);
    };

    const loadPeriodos = useCallback(async () => {
        const data = await TraspasoService.getPeriodos();
        setPeriodos((Array.isArray(data) ? data : []).map(normalizePeriodo));
    }, []);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                await loadPeriodos();
            } catch (err) {
                if (!cancelled) showAlert('error', err.message || 'Error al cargar periodos.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [loadPeriodos]);

    const openCreate = () => {
        setEditing(null);
        setForm(emptyForm());
        setModalOpen(true);
    };

    const openEdit = (p) => {
        setEditing(p);
        setForm({
            fechaInicio: toDateInputValue(p.fechaInicio),
            fechaFin: toDateInputValue(p.fechaFin),
            activo: p.activo,
            observaciones: p.observaciones || '',
        });
        setModalOpen(true);
    };

    const handleSave = async () => {
        if (!form.fechaInicio || !form.fechaFin) {
            showAlert('error', 'Complete fecha de inicio y fin.');
            return;
        }

        setSaving(true);
        try {
            const payload = {
                fechaInicio: form.fechaInicio,
                fechaFin: form.fechaFin,
                activo: form.activo,
                observaciones: form.observaciones || null,
            };

            if (editing) {
                await TraspasoService.updatePeriodo(editing.id, payload);
                showAlert('success', 'Periodo actualizado.');
            } else {
                await TraspasoService.createPeriodo(payload);
                showAlert('success', 'Periodo creado.');
            }

            setModalOpen(false);
            await loadPeriodos();
        } catch (err) {
            showAlert('error', err.message || 'Error al guardar periodo.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="page-content container traspasos-page">
            <div className="traspasos-header">
                <div>
                    <Link to={basePath} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 8, color: 'var(--text-secondary)', textDecoration: 'none' }}>
                        <ArrowLeft size={16} /> Volver a bandeja
                    </Link>
                    <h1><Calendar size={22} style={{ verticalAlign: 'middle', marginRight: 8 }} />Periodos de traspaso</h1>
                </div>
                <Button variant="primary" icon={Plus} onClick={openCreate}>Nuevo periodo</Button>
            </div>

            {alert && (
                <div className={`traspasos-alert traspasos-alert-${alert.type === 'error' ? 'error' : 'success'}`}>
                    {alert.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
                    <span>{alert.message}</span>
                </div>
            )}

            <Card>
                {loading ? (
                    <div className="traspasos-empty">Cargando periodos...</div>
                ) : periodos.length === 0 ? (
                    <div className="traspasos-empty">No hay periodos configurados.</div>
                ) : (
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Inicio</th>
                                    <th>Fin</th>
                                    <th>Activo</th>
                                    <th>Vigente</th>
                                    <th>Observaciones</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {periodos.map((p) => (
                                    <tr key={p.id}>
                                        <td>{formatFecha(p.fechaInicio)}</td>
                                        <td>{formatFecha(p.fechaFin)}</td>
                                        <td>
                                            <span className={`badge badge-${p.activo ? 'success' : 'secondary'}`}>
                                                {p.activo ? 'Sí' : 'No'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge badge-${p.esVigente ? 'info' : 'secondary'}`}>
                                                {p.esVigente ? 'Vigente' : '—'}
                                            </span>
                                        </td>
                                        <td>{p.observaciones || '—'}</td>
                                        <td>
                                            <Button size="sm" variant="secondary" icon={Edit} onClick={() => openEdit(p)}>
                                                Editar
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            <Modal
                isOpen={modalOpen}
                onClose={() => !saving && setModalOpen(false)}
                title={editing ? 'Editar periodo' : 'Nuevo periodo'}
                footer={
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>
                            Cancelar
                        </Button>
                        <Button variant="primary" onClick={handleSave} isLoading={saving}>
                            Guardar
                        </Button>
                    </div>
                }
            >
                <div className="traspasos-periodo-form">
                    <FormField
                        label="Fecha inicio"
                        type="date"
                        name="fechaInicio"
                        value={form.fechaInicio}
                        onChange={(e) => setForm((f) => ({ ...f, fechaInicio: e.target.value }))}
                        required
                    />
                    <FormField
                        label="Fecha fin"
                        type="date"
                        name="fechaFin"
                        value={form.fechaFin}
                        onChange={(e) => setForm((f) => ({ ...f, fechaFin: e.target.value }))}
                        required
                    />
                    <div className="form-group">
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={form.activo}
                                onChange={(e) => setForm((f) => ({ ...f, activo: e.target.checked }))}
                            />
                            Periodo activo
                        </label>
                    </div>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label htmlFor="observaciones">Observaciones</label>
                        <textarea
                            id="observaciones"
                            rows={3}
                            value={form.observaciones}
                            onChange={(e) => setForm((f) => ({ ...f, observaciones: e.target.value }))}
                            style={{
                                width: '100%',
                                padding: '0.75rem 1rem',
                                borderRadius: 8,
                                border: '1px solid var(--border-color)',
                                background: 'var(--bg-card)',
                                color: 'var(--text-primary)',
                            }}
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default PeriodosTraspaso;
