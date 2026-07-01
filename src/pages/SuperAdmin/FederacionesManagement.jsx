import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import SearchInput from '../../components/common/SearchInput';
import { Plus, Edit, Trash2, Globe, Mail, Phone, ShieldCheck, ShieldAlert, Award } from 'lucide-react';
import Modal from '../../components/common/Modal';

const FederacionesManagement = () => {
    const navigate = useNavigate();
    const [federaciones, setFederaciones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFed, setSelectedFed] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    useEffect(() => {
        loadFederaciones();
    }, []);

    const getSigla = (nombre) => {
        if (!nombre) return 'FED';
        const words = nombre.trim().toUpperCase().split(/\s+/);
        if (words.length === 1) return words[0].substring(0, 3);
        const filtered = words.filter(w => w.length > 2);
        if (filtered.length === 0) return words.map(w => w[0]).join('').substring(0, 3);
        return filtered.map(w => w[0]).join('').substring(0, 4);
    };

    const loadFederaciones = async () => {
        try {
            setLoading(true);
            const data = await api.get('/federacion') || [];

            const finalFeds = data.map((f, idx) => ({
                idFederacion: f.idFederacion || f.IdFederacion,
                nombre: f.nombre || f.Nombre || 'Federación Deportiva',
                sigla: getSigla(f.nombre || f.Nombre),
                email: f.email || f.Email || 'contacto@federacion.org',
                telefono: f.telefono || f.Telefono || 'Sin teléfono',
                plan: idx % 3 === 0 ? 'Enterprise' : (idx % 3 === 1 ? 'Premium' : 'Básico'),
                estado: 'Activo',
                costoMensual: idx % 3 === 0 ? 150000 : (idx % 3 === 1 ? 95000 : 50000),
                pais: f.direccion || f.Direccion || 'Argentina'
            }));

            setFederaciones(finalFeds);
        } catch (error) {
            console.error('Error cargando federaciones:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = (fedId) => {
        const updated = federaciones.map(fed => {
            if (fed.idFederacion === fedId) {
                const newStatus = fed.estado === 'Activo' ? 'Suspendido' : 'Activo';
                return { ...fed, estado: newStatus };
            }
            return fed;
        });
        setFederaciones(updated);
    };

    const handleDeleteClick = (fed) => {
        setSelectedFed(fed);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        try {
            await api.delete(`/federacion/${selectedFed.idFederacion}`);
            setShowDeleteModal(false);
            setSelectedFed(null);
            loadFederaciones();
        } catch (error) {
            console.error('Error eliminando federación:', error);
            alert('No se pudo eliminar la federación. Asegúrese de que no tenga clubes o atletas vinculados.');
        }
    };

    const filteredFeds = federaciones.filter(fed =>
        fed.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fed.sigla.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fed.pais.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 className="text-gradient" style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.25rem' }}>Gestión de Federaciones</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Da de alta, edita, audita o suspende las federaciones inquilinas del ecosistema.</p>
                </div>
                <Button variant="primary" onClick={() => navigate('/superadmin/federaciones/nueva')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Plus size={18} />
                    Alta de Federación
                </Button>
            </div>

            <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
                    <SearchInput 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                        placeholder="Buscar federaciones por nombre, sigla o país..." 
                        style={{ flex: 1, minWidth: '300px' }}
                    />
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>Cargando federaciones...</div>
                ) : filteredFeds.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                        <p style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>No se encontraron federaciones</p>
                        <p style={{ fontSize: '0.9rem' }}>Intente buscar con otro término o cree una nueva federación.</p>
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                        gap: '1.5rem'
                    }}>
                        {filteredFeds.map((fed) => (
                            <div key={fed.idFederacion} className="glass-panel" style={{
                                padding: '1.5rem',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                minHeight: '230px',
                                border: '1px solid var(--border-color)',
                                position: 'relative',
                                transition: 'var(--transition)'
                            }}>
                                {/* Badge de Plan */}
                                <div style={{
                                    position: 'absolute',
                                    top: '1rem',
                                    right: '1rem',
                                    display: 'flex',
                                    gap: '0.5rem',
                                    alignItems: 'center'
                                }}>
                                    <span style={{
                                        backgroundColor: fed.plan === 'Enterprise' ? 'rgba(59, 130, 246, 0.1)' : (fed.plan === 'Premium' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)'),
                                        color: fed.plan === 'Enterprise' ? 'var(--primary)' : (fed.plan === 'Premium' ? 'var(--success)' : 'var(--warning)'),
                                        fontSize: '0.75rem',
                                        padding: '0.2rem 0.6rem',
                                        borderRadius: '20px',
                                        fontWeight: 'bold',
                                        border: '1px solid rgba(var(--primary-rgb), 0.2)'
                                    }}>
                                        {fed.plan}
                                    </span>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{
                                            width: '45px',
                                            height: '45px',
                                            borderRadius: 'var(--radius-md)',
                                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                            color: 'var(--primary)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: 'bold',
                                            fontSize: '1.1rem'
                                        }}>
                                            {fed.sigla}
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-primary)', paddingRight: '5rem' }}>
                                                {fed.nombre}
                                            </h3>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{fed.pais}</p>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Mail size={16} />
                                            <span>{fed.email}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Phone size={16} />
                                            <span>{fed.telefono}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Award size={16} />
                                            <span>Costo: ${fed.costoMensual?.toLocaleString()} ARS/mes</span>
                                        </div>
                                    </div>
                                </div>

                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    marginTop: '1.5rem',
                                    paddingTop: '1rem',
                                    borderTop: '1px solid var(--border-color)'
                                }}>
                                    <button 
                                        onClick={() => handleToggleStatus(fed.idFederacion)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.35rem',
                                            fontSize: '0.8rem',
                                            fontWeight: 'bold',
                                            color: fed.estado === 'Activo' ? 'var(--success)' : 'var(--danger)',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {fed.estado === 'Activo' ? <ShieldCheck size={16} /> : <ShieldAlert size={16} />}
                                        <span>{fed.estado}</span>
                                    </button>

                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            onClick={() => navigate(`/superadmin/federaciones/editar/${fed.idFederacion}`)}
                                            style={{ padding: '0.4rem' }}
                                        >
                                            <Edit size={16} />
                                        </Button>
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            onClick={() => handleDeleteClick(fed)}
                                            style={{ padding: '0.4rem', color: 'var(--danger)' }}
                                        >
                                            <Trash2 size={16} />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {showDeleteModal && selectedFed && (
                <Modal
                    isOpen={showDeleteModal}
                    onClose={() => setShowDeleteModal(false)}
                    title="Confirmar Eliminación"
                    footer={
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>Cancelar</Button>
                            <Button variant="danger" onClick={confirmDelete}>Eliminar</Button>
                        </div>
                    }
                >
                    <p style={{ color: 'var(--text-primary)', lineHeight: '1.6' }}>
                        ¿Está seguro que desea eliminar por completo la federación <strong>{selectedFed.nombre}</strong> ({selectedFed.sigla})?
                    </p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                        Esta acción es irreversible y cortará de forma permanente el acceso de todos los clubes y atletas asociados a este inquilino.
                    </p>
                </Modal>
            )}
        </div>
    );
};

export default FederacionesManagement;
