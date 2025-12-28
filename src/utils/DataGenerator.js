import { api } from '../services/api';

export class DataGenerator {
    static async createRandomClub() {
        const names = [
            "Club Regatas", "Rowing Club", "Asociación Nautica",
            "Club Kayak", "Canoe Club", "Club de Remo"
        ];
        const modifiers = ["del Delta", "Tigre", "Alpha", "Olivos", "Rosario", "Nordelta", "Sur", "Norte"];
        const siglasList = ["CR", "RC", "AN", "CK", "CC", "CRM"];

        const nameBase = names[Math.floor(Math.random() * names.length)];
        const modifier = modifiers[Math.floor(Math.random() * modifiers.length)];
        const randomNum = Math.floor(Math.random() * 999);

        const finalName = `${nameBase} ${modifier} #${randomNum}`;
        const finalSiglas = `${siglasList[Math.floor(Math.random() * siglasList.length)]}${randomNum}`;

        const payload = {
            Nombre: finalName,
            Direccion: "Av. Libertador " + Math.floor(Math.random() * 5000),
            Telefono: "11-" + Math.floor(Math.random() * 90000000 + 10000000),
            Siglas: finalSiglas
        };

        return await api.post('/Club', payload);
    }

    static async createRandomPersona() {
        const nombres = ["Juan", "María", "Pedro", "Ana", "Luis", "Sofía", "Carlos", "Lucía", "Miguel", "Elena"];
        const apellidos = ["García", "Rodríguez", "López", "Martínez", "González", "Perez", "Sanchez", "Romero"];

        const nombre = nombres[Math.floor(Math.random() * nombres.length)];
        const apellido = apellidos[Math.floor(Math.random() * apellidos.length)];
        const documento = (Math.floor(Math.random() * 90000000) + 10000000).toString();

        const personaPayload = {
            Nombre: nombre,
            Apellido: apellido,
            Documento: documento,
            Sexo: Math.floor(Math.random() * 2) + 1,
            FechaNacimiento: new Date(1975 + Math.floor(Math.random() * 40), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28)).toISOString(),
            Email: `${nombre.toLowerCase()}.${apellido.toLowerCase()}${Math.floor(Math.random() * 10000)}@test.com`,
            Telefono: "11-" + Math.floor(Math.random() * 9000000 + 1000000),
            Direccion: "Calle Falsa " + Math.floor(Math.random() * 1000)
        };

