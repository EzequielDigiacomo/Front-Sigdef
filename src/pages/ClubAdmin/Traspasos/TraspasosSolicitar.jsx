import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Search, Send, AlertCircle } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import TraspasoService from '../../../services/traspasoService';
import {
    normalizeAtletaBusqueda,
    normalizePeriodo,
    notifyTraspasosChanged,
    notifyMensajesChanged,
} from '../../../utils/traspasoUtils';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Modal from '../../../components/common/Modal';

const TraspasosSolicitar = () => {
    const { user } = useAuth();
    const idClub = user?.idClub ?? user?.IdClub;

    const [periodo, setPeriodo] = useState(null);
    const [periodoLoading, setPeriodoLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [searching, setSearching] = useState(false);
    const [results, setResults] = useState([]);
    const [selected, setSelected] = useState(null);
    const [motivo, setMotivo] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [alert, setAlert] = useState(null);

    const periodoActivo = periodo?.esVigente;

    const showAlert = (type, message) => {
        setAlert({ type, message });
        setTimeout(() => setAlert(null), 4000);
    };

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setPeriodoLoading(true);
            try {
                const data = await TraspasoService.getPeriodoActivo();
                if (!cancelled) setPeriodo(data ? normalizePeriodo(data) : null);
            } catch {
                if (!cancelled) setPeriodo(null);
            } finally {
                if (!cancelled) setPeriodoLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    const handleSearch = async () => {
        if (searchTerm.trim().length < 2) {
            showAlert('error', 'Ingrese al menos 2 caracteres.');
            return;
        }
        setSearching(true);
        try {
            const data = await TraspasoService.buscarAtletas(searchTerm.trim());
            setResults((Array.isArray(data) ? data : []).map(normalizeAtletaBusqueda));
        } catch (err) {
            showAlert('error', err.message || 'Error en la búsqueda.');
            setResults([]);
        } finally {
            setSearching(false);
        }
    };

    const handleSubmit = async () => {
        if (!selected || !idClub) return;
        setSubmitting(true);
        try {
            await TraspasoService.crearSolicitud({
                participanteId: selected.participanteId,
                idClubDestino: Number(idClub),
                motivoSolicitud: motivo.trim() || null,
            });
            notifyTraspasosChanged();
            notifyMensajesChanged();
            setSelected(null);
            setMotivo('');
            setResults([]);
            setSearchTerm('');
            showAlert('success', 'Solicitud de traspaso enviada. La federación verificará la deuda del atleta.');
        } catch (err) {
            showAlert('error', err.message || 'No se pudo crear la solicitud.');
        } finally {
            setSubmitting(false);
        }
    };

    if (periodoLoading) {
        return <div className="traspasos-empty">Verificando periodo de traspaso...</div>;
    }

    if (!periodoActivo) {
        return (
            <div className="traspasos-alert traspasos-alert-warning">
                <AlertTriangle size={20} />
                <div>
                    <strong>Periodo de traspaso cerrado</strong>
                    <p style={{ margin: '0.35rem 0 0' }}>
                        No hay un periodo activo. Contacte a la federación para habilitar traspasos.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <>
            {alert && (
                <div className={`traspasos-alert traspasos-alert-${alert.type === 'error' ? 'error' : 'success'}`} style={{ marginBottom: '1rem' }}>
                    {alert.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
                    <span>{alert.message}</span>
                </div>
            )}

            <Card title="Buscar atleta de otro club">
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: 0 }}>
                    Busque por nombre o documento. Solo se muestran atletas de otros clubes de su federación.
                </p>
                <div className="traspasos-search-box">
                    <input
                        type="search"
                        placeholder="Nombre o documento..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <Button variant="primary" icon={Search} onClick={handleSearch} isLoading={searching}>
                        Buscar
                    </Button>
                </div>

                {results.length > 0 && (
                    <div className="traspasos-result-list" style={{ marginTop: '1rem' }}>
                        {results.map((a) => (
                            <div key={a.participanteId} className="traspasos-result-item">
                                <div>
                                    <h4>{a.nombre}</h4>
                                    <p>Doc: {a.documento} · Club actual: {a.clubNombre}</p>
                                </div>
                                <Button variant="primary" size="sm" icon={Send} onClick={() => setSelected(a)}>
                                    Solicitar
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            <Modal
                isOpen={!!selected}
                onClose={() => !submitting && setSelected(null)}
                title="Confirmar solicitud de traspaso"
                footer={
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <Button variant="secondary" onClick={() => setSelected(null)} disabled={submitting}>
                            Cancelar
                        </Button>
                        <Button variant="primary" onClick={handleSubmit} isLoading={submitting}>
                            Enviar solicitud
                        </Button>
                    </div>
                }
            >
                {selected && (
                    <>
                        <p>
                            Solicitar traspaso de <strong>{selected.nombre}</strong> desde{' '}
                            <strong>{selected.clubNombre}</strong> hacia su club.
                        </p>
                        <label htmlFor="motivoSolicitud" style={{ display: 'block', marginBottom: 6 }}>Motivo (opcional)</label>
                        <textarea
                            id="motivoSolicitud"
                            rows={3}
                            value={motivo}
                            onChange={(e) => setMotivo(e.target.value)}
                            placeholder="Motivo del traspaso..."
                            style={{
                                width: '100%',
                                padding: '0.75rem 1rem',
                                borderRadius: 8,
                                border: '1px solid var(--border-color)',
                                background: 'var(--bg-card)',
                                color: 'var(--text-primary)',
                            }}
                        />
                    </>
                )}
            </Modal>
        </>
    );
};

export default TraspasosSolicitar;
