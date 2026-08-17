import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import FormField from '../../components/forms/FormField';
import PageHeader from '../../components/common/PageHeader';
import { useDevice } from '../../hooks/useDevice';
import { Search, ClipboardList, Trash2, Download, RefreshCw } from 'lucide-react';
import './RegistroInscripciones.css';

const normalizeRegistro = (item) => ({
    id: item.id ?? item.Id ?? item.idInscripcion ?? item.IdInscripcion,
    participanteId: item.participanteId ?? item.ParticipanteId,
    participanteNombre: item.participanteNombre ?? item.ParticipanteNombre ?? '',
    participanteDocumento: item.participanteDocumento ?? item.ParticipanteDocumento ?? '',
    clubId: item.clubId ?? item.ClubId,
    clubNombre: item.clubNombre ?? item.ClubNombre ?? '',
    eventoId: item.eventoId ?? item.EventoId,
    eventoNombre: item.eventoNombre ?? item.EventoNombre ?? '',
    eventoPruebaId: item.eventoPruebaId ?? item.EventoPruebaId,
    pruebaNombre: item.pruebaNombre ?? item.PruebaNombre ?? '',
    fechaInscripcion: item.fechaInscripcion ?? item.FechaInscripcion,
    fechaInicioEvento: item.fechaInicioEvento ?? item.FechaInicioEvento,
    fechaFinEvento: item.fechaFinEvento ?? item.FechaFinEvento,
    estado: item.estado ?? item.Estado ?? '',
    pagado: item.pagado ?? item.Pagado ?? false,
    tripulantesNombres: item.tripulantesNombres ?? item.TripulantesNombres ?? [],
});

const formatFecha = (value) => {
    if (!value) return '-';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? '-' : d.toLocaleDateString('es-AR');
};

const formatPrueba = (row) => {
    if (row.tripulantesNombres?.length > 0) {
        const crew = [row.participanteNombre, ...row.tripulantesNombres].filter(Boolean).join(' / ');
        return `${row.pruebaNombre} (${crew})`;
    }
    return row.pruebaNombre || '-';
};

/**
 * @param {{ modo?: 'admin' | 'club' }} props
 */
