import React, { useEffect, useState } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { fetchPlanes, updatePlan } from '../../services/saasService';
import { Save, RotateCcw } from 'lucide-react';

/** Precio anual = mensual × 12 × (1 − descuento/100) */
export const calcPrecioAnual = (precioMensual, descuentoPct) => {
    const m = Number(precioMensual);
    let d = Number(descuentoPct);
    if (Number.isNaN(m) || m < 0) return 0;
    if (Number.isNaN(d)) d = 0;
    if (d < 0) d = 0;
    if (d > 100) d = 100;
    return Math.round(m * 12 * (1 - d / 100) * 100) / 100;
};

const toRow = (p) => {
    const id = p.id ?? p.Id;
    const maxAtletas = p.maxAtletas ?? p.MaxAtletas ?? 0;
    const precio = p.precio ?? p.Precio ?? 0;
    const descuento = p.descuentoAnualPorcentaje ?? p.DescuentoAnualPorcentaje ?? 0;
    return {
        id,
        nombre: p.nombre ?? p.Nombre ?? '',
        precio: String(precio),
        descuentoAnual: String(descuento),
        maxAtletas: String(maxAtletas),
        ilimitado: Number(maxAtletas) === -1,
        saving: false,
        error: '',
        dirty: false,
    };
};

const inputStyle = {
    width: '100px',
    padding: '0.45rem 0.6rem',
    borderRadius: '8px',
    border: '1px solid var(--border-color)',
    background: 'var(--bg-secondary, transparent)',
    color: 'var(--text-primary)',
};

