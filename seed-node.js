
import https from 'https';

// Deshabilitar verificación SSL para localhost
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const API_BASE = 'https://localhost:7112/api';

let TOKEN = '';

async function login() {
    console.log('🔑 Iniciando sesión como admin...');
    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: 'admin123' })
        });

        if (!response.ok) {
            throw new Error(`Login falló: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        TOKEN = data.token;
        console.log('✅ Login exitoso.');
        return true;
    } catch (error) {
        console.error('❌ Error en login:', error.message);
        return false;
    }
}

async function apiPost(endpoint, data) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TOKEN}`
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorText = await response.text();
            // Si es error de duplicado, lanzamos error específico para manejarlo
            if (response.status === 400 && (errorText.includes('existe') || errorText.includes('Duplicate'))) {
                throw new Error('DUPLICATE');
            }
            throw new Error(`Error ${response.status}: ${errorText}`);
        }

        const text = await response.text();
        return text ? JSON.parse(text) : {};
    } catch (error) {
        if (error.message === 'DUPLICATE') return 'DUPLICATE';
        console.error(`❌ Error POST ${endpoint}:`, error.message);
        return null;
    }
}

async function apiGet(endpoint) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TOKEN}`
            }
        });

        if (!response.ok) {
            if (response.status === 404) return null;
            throw new Error(`Error ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`❌ Error GET ${endpoint}:`, error.message);
        return null;
    }
}

async function getOrCreatePersona(personaData) {
    // 1. Intentar buscar por documento
    const existente = await apiGet(`/Persona/documento/${personaData.Documento}`);
    if (existente && existente.idPersona) {
        // console.log(`   ℹ️ Persona ya existe: ${personaData.Nombre} ${personaData.Apellido} (ID: ${existente.idPersona})`);
        return existente.idPersona;
    }

    // 2. Si no existe, crear
    const creado = await apiPost('/Persona', personaData);
    if (creado && (creado.idPersona || creado.IdPersona)) {
        console.log(`   ✅ Persona creada: ${personaData.Nombre} ${personaData.Apellido}`);
        return creado.idPersona || creado.IdPersona;
    }

    return null;
}

