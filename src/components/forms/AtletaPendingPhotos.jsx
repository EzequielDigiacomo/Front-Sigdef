import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ImagePlus, X, FileText, Minus, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { extractPlanFromUser } from '../../utils/planHelpers';
import { api } from '../../services/api';
import './AtletaPendingPhotos.css';

const PHOTO_SLOTS = [
    { key: 'fotoPerfil', tipoDocumento: 4, label: 'Foto de perfil' },
    { key: 'dniFrente', tipoDocumento: 0, label: 'DNI (frente)' },
    { key: 'dniDorso', tipoDocumento: 1, label: 'DNI (dorso)' },
    { key: 'aptoMedico', tipoDocumento: 3, label: 'Apto médico', allowPdf: true, needsExpiry: true },
];

const MAX_BYTES = 5 * 1024 * 1024;

const emptySlots = () =>
    PHOTO_SLOTS.reduce((acc, slot) => {
        acc[slot.key] = { file: null, previewUrl: null, fechaVencimiento: '' };
        return acc;
    }, {});

/** Sube los archivos pendientes a /Documentacion/upload. No falla el alta si alguna subida falla. */
export async function uploadPendingAtletaPhotos(personaId, pendingSlots) {
    if (!personaId || !pendingSlots) return { uploaded: 0, failed: [] };

    const failed = [];
    let uploaded = 0;

    for (const slot of PHOTO_SLOTS) {
        const entry = pendingSlots[slot.key];
        if (!entry?.file) continue;

        try {
            const formData = new FormData();
            formData.append('File', entry.file);
            formData.append('PersonaId', String(personaId));
            formData.append('TipoDocumento', String(slot.tipoDocumento));
            if (slot.needsExpiry && entry.fechaVencimiento) {
                formData.append('FechaVencimiento', entry.fechaVencimiento);
            }
            const response = await api.upload('/Documentacion/upload', formData);
            if (response && response.success === false) {
                failed.push({ label: slot.label, error: response.error || 'Error al subir' });
            } else {
                uploaded += 1;
            }
        } catch (err) {
            failed.push({ label: slot.label, error: err?.message || 'Error al subir' });
        }
    }

    return { uploaded, failed };
}

/** Texto corto para concatenar al mensaje de éxito tras subir fotos. */
export function formatPhotosUploadNote({ uploaded = 0, failed = [] } = {}) {
    if (uploaded > 0 && failed.length === 0) {
        return ` Se cargaron ${uploaded} archivo(s).`;
    }
    if (uploaded > 0 && failed.length > 0) {
        return ` Se cargaron ${uploaded} archivo(s); falló: ${failed.map((f) => f.label).join(', ')}.`;
    }
    if (failed.length > 0) {
        return ` No se pudieron subir las fotos (${failed.map((f) => f.label).join(', ')}). Podés cargarlas después desde el detalle.`;
    }
    return '';
}

/**
 * Sección colapsable de fotos/documentos opcionales (atleta, entrenador, delegado).
 * @param {{ value: object, onChange: (next: object) => void, forceAllowImages?: boolean, entityLabel?: string, defaultCollapsed?: boolean }} props
 */
