import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';
import { DataGenerator } from '../../utils/DataGenerator';
import { api } from '../../services/api';
import { Database, Loader, CheckCircle, AlertTriangle } from 'lucide-react';

const DataGenerationModal = ({ isOpen, onClose, onDataGenerated }) => {
    const [entityType, setEntityType] = useState('club');
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0, success: 0, failed: 0 });
    const [logs, setLogs] = useState([]);

    // Cache clubs for athlete generation
    const [clubes, setClubes] = useState([]);

    useEffect(() => {
        const needsClubs = ['atleta', 'entrenador_club', 'entrenador_seleccion'];
        if (isOpen && needsClubs.includes(entityType)) {
            loadClubes();
        }
    }, [isOpen, entityType]);

    const loadClubes = async () => {
        try {
            const data = await api.get('/Club');
            setClubes(data);
        } catch (e) {
            console.error("Error loading clubs for generator", e);
        }
    };

    const addLog = (message, type = 'info') => {
        setLogs(prev => [...prev, { message, type, time: new Date().toLocaleTimeString() }]);
    };

    const handleGenerate = async () => {
        setLoading(true);
        setLogs([]);
        setProgress({ current: 0, total: quantity, success: 0, failed: 0 });

        let successCount = 0;
        let failedCount = 0;

        for (let i = 0; i < quantity; i++) {
            try {
                setProgress(prev => ({ ...prev, current: i + 1 }));

                if (entityType === 'club') {
                    await DataGenerator.createRandomClub();
                    addLog(`Club generado correctamente`, 'success');
                } else if (entityType === 'atleta') {
                    await DataGenerator.createRandomAtleta(clubes);
                    addLog(`Atleta generado correctamente`, 'success');
                } else if (entityType === 'entrenador_club') {
                    await DataGenerator.createRandomEntrenadorClub(clubes);
                    addLog(`Entrenador de Club generado correctamente`, 'success');
                } else if (entityType === 'entrenador_seleccion') {
                    await DataGenerator.createRandomEntrenadorSeleccion(clubes);
                    addLog(`Entrenador de Selección generado correctamente`, 'success');
                } else if (entityType === 'tutor') {
                    await DataGenerator.createRandomTutor();
                    addLog(`Tutor generado correctamente`, 'success');
                }

                successCount++;
            } catch (error) {
                console.error("Gen Error", error);
                addLog(`Error generando item ${i + 1}: ${error.message || 'Error desconocido'}`, 'error');
                failedCount++;
            }

            setProgress(prev => ({ ...prev, success: successCount, failed: failedCount }));
        }

        setLoading(false);
        addLog(`Proceso finalizado. Éxitos: ${successCount}, Fallos: ${failedCount}`, 'info');

        if (successCount > 0 && onDataGenerated) {
            onDataGenerated();
        }
    };

    const resetState = () => {
        setLogs([]);
        setProgress({ current: 0, total: 0, success: 0, failed: 0 });
        setLoading(false);
    }

    useEffect(() => {
        if (!isOpen) resetState();
    }, [isOpen]);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Generador de Datos de Prueba"
        >
            <div style={{ padding: '1rem' }}>
                {!loading && progress.total === 0 && (
                    <div className="form-grid">
                        <div className="alert alert-warning" style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '1rem', padding: '0.75rem', background: '#fff3cd', color: '#856404', borderRadius: '4px' }}>
                            <AlertTriangle size={20} />
                            <small>
                                <strong>¡Atención!</strong> Esta herramienta generará datos reales en la base de datos.
                                Úsala solo en entornos de desarrollo o prueba.
                            </small>
                        </div>

                        <div className="form-group">
                            <label>Tipo de Entidad</label>
                            <select
                                className="form-input"
                                value={entityType}
                                onChange={(e) => setEntityType(e.target.value)}
                            >
                                <option value="club">Clubes</option>
                                <option value="atleta">Atletas</option>
                                <option value="entrenador_club">Entrenadores de Club</option>
                                <option value="entrenador_seleccion">Entrenadores de Selección</option>
                                <option value="tutor">Tutores</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Cantidad a Generar</label>
                            <select
                                className="form-input"
                                value={quantity}
                                onChange={(e) => setQuantity(parseInt(e.target.value))}
                            >
                                <option value="1">1</option>
                                <option value="5">5</option>
                                <option value="10">10</option>
                                <option value="20">20</option>
                                <option value="50">50</option>
                            </select>
                        </div>
                    </div>
                )}

                {(loading || progress.total > 0) && (
                    <div className="generation-progress">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span>Progreso: {progress.current} / {progress.total}</span>
                            <span>{Math.round((progress.current / progress.total) * 100)}%</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: '#eee', borderRadius: '4px', overflow: 'hidden', marginBottom: '1rem' }}>
                            <div style={{
                                width: `${(progress.current / progress.total) * 100}%`,
                                height: '100%',
                                background: 'var(--primary)',
                                transition: 'width 0.3s ease'
                            }} />
                        </div>

                        <div className="logs-container" style={{
                            maxHeight: '200px',
                            overflowY: 'auto',
                            background: '#f8f9fa',
                            padding: '0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.85rem',
                            border: '1px solid #ddd'
                        }}>
                            {logs.map((log, idx) => (
                                <div key={idx} style={{
                                    padding: '2px 0',
                                    color: log.type === 'error' ? 'red' : (log.type === 'success' ? 'green' : '#333')
                                }}>
                                    <span style={{ color: '#999', marginRight: '5px' }}>[{log.time}]</span>
                                    {log.message}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="form-actions" style={{ marginTop: '1.5rem', justifyContent: 'flex-end', display: 'flex', gap: '1rem' }}>
                    <Button variant="secondary" onClick={onClose} disabled={loading}>
                        {progress.total > 0 && !loading ? 'Cerrar' : 'Cancelar'}
                    </Button>

                    {!loading && progress.total === 0 && (
                        <Button variant="primary" onClick={handleGenerate}>
                            <Database size={16} /> Generar Datos
                        </Button>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default DataGenerationModal;