async function seedDatabase() {
    if (!await login()) return;

    console.log('\n🌱 Iniciando seed inteligente...');

    // ========================================
    // 0. OBTENER FEDERACIÓN
    // ========================================
    let idFederacion = 1;
    const federaciones = await apiGet('/Federacion');
    if (federaciones && federaciones.length > 0) {
        idFederacion = federaciones[0].idFederacion || federaciones[0].IdFederacion;
        console.log(`ℹ️ Usando Federación ID: ${idFederacion}`);
    } else {
        console.warn('⚠️ No se encontraron federaciones. Usando ID 1 por defecto.');
    }

    // ========================================
    // 1. CREAR CLUBES
    // ========================================
    console.log('\n📍 Gestionando clubes...');
    const clubes = [
        { Nombre: 'Club Atlético River Plate', Direccion: 'Av. Figueroa Alcorta 7597, CABA', Telefono: '011-4789-1200', Siglas: 'CARP' },
        { Nombre: 'Club Atlético Boca Juniors', Direccion: 'Brandsen 805, CABA', Telefono: '011-4362-2260', Siglas: 'CABJ' },
        { Nombre: 'Racing Club', Direccion: 'Colón 1509, Avellaneda', Telefono: '011-4201-5120', Siglas: 'RAC' },
        { Nombre: 'Club Estudiantes de La Plata', Direccion: 'Calle 1 y 57, La Plata', Telefono: '0221-421-8600', Siglas: 'EDLP' },
        { Nombre: 'Club Gimnasia y Esgrima La Plata', Direccion: 'Calle 4 entre 51 y 53, La Plata', Telefono: '0221-483-7575', Siglas: 'GELP' }
    ];

    const clubesMap = []; // Array de IDs

    // Obtener clubes existentes primero para evitar duplicados
    const clubesExistentes = await apiGet('/Club') || [];

    for (const club of clubes) {
        const existente = clubesExistentes.find(c => c.nombre === club.Nombre || c.siglas === club.Siglas);
        if (existente) {
            clubesMap.push(existente.idClub || existente.IdClub);
            // console.log(`   ℹ️ Club ya existe: ${club.Nombre}`);
        } else {
            const nuevo = await apiPost('/Club', club);
            if (nuevo && nuevo !== 'DUPLICATE') {
                clubesMap.push(nuevo.idClub || nuevo.IdClub);
                console.log(`   ✅ Club creado: ${club.Nombre}`);
            }
        }
    }

    if (clubesMap.length === 0) {
        console.error('❌ No hay clubes disponibles. Abortando.');
        return;
    }

    // ========================================
    // 2. CREAR DELEGADOS DE CLUB
    // ========================================
    console.log('\n👔 Gestionando delegados...');
    const delegados = [
        { Nombre: 'Enzo', Apellido: 'Francescoli', Documento: '10111222', Email: 'enzo@river.com', Telefono: '11-1111-1111' },
        { Nombre: 'Juan Román', Apellido: 'Riquelme', Documento: '10222333', Email: 'roman@boca.com', Telefono: '11-2222-2222' },
        { Nombre: 'Diego', Apellido: 'Milito', Documento: '10333444', Email: 'diego@racing.com', Telefono: '11-3333-3333' },
        { Nombre: 'Juan Sebastián', Apellido: 'Verón', Documento: '10444555', Email: 'bruja@edlp.com', Telefono: '11-4444-4444' },
        { Nombre: 'Pedro', Apellido: 'Troglio', Documento: '10555666', Email: 'pedro@gelp.com', Telefono: '11-5555-5555' }
    ];

    for (let i = 0; i < delegados.length; i++) {
        if (i >= clubesMap.length) break;

        const idPersona = await getOrCreatePersona({
            ...delegados[i],
            FechaNacimiento: '1970-01-01',
            Direccion: 'Club Address'
        });

        if (idPersona) {
            // Intentar crear delegado
            const delegadoData = {
                idPersona: idPersona,
                idClub: clubesMap[i],
                idRol: 2, // Delegado
                idFederacion: idFederacion
            };

            // Verificar si ya es delegado (podríamos hacer un GET, pero POST suele fallar si existe)
            const res = await apiPost('/DelegadoClub', delegadoData);
            if (res && res !== 'DUPLICATE') {
                console.log(`   ✅ Delegado asignado: ${delegados[i].Nombre} ${delegados[i].Apellido}`);
            }
        }
    }

    // ========================================
    // 3. CREAR ATLETAS MAYORES
    // ========================================
    console.log('\n👤 Gestionando atletas mayores...');
    const atletasMayores = [
        { Nombre: 'Juan', Apellido: 'Martínez', Documento: '35123456', FechaNacimiento: '1998-03-15', Email: 'juan.martinez@email.com', Telefono: '11-5555-1001', Direccion: 'Av. Corrientes 1234, CABA' },
        { Nombre: 'María', Apellido: 'González', Documento: '36234567', FechaNacimiento: '1999-07-22', Email: 'maria.gonzalez@email.com', Telefono: '11-5555-1002', Direccion: 'Av. Santa Fe 2345, CABA' },
        { Nombre: 'Carlos', Apellido: 'Rodríguez', Documento: '34345678', FechaNacimiento: '1997-11-08', Email: 'carlos.rodriguez@email.com', Telefono: '11-5555-1003', Direccion: 'Av. Cabildo 3456, CABA' },
        { Nombre: 'Ana', Apellido: 'Fernández', Documento: '37456789', FechaNacimiento: '2000-02-14', Email: 'ana.fernandez@email.com', Telefono: '11-5555-1004', Direccion: 'Av. Rivadavia 4567, CABA' },
        { Nombre: 'Diego', Apellido: 'López', Documento: '33567890', FechaNacimiento: '1996-09-30', Email: 'diego.lopez@email.com', Telefono: '11-5555-1005', Direccion: 'Av. Callao 5678, CABA' },
        { Nombre: 'Laura', Apellido: 'Pérez', Documento: '38678901', FechaNacimiento: '2001-05-18', Email: 'laura.perez@email.com', Telefono: '11-5555-1006', Direccion: 'Av. Pueyrredón 6789, CABA' }
    ];

    for (let i = 0; i < atletasMayores.length; i++) {
        const idPersona = await getOrCreatePersona(atletasMayores[i]);
        if (idPersona) {
            const atletaData = {
                IdPersona: idPersona,
                IdClub: clubesMap[i % clubesMap.length],
                Categoria: i % 4,
                BecadoEnard: i % 3 === 0,
                BecadoSdn: i % 4 === 0,
                MontoBeca: (i % 3 === 0) ? 5000 + (i * 500) : 0,
                PresentoAptoMedico: i % 2 === 0,
                EstadoPago: 0,
                PerteneceSeleccion: i % 5 === 0,
                FechaAptoMedico: null
            };
            const res = await apiPost('/Atleta', atletaData);
            if (res && res !== 'DUPLICATE') {
                console.log(`   ✅ Atleta creado: ${atletasMayores[i].Nombre}`);
            }
        }
    }

    // ========================================
    // 4. CREAR ATLETAS MENORES CON TUTORES
    // ========================================
    console.log('\n👶 Gestionando atletas menores...');
    const atletasMenores = [
        {
            atleta: { Nombre: 'Sofía', Apellido: 'Ramírez', Documento: '48123456', FechaNacimiento: '2010-04-12', Email: '', Telefono: '', Direccion: 'Calle 123, Villa Devoto' },
            tutor: { Nombre: 'Roberto', Apellido: 'Ramírez', Documento: '25111222', Telefono: '11-5555-2001', Email: 'roberto.ramirez@email.com', TipoTutor: 'Padre' }
        },
        {
            atleta: { Nombre: 'Lucas', Apellido: 'Silva', Documento: '49234567', FechaNacimiento: '2011-08-25', Email: '', Telefono: '', Direccion: 'Calle 456, Belgrano' },
            tutor: { Nombre: 'Patricia', Apellido: 'Silva', Documento: '26222333', Telefono: '11-5555-2002', Email: 'patricia.silva@email.com', TipoTutor: 'Madre' }
        },
        {
            atleta: { Nombre: 'Valentina', Apellido: 'Torres', Documento: '50345678', FechaNacimiento: '2012-01-30', Email: '', Telefono: '', Direccion: 'Calle 789, Palermo' },
            tutor: { Nombre: 'Fernando', Apellido: 'Torres', Documento: '27333444', Telefono: '11-5555-2003', Email: 'fernando.torres@email.com', TipoTutor: 'Padre' }
        },
        {
            atleta: { Nombre: 'Mateo', Apellido: 'Vargas', Documento: '51456789', FechaNacimiento: '2013-06-18', Email: '', Telefono: '', Direccion: 'Calle 101, Caballito' },
            tutor: { Nombre: 'Claudia', Apellido: 'Vargas', Documento: '28444555', Telefono: '11-5555-2004', Email: 'claudia.vargas@email.com', TipoTutor: 'Madre' }
        }
    ];

    for (let i = 0; i < atletasMenores.length; i++) {
        const { atleta, tutor } = atletasMenores[i];

        const idAtleta = await getOrCreatePersona({ ...atleta, Email: tutor.Email, Telefono: tutor.Telefono });
        if (idAtleta) {
            await apiPost('/Atleta', {
                IdPersona: idAtleta,
                IdClub: clubesMap[i % clubesMap.length],
                Categoria: 0,
                BecadoEnard: false,
                BecadoSdn: i % 2 === 0,
                MontoBeca: (i % 2 === 0) ? 2000 : 0,
                PresentoAptoMedico: true,
                EstadoPago: 0,
                PerteneceSeleccion: false,
                FechaAptoMedico: null
            });

            const idTutor = await getOrCreatePersona({
                Nombre: tutor.Nombre, Apellido: tutor.Apellido, Documento: tutor.Documento,
                FechaNacimiento: '1980-01-01', Email: tutor.Email, Telefono: tutor.Telefono, Direccion: atleta.Direccion
            });

            if (idTutor) {
                await apiPost('/Tutor', {
                    IdPersona: idTutor, TipoTutor: tutor.TipoTutor, NombrePersona: `${tutor.Nombre} ${tutor.Apellido}`,
                    Documento: tutor.Documento, Telefono: tutor.Telefono, Email: tutor.Email
                });
                await apiPost('/AtletaTutor', { IdAtleta: idAtleta, IdTutor: idTutor, Parentesco: tutor.TipoTutor === 'Padre' ? 0 : 1 });
                console.log(`   ✅ Relación Atleta-Tutor creada: ${atleta.Nombre} - ${tutor.Nombre}`);
            }
        }
    }

    // ========================================
    // 5. CREAR ENTRENADORES DE CLUB
    // ========================================
    console.log('\n🏃 Gestionando entrenadores...');
    const entrenadoresClub = [
        { Nombre: 'Marcelo', Apellido: 'Gallardo', Documento: '20111222', FechaNacimiento: '1976-01-18', Email: 'mgallardo@email.com', Telefono: '11-5555-3001', Direccion: 'CABA', Licencia: 'CONMEBOL-PRO-001' },
        { Nombre: 'Ricardo', Apellido: 'Gareca', Documento: '19222333', FechaNacimiento: '1958-02-10', Email: 'rgareca@email.com', Telefono: '11-5555-3002', Direccion: 'CABA', Licencia: 'CONMEBOL-PRO-002' },
        { Nombre: 'Fernando', Apellido: 'Gago', Documento: '28333444', FechaNacimiento: '1986-04-10', Email: 'fgago@email.com', Telefono: '11-5555-3003', Direccion: 'CABA', Licencia: 'CONMEBOL-PRO-003' },
        { Nombre: 'Gustavo', Apellido: 'Costas', Documento: '22444555', FechaNacimiento: '1963-02-28', Email: 'gcostas@email.com', Telefono: '11-5555-3004', Direccion: 'Avellaneda', Licencia: 'CONMEBOL-PRO-004' }
    ];

    for (let i = 0; i < entrenadoresClub.length; i++) {
        const idPersona = await getOrCreatePersona(entrenadoresClub[i]);
        if (idPersona) {
            const res = await apiPost('/Entrenador', {
                IdPersona: idPersona,
                IdClub: clubesMap[i % clubesMap.length],
                Licencia: entrenadoresClub[i].Licencia,
                PerteneceSeleccion: false,
                CategoriaSeleccion: '',
                BecadoEnard: false,
                BecadoSdn: false,
                MontoBeca: 0,
                PresentoAptoMedico: true
            });
            if (res && res !== 'DUPLICATE') {
                console.log(`   ✅ Entrenador creado: ${entrenadoresClub[i].Nombre}`);
            }
        }
    }

    console.log('\n✨ ¡Proceso finalizado!');
}

seedDatabase();