const money = (n) =>
    `$${Number(n).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

/** Tabla editable: mensual + % descuento anual; anual solo lectura calculado */
const PlanesCatalogEditor = ({ onPlanUpdated }) => {
    const [rows, setRows] = useState([]);
    const [original, setOriginal] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    const load = async () => {
        try {
            setLoading(true);
            setMessage('');
            const data = await fetchPlanes();
            const mapped = (data || []).map(toRow);
            setRows(mapped);
            setOriginal(mapped.map((r) => ({ ...r })));
        } catch (err) {
            console.error('Error cargando planes:', err);
            setMessage(err.message || 'No se pudieron cargar los planes.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const updateRow = (id, patch) => {
        setRows((prev) =>
            prev.map((r) => (r.id === id ? { ...r, ...patch, dirty: true, error: '' } : r))
        );
        setMessage('');
    };

    const handleToggleIlimitado = (id, checked) => {
        setRows((prev) =>
            prev.map((r) => {
                if (r.id !== id) return r;
                if (checked) {
                    return { ...r, ilimitado: true, maxAtletas: '-1', dirty: true, error: '' };
                }
                const prevOrig = original.find((o) => o.id === id);
                const fallback =
                    prevOrig && !prevOrig.ilimitado && Number(prevOrig.maxAtletas) > 0
                        ? prevOrig.maxAtletas
                        : '200';
                return { ...r, ilimitado: false, maxAtletas: fallback, dirty: true, error: '' };
            })
        );
        setMessage('');
    };

    const handleReset = (id) => {
        const orig = original.find((o) => o.id === id);
        if (!orig) return;
        setRows((prev) => prev.map((r) => (r.id === id ? { ...orig, dirty: false, error: '' } : r)));
    };

    const handleSave = async (id) => {
        const row = rows.find((r) => r.id === id);
        if (!row) return;

        const precio = Number(row.precio);
        const descuentoAnualPorcentaje = Number(row.descuentoAnual);
        const maxAtletas = row.ilimitado ? -1 : Number(row.maxAtletas);

        if (Number.isNaN(precio) || precio < 0) {
            updateRow(id, { error: 'Precio mensual inválido' });
            return;
        }
        if (Number.isNaN(descuentoAnualPorcentaje) || descuentoAnualPorcentaje < 0 || descuentoAnualPorcentaje > 100) {
            updateRow(id, { error: 'Descuento debe ser entre 0 y 100' });
            return;
        }
        if (!row.ilimitado && (Number.isNaN(maxAtletas) || maxAtletas < 1)) {
            updateRow(id, { error: 'Máx. atletas debe ser ≥ 1 o ilimitado' });
            return;
        }

        setRows((prev) => prev.map((r) => (r.id === id ? { ...r, saving: true, error: '' } : r)));
        try {
            const updated = await updatePlan(id, { precio, descuentoAnualPorcentaje, maxAtletas });
            const mapped = toRow(updated);
            setRows((prev) => prev.map((r) => (r.id === id ? mapped : r)));
            setOriginal((prev) => prev.map((r) => (r.id === id ? { ...mapped } : r)));
            setMessage(`Plan «${mapped.nombre}» guardado.`);
            onPlanUpdated?.();
        } catch (err) {
            console.error('Error guardando plan:', err);
            setRows((prev) =>
                prev.map((r) =>
                    r.id === id
                        ? { ...r, saving: false, error: err.message || 'Error al guardar' }
                        : r
                )
            );
        }
    };

    return (
        <Card>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                Catálogo de planes
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                El precio anual se calcula solo: mensual × 12 con el % de descuento que indiques.
            </p>

            {message && (
                <div
                    style={{
                        padding: '0.75rem 1rem',
                        marginBottom: '1rem',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: message.toLowerCase().includes('error') || message.toLowerCase().includes('no se')
                            ? 'rgba(239, 68, 68, 0.1)'
                            : 'rgba(16, 185, 129, 0.12)',
                        color: message.toLowerCase().includes('error') || message.toLowerCase().includes('no se')
                            ? 'var(--danger)'
                            : 'var(--success)',
                        fontSize: '0.9rem',
                    }}
                >
                    {message}
                </div>
            )}

            {loading ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    Cargando planes...
                </div>
            ) : rows.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)' }}>No hay planes en la base de datos.</p>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                <th style={{ padding: '0.75rem' }}>PLAN</th>
                                <th style={{ padding: '0.75rem' }}>PRECIO MENSUAL</th>
                                <th style={{ padding: '0.75rem' }}>% DESCUENTO</th>
                                <th style={{ padding: '0.75rem' }}>PRECIO ANUAL</th>
                                <th style={{ padding: '0.75rem' }}>MÁX. ATLETAS</th>
                                <th style={{ padding: '0.75rem' }}>ILIMITADO</th>
                                <th style={{ padding: '0.75rem' }} />
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => {
                                const anual = calcPrecioAnual(row.precio, row.descuentoAnual);
                                return (
                                    <tr key={row.id} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
                                        <td style={{ padding: '0.75rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                                            {row.nombre}
                                        </td>
                                        <td style={{ padding: '0.75rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                                <span style={{ color: 'var(--text-secondary)' }}>$</span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="1"
                                                    value={row.precio}
                                                    onChange={(e) => updateRow(row.id, { precio: e.target.value })}
                                                    style={inputStyle}
                                                />
                                            </div>
                                        </td>
                                        <td style={{ padding: '0.75rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    step="0.01"
                                                    value={row.descuentoAnual}
                                                    onChange={(e) => updateRow(row.id, { descuentoAnual: e.target.value })}
                                                    style={{ ...inputStyle, width: '80px' }}
                                                />
                                                <span style={{ color: 'var(--text-secondary)' }}>%</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '0.75rem' }}>
                                            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                                                {money(anual)}
                                            </span>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                                                12×{money(Number(row.precio) || 0)} − {row.descuentoAnual || 0}%
                                            </div>
                                        </td>
                                        <td style={{ padding: '0.75rem' }}>
                                            {row.ilimitado ? (
                                                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                                                    ∞ Ilimitado
                                                </span>
                                            ) : (
                                                <input
                                                    type="number"
                                                    min="1"
                                                    step="1"
                                                    value={row.maxAtletas}
                                                    onChange={(e) => updateRow(row.id, { maxAtletas: e.target.value })}
                                                    style={inputStyle}
                                                />
                                            )}
                                            {row.error && (
                                                <div style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.35rem' }}>
                                                    {row.error}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ padding: '0.75rem' }}>
                                            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={row.ilimitado}
                                                    onChange={(e) => handleToggleIlimitado(row.id, e.target.checked)}
                                                />
                                                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Sin tope</span>
                                            </label>
                                        </td>
                                        <td style={{ padding: '0.75rem' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                <Button
                                                    variant="ghost"
                                                    disabled={!row.dirty || row.saving}
                                                    onClick={() => handleReset(row.id)}
                                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.7rem' }}
                                                >
                                                    <RotateCcw size={14} />
                                                </Button>
                                                <Button
                                                    variant="primary"
                                                    disabled={!row.dirty || row.saving}
                                                    onClick={() => handleSave(row.id)}
                                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.85rem' }}
                                                >
                                                    <Save size={14} />
                                                    {row.saving ? 'Guardando…' : 'Guardar'}
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
            <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Ejemplo: $100/mes con 16,67% de descuento → anual {money(calcPrecioAnual(100, 16.67))} (equivale a ~10 meses).
            </p>
        </Card>
    );
};

export default PlanesCatalogEditor;
