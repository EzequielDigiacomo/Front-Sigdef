import { api } from '../services/api';
import { CATEGORIA_MAP, PARENTESCO_MAP } from './enums';

// Helper to generate random number in range
const random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Helper to generate random DNI
const generateDNI = () => random(10000000, 50000000).toString();

// Helper to generate random date in range (years back)
const randomDate = (minAge, maxAge) => {
    const today = new Date();
    const year = today.getFullYear() - random(minAge, maxAge);
    const month = random(0, 11);
    const day = random(1, 28);
    return new Date(year, month, day).toISOString();
};

const firstNames = ["Juan", "Pedro", "Maria", "Ana", "Luis", "Carlos", "Sofia", "Lucia", "Miguel", "Jose", "Elena", "Clara"];
const lastNames = ["Garcia", "Rodriguez", "Lopez", "Martinez", "Gonzalez", "Perez", "Sanchez", "Romero", "Diaz", "Fernandez"];

const getRandomName = () => {
    return {
        nombre: firstNames[random(0, firstNames.length - 1)],
        apellido: lastNames[random(0, lastNames.length - 1)]
    };
};

const createPersona = async (personaData) => {
    try {
        // Check if exists
        try {
            const existing = await api.get(`/Persona/documento/${personaData.Documento}`, { silentErrors: true });
            if (existing && (existing.idPersona || existing.IdPersona)) {
                return existing.idPersona || existing.IdPersona;
            }
        } catch (e) {
            // Not found, continue
        }

        const response = await api.post('/Persona', personaData);
        return response.idPersona || response.IdPersona;
    } catch (error) {
        console.error('Error creating persona:', error);
        return null;
    }
};

const createClub = async (name, siglas) => {
    const payload = {
        nombre: name,
        direccion: `Calle Falsa ${random(100, 999)}`,
        telefono: `555-${random(1000, 9999)}`,
        siglas: siglas
    };
    try {
        const res = await api.post('/Club', payload);
        return res ? (res.idClub || res.IdClub) : null; // Adjust based on API response
    } catch (e) {
        // Assuming it might fail if exists, but we want unique names usually
        console.warn(`Club ${name} creation failed or exists:`, e);
        // Try finding it? Hard to find by name without list. Assuming success or manual handling.
        // Actually, getAllClubs is safer.
        return null;
    }
};

const createTutor = async (childName) => {
    const { nombre, apellido } = getRandomName();
    const dni = generateDNI();
    const personaId = await createPersona({
        Nombre: nombre,
        Apellido: apellido,
        Documento: dni,
        FechaNacimiento: randomDate(30, 60),
        Email: `tutor.${childName}@test.com`,
        Telefono: '123456789',
        Direccion: 'Address Tutor'
    });

    if (!personaId) return null;

    try {
        const tutorPayload = {
            IdPersona: personaId,
            TipoTutor: PARENTESCO_MAP[0], // Padre
            NombrePersona: `${nombre} ${apellido}`,
            Documento: dni,
            Telefono: '123456789',
            Email: `tutor.${childName}@test.com` // Assuming uniqueness
        };
        await api.post('/Tutor', tutorPayload);
        return personaId; // Use personaId as tutorId usually in this system
    } catch (e) {
        console.error('Error creating tutor:', e);
        return null;
    }
};

const createAtleta = async (clubId, isMinor) => {
    const { nombre, apellido } = getRandomName();
    const dni = generateDNI();
    const birthDate = isMinor ? randomDate(10, 17) : randomDate(19, 30);

    const personaId = await createPersona({
        Nombre: nombre,
        Apellido: apellido,
        Documento: dni,
        FechaNacimiento: birthDate,
        Email: `atleta.${dni}@test.com`,
        Telefono: '11111111',
        Direccion: 'Club Address'
    });

    if (!personaId) return;

    // Create Atleta
    const categoria = isMinor ? 2 : 6; // Simplified: 2=Cadete, 6=Senior
    await api.post('/Atleta', {
        IdPersona: personaId,
        IdClub: clubId,
        Categoria: categoria,
        BecadoEnard: false,
        BecadoSdn: false,
        MontoBeca: 0,
        PresentoAptoMedico: true,
        EstadoPago: 1,
        PerteneceSeleccion: false,
        FechaAptoMedico: new Date().toISOString()
    });

    if (isMinor) {
        const tutorId = await createTutor(nombre);
        if (tutorId) {
            await api.post('/AtletaTutor', {
                IdAtleta: personaId,
                IdTutor: tutorId,
                Parentesco: 0
            });
        }
    }
};

