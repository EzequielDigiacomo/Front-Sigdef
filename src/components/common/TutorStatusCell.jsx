import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

/** Edad en años cumplidos. Ignora fechas inválidas / default .NET (0001-01-01). */
export const calcEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return null;
    const nacimiento = new Date(fechaNacimiento);
    if (Number.isNaN(nacimiento.getTime())) return null;
    // DateTime default de C# u otras fechas basura
    if (nacimiento.getFullYear() < 1900) return null;

    const hoy = new Date();
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
    if (edad < 0 || edad > 120) return null;
    return edad;
};

/**
 * Categorías típicamente de menores (requieren tutor).
 * 1 Preinfantil … 5 Junior (incluye 17-18).
 */
const MINOR_CATEGORY_IDS = new Set([1, 2, 3, 4, 5]);
const MINOR_CATEGORY_NAMES = new Set([
    'preinfantil',
    'infantil',
    'menores',
    'cadete',
    'junior',
]);

export const isMinorCategory = (atleta = {}) => {
    const id = atleta.categoriaId ?? atleta.CategoriaId ?? atleta.categoria ?? atleta.Categoria;
    if (id != null && id !== '' && MINOR_CATEGORY_IDS.has(Number(id))) return true;

    const nombre = String(
        atleta.categoriaNombre ?? atleta.CategoriaNombre ?? ''
    )
        .toLowerCase()
        .trim();
    if (nombre && [...MINOR_CATEGORY_NAMES].some((n) => nombre.includes(n))) return true;

    // Enum label puro (ej. "Infantil")
    if (typeof id === 'string' && MINOR_CATEGORY_NAMES.has(id.toLowerCase())) return true;

    return false;
};

export const requiresTutor = ({ edad, fechaNacimiento, ...atleta } = {}) => {
    const age = edad != null && edad !== '' ? Number(edad) : calcEdad(fechaNacimiento);
    if (Number.isFinite(age)) return age < 18;
    // Sin fecha confiable: usar categoría como heurística
    return isMinorCategory(atleta);
};

/**
 * Estado de tutor para grilla:
 * - 'ok'      → requiere tutor y lo tiene
 * - 'missing' → requiere tutor y no lo tiene
 * - 'na'      → no aplica (mayor / sin indicios de menor)
 */
export const getTutorStatus = ({
    edad,
    tieneTutor,
    fechaNacimiento,
    categoria,
    categoriaId,
    categoriaNombre,
} = {}) => {
    const needsTutor = requiresTutor({
        edad,
        fechaNacimiento,
        categoria,
        categoriaId,
        categoriaNombre,
    });
    if (!needsTutor) return 'na';
    return tieneTutor ? 'ok' : 'missing';
};

/** Celda compacta: check verde / cruz roja / guión */
export const TutorStatusCell = ({
    edad,
    tieneTutor,
    fechaNacimiento,
    categoria,
    categoriaId,
    categoriaNombre,
    title,
}) => {
    const status = getTutorStatus({
        edad,
        tieneTutor,
        fechaNacimiento,
        categoria,
        categoriaId,
        categoriaNombre,
    });

    if (status === 'ok') {
        return (
            <span
                title={title || 'Tutor asignado'}
                style={{ display: 'inline-flex', color: 'var(--success, #22c55e)' }}
            >
                <CheckCircle2 size={18} />
            </span>
        );
    }

    if (status === 'missing') {
        return (
            <span
                title={title || 'Menor sin tutor asignado'}
                style={{ display: 'inline-flex', color: 'var(--danger, #ef4444)' }}
            >
                <XCircle size={18} />
            </span>
        );
    }

    return (
        <span title="No aplica (mayor de edad)" style={{ color: 'var(--text-secondary)' }}>
            —
        </span>
    );
};

export default TutorStatusCell;
