
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; // Bypass self-signed certs

const API_BASE = 'https://localhost:7112/api';

async function login(username, password) {
    console.log(`🔑 Intentando login como ${username}...`);
    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${await response.text()}`);
        }

        const data = await response.json();
        console.log('✅ Login exitoso');
        return data.token;
    } catch (error) {
        console.error('❌ Error de login:', error.message);
        process.exit(1);
    }
}

async function apiPost(endpoint, data, token) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        const responseText = await response.text();

        if (!response.ok) {
            console.error(`❌ Error en ${endpoint}: ${responseText}`);
            return null;
        }

        try {
            return JSON.parse(responseText);
        } catch {
            return { success: true, message: responseText };
        }
    } catch (error) {
        console.error(`💥 Excepción en ${endpoint}:`, error.message);
        return null;
    }
}

async function seedEventos() {
    console.log('🌱 Iniciando seed de EVENTOS FUTUROS (2026)...');

    // 1. Obtener Token
    const token = await login('admin', 'admin123');

    // 2. Definir Eventos Futuros (Inscripciones abiertas AHORA en Dic 2025)
    // Fecha actual simulada: 2025-12-09

    const eventos = [
        {
            nombre: 'Copa Verano 2026',
            descripcion: 'Torneo de pretemporada para iniciar el año competitivo.',
            tipoEvento: 1, // Carrera Oficial
            // Evento en Febrero 2026
            fechaInicio: new Date(2026, 1, 15).toISOString(), // 15 Feb 2026
            fechaFin: new Date(2026, 1, 17).toISOString(),    // 17 Feb 2026
            // Inscripciones abiertas desde el 1 de Dic 2025 hasta fin de Enero 2026
            fechaInicioInscripciones: new Date(2025, 11, 1).toISOString(), // 1 Dic 2025
            fechaFinInscripciones: new Date(2026, 0, 31).toISOString(),    // 31 Ene 2026
            ubicacion: 'Delta del Tigre',
            ciudad: 'Tigre',
            provincia: 'Buenos Aires',
            precioBase: 18000,
            cupoMaximo: 250,
            tieneCronometraje: true,
            requiereCertificadoMedico: true,
            distancias: [
                { distancia: 1, descripcion: '200m Sprint' },
                { distancia: 4, descripcion: '500m Velocidad' }
            ]
        },
        {
            nombre: 'Campeonato Nacional 2026',
            descripcion: 'El evento más importante del año.',
            tipoEvento: 2, // Campeonato
            // Evento en Julio 2026
            fechaInicio: new Date(2026, 6, 10).toISOString(), // 10 Jul 2026
            fechaFin: new Date(2026, 6, 14).toISOString(),    // 14 Jul 2026
            // Inscripciones abiertas desde AHORA hasta Junio 2026
            fechaInicioInscripciones: new Date(2025, 11, 5).toISOString(), // 5 Dic 2025
            fechaFinInscripciones: new Date(2026, 5, 30).toISOString(),    // 30 Jun 2026
            ubicacion: 'Pista Olímpica',
            ciudad: 'Buenos Aires',
            provincia: 'CABA',
            precioBase: 30000,
            cupoMaximo: 500,
            tieneCronometraje: true,
            requiereCertificadoMedico: true,
            distancias: [
                { distancia: 5, descripcion: '1000m Eliminatorias' },
                { distancia: 6, descripcion: '2000m Finales' }
            ]
        },
        {
            nombre: 'Regata Promocional 2026',
            descripcion: 'Evento para nuevos talentos y categorías menores.',
            tipoEvento: 3, // Recreativo
            // Evento en Marzo 2026
            fechaInicio: new Date(2026, 2, 20, 10, 0, 0).toISOString(), // 20 Mar 2026
            fechaFin: new Date(2026, 2, 20, 18, 0, 0).toISOString(),    // 20 Mar 2026
            // Inscripciones abiertas YA
            fechaInicioInscripciones: new Date(2025, 11, 1).toISOString(),
            fechaFinInscripciones: new Date(2026, 2, 10).toISOString(),
            ubicacion: 'Lago del Parque',
            ciudad: 'Rosario',
            provincia: 'Santa Fe',
            precioBase: 5000,
            cupoMaximo: 150,
            tieneCronometraje: false,
            requiereCertificadoMedico: false,
            distancias: [
                { distancia: 1, descripcion: '200m Escuela' },
                { distancia: 2, descripcion: '350m Menores' }
            ]
        }
    ];

    // 3. Crear Eventos
    console.log(`\n📅 Creando ${eventos.length} eventos futuros...`);
    for (const evento of eventos) {
        const result = await apiPost('/Evento', evento, token);
        if (result) {
            console.log(`✅ Evento creado: "${evento.nombre}"`);
        }
    }

    console.log('\n✨ Proceso finalizado.');
}

seedEventos();