const RegistroInscripciones = ({ modo = 'admin' }) => {
    const { user } = useAuth();
    const { isNative, isMobile } = useDevice();
    const isMobileView = isMobile || isNative;
    const esAdmin = modo === 'admin';

    const [inscripciones, setInscripciones] = useState([]);
    const [eventos, setEventos] = useState([]);
    const [clubes, setClubes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filtroBusqueda, setFiltroBusqueda] = useState('');
    const [filtroEventoId, setFiltroEventoId] = useState('');
    const [filtroClubId, setFiltroClubId] = useState('');

    const loadCatalogos = useCallback(async () => {
        try {
            const [eventosData, clubesData] = await Promise.all([
                api.get('/eventos').catch(() => []),
                esAdmin ? api.get('/Clubes').catch(() => []) : Promise.resolve([]),
            ]);
            setEventos(Array.isArray(eventosData) ? eventosData : []);
            setClubes(Array.isArray(clubesData) ? clubesData : []);
        } catch (error) {
            console.error('Error cargando catálogos:', error);
        }
    }, [esAdmin]);

    const loadInscripciones = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filtroEventoId) params.set('eventoId', filtroEventoId);
            if (esAdmin && filtroClubId) params.set('clubId', filtroClubId);
            if (filtroBusqueda.trim()) params.set('busqueda', filtroBusqueda.trim());

            const query = params.toString();
            const data = await api.get(`/inscripciones/registro${query ? `?${query}` : ''}`);
            setInscripciones(Array.isArray(data) ? data.map(normalizeRegistro) : []);
        } catch (error) {
            console.error('Error cargando registro de inscripciones:', error);
            setInscripciones([]);
        } finally {
            setLoading(false);
        }
    }, [esAdmin, filtroEventoId, filtroClubId, filtroBusqueda]);

    useEffect(() => {
        loadCatalogos();
    }, [loadCatalogos]);

    useEffect(() => {
        const timer = setTimeout(() => {
            loadInscripciones();
        }, filtroBusqueda ? 350 : 0);
        return () => clearTimeout(timer);
    }, [loadInscripciones, filtroBusqueda]);

    const handleDelete = async (id) => {
        if (!window.confirm('¿Eliminar esta inscripción del registro?')) return;
        try {
            await api.delete(`/inscripciones/${id}`);
            loadInscripciones();
        } catch (error) {
            console.error('Error eliminando inscripción:', error);
            alert('No se pudo eliminar la inscripción');
        }
    };

    const exportCsv = () => {
        if (inscripciones.length === 0) return;

        const headers = esAdmin
            ? ['Atleta', 'Documento', 'Club', 'Evento', 'Prueba', 'Fecha inscripción', 'Estado', 'Pagado']
            : ['Atleta', 'Documento', 'Evento', 'Prueba', 'Fecha inscripción', 'Estado', 'Pagado'];

        const rows = inscripciones.map((r) => {
            const base = [
                r.participanteNombre,
                r.participanteDocumento,
                r.eventoNombre,
                formatPrueba(r),
                formatFecha(r.fechaInscripcion),
                r.estado,
                r.pagado ? 'Sí' : 'No',
            ];
            if (esAdmin) base.splice(2, 0, r.clubNombre);
            return base;
        });

        const csv = [headers, ...rows]
            .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
            .join('\n');

        const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `registro-inscripciones-${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const titulo = esAdmin ? 'Registro de Inscripciones' : 'Mis Inscripciones';
    const subtitulo = esAdmin
        ? 'Consulta de atletas inscriptos por evento y prueba en toda la federación'
        : 'Consulta de inscripciones de atletas de tu club';

    return (
        <div className={`page-container inscripciones-page ${isMobileView ? 'mobile-view' : ''}`}>
            <PageHeader
                title={titulo}
                subtitle={subtitulo}
                icon={ClipboardList}
                backTo="/dashboard"
                actions={(
                <div className="inscripciones-header-actions">
                    <Button variant="secondary" onClick={loadInscripciones} disabled={loading}>
                        <RefreshCw size={18} /> Actualizar
                    </Button>
                    {esAdmin && (
                        <Button variant="secondary" onClick={exportCsv} disabled={inscripciones.length === 0}>
                            <Download size={18} /> Exportar CSV
                        </Button>
                    )}
                </div>
                )}
            />

            <Card className="inscripciones-content-card">
                <div className="inscripciones-filters">
                    <div className="inscripciones-filter-search">
                        <FormField
                            icon={Search}
                            placeholder="Buscar atleta, documento, evento o club..."
                            value={filtroBusqueda}
                            onChange={(e) => setFiltroBusqueda(e.target.value)}
                        />
                    </div>
                    <div className="inscripciones-filter-select">
                        <select
                            className="form-input"
                            value={filtroEventoId}
                            onChange={(e) => setFiltroEventoId(e.target.value)}
                        >
                            <option value="">Todos los eventos</option>
                            {eventos.map((ev) => {
                                const id = ev.id ?? ev.Id ?? ev.idEvento ?? ev.IdEvento;
                                const nombre = ev.nombre ?? ev.Nombre ?? `Evento ${id}`;
                                return (
                                    <option key={id} value={id}>{nombre}</option>
                                );
                            })}
                        </select>
                    </div>
                    {esAdmin && (
                        <div className="inscripciones-filter-select">
                            <select
                                className="form-input"
                                value={filtroClubId}
                                onChange={(e) => setFiltroClubId(e.target.value)}
                            >
                                <option value="">Todos los clubes</option>
                                {clubes.map((c) => {
                                    const id = c.idClub ?? c.id ?? c.Id;
                                    const nombre = c.nombre ?? c.Nombre ?? `Club ${id}`;
                                    return (
                                        <option key={id} value={id}>{nombre}</option>
                                    );
                                })}
                            </select>
                        </div>
                    )}
                </div>

                <div className="table-responsive">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Atleta</th>
                                <th>Documento</th>
                                {esAdmin && <th>Club</th>}
                                <th>Evento</th>
                                <th>Prueba</th>
                                <th>Fecha inscripción</th>
                                <th>Estado</th>
                                <th>Pagado</th>
                                {esAdmin && <th>Acciones</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr className="inscripciones-empty-row">
                                    <td colSpan={esAdmin ? 9 : 7} data-label="" className="text-center">Cargando...</td>
                                </tr>
                            ) : inscripciones.length === 0 ? (
                                <tr className="inscripciones-empty-row">
                                    <td colSpan={esAdmin ? 9 : 7} data-label="" className="text-center">No hay inscripciones registradas</td>
                                </tr>
                            ) : (
                                inscripciones.map((row) => (
                                    <tr key={row.id}>
                                        <td data-label="Atleta">{row.participanteNombre || '-'}</td>
                                        <td data-label="Documento">{row.participanteDocumento || '-'}</td>
                                        {esAdmin && <td data-label="Club">{row.clubNombre || '-'}</td>}
                                        <td data-label="Evento">{row.eventoNombre || '-'}</td>
                                        <td data-label="Prueba">{formatPrueba(row)}</td>
                                        <td data-label="Fecha inscripción">{formatFecha(row.fechaInscripcion)}</td>
                                        <td data-label="Estado">{row.estado || '-'}</td>
                                        <td data-label="Pagado">{row.pagado ? 'Sí' : 'No'}</td>
                                        {esAdmin && (
                                            <td data-label="Acciones">
                                                <div className="actions-cell">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-danger"
                                                        onClick={() => handleDelete(row.id)}
                                                        title="Eliminar inscripción"
                                                    >
                                                        <Trash2 size={18} />
                                                    </Button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {!loading && inscripciones.length > 0 && (
                    <p className="inscripciones-count">
                        {inscripciones.length} inscripción{inscripciones.length !== 1 ? 'es' : ''} encontrada{inscripciones.length !== 1 ? 's' : ''}
                        {!esAdmin && user?.clubId ? ` · Club ID ${user.clubId}` : ''}
                    </p>
                )}
            </Card>
        </div>
    );
};

export default RegistroInscripciones;
