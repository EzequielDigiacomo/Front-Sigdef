import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../../services/api';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import { ArrowLeft, Ruler, Trash2 } from 'lucide-react';
import {
    getDistanciaLabel,
    getCategoriaEdadLabel,
    getSexoLabel,
    getTipoBoteLabel,
    getCategoriaLabel
} from '../../../utils/enums';
import './Evento.css';

const DistanciasList = () => {
    const { eventoId } = useParams();
    const navigate = useNavigate();
    const [distancias, setDistancias] = useState([]);
    const [evento, setEvento] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [eventoId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const eventoData = await api.get(`/Evento/${eventoId}`);
            setEvento(eventoData);
            setDistancias(eventoData.distancias || eventoData.eventoDistancias || []);
        } catch (error) {
            console.error('Error cargando distancias:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Button variant="ghost" onClick={() => navigate(`/dashboard/eventos/${eventoId}`)}>
                        <ArrowLeft size={20} />
                    </Button>
                    <div>
                        <h2 className="page-title">
                            <Ruler size={28} /> Cronograma del Evento
                        </h2>
                        {evento && <p className="page-subtitle">{evento.nombre}</p>}
                    </div>
                </div>
            </div>

            <Card>
                <div className="table-responsive">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Distancia</th>
                                <th>Bote</th>
                                <th>Categoría</th>
                                <th>Sexo</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="4" className="text-center">Cargando...</td>
                                </tr>
                            ) : distancias.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="text-center">No hay distancias configuradas para este evento</td>
                                </tr>
                            ) : (
                                distancias.map((row, index) => (
                                    <tr key={row.idDistancia || index}>
                                        <td>{getDistanciaLabel(row.distanciaRegata)}</td>
                                        <td>{getTipoBoteLabel(row.tipoBote)}</td>
                                        <td>
                                            {getCategoriaEdadLabel(row.categoriaEdad) !== 'Desconocido'
                                                ? getCategoriaEdadLabel(row.categoriaEdad)
                                                : getCategoriaLabel(row.categoriaEdad)}
                                        </td>
                                        <td>{getSexoLabel(row.sexoCompetencia)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default DistanciasList;
