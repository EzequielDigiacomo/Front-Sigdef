/** Helpers de búsqueda de texto para listados SIGDEF. */

/**
 * Coincide si TODOS los tokens del término aparecen en alguna parte
 * de los campos (sin importar orden ni mayúsculas/minúsculas).
 * Ej: "acosta facu" matchea "Facundo Acosta".
 */
export const matchesSearch = (term, ...parts) => {
    const q = String(term || '').trim().toLowerCase();
    if (!q) return true;
    const haystack = parts
        .flat()
        .filter((p) => p != null && p !== '')
        .map((p) => String(p).toLowerCase())
        .join(' ');
    const tokens = q.split(/\s+/).filter(Boolean);
    return tokens.every((token) => haystack.includes(token));
};
