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
                const id = existing.idPersona || existing.IdPersona;
                await api.put(`/Persona/${id}`, personaData);
                return id;
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
        Nombre: name,
        Direccion: `Calle Falsa ${random(100, 999)}`,
        Telefono: `555-${random(1000, 9999)}`,
        Siglas: siglas
    };
    try {
        const res = await api.post('/Club', payload);
        return res ? (res.idClub || res.IdClub) : null;
    } catch (e) {
        console.warn(`Club ${name} creation failed or exists:`, e);
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
        Sexo: random(1, 2),
        FechaNacimiento: randomDate(30, 60),
        Email: `tutor.${childName}@test.com`,
        Telefono: '123456789',
        Direccion: 'Address Tutor'
    });

    if (!personaId) return null;

    try {
        const tutorPayload = {
            IdPersona: personaId,
            TipoTutor: PARENTESCO_MAP[0] || 'Padre/Madre',
            NombrePersona: `${nombre} ${apellido}`,
            Documento: dni,
            Telefono: '123456789',
            Email: `tutor.${childName}@test.com`
        };
        await api.post('/Tutor', tutorPayload);
        return personaId;
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
        Sexo: random(1, 2),
        FechaNacimiento: birthDate,
        Email: `atleta.${dni}@test.com`,
        Telefono: '11111111',
        Direccion: 'Club Address'
    });

    if (!personaId) return;

    const categoria = isMinor ? 2 : 6;
    await api.post('/Atleta', {
        IdPersona: personaId,
        IdClub: clubId ? parseInt(clubId) : null,
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
                IdParentesco: 0
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
        Sexo: random(1, 2),
        FechaNacimiento: randomDate(25, 50),
        Email: `coach.${dni}@test.com`,
        Telefono: '99999999',
        Direccion: 'Coach House'
    });

    if (!personaId) return;

    try {
        await api.post('/Entrenador', {
            IdPersona: personaId,
            IdClub: clubId ? parseInt(clubId) : null,
            Licencia: `SEED-${random(1000, 9999)}`,
            PerteneceSeleccion: false,
            CategoriaSeleccion: "0",
            BecadoEnard: false,
            BecadoSdn: false,
            MontoBeca: 0,
            PresentoAptoMedico: true
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
        Sexo: random(1, 2),
        FechaNacimiento: randomDate(30, 60),
        Email: `delegado.${dni}@test.com`,
        Telefono: '88888888',
        Direccion: 'Club Office'
    });

    if (!personaId) return;

    try {
        await api.post('/DelegadoClub', {
            IdPersona: personaId,
            IdClub: clubId ? parseInt(clubId) : null,
            IdFederacion: 1,
            IdRol: 3
        });
    } catch (e) { console.warn('Delegado creation issue', e); }
};

const createEvento = async () => {
    const names = ["Regata Invierno", "Copa Verano", "Torneo Nacional", "Campeonato Regional"];
    const name = names[random(0, names.length - 1)] + " " + random(2025, 2030);

    const payload = {
        Nombre: name,
        Descripcion: "Evento generado automáticamente",
        TipoEvento: random(1, 5),
        FechaInicio: new Date(Date.now() + 86400000 * random(10, 100)).toISOString(),
        FechaFin: new Date(Date.now() + 86400000 * random(101, 105)).toISOString(),
        FechaInicioInscripciones: new Date().toISOString(),
        FechaFinInscripciones: new Date(Date.now() + 86400000 * 5).toISOString(),
        Ubicacion: "Lago Central",
        Ciudad: "Tigre",
        Provincia: "Buenos Aires",
        PrecioBase: random(1000, 5000),
        CupoMaximo: 200,
        TieneCronometraje: true,
        RequiereCertificadoMedico: true,
        Observaciones: "",
        Distancias: []
    };

    const numDistances = random(4, 5);
    for (let i = 0; i < numDistances; i++) {
        payload.Distancias.push({
            DistanciaRegata: random(1, 13),
            CategoriaEdad: random(1, 8),
            SexoCompetencia: random(1, 2),
            TipoBote: random(0, 5),
            Descripcion: "Prueba generada"
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
        let clubId = null;
        try {
            const allClubs = await api.get('/Club', { silentErrors: true });
            const found = allClubs.find(cl => (cl.nombre === c.name || cl.Nombre === c.name));
            if (found) clubId = found.idClub || found.IdClub;
        } catch (e) { }

        if (!clubId) {
            clubId = await createClub(c.name, c.siglas);
        }

        if (clubId) {
            console.log(`Procesando Club: ${c.name} (ID: ${clubId})`);
            for (let i = 0; i < 5; i++) {
                await createAtleta(clubId, i < 2);
            }
            await createEntrenador(clubId);
            await createDelegado(clubId);
        }
    }

    for (let i = 0; i < 3; i++) {
        await createEvento();
    }

    console.log("Seed Finalizado!");
};
