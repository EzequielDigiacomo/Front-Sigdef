

export const CATEGORIA_MAP = {
    0: 'Preinfantil',
    1: 'Infantil',
    2: 'Cadete',
    3: 'Junior',
    4: 'Sub21',
    5: 'Sub23',
    6: 'Senior',
    7: 'Master'
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

export const getCategoriaLabel = (value) => CATEGORIA_MAP[value] ?? 'Desconocido';
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
