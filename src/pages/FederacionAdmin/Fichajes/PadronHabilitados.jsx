import React, { useCallback, useEffect, useState } from 'react';
import { Download, RefreshCw, Search, ShieldCheck } from 'lucide-react';
import FichajeService from '../../../services/fichajeService';
import { api } from '../../../services/api';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import PageHeader from '../../../components/common/PageHeader';
import FormField from '../../../components/forms/FormField';
import {
    getEstadoFichajeLabel,
    getEstadoAptoLabel,
    getEstadoAptoColor,
    getEstadoPagoLabel,
    getCategoriaLabel,
} from '../../../utils/enums';

const normalize = (item) => ({
    id: item.participanteId ?? item.ParticipanteId,
    nombre: item.nombrePersona ?? item.NombrePersona ?? '',
    documento: item.documento ?? item.Documento ?? '',
    club: item.nombreClub ?? item.NombreClub ?? '—',
    categoria: item.categoria ?? item.Categoria,
    estadoPago: item.estadoPago ?? item.EstadoPago,
    estadoFichaje: item.estadoFichaje ?? item.EstadoFichaje,
    estadoApto: item.estadoApto ?? item.EstadoApto,
    estaHabilitado: !!(item.estaHabilitado ?? item.EstaHabilitado),
    motivos: item.motivosBloqueo ?? item.MotivosBloqueo ?? [],
    vencimientoApto: item.fechaVencimientoApto ?? item.FechaVencimientoApto,
});

const PadronHabilitados = ({ modo = 'admin' }) => {
    const esAdmin = modo === 'admin';
    const [items, setItems] = useState([]);
    const [clubes, setClubes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [soloHabilitados, setSoloHabilitados] = useState(true);
    const [clubId, setClubId] = useState('');
    const [busqueda, setBusqueda] = useState('');
    const [alert, setAlert] = useState(null);

    const showAlert = (type, message) => {
        setAlert({ type, message });
        setTimeout(() => setAlert(null), 3500);
    };

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await FichajeService.getPadron({
                soloHabilitados,
                clubId: clubId || undefined,
                busqueda: busqueda.trim() || undefined,
            });
            setItems((Array.isArray(data) ? data : []).map(normalize));
        } catch (err) {
            showAlert('error', err.message || 'Error al cargar padrón.');
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, [soloHabilitados, clubId, busqueda]);

    useEffect(() => {
        if (esAdmin) {
            api.get('/Club').then((data) => setClubes(Array.isArray(data) ? data : [])).catch(() => setClubes([]));
        }
    }, [esAdmin]);

    useEffect(() => {
        const t = setTimeout(load, busqueda ? 350 : 0);
        return () => clearTimeout(t);
    }, [load, busqueda]);

    const exportCsv = () => {
        if (items.length === 0) return;
        const headers = ['Atleta', 'Documento', 'Club', 'Categoría', 'Pago', 'Fichaje', 'Apto', 'Habilitado', 'Motivos'];
        const rows = items.map((r) => [
            r.nombre,
            r.documento,
            r.club,
            getCategoriaLabel(r.categoria),
            getEstadoPagoLabel(r.estadoPago),
            getEstadoFichajeLabel(r.estadoFichaje),
            getEstadoAptoLabel(r.estadoApto),
            r.estaHabilitado ? 'Sí' : 'No',
            (r.motivos || []).join(' | '),
        ]);
        const csv = [headers, ...rows].map((row) => row.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';')).join('\n');
        const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `padron-${soloHabilitados ? 'habilitados' : 'completo'}-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="page-container">
            <PageHeader
                title={esAdmin ? 'Padrón habilitados' : 'Mi plantel habilitado'}
                icon={ShieldCheck}
                backTo={esAdmin ? '/dashboard' : '/club'}
                actions={
                    <div style={{ display: 'flex', gap: 8 }}>
                        <Button variant="ghost" size="sm" onClick={load} disabled={loading}>
                            <RefreshCw size={16} /> Actualizar
                        </Button>
                        <Button size="sm" onClick={exportCsv} disabled={items.length === 0}>
                            <Download size={16} /> Exportar CSV
                        </Button>
                    </div>
                }
            />

            {alert && <div className={`traspasos-alert traspasos-alert--${alert.type}`}>{alert.message}</div>}

            <Card>
                <div className="filters-bar" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <FormField
                        icon={Search}
                        placeholder="Buscar..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                    />
                    {esAdmin && (
                        <select className="form-input" value={clubId} onChange={(e) => setClubId(e.target.value)} style={{ minWidth: 180 }}>
                            <option value="">Todos los clubes</option>
                            {clubes.map((c) => (
                                <option key={c.idClub ?? c.IdClub} value={c.idClub ?? c.IdClub}>
                                    {c.nombre ?? c.Nombre}
                                </option>
                            ))}
                        </select>
                    )}
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem' }}>
                        <input
                            type="checkbox"
                            checked={soloHabilitados}
                            onChange={(e) => setSoloHabilitados(e.target.checked)}
                        />
                        Solo habilitados
                    </label>
                </div>

                <div className="table-responsive" style={{ marginTop: '1rem' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Atleta</th>
                                <th>Club</th>
                                <th>Categoría</th>
                                <th>Pago</th>
                                <th>Apto</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" className="text-center">Cargando...</td></tr>
                            ) : items.length === 0 ? (
                                <tr><td colSpan="6" className="text-center">Sin resultados.</td></tr>
                            ) : items.map((row) => (
                                <tr key={row.id}>
                                    <td>
                                        <strong>{row.nombre}</strong>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{row.documento}</div>
                                        {!row.estaHabilitado && row.motivos?.length > 0 && (
                                            <div style={{ fontSize: '0.75rem', color: 'var(--danger)' }}>{row.motivos.join(' · ')}</div>
                                        )}
                                    </td>
                                    <td>{row.club}</td>
                                    <td>{getCategoriaLabel(row.categoria)}</td>
                                    <td>{getEstadoPagoLabel(row.estadoPago)}</td>
                                    <td>
                                        <span className={`badge badge-${getEstadoAptoColor(row.estadoApto)}`}>
                                            {getEstadoAptoLabel(row.estadoApto)}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`badge badge-${row.estaHabilitado ? 'success' : 'secondary'}`}>
                                            {row.estaHabilitado ? 'Habilitado' : 'No habilitado'}
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

export default PadronHabilitados;
