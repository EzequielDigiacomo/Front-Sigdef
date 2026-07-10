import React, { useState, useEffect } from 'react';
import { DollarSign, CheckCircle } from 'lucide-react';
import Modal from '../../../components/common/Modal';
import Button from '../../../components/common/Button';
import './PagosClubes.css';

const RegistrarPagoModal = ({ isOpen, onClose, onSubmit, paymentType, entityName }) => {
    const [monto, setMonto] = useState('');
    const [referencia, setReferencia] = useState('');
    const [notas, setNotas] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen) {
            setMonto('');
            setReferencia('');
            setNotas('');
            setError(null);
            setLoading(false);
        }
    }, [isOpen]);

    const getTitle = () => {
        switch (paymentType) {
            case 'ClubAfiliacion':
                return 'Registrar Pago Anual de Club';
            case 'AtletaAfiliacion':
                return 'Registrar Pago de Cuota de Atleta';
            case 'InscripcionEvento':
                return 'Registrar Pago de Inscripción';
            default:
                return 'Registrar Pago';
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        const amount = parseFloat(monto);
        if (isNaN(amount) || amount <= 0) {
            setError('Ingresá un monto válido mayor a 0.');
            return;
        }
        if (!referencia.trim()) {
            setError('La referencia / comprobante es obligatoria.');
            return;
        }

        setLoading(true);
        try {
            await onSubmit({
                monto: amount,
                referencia: referencia.trim(),
                notas: notas.trim() || null,
            });
            onClose();
        } catch (err) {
            setError(err.message || 'Ocurrió un error al registrar el pago.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={getTitle()}
            size="medium"
            footer={
                <div className="pagos-modal-footer">
                    <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        variant="primary"
                        icon={CheckCircle}
                        isLoading={loading}
                        onClick={handleSubmit}
                        className="pagos-btn-confirm"
                    >
                        Confirmar Pago
                    </Button>
                </div>
            }
        >
            <div className="pagos-modal-entity">
                <div className="pagos-modal-icon">
                    <DollarSign size={20} />
                </div>
                <p>
                    Para: <strong>{entityName}</strong>
                </p>
            </div>

            {error && <div className="pagos-modal-error">{error}</div>}

            <form className="pagos-modal-form" onSubmit={handleSubmit}>
                <label className="pagos-field">
                    <span>Monto a Registrar ($)</span>
                    <div className="pagos-input-prefix">
                        <span>$</span>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={monto}
                            onChange={(e) => setMonto(e.target.value)}
                            required
                        />
                    </div>
                </label>

                <label className="pagos-field">
                    <span>Nro. de Referencia / Comprobante</span>
                    <input
                        type="text"
                        placeholder="Ej. TRANSF-887766, RECIBO-02"
                        value={referencia}
                        onChange={(e) => setReferencia(e.target.value)}
                        required
                    />
                </label>

                <label className="pagos-field">
                    <span>Notas Adicionales</span>
                    <textarea
                        placeholder="Detalles sobre el pago..."
                        value={notas}
                        onChange={(e) => setNotas(e.target.value)}
                        rows={3}
                    />
                </label>
            </form>
        </Modal>
    );
};

export default RegistrarPagoModal;
