/** Helpers de búsqueda de texto para listados SIGDEF. */

export const matchesSearch = (term, ...parts) => {
    const q = String(term || '').trim().toLowerCase();
    if (!q) return true;
    const haystack = parts
        .flat()
        .filter((p) => p != null && p !== '')
        .map((p) => String(p).toLowerCase())
        .join(' ');
    return haystack.includes(q);
};