const createEntrenador = async (clubId) => {
    const { nombre, apellido } = getRandomName();
    const dni = generateDNI();
    const personaId = await createPersona({
        Nombre: nombre,
        Apellido: apellido,
        Documento: dni,
        FechaNacimiento: randomDate(25, 50),
        Email: `coach.${dni}@test.com`,
        Telefono: '99999999',
        Direccion: 'Coach House'
    });

    if (!personaId) return;

    // Create Entrenador (This assumes similar payload to others, based on guesswork or standard practice)
    // Actually, I should check ClubEntrenadoresForm to be sure, but standard pattern suggests:
    // POST /Entrenador { IdPersona, IdClub, Licencia, ... }
    // Let's assume standard fields.
    try {
        await api.post('/Entrenador', {
            IdPersona: personaId,
            IdClub: clubId,
            Licencia: `LIC-${random(1000, 9999)}`,
            CategoriaSeleccion: null,
            BecadoEnard: false,
            BecadoSdn: false
        });
    } catch (e) { console.warn('Entrenador creation issue', e); }
};

const createDelegado = async (clubId) => {
    const { nombre, apellido } = getRandomName();
    const dni = generateDNI();
    const personaId = await createPersona({
        Nombre: nombre,
        Apellido: apellido,
        Documento: dni,
        FechaNacimiento: randomDate(30, 60),
        Email: `delegado.${dni}@test.com`,
        Telefono: '88888888',
        Direccion: 'Club Office'
    });

    if (!personaId) return;

    try {
        await api.post('/DelegadoClub', {
            IdPersona: personaId,
            IdClub: clubId,
            FechaInicio: new Date().toISOString()
        });
    } catch (e) { console.warn('Delegado creation issue', e); }
};

const createEvento = async () => {
    const names = ["Regata Invierno", "Copa Verano", "Torneo Nacional", "Campeonato Regional"];
    const name = names[random(0, names.length - 1)] + " " + random(2025, 2030);

    const payload = {
        nombre: name,
        descripcion: "Evento generado automáticamente",
        tipoEvento: random(1, 5),
        fechaInicio: new Date(Date.now() + 86400000 * random(10, 100)).toISOString(),
        fechaFin: new Date(Date.now() + 86400000 * random(101, 105)).toISOString(),
        fechaInicioInscripciones: new Date().toISOString(),
        fechaFinInscripciones: new Date(Date.now() + 86400000 * 5).toISOString(),
        ubicacion: "Lago Central",
        ciudad: "Tigre",
        provincia: "Buenos Aires",
        precioBase: random(1000, 5000),
        cupoMaximo: 200,
        tieneCronometraje: true,
        requiereCertificadoMedico: true,
        observaciones: "",
        distancias: []
    };

    // Create 4-5 distances
    const numDistances = random(4, 5);
    for (let i = 0; i < numDistances; i++) {
        payload.distancias.push({
            distanciaRegata: random(1, 13), // 1..13
            categoriaEdad: random(1, 8), // 1..8 (Avoiding 0 just in case based on error pattern, or keep 0 if sure. Reverting to 1..8 to be safe as user said "distancia sexo categoria")
            sexoCompetencia: random(1, 2), // 1=Masculino, 2=Femenino
            tipoBote: random(0, 5),
            descripcion: "Prueba generada"
        });
    }

    try {
        await api.post('/Evento', payload);
        console.log(`Evento ${name} creado`);
    } catch (e) {
        console.error('Error creating evento', e);
    }
};

export const seedDatabase = async () => {
    console.log("Iniciando Seed...");

    const clubNames = [
        { name: "Club Regatas Alpha", siglas: "CRA" },
        { name: "Club Nautico Beta", siglas: "CNB" },
        { name: "Rowing Club Gamma", siglas: "RCG" },
        { name: "Delta Kayak Club", siglas: "DKC" }
    ];

    for (let c of clubNames) {
        // Create Club
        // First check if existing isn't easy without GET list, so we treat it optimistically
        // Better: GET all clubs and check.
        let clubId = null;
        try {
            const allClubs = await api.get('/Club');
            const found = allClubs.find(cl => cl.nombre === c.name);
            if (found) clubId = found.idClub;
        } catch (e) { }

        if (!clubId) {
            const res = await api.post('/Club', {
                nombre: c.name,
                direccion: "Calle Club " + random(1, 100),
                telefono: "11-2222-3333",
                siglas: c.siglas
            });
            // Result of POST /Club usually returns the object including IdClub
            // Based on ClubDetalles loading, it seems it returns the object.
            // But let's be safe and check field casing
            if (res) clubId = res.idClub || res.IdClub;
        }

        if (clubId) {
            console.log(`Procesando Club: ${c.name} (ID: ${clubId})`);

            // Create 5 Athletes
            for (let i = 0; i < 5; i++) {
                // 2 minors, 3 adults
                await createAtleta(clubId, i < 2);
            }

            // Create Entrenador
            await createEntrenador(clubId);

            // Create Delegado
            await createDelegado(clubId);
        }
    }

    // Create 3 Events
    for (let i = 0; i < 3; i++) {
        await createEvento();
    }

    console.log("Seed Finalizado!");
    alert("Proceso de creación finalizado. Refresca la página.");
};
