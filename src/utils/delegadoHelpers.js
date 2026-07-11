/** Normaliza un usuario de /Auth/usuarios como delegado de club. */
export const getUsuarioRol = (u) =>
    u?.rol || u?.Rol || u?.rolFederacion || u?.RolFederacion || '';

export const getUsuarioClubId = (u) =>
    u?.idClub ?? u?.IdClub ?? u?.clubId ?? u?.ClubId ?? null;

export const getUsuarioFederacionId = (u) =>
    u?.idFederacion ?? u?.IdFederacion ?? u?.federacionId ?? u?.FederacionId ?? null;

export const getUsuarioUsername = (u) =>
    String(u?.username || u?.Username || '').trim().toLowerCase();

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

/** Rol de acceso al panel del club o delegado (alta vía Auth/register). */
export const isDelegadoClubRole = (rol) =>
    ['Club', 'Delegado', 'DelegadoClub'].includes(String(rol || '').trim());

/**
 * Cuenta de acceso al panel del club (seed / login institucional),
 * no un delegado “persona”. Ej: club1fec, club1fec2.
 */
export const normalizeClubUsername = (name) =>
    String(name || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');

export const isClubPanelAccessAccount = (u, clubNameOrUsernameBase) => {
    const username = getUsuarioUsername(u);
    if (!username) return false;

    const base = normalizeClubUsername(clubNameOrUsernameBase);
    if (base && (username === base || new RegExp(`^${base}\\d+$`).test(username))) {
        return true;
    }

    // Patrón genérico de cuentas de prueba ClubNFec / ClubNFec2
    if (/^club\d+fec\d*$/i.test(username)) return true;

    return false;
};

export const mapAuthUserToDelegado = (u) => ({
    ...u,
    id: u.id ?? u.Id ?? u.idPersona ?? u.IdPersona,
    rol: getUsuarioRol(u),
    idClub: getUsuarioClubId(u),
    clubId: getUsuarioClubId(u),
    idFederacion: getUsuarioFederacionId(u),
    nombreCompleto: getUsuarioNombre(u),
    nombrePersona: getUsuarioNombre(u),
    username: getUsuarioUsername(u) || u.username || u.Username || '',
    dni: u.dni || u.Dni || u.documento || u.Documento || '',
    email: u.email || u.Email || '',
    telefono: u.telefono || u.Telefono || '',
    clubNombre: u.clubNombre || u.ClubNombre || u.nombreClub || u.NombreClub || '',
});