const AtletaPendingPhotos = ({
    value,
    onChange,
    forceAllowImages = false,
    entityLabel = 'atleta',
    defaultCollapsed = false,
}) => {
    const { user } = useAuth();
    const plan = extractPlanFromUser(user) || user?.plan;
    const imagesAllowed = forceAllowImages || !!plan?.permitirCargaImagenes;
    const slots = value || emptySlots();
    const inputRefs = useRef({});
    const slotsRef = useRef(slots);
    slotsRef.current = slots;
    const [localError, setLocalError] = useState('');
    const [collapsed, setCollapsed] = useState(defaultCollapsed);

    useEffect(() => () => {
        Object.values(slotsRef.current).forEach((s) => {
            if (s?.previewUrl) URL.revokeObjectURL(s.previewUrl);
        });
    }, []);

    const accept = useMemo(() => {
        if (imagesAllowed) return 'image/jpeg,image/jpg,image/png,image/gif,image/webp,application/pdf';
        return 'application/pdf';
    }, [imagesAllowed]);

    const pendingCount = useMemo(
        () => PHOTO_SLOTS.reduce((n, slot) => n + (slots[slot.key]?.file ? 1 : 0), 0),
        [slots]
    );

    const updateSlot = (key, patch) => {
        const prev = slots[key] || { file: null, previewUrl: null, fechaVencimiento: '' };
        if (patch.previewUrl === null && prev.previewUrl) {
            URL.revokeObjectURL(prev.previewUrl);
        }
        onChange({
            ...slots,
            [key]: { ...prev, ...patch },
        });
    };

    const handleFilePick = (slot, file) => {
        if (!file) return;
        setLocalError('');

        const isImage = file.type.startsWith('image/');
        const isPdf = file.type === 'application/pdf';

        if (isImage && !imagesAllowed) {
            setLocalError('Tu plan solo permite PDF. Las imágenes requieren un plan con carga de fotos.');
            return;
        }
        if (!isImage && !(slot.allowPdf && isPdf)) {
            setLocalError(
                slot.allowPdf
                    ? `Solo se permiten imágenes o PDF para ${slot.label}.`
                    : `Solo se permiten imágenes para ${slot.label}.`
            );
            return;
        }
        if (file.size > MAX_BYTES) {
            setLocalError('El archivo es demasiado grande (máx. 5 MB).');
            return;
        }

        const previewUrl = isImage ? URL.createObjectURL(file) : null;
        updateSlot(slot.key, { file, previewUrl });
    };

    const handleRemove = (slot) => {
        updateSlot(slot.key, { file: null, previewUrl: null });
        const input = inputRefs.current[slot.key];
        if (input) input.value = '';
    };

    return (
        <div className={`atleta-pending-photos${collapsed ? ' is-collapsed' : ''}`}>
            <div className="atleta-pending-photos__header">
                <h3 className="form-section-title atleta-pending-photos__title">
                    Fotos / documentación (opcional)
                    {collapsed && pendingCount > 0 && (
                        <span className="atleta-pending-photos__badge">{pendingCount}</span>
                    )}
                </h3>
                <button
                    type="button"
                    className="atleta-pending-photos__toggle"
                    onClick={() => setCollapsed((c) => !c)}
                    title={collapsed ? 'Expandir sección' : 'Minimizar sección'}
                    aria-expanded={!collapsed}
                    aria-label={collapsed ? 'Expandir fotos' : 'Minimizar fotos'}
                >
                    {collapsed ? <Plus size={16} /> : <Minus size={16} />}
                </button>
            </div>

            {!collapsed && (
                <>
                    <p className="atleta-pending-photos__hint">
                        Si ya tenés las fotos del {entityLabel}, podés cargarlas ahora. No es obligatorio.
                        {!imagesAllowed && (
                            <> Tu plan actual no incluye carga de imágenes: solo PDF (p. ej. apto médico).</>
                        )}
                    </p>
                    {localError && <p className="atleta-pending-photos__error">{localError}</p>}

                    <div className="atleta-pending-photos__grid">
                        {PHOTO_SLOTS.map((slot) => {
                            const entry = slots[slot.key] || {};
                            const hasFile = !!entry.file;
                            const onlyPdf = !imagesAllowed && slot.allowPdf;
                            const disabledSlot = !imagesAllowed && !slot.allowPdf;

                            return (
                                <div key={slot.key} className={`atleta-pending-photos__card${disabledSlot ? ' is-disabled' : ''}`}>
                                    <div className="atleta-pending-photos__label">{slot.label}</div>

                                    {!hasFile ? (
                                        <button
                                            type="button"
                                            className="atleta-pending-photos__drop"
                                            disabled={disabledSlot}
                                            onClick={() => inputRefs.current[slot.key]?.click()}
                                        >
                                            <ImagePlus size={22} />
                                            <span>{disabledSlot ? 'No disponible en tu plan' : onlyPdf ? 'Adjuntar PDF' : 'Elegir archivo'}</span>
                                        </button>
                                    ) : (
                                        <div className="atleta-pending-photos__preview">
                                            {entry.previewUrl ? (
                                                <img src={entry.previewUrl} alt={slot.label} />
                                            ) : (
                                                <div className="atleta-pending-photos__pdf">
                                                    <FileText size={28} />
                                                    <span>{entry.file.name}</span>
                                                </div>
                                            )}
                                            <button
                                                type="button"
                                                className="atleta-pending-photos__remove"
                                                onClick={() => handleRemove(slot)}
                                                title="Quitar"
                                                aria-label={`Quitar ${slot.label}`}
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    )}

                                    <input
                                        ref={(el) => { inputRefs.current[slot.key] = el; }}
                                        type="file"
                                        accept={slot.allowPdf ? accept : (imagesAllowed ? 'image/*' : '')}
                                        hidden
                                        disabled={disabledSlot}
                                        onChange={(e) => handleFilePick(slot, e.target.files?.[0])}
                                    />

                                    {slot.needsExpiry && hasFile && (
                                        <div className="atleta-pending-photos__expiry">
                                            <label>Vencimiento (opcional)</label>
                                            <input
                                                type="date"
                                                className="form-input"
                                                value={entry.fechaVencimiento || ''}
                                                onChange={(e) => updateSlot(slot.key, { fechaVencimiento: e.target.value })}
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
};

export { emptySlots as emptyAtletaPendingPhotos };
export default AtletaPendingPhotos;
