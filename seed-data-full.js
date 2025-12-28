
import https from 'https';

// Deshabilitar verificación SSL para localhost
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const API_BASE = 'https://localhost:7112/api';
let TOKEN = '';

// ==========================================
// UTILS
// ==========================================
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

const NOMBRES = ['Juan', 'Pedro', 'Lucas', 'Mateo', 'Santiago', 'Benjamín', 'Sebastián', 'Alejandro', 'Diego', 'Nicolás', 'Martín', 'Agustín', 'Federico', 'Matías', 'Gabriel', 'Tomás', 'Julián', 'Joaquín', 'Facundo', 'Ignacio', 'Ana', 'María', 'Sofía', 'Lucía', 'Valentina', 'Isabella', 'Martina', 'Camila', 'Julieta', 'Victoria', 'Florencia', 'Delfina', 'Carolina', 'Rocío', 'Paula', 'Micaela', 'Agustina', 'Sol', 'Abril', 'Catalina'];
const APELLIDOS = ['González', 'Rodríguez', 'López', 'Martínez', 'García', 'Pérez', 'Sánchez', 'Romero', 'Díaz', 'Álvarez', 'Fernández', 'Torres', 'Ruiz', 'Ramírez', 'Flores', 'Acosta', 'Benítez', 'Medina', 'Herrera', 'Suárez', 'Aguirre', 'Pereyra', 'Gutiérrez', 'Giménez', 'Molina', 'Silva', 'Castro', 'Rojas', 'Ortiz', 'Núñez'];

// Generador de Personas Aleatorias
function generarPersona(tipo = 'MAYOR') {
    const nombre = getRandomItem(NOMBRES);
    const apellido = getRandomItem(APELLIDOS);
    const dni = getRandomInt(20000000, 59999999).toString();
    const isMayor = tipo === 'MAYOR';

    // Mayor: 18-35 años, Menor: 8-17 años
    const year = isMayor ? getRandomInt(1990, 2005) : getRandomInt(2008, 2015);
    const month = getRandomInt(1, 12).toString().padStart(2, '0');
    const day = getRandomInt(1, 28).toString().padStart(2, '0');

    return {
        Nombre: nombre,
        Apellido: apellido,
        Documento: dni,
        Sexo: getRandomInt(1, 2),
        FechaNacimiento: `${year}-${month}-${day}`,
        Email: `${nombre.toLowerCase()}.${apellido.toLowerCase()}.${dni}@test.com`,
        Telefono: `11-${getRandomInt(1000, 9999)}-${getRandomInt(1000, 9999)}`,
        Direccion: `Calle Falsa ${getRandomInt(1, 5000)}`
    };
}

// ==========================================
// API CLIENT
// ==========================================

async function login() {
    console.log('🔑 Iniciando sesión como admin...');
    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: 'admin123' })
        });

        if (!response.ok) throw new Error(`Login falló: ${response.status}`);
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
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}` },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorText = await response.text();
            if (response.status === 400 && (errorText.includes('existe') || errorText.includes('Duplicate'))) return 'DUPLICATE';
            throw new Error(`${response.status}: ${errorText}`);
        }
        const text = await response.text();
        return text ? JSON.parse(text) : {};
    } catch (error) {
        if (error.message.includes('DUPLICATE')) return 'DUPLICATE';
        console.error(`❌ Error POST ${endpoint}:`, error.message);
        return null;
    }
}

async function apiGet(endpoint) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}` }
        });
        if (!response.ok) return null;
        return await response.json();
    } catch (e) { return null; }
}

async function getOrCreatePersona(personaData) {
    // Check by DNI
    const existente = await apiGet(`/Persona/documento/${personaData.Documento}`);
    if (existente && (existente.idPersona || existente.IdPersona)) return existente.idPersona || existente.IdPersona;

    // Create
    const creado = await apiPost('/Persona', personaData);
    if (creado && (creado.idPersona || creado.IdPersona)) {
        process.stdout.write('+'); // Visual feedback
        return creado.idPersona || creado.IdPersona;
    }
    return null;
}

// ==========================================
// MAIN SEED
// ==========================================

