/** Normaliza un usuario de /Auth/usuarios como delegado de club. */
export const getUsuarioRol = (u) =>
    u?.rol || u?.Rol || u?.rolFederacion || u?.RolFederacion || '';

export const getUsuarioClubId = (u) =>
    u?.idClub ?? u?.IdClub ?? u?.clubId ?? u?.ClubId ?? null;

export const getUsuarioFederacionId = (u) =>
    u?.idFederacion ?? u?.IdFederacion ?? u?.federacionId ?? u?.FederacionId ?? null;

export const getUsuarioNombre = (u) => {
    const composed = `${u?.nombre || u?.Nombre || ''} ${u?.apellido || u?.Apellido || ''}`.trim();
    return (
        composed ||
        u?.nombreCompleto ||
        u?.NombreCompleto ||
        u?.nombrePersona ||
        u?.NombrePersona ||
        u?.username ||
        u?.Username ||
        'Sin nombre'
    );
};

export const isDelegadoClubRole = (rol) =>
    ['Club', 'Delegado', 'DelegadoClub'].includes(String(rol || '').trim());

export const mapAuthUserToDelegado = (u) => ({
    ...u,
    id: u.id ?? u.Id ?? u.idPersona ?? u.IdPersona,
    rol: getUsuarioRol(u),
    idClub: getUsuarioClubId(u),
    clubId: getUsuarioClubId(u),
    idFederacion: getUsuarioFederacionId(u),
    nombreCompleto: getUsuarioNombre(u),
    nombrePersona: getUsuarioNombre(u),
    dni: u.dni || u.Dni || u.documento || u.Documento || '',
    email: u.email || u.Email || '',
    telefono: u.telefono || u.Telefono || '',
    clubNombre: u.clubNombre || u.ClubNombre || u.nombreClub || u.NombreClub || '',
});
