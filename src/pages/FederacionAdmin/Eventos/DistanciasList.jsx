import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../../services/api';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import DataTable from '../../../components/common/DataTable';
import { ArrowLeft, Ruler } from 'lucide-react';
import './Evento.css';

const DistanciasList = () => {
    const { eventoId } = useParams();
    const navigate = useNavigate();
    const [distancias, setDistancias] = useState([]);
    const [evento, setEvento] = useState(null);
    const [loading, setLoading] = useState(true);

    // Mapeos de enums
    const distanciaRegataMap = {
        1: '200 Metros',
        2: '350 Metros',
        3: '400 Metros',
        4: '500 Metros',
        5: '1000 Metros',
        6: '2 Kilómetros',
        7: '3 Kilómetros',
        8: '5 Kilómetros',
        9: '10 Kilómetros',
        10: '15 Kilómetros',
        11: '22 Kilómetros',
        12: '25 Kilómetros',
        13: '32 Kilómetros'
    };

    const tipoBoteMap = {
        0: 'K1',
        1: 'K2',
        2: 'K4',
        3: 'C1',
        4: 'C2',
        5: 'C4'
    };

    const categoriaMap = {
        0: 'Infantil',
        1: 'Cadete',
        2: 'Junior',
        3: 'Sub23',
        4: 'Senior',
        5: 'Master',
        6: 'Veterano'
    };

    const sexoMap = {
        0: 'Masculino',
        1: 'Femenino',
        2: 'Mixto'
    };

    useEffect(() => {
        loadData();
    }, [eventoId]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Cargar evento
            const eventoData = await api.get(`/Evento/${eventoId}`);
            setEvento(eventoData);

            // Usar las distancias que vienen con el evento (priorizar 'distancias' del DTO)
            setDistancias(eventoData.distancias || eventoData.eventoDistancias || []);
        } catch (error) {
            console.error('Error cargando distancias:', error);
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            label: 'Distancia',
            key: 'distanciaCodigo',
            render: (val, row) => val || row.distanciaNombre || '-'
        },
        {
            label: 'Bote',
            key: 'tipoBoteNombre',
            render: (val) => val || '-'
        },
        {
            label: 'Categoría',
            key: 'categoriaEdad',
            render: (val) => categoriaMap[val] || categoriaMap[String(val)] || val || '-'
        },
        {
            label: 'Sexo',
            key: 'sexoCompetencia',
            render: (val) => sexoMap[val] || sexoMap[String(val)] || val || '-'
        }
    ];

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
                <DataTable
                    columns={columns}
                    data={distancias}
                    loading={loading}
                    emptyMessage="No hay distancias configuradas para este evento"
                />
            </Card>
        </div>
    );
};

export default DistanciasList;