        const res = await api.post('/Persona', personaPayload);
        return {
            idPersona: res.idPersona || res.IdPersona,
            nombre,
            apellido,
            documento
        };
    }

    static async createRandomAtleta(clubes = []) {
        const persona = await this.createRandomPersona();

        let idClub = null;
        if (clubes && clubes.length > 0) {
            const randomClub = clubes[Math.floor(Math.random() * clubes.length)];
            idClub = randomClub.idClub || randomClub.IdClub;
        }

        const atletaPayload = {
            IdPersona: persona.idPersona,
            IdClub: idClub ? parseInt(idClub) : null,
            Categoria: Math.floor(Math.random() * 8) + 1,
            BecadoEnard: Math.random() > 0.8,
            BecadoSdn: Math.random() > 0.8,
            MontoBeca: 0,
            PresentoAptoMedico: true,
            EstadoPago: 1,
            PerteneceSeleccion: false,
            FechaAptoMedico: new Date().toISOString()
        };

        return await api.post('/Atleta', atletaPayload);
    }

    static async createRandomEntrenadorClub(clubes = []) {
        const persona = await this.createRandomPersona();

        let idClub = null;
        if (clubes && clubes.length > 0) {
            const randomClub = clubes[Math.floor(Math.random() * clubes.length)];
            idClub = randomClub.idClub || randomClub.IdClub;
        }

        const payload = {
            IdPersona: persona.idPersona,
            IdClub: idClub ? parseInt(idClub) : null,
            Licencia: `CLUB-${Math.floor(Math.random() * 10000)}`,
            PerteneceSeleccion: false,
            CategoriaSeleccion: "0", // String based on error from backend
            BecadoEnard: false,
            BecadoSdn: false,
            MontoBeca: 0,
            PresentoAptoMedico: true
        };

        return await api.post('/Entrenador', payload);
    }

    static async createRandomEntrenadorSeleccion(clubes = []) {
        const persona = await this.createRandomPersona();

        let idClub = null;
        if (clubes && clubes.length > 0 && Math.random() > 0.2) {
            const randomClub = clubes[Math.floor(Math.random() * clubes.length)];
            idClub = randomClub.idClub || randomClub.IdClub;
        }

        const payload = {
            IdPersona: persona.idPersona,
            IdClub: idClub ? parseInt(idClub) : null,
            Licencia: `SEL-${Math.floor(Math.random() * 10000)}`,
            PerteneceSeleccion: true,
            CategoriaSeleccion: (Math.floor(Math.random() * 8) + 1).toString(), // String based on error from backend
            BecadoEnard: Math.random() > 0.5,
            BecadoSdn: Math.random() > 0.5,
            MontoBeca: Math.random() > 0.5 ? Math.floor(Math.random() * 50000) : 0,
            PresentoAptoMedico: true
        };

        return await api.post('/Entrenador', payload);
    }

    static async createRandomTutor() {
        const persona = await this.createRandomPersona();

        const payload = {
            IdPersona: persona.idPersona,
            TipoTutor: "Padre/Madre",
            NombrePersona: `${persona.nombre} ${persona.apellido}`,
            Documento: persona.documento,
            Telefono: "11-9999-8888",
            Email: `tutor.${persona.documento}@test.com`
        };

        return await api.post('/Tutor', payload);
    }

    static async createRandomEvento() {
        const names = ["Regata Invierno", "Copa Verano", "Torneo Nacional", "Campeonato Regional"];
        const name = names[Math.floor(Math.random() * names.length)] + " " + (2025 + Math.floor(Math.random() * 5));

        const payload = {
            Nombre: name,
            Descripcion: "Evento generado automáticamente",
            TipoEvento: Math.floor(Math.random() * 5) + 1,
            FechaInicio: new Date(Date.now() + 86400000 * (10 + Math.floor(Math.random() * 90))).toISOString(),
            FechaFin: new Date(Date.now() + 86400000 * (101 + Math.floor(Math.random() * 5))).toISOString(),
            FechaInicioInscripciones: new Date().toISOString(),
            FechaFinInscripciones: new Date(Date.now() + 86400000 * 5).toISOString(),
            Ubicacion: "Lago Central",
            Ciudad: "Tigre",
            Provincia: "Buenos Aires",
            PrecioBase: Math.floor(Math.random() * 4001) + 1000,
            CupoMaximo: 200,
            TieneCronometraje: true,
            RequiereCertificadoMedico: true,
            Observaciones: "",
            Distancias: []
        };

        const numDistances = Math.floor(Math.random() * 2) + 2;
        for (let i = 0; i < numDistances; i++) {
            payload.Distancias.push({
                DistanciaRegata: Math.floor(Math.random() * 13) + 1,
                CategoriaEdad: Math.floor(Math.random() * 8) + 1,
                SexoCompetencia: Math.floor(Math.random() * 2) + 1,
                TipoBote: Math.floor(Math.random() * 6),
                Descripcion: "Prueba generada"
            });
        }

        return await api.post('/Evento', payload);
    }

    static async clearAllData() {
        const getVal = (obj, keys) => {
            if (!obj) return null;
            for (const key of keys) {
                if (obj[key] !== undefined && obj[key] !== null) return obj[key];
            }
            return null;
        };

        console.log('🚀 Iniciando limpieza exhaustiva de la DB...');

        const firstLevel = [
            { name: 'Usuarios', path: '/Usuario', idKeys: ['idUsuario', 'IdUsuario'] },
            { name: 'Inscripciones', path: '/Inscripcion', idKeys: ['idInscripcion', 'IdInscripcion'] },
            {
                name: 'Relaciones Atleta-Tutor',
                path: '/AtletaTutor',
                customDelete: async (item) => {
                    const idAtleta = getVal(item, ['idAtleta', 'IdAtleta']);
                    const idTutor = getVal(item, ['idTutor', 'IdTutor']);
                    const idRel = getVal(item, ['id', 'idAtletaTutor', 'IdAtletaTutor']);
                    if (idRel) await api.delete(`/AtletaTutor/${idRel}`, { silentErrors: true });
                    else if (idAtleta && idTutor) await api.delete(`/AtletaTutor/${idAtleta}/${idTutor}`, { silentErrors: true });
                }
            },
            { name: 'Pagos', path: '/PagoTransaccion', idKeys: ['id', 'Id', 'idPago'] }
        ];

        const roles = [
            { name: 'Atletas', path: '/Atleta', idKeys: ['idPersona', 'IdPersona'] },
            { name: 'Entrenadores', path: '/Entrenador', idKeys: ['idPersona', 'IdPersona'] },
            { name: 'Delegados', path: '/DelegadoClub', idKeys: ['idPersona', 'IdPersona'] },
            { name: 'Tutores', path: '/Tutor', idKeys: ['idPersona', 'IdPersona'] }
        ];

        const masters = [
            { name: 'Eventos', path: '/Evento', idKeys: ['idEvento', 'IdEvento'] }
        ];

        const processList = async (list) => {
            for (const entity of list) {
                try {
                    console.log(`🔍 Buscando ${entity.name}...`);
                    const items = await api.get(entity.path, { silentErrors: true }).catch(() => []);
                    if (items && Array.isArray(items) && items.length > 0) {
                        console.log(`🗑️ Eliminando ${items.length} de ${entity.name}...`);
                        for (const item of items) {
                            try {
                                if (entity.customDelete) await entity.customDelete(item);
                                else {
                                    const id = getVal(item, entity.idKeys);
                                    if (id) await api.delete(`${entity.path}/${id}`, { silentErrors: true });
                                }
                            } catch (e) { }
                        }
                    }
                } catch (e) { console.warn(`Fallo al procesar ${entity.name}`); }
            }
        };

        await processList(firstLevel);
        await processList(roles);
        await processList(masters);

        try {
            console.log('🔍 Buscando Personas para limpieza final...');
            const personas = await api.get('/Persona', { silentErrors: true }).catch(() => []);
            if (personas && Array.isArray(personas)) {
                console.log(`🗑️ Eliminando ${personas.length} Personas y su Documentación...`);
                for (const p of personas) {
                    const pid = getVal(p, ['idPersona', 'IdPersona']);
                    if (!pid) continue;

                    try {
                        const docs = await api.get(`/Documentacion/persona/${pid}`, { silentErrors: true }).catch(() => []);
                        const docsArray = docs?.documentos || docs?.data?.documentos || (Array.isArray(docs) ? docs : []);
                        for (const doc of docsArray) {
                            const did = getVal(doc, ['id', 'Id', 'idDocumentacion']);
                            if (did) await api.delete(`/Documentacion/${did}`, { silentErrors: true });
                        }
                    } catch (e) { }

                    try {
                        await api.delete(`/Persona/${pid}`, { silentErrors: true });
                    } catch (e) { }
                }
            }
        } catch (e) { console.error('Error en limpieza de Personas'); }

        try {
            console.log('🔍 Buscando Clubes para eliminar...');
            const clubes = await api.get('/Club', { silentErrors: true }).catch(() => []);
            if (clubes && Array.isArray(clubes)) {
                console.log(`🗑️ Eliminando ${clubes.length} Clubes...`);
                for (const club of clubes) {
                    const cid = getVal(club, ['idClub', 'IdClub']);
                    if (cid) await api.delete(`/Club/${cid}`, { silentErrors: true });
                }
            }
        } catch (e) { console.error('Error eliminando Clubes'); }

        console.log('✅ Base de datos despejada completamente.');
    }
}
