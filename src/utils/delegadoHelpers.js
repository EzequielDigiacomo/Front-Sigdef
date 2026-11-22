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
    dni: resolveDocumentoFromUser(u),
    email: u.email || u.Email || '',
    telefono: u.telefono || u.Telefono || '',
    clubNombre: u.clubNombre || u.ClubNombre || u.nombreClub || u.NombreClub || '',
    participanteId: u.participanteId ?? u.ParticipanteId ?? null,
});

/** DNI del usuario Auth; si no está en Dni, usa username numérico (alta con DNI como user). */
export const resolveDocumentoFromUser = (u) => {
    const direct = String(u?.dni || u?.Dni || u?.documento || u?.Documento || '').trim();
    if (direct) return direct.replace(/[\s.]/g, '');

    const username = String(u?.username || u?.Username || '').trim();
    const digits = username.replace(/\D/g, '');
    if (digits.length >= 7 && digits === username.replace(/[\s.-]/g, '')) {
        return digits;
    }
    return '';
};

export const pickPersonaId = (p) =>
    p?.participanteId ?? p?.ParticipanteId ?? p?.idPersona ?? p?.IdPersona ?? p?.id ?? p?.Id ?? null;

export const mapPersonaToDelegadoForm = (persona) => ({
    nombre: persona?.nombre || persona?.Nombre || '',
    apellido: persona?.apellido || persona?.Apellido || '',
    documento: String(
        persona?.documento || persona?.Documento || persona?.dni || persona?.Dni || ''
    ).replace(/[\s.]/g, ''),
    sexo:
        persona?.sexoId
        ?? persona?.SexoId
        ?? persona?.sexo?.id
        ?? persona?.Sexo?.Id
        ?? persona?.sexo
        ?? persona?.Sexo
        ?? 1,
    fechaNacimiento: String(persona?.fechaNacimiento || persona?.FechaNacimiento || '').split('T')[0],
    email: persona?.email || persona?.Email || '',
    telefono: persona?.telefono || persona?.Telefono || '',
    direccion: persona?.direccion || persona?.Direccion || '',
});