async function seedFull() {
    if (!await login()) return;

    // 1. Get Federation
    let idFederacion = 1;
    const feds = await apiGet('/Federacion');
    if (feds?.length) idFederacion = feds[0].idFederacion;

    // 2. Clubs
    const CLUBES_CONFIG = [
        { Nombre: 'Club Regatas La Marina', Siglas: 'CRLM' },
        { Nombre: 'Club Náutico Hacoaj', Siglas: 'CNH' },
        { Nombre: 'Club San Fernando', Siglas: 'CSF' },
        { Nombre: 'Tigre Boat Club', Siglas: 'TBC' },
        { Nombre: 'Buenos Aires Rowing Club', Siglas: 'BARC' },
        { Nombre: 'Club de Remeros Escandinavos', Siglas: 'CRE' }
    ];

    console.log('\n📍 Procesando Clubes...');
    let clubIds = [];

    // Add existing clubs from DB to the pool
    const existingClubs = await apiGet('/Club') || [];
    clubIds = existingClubs.map(c => c.idClub);

    for (const c of CLUBES_CONFIG) {
        let existing = existingClubs.find(ex => ex.nombre === c.Nombre);
        if (existing) {
            // clubIds.push(existing.idClub); // Already pushed from map
        } else {
            const nuevo = await apiPost('/Club', { ...c, Direccion: 'Tigre, BsAs', Telefono: '11-4444-5555' });
            if (nuevo && nuevo.idClub) {
                clubIds.push(nuevo.idClub);
                console.log(`   ✅ Nuevo Club: ${c.Nombre}`);
            }
        }
    }

    if (clubIds.length === 0) { console.error('No hay clubes!'); return; }
    console.log(`ℹ️ Trabajando con ${clubIds.length} clubes.`);


    // 3. Populate each Club
    for (const idClub of clubIds) {
        console.log(`\n🏢 Poblando Club ID ${idClub}...`);

        // A. Delegado (1 per club if not exists)
        // Check manually or just try to create. We'll generate one delegate per club
        const delPersona = generarPersona('MAYOR');
        const idDelPer = await getOrCreatePersona(delPersona);
        if (idDelPer) {
            await apiPost('/DelegadoClub', { idPersona: idDelPer, idClub, idRol: 2, idFederacion });
        }

        // B. Entrenadores (2 per club)
        for (let i = 0; i < 2; i++) {
            const entPersona = generarPersona('MAYOR');
            const idEntPer = await getOrCreatePersona(entPersona);
            if (idEntPer) {
                await apiPost('/Entrenador', {
                    IdPersona: idEntPer,
                    IdClub: idClub,
                    Licencia: `LIC-${getRandomInt(1000, 9999)}`,
                    PerteneceSeleccion: false,
                    CategoriaSeleccion: '',
                    PresentoAptoMedico: true
                });
            }
        }

        // C. Atletas Mayores (8 per club)
        process.stdout.write('   Atletas Mayores: ');
        for (let i = 0; i < 8; i++) {
            const atl = generarPersona('MAYOR');
            const idPer = await getOrCreatePersona(atl);
            if (idPer) {
                await apiPost('/Atleta', {
                    IdPersona: idPer,
                    IdClub: idClub,
                    Categoria: getRandomInt(4, 6), // Junior, Senior, etc
                    BecadoEnard: Math.random() < 0.2, // 20% chance
                    BecadoSdn: Math.random() < 0.2,
                    MontoBeca: 0,
                    PresentoAptoMedico: true,
                    EstadoPago: 1 // Pagado
                });
            }
        }
        process.stdout.write('\n');

        // D. Atletas Menores + Tutores (5 per club)
        process.stdout.write('   Atletas Menores + Tutores: ');
        for (let i = 0; i < 5; i++) {
            const menor = generarPersona('MENOR');
            const tutor = generarPersona('MAYOR'); // Tutor is an adult

            // Link contact info
            menor.Email = tutor.Email;
            menor.Telefono = tutor.Telefono;

            const idMenor = await getOrCreatePersona(menor);
            const idTutor = await getOrCreatePersona(tutor);

            if (idMenor && idTutor) {
                await apiPost('/Atleta', {
                    IdPersona: idMenor,
                    IdClub: idClub,
                    Categoria: getRandomInt(0, 3), // Infantil, Menor, Cadete
                    BecadoEnard: false,
                    PresentoAptoMedico: true,
                    EstadoPago: 1
                });

                await apiPost('/Tutor', {
                    IdPersona: idTutor,
                    TipoTutor: 'Padre',
                    NombrePersona: `${tutor.Nombre} ${tutor.Apellido}`,
                    Documento: tutor.Documento,
                    Telefono: tutor.Telefono,
                    Email: tutor.Email
                });

                await apiPost('/AtletaTutor', {
                    IdAtleta: idMenor,
                    IdTutor: idTutor,
                    Parentesco: 0 // Padre/Madre
                });
            }
        }
        process.stdout.write('\n');
    }

    console.log('\n✨ Carga masiva completada exitosamente.');
}

seedFull();
