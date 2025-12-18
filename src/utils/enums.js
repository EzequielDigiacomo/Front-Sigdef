
export const CATEGORIA_MAP = {
    1: 'Preinfantil',
    2: 'Infantil',
    3: 'Menores',
    4: 'Cadete',
    5: 'Junior',
    6: 'Sub21',
    7: 'Sub23',
    8: 'Senior',
    9: 'Master A'
};

// Start of new user-requested Enums

export const TIPO_BOTE_MAP = {
    0: 'K1',
    1: 'K2',
    2: 'K4',
    3: 'C1',
    4: 'C2',
    5: 'C4'
};

export const CATEGORIA_EDAD_MAP = {
    1: 'Preinfantil (6-9 años)',
    2: 'Infantil (10-12 años)',
    3: 'Cadete (13-14 años)',
    4: 'Junior (15-17 años)',
    5: 'Sub21 (18-20 años)',
    6: 'Sub23 (18-22 años)',
    7: 'Senior (18-35 años)',
    8: 'Master (35+ años)'
};

export const DISTANCIA_REGATA_MAP = {
    1: '200 Metros',
    2: '350 Metros',
    3: '400 Metros',
    4: '500 Metros',
    5: '1000 Metros',
    6: '2 Kilómetros',
    7: '3 Kilómetros',
    8: '5 Kilómetros',
    9: '10 Kilómetros',
    10: '15 Kilómetros',
    11: '22 Kilómetros',
    12: '25 Kilómetros',
    13: '32 Kilómetros'
};

export const DISTANCIA_REGATA_SHORT_MAP = {
    1: '200m',
    2: '350m',
    3: '400m',
    4: '500m',
    5: '1000m',
    6: '2K',
    7: '3K',
    8: '5K',
    9: '10K',
    10: '15K',
    11: '22K',
    12: '25K',
    13: '32K'
};

export const DISTANCIA_REGATA_METROS = {
    1: 200,
    2: 350,
    3: 400,
    4: 500,
    5: 1000,
    6: 2000,
    7: 3000,
    8: 5000,
    9: 10000,
    10: 15000,
    11: 22000,
    12: 25000,
    13: 32000
};

export const ESTADO_PAGO_MAP = {
    0: 'Pendiente',
    1: 'Pagado',
    2: 'Vencido',
    3: 'Parcial'
};

export const ESTADO_PAGO_TRANSACCION_MAP = {
    0: 'Pendiente',
    1: 'Aprobado',
    2: 'Rechazado',
    3: 'Cancelado',
    4: 'Fallido'
};

export const PARENTESCO_MAP = {
    0: 'Padre',
    1: 'Madre',
    2: 'Tutor Legal',
    3: 'Hermano',
    4: 'Abuelo',
    5: 'Abuela',
    6: 'Otro'
};

export const ROL_TIPO_MAP = {
    0: 'Administrador',
    1: 'Presidente Federación',
    2: 'Delegado Club',
    3: 'Entrenador',
    4: 'Atleta',
    5: 'Secretario'
};

export const SEXO_MAP = {
    1: 'Masculino',
    2: 'Femenino',
    3: 'Otro',
    4: 'Prefiero no decir'
};

export const getCategoriaLabel = (value) => {
    // Si el valor ya está en el mapa, devolverlo
    if (CATEGORIA_MAP[value]) {
        return CATEGORIA_MAP[value];
    }

    // Si el valor es un texto (error de datos antiguos), buscar la clave correspondiente
    if (typeof value === 'string') {
        const entry = Object.entries(CATEGORIA_MAP).find(([key, label]) => label === value);
        if (entry) {
            return entry[1]; // Devolver el label
        }
    }

    return 'Desconocido';
};
export const getCategoriaEdadLabel = (value) => CATEGORIA_EDAD_MAP[value] ?? 'Desconocido';
export const getDistanciaLabel = (value) => DISTANCIA_REGATA_MAP[value] ?? 'Desconocido';
export const getDistanciaShortLabel = (value) => DISTANCIA_REGATA_SHORT_MAP[value] ?? 'Desconocido';
export const getDistanciaMetros = (value) => DISTANCIA_REGATA_METROS[value] ?? 0;
export const getSexoLabel = (value) => SEXO_MAP[value] ?? 'Desconocido';

export const getEstadoPagoLabel = (value) => ESTADO_PAGO_MAP[value] ?? 'Desconocido';
export const getParentescoLabel = (value) => PARENTESCO_MAP[value] ?? 'Desconocido';
export const getRolTipoLabel = (value) => ROL_TIPO_MAP[value] ?? 'Desconocido';

export const getEstadoPagoColor = (value) => {
    switch (value) {
        case 1: return 'success';
        case 2: return 'danger';
        case 3: return 'warning';
        case 0: return 'secondary';
        default: return 'secondary';
    }
};

export const TIPO_DOCUMENTO_MAP = {
    0: 'DNI (Frente)',
    1: 'DNI (Dorso)',
    2: 'Pasaporte',
    3: 'Apto Médico',
    4: 'Foto Perfil',
    5: 'Autorización Menor',
    99: 'Otro'
};

export const getTipoDocumentoLabel = (value) => TIPO_DOCUMENTO_MAP[value] ?? 'Documento';
export const getTipoBoteLabel = (value) => TIPO_BOTE_MAP[value] ?? '-';
