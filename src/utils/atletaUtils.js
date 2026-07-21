/** Id del participante/atleta para la API SIGDEF (PUT /Atleta/{id}). */
export const getParticipanteId = (atleta) =>
    atleta?.participanteId ??
    atleta?.ParticipanteId ??
    atleta?.idPersona ??
    atleta?.IdPersona ??
    null;

/** Payload esperado por AtletaCreateDto en PUT /api/Atleta/{id}. */
export const buildAtletaUpdatePayload = (atleta, overrides = {}) => {
    const participanteId = getParticipanteId(atleta);
    return {
        participanteId,
        idClub: atleta?.idClub ?? atleta?.IdClub ?? null,
        estadoPago: atleta?.estadoPago ?? atleta?.EstadoPago ?? 0,
        perteneceSeleccion: atleta?.perteneceSeleccion ?? atleta?.PerteneceSeleccion ?? false,
        categoria: atleta?.categoria ?? atleta?.Categoria ?? null,
        becadoEnard: atleta?.becadoEnard ?? atleta?.BecadoEnard ?? false,
        becadoSdn: atleta?.becadoSdn ?? atleta?.BecadoSdn ?? false,
        montoBeca: atleta?.montoBeca ?? atleta?.MontoBeca ?? 0,
        presentoAptoMedico: atleta?.presentoAptoMedico ?? atleta?.PresentoAptoMedico ?? false,
        fechaAptoMedico: atleta?.fechaAptoMedico ?? atleta?.FechaAptoMedico ?? null,
        fechaCreacion: atleta?.fechaCreacion ?? atleta?.FechaCreacion ?? new Date().toISOString(),
        ...overrides,
    };
};
