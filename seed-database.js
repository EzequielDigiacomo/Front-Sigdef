// Script para poblar la base de datos con datos de prueba
// Ejecutar desde la consola del navegador estando logueado en la aplicación

const API_BASE = 'https://localhost:7112/api'; // URL de tu API backend

// Función helper para hacer requests
async function apiPost(endpoint, data) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
    });
    return response.json();
}

async function seedDatabase() {
    console.log('🌱 Iniciando seed de base de datos...');

    try {
        // ========================================
        // 1. CREAR CLUBES
        // ========================================
        console.log('\n📍 Creando clubes...');

        const clubes = [
            { Nombre: 'Club Atlético River Plate', Direccion: 'Av. Figueroa Alcorta 7597, CABA', Telefono: '011-4789-1200', Siglas: 'CARP' },
            { Nombre: 'Club Atlético Boca Juniors', Direccion: 'Brandsen 805, CABA', Telefono: '011-4362-2260', Siglas: 'CABJ' },
            { Nombre: 'Racing Club', Direccion: 'Colón 1509, Avellaneda', Telefono: '011-4201-5120', Siglas: 'RAC' },
            { Nombre: 'Club Estudiantes de La Plata', Direccion: 'Calle 1 y 57, La Plata', Telefono: '0221-421-8600', Siglas: 'EDLP' },
            { Nombre: 'Club Gimnasia y Esgrima La Plata', Direccion: 'Calle 4 entre 51 y 53, La Plata', Telefono: '0221-483-7575', Siglas: 'GELP' }
        ];

        const clubesCreados = [];
        for (const club of clubes) {
            const resultado = await apiPost('/Club', club);
            clubesCreados.push(resultado);
            console.log(`✅ Club creado: ${club.Nombre} (ID: ${resultado.idClub || resultado.IdClub})`);
        }

        // ========================================
        // 2. CREAR PERSONAS PARA ATLETAS MAYORES
        // ========================================
        console.log('\n👤 Creando atletas mayores...');

        const atletasMayores = [
            { Nombre: 'Juan', Apellido: 'Martínez', Documento: '35123456', FechaNacimiento: '1998-03-15', Email: 'juan.martinez@email.com', Telefono: '11-5555-1001', Direccion: 'Av. Corrientes 1234, CABA' },
            { Nombre: 'María', Apellido: 'González', Documento: '36234567', FechaNacimiento: '1999-07-22', Email: 'maria.gonzalez@email.com', Telefono: '11-5555-1002', Direccion: 'Av. Santa Fe 2345, CABA' },
            { Nombre: 'Carlos', Apellido: 'Rodríguez', Documento: '34345678', FechaNacimiento: '1997-11-08', Email: 'carlos.rodriguez@email.com', Telefono: '11-5555-1003', Direccion: 'Av. Cabildo 3456, CABA' },
            { Nombre: 'Ana', Apellido: 'Fernández', Documento: '37456789', FechaNacimiento: '2000-02-14', Email: 'ana.fernandez@email.com', Telefono: '11-5555-1004', Direccion: 'Av. Rivadavia 4567, CABA' },
            { Nombre: 'Diego', Apellido: 'López', Documento: '33567890', FechaNacimiento: '1996-09-30', Email: 'diego.lopez@email.com', Telefono: '11-5555-1005', Direccion: 'Av. Callao 5678, CABA' },
            { Nombre: 'Laura', Apellido: 'Pérez', Documento: '38678901', FechaNacimiento: '2001-05-18', Email: 'laura.perez@email.com', Telefono: '11-5555-1006', Direccion: 'Av. Pueyrredón 6789, CABA' }
        ];

        const idClubes = clubesCreados.map(c => c.idClub || c.IdClub);

        for (let i = 0; i < atletasMayores.length; i++) {
            const persona = await apiPost('/Persona', atletasMayores[i]);
            const idPersona = persona.idPersona || persona.IdPersona;

            const atleta = await apiPost('/Atleta', {
                IdPersona: idPersona,
                IdClub: idClubes[i % idClubes.length],
                Categoria: i % 4, // Variar categorías
                BecadoEnard: i % 3 === 0,
                BecadoSdn: i % 4 === 0,
                MontoBeca: (i % 3 === 0) ? 5000 + (i * 500) : 0,
                PresentoAptoMedico: i % 2 === 0,
                EstadoPago: 0,
                PerteneceSeleccion: i % 5 === 0,
                FechaAptoMedico: null
            });

            console.log(`✅ Atleta mayor: ${atletasMayores[i].Nombre} ${atletasMayores[i].Apellido}`);
        }

        // ========================================
        // 3. CREAR ATLETAS MENORES CON TUTORES
        // ========================================
        console.log('\n👶 Creando atletas menores con tutores...');

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

            // Crear persona del atleta
            const personaAtleta = await apiPost('/Persona', {
                ...atleta,
                Email: tutor.Email, // Usar email del tutor
                Telefono: tutor.Telefono // Usar teléfono del tutor
            });
            const idAtleta = personaAtleta.idPersona || personaAtleta.IdPersona;

            // Crear atleta
            await apiPost('/Atleta', {
                IdPersona: idAtleta,
                IdClub: idClubes[i % idClubes.length],
                Categoria: 0, // Infantil
                BecadoEnard: false,
                BecadoSdn: i % 2 === 0,
                MontoBeca: (i % 2 === 0) ? 2000 : 0,
                PresentoAptoMedico: true,
                EstadoPago: 0,
                PerteneceSeleccion: false,
                FechaAptoMedico: null
            });

            // Crear persona del tutor
            const personaTutor = await apiPost('/Persona', {
                Nombre: tutor.Nombre,
                Apellido: tutor.Apellido,
                Documento: tutor.Documento,
                FechaNacimiento: '1980-01-01', // Fecha dummy
                Email: tutor.Email,
                Telefono: tutor.Telefono,
                Direccion: atleta.Direccion
            });
            const idPersonaTutor = personaTutor.idPersona || personaTutor.IdPersona;

            // Registrar como tutor
            await apiPost('/Tutor', {
                IdPersona: idPersonaTutor,
                TipoTutor: tutor.TipoTutor,
                NombrePersona: `${tutor.Nombre} ${tutor.Apellido}`,
                Documento: tutor.Documento,
                Telefono: tutor.Telefono,
                Email: tutor.Email
            });

            // Vincular atleta con tutor
            await apiPost('/AtletaTutor', {
                IdAtleta: idAtleta,
                IdTutor: idPersonaTutor,
                Parentesco: tutor.TipoTutor === 'Padre' ? 0 : 1
            });

            console.log(`✅ Atleta menor: ${atleta.Nombre} ${atleta.Apellido} (Tutor: ${tutor.Nombre} ${tutor.Apellido})`);
        }

        // ========================================
        // 4. CREAR ENTRENADORES DE CLUB
        // ========================================
        console.log('\n🏃 Creando entrenadores de club...');

        const entrenadoresClub = [
            { Nombre: 'Marcelo', Apellido: 'Gallardo', Documento: '20111222', FechaNacimiento: '1976-01-18', Email: 'mgallardo@email.com', Telefono: '11-5555-3001', Direccion: 'CABA', Licencia: 'CONMEBOL-PRO-001' },
            { Nombre: 'Ricardo', Apellido: 'Gareca', Documento: '19222333', FechaNacimiento: '1958-02-10', Email: 'rgareca@email.com', Telefono: '11-5555-3002', Direccion: 'CABA', Licencia: 'CONMEBOL-PRO-002' },
            { Nombre: 'Fernando', Apellido: 'Gago', Documento: '28333444', FechaNacimiento: '1986-04-10', Email: 'fgago@email.com', Telefono: '11-5555-3003', Direccion: 'CABA', Licencia: 'CONMEBOL-PRO-003' },
            { Nombre: 'Sebastián', Apellido: 'Verón', Documento: '22444555', FechaNacimiento: '1975-03-09', Email: 'sveron@email.com', Telefono: '11-5555-3004', Direccion: 'La Plata', Licencia: 'CONMEBOL-PRO-004' }
        ];

        for (let i = 0; i < entrenadoresClub.length; i++) {
            const persona = await apiPost('/Persona', entrenadoresClub[i]);
            const idPersona = persona.idPersona || persona.IdPersona;

            await apiPost('/Entrenador', {
                IdPersona: idPersona,
                IdClub: idClubes[i % idClubes.length],
                Licencia: entrenadoresClub[i].Licencia,
                PerteneceSeleccion: false,
                CategoriaSeleccion: '',
                BecadoEnard: false,
                BecadoSdn: false,
                MontoBeca: 0,
                PresentoAptoMedico: true
            });

            console.log(`✅ Entrenador de club: ${entrenadoresClub[i].Nombre} ${entrenadoresClub[i].Apellido}`);
        }

        // ========================================
        // 5. CREAR ENTRENADORES DE SELECCIÓN
        // ========================================
        console.log('\n🏆 Creando entrenadores de selección...');

        const entrenadoresSeleccion = [
            { Nombre: 'Lionel', Apellido: 'Scaloni', Documento: '24555666', FechaNacimiento: '1978-05-16', Email: 'lscaloni@email.com', Telefono: '11-5555-4001', Direccion: 'CABA', Licencia: 'CONMEBOL-PRO-101', Categoria: '3' },
            { Nombre: 'Javier', Apellido: 'Mascherano', Documento: '29666777', FechaNacimiento: '1984-06-08', Email: 'jmascherano@email.com', Telefono: '11-5555-4002', Direccion: 'CABA', Licencia: 'CONMEBOL-PRO-102', Categoria: '1' }
        ];

        for (let i = 0; i < entrenadoresSeleccion.length; i++) {
            const persona = await apiPost('/Persona', entrenadoresSeleccion[i]);
            const idPersona = persona.idPersona || persona.IdPersona;

            await apiPost('/Entrenador', {
                IdPersona: idPersona,
                IdClub: idClubes[0], // Asociar al primer club
                Licencia: entrenadoresSeleccion[i].Licencia,
                PerteneceSeleccion: true,
                CategoriaSeleccion: entrenadoresSeleccion[i].Categoria,
                BecadoEnard: true,
                BecadoSdn: false,
                MontoBeca: 15000,
                PresentoAptoMedico: true
            });

            console.log(`✅ Entrenador de selección: ${entrenadoresSeleccion[i].Nombre} ${entrenadoresSeleccion[i].Apellido}`);
        }

        // ========================================
        // 6. CREAR EVENTOS
        // ========================================
        console.log('\n📅 Creando eventos...');

        const hoy = new Date();
        const eventos = [
            {
                Nombre: 'Torneo Apertura 2024',
                Descripcion: 'Torneo provincial categoría juvenil',
                FechaInicio: new Date(2024, 2, 15).toISOString(),
                FechaFin: new Date(2024, 5, 30).toISOString(),
                Ubicacion: 'Estadio Monumental',
                CupoMaximo: 200,
                Estado: 'Finalizado'
            },
            {
                Nombre: 'Campeonato Nacional Sub-16',
                Descripcion: 'Campeonato nacional categoría sub-16',
                FechaInicio: new Date(2024, 8, 10).toISOString(),
                FechaFin: new Date(2024, 10, 25).toISOString(),
                Ubicacion: 'Complejo Deportivo AFA',
                CupoMaximo: 150,
                Estado: 'Finalizado'
            },
            {
                Nombre: 'Copa de Verano 2025',
                Descripcion: 'Torneo amistoso todas las categorías',
                FechaInicio: new Date(2025, 0, 15).toISOString(),
                FechaFin: new Date(2025, 1, 28).toISOString(),
                Ubicacion: 'Parque Roca',
                CupoMaximo: 300,
                Estado: 'Pendiente'
            },
            {
                Nombre: 'Torneo Clausura 2025',
                Descripcion: 'Torneo provincial segunda parte del año',
                FechaInicio: new Date(2025, 7, 1).toISOString(),
                FechaFin: new Date(2025, 11, 15).toISOString(),
                Ubicacion: 'Estadio Ciudad de La Plata',
                CupoMaximo: 250,
                Estado: 'Pendiente'
            },
            {
                Nombre: 'Selectivo Regional',
                Descripcion: 'Pruebas para selección regional',
                FechaInicio: new Date(2025, 2, 5).toISOString(),
                FechaFin: new Date(2025, 2, 7).toISOString(),
                Ubicacion: 'Predio La Plata',
                CupoMaximo: 100,
                Estado: 'Pendiente'
            }
        ];

        for (const evento of eventos) {
            await apiPost('/Evento', evento);
            console.log(`✅ Evento: ${evento.Nombre} (${evento.Estado})`);
        }

        console.log('\n✨ ¡Seed completado exitosamente!');
        console.log('\n📊 Resumen:');
        console.log(`   - ${clubes.length} clubes creados`);
        console.log(`   - ${atletasMayores.length} atletas mayores creados`);
        console.log(`   - ${atletasMenores.length} atletas menores con tutores creados`);
        console.log(`   - ${entrenadoresClub.length} entrenadores de club creados`);
        console.log(`   - ${entrenadoresSeleccion.length} entrenadores de selección creados`);
        console.log(`   - ${eventos.length} eventos creados (${eventos.filter(e => e.Estado === 'Finalizado').length} finalizados, ${eventos.filter(e => e.Estado === 'Pendiente').length} pendientes)`);

    } catch (error) {
        console.error('❌ Error durante el seed:', error);
        console.error('Detalles:', error.message);
    }
}

// Ejecutar el seed
console.log('⚠️  IMPORTANTE: Asegúrate de estar logueado en la aplicación antes de ejecutar este script.');
console.log('💡 Puedes ejecutar seedDatabase() para iniciar el proceso.');
console.log('');
// seedDatabase(); // Descomenta esta línea para ejecutar automáticamente
