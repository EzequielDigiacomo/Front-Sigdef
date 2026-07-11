/**
 * Crea 2 entrenadores y 2 delegados por club, y verifica POST + PUT (edit).
 * Usa los mismos payloads que ClubAdmin (Persona+Entrenador / Auth/register).
 *
 * Uso: node scripts/seed-entrenadores-delegados.js
 */
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const API_CANDIDATES = [
    process.env.API_URL,
    'https://sporttrack-sigdef.onrender.com/api',
    'https://localhost:7112/api',
    'http://localhost:5029/api',
].filter(Boolean);

const CREDENTIALS = [
    { username: 'admin', password: 'admin123' },
    { username: 'admin', password: 'Admin123!' },
];

const NOMBRES = ['Marcelo', 'Diego', 'Ricardo', 'Gustavo', 'Hernán', 'Pablo', 'Andrés', 'Sebastián', 'Lucía', 'Carolina', 'Valeria', 'Natalia'];
const APELLIDOS = ['Bielsa', 'Simeone', 'Gallardo', 'Russo', 'Almirón', 'Gago', 'Domínguez', 'Holan', 'Ferro', 'Pizzi'];

let API_BASE = '';
let TOKEN = '';

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function genPersona(suffix) {
    const nombre = pick(NOMBRES);
    const apellido = pick(APELLIDOS);
    const documento = `${randInt(30000000, 45999999)}${suffix}`.slice(0, 8);
    const year = randInt(1975, 1998);
    return {
        nombre,
        apellido,
        documento,
        fechaNacimiento: `${year}-${String(randInt(1, 12)).padStart(2, '0')}-${String(randInt(1, 28)).padStart(2, '0')}T00:00:00.000Z`,
        email: `${nombre.toLowerCase()}.${apellido.toLowerCase()}.${documento}@sigdef.test`,
        telefono: `11-${randInt(1000, 9999)}-${randInt(1000, 9999)}`,
        direccion: `Calle Test ${randInt(100, 9999)}`,
        sexoId: randInt(1, 2),
    };
}

async function request(method, path, body) {
    const res = await fetch(`${API_BASE}${path}`, {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    let data = null;
    try {
        data = text ? JSON.parse(text) : null;
    } catch {
        data = text;
    }
    return { ok: res.ok, status: res.status, data, text };
}

async function resolveApiAndLogin() {
    for (const base of API_CANDIDATES) {
        for (const cred of CREDENTIALS) {
            try {
                API_BASE = base;
                TOKEN = '';
                console.log(`\n🔑 Probando ${base} con ${cred.username}...`);
                const res = await request('POST', '/auth/login', cred);
                if (res.ok && (res.data?.token || res.data?.Token)) {
                    TOKEN = res.data.token || res.data.Token;
                    console.log(`✅ Login OK en ${base}`);
                    return true;
                }
                console.log(`   Login falló (${res.status}): ${String(res.text).slice(0, 120)}`);
            } catch (err) {
                console.log(`   No disponible: ${err.message}`);
            }
        }
    }
    return false;
}

function idOf(obj, ...keys) {
    for (const k of keys) {
        if (obj?.[k] != null) return obj[k];
    }
    return null;
}

async function createPersona(persona) {
    const existing = await request('GET', `/Persona/documento/${persona.documento}`);
    if (existing.ok) {
        const id = idOf(existing.data, 'participanteId', 'ParticipanteId', 'idPersona', 'IdPersona');
        if (id) {
            const put = await request('PUT', `/Persona/${id}`, persona);
            return { id: Number(id), created: false, putOk: put.ok, putStatus: put.status };
        }
    }
    const post = await request('POST', '/Persona', persona);
    const id = idOf(post.data, 'participanteId', 'ParticipanteId', 'idPersona', 'IdPersona');
    return {
        id: id ? Number(id) : null,
        created: post.ok,
        postOk: post.ok,
        postStatus: post.status,
        error: post.ok ? null : post.text,
    };
}

async function createEntrenador(clubId, index) {
    const persona = genPersona(String(clubId) + String(index));
    const personaRes = await createPersona(persona);
    if (!personaRes.id) {
        return { ok: false, step: 'persona', error: personaRes.error || 'sin id', persona };
    }

    const payload = {
        participanteId: personaRes.id,
        ParticipanteId: personaRes.id,
        idPersona: personaRes.id,
        idClub: clubId,
        licencia: `LIC-${clubId}-${index}-${randInt(100, 999)}`,
        perteneceSeleccion: false,
        categoriaSeleccion: '',
        becadoEnard: false,
        becadoSdn: false,
        montoBeca: 0,
        presentoAptoMedico: true,
    };

    const post = await request('POST', '/Entrenador', payload);
    if (!post.ok) {
        return {
            ok: false,
            step: 'post-entrenador',
            status: post.status,
            error: post.text,
            personaId: personaRes.id,
            persona,
        };
    }

    // Edit: actualizar persona + entrenador (mismos campos del form)
    const editPersona = {
        ...persona,
        telefono: `11-EDIT-${randInt(1000, 9999)}`,
        direccion: `Dirección editada ${randInt(1, 99)}`,
        email: `edit.${persona.documento}@sigdef.test`,
    };
    const putPersona = await request('PUT', `/Persona/${personaRes.id}`, editPersona);

    const editEntrenador = {
        ...payload,
        perteneceSeleccion: true,
        categoriaSeleccion: '1',
        presentoAptoMedico: true,
        becadoSdn: true,
        montoBeca: 1500,
    };
    const putEntrenador = await request('PUT', `/Entrenador/${personaRes.id}`, editEntrenador);

    const getBack = await request('GET', `/Entrenador/${personaRes.id}`);
    const getPersona = await request('GET', `/Persona/${personaRes.id}`);

    const editOk = putPersona.ok && putEntrenador.ok;
    const verifyOk =
        getBack.ok &&
        (getBack.data?.perteneceSeleccion === true || getBack.data?.PerteneceSeleccion === true) &&
        getPersona.ok &&
        String(getPersona.data?.telefono || getPersona.data?.Telefono || '').includes('EDIT');

    return {
        ok: post.ok && editOk,
        personaId: personaRes.id,
        nombre: `${persona.nombre} ${persona.apellido}`,
        documento: persona.documento,
        postOk: post.ok,
        putPersonaOk: putPersona.ok,
        putEntrenadorOk: putEntrenador.ok,
        verifyOk,
        putPersonaStatus: putPersona.status,
        putEntrenadorStatus: putEntrenador.status,
        getStatus: getBack.status,
        errors: [
            !putPersona.ok && `PUT Persona ${putPersona.status}: ${String(putPersona.text).slice(0, 100)}`,
            !putEntrenador.ok && `PUT Entrenador ${putEntrenador.status}: ${String(putEntrenador.text).slice(0, 100)}`,
            !verifyOk && 'Verificación GET no reflejó los cambios de edición',
        ].filter(Boolean),
    };
}

async function createDelegado(club, index) {
    const clubId = idOf(club, 'idClub', 'IdClub');
    const fedId = idOf(club, 'idFederacion', 'IdFederacion', 'federacionId') || 1;
    const persona = genPersona(`D${clubId}${index}`);

    // Flujo ClubAdmin: Auth/register
    const registerPayload = {
        username: persona.documento,
        password: persona.documento,
        email: persona.email,
        rol: 'Club',
        rolFederacion: 'Club',
        clubId: Number(clubId),
        federacionId: Number(fedId),
        nombre: persona.nombre,
        apellido: persona.apellido,
        dni: persona.documento,
        telefono: persona.telefono,
    };

    const reg = await request('POST', '/Auth/register', registerPayload);
    if (!reg.ok) {
        // Fallback canónico: Persona + DelegadoClub
        const personaRes = await createPersona(persona);
        if (!personaRes.id) {
            return { ok: false, step: 'register+persona', error: reg.text || personaRes.error, persona };
        }

        const roles = await request('GET', '/Rol');
        const roleList = Array.isArray(roles.data) ? roles.data : [];
        const rol =
            roleList.find((r) => /delegado/i.test(r.tipo || r.Tipo || r.nombre || r.Nombre || '')) ||
            roleList[0];
        const idRol = idOf(rol, 'idRol', 'IdRol') || 2;

        const delPost = await request('POST', '/DelegadoClub', {
            participanteId: personaRes.id,
            idRol: Number(idRol),
            idFederacion: Number(fedId),
            idClub: Number(clubId),
        });

        if (!delPost.ok) {
            return {
                ok: false,
                step: 'delegadoClub',
                status: delPost.status,
                error: `Auth/register ${reg.status}; DelegadoClub ${delPost.status}: ${String(delPost.text).slice(0, 150)}`,
                persona,
            };
        }

        const putDel = await request('PUT', `/DelegadoClub/${personaRes.id}`, {
            participanteId: personaRes.id,
            idRol: Number(idRol),
            idFederacion: Number(fedId),
            idClub: Number(clubId),
        });

        return {
            ok: delPost.ok && putDel.ok,
            mode: 'DelegadoClub',
            personaId: personaRes.id,
            nombre: `${persona.nombre} ${persona.apellido}`,
            documento: persona.documento,
            postOk: delPost.ok,
            putOk: putDel.ok,
            errors: !putDel.ok ? [`PUT DelegadoClub ${putDel.status}`] : [],
        };
    }

    // Buscar usuario creado para editar perfil
    await sleep(300);
    const users = await request('GET', '/Auth/usuarios');
    const list = Array.isArray(users.data) ? users.data : [];
    const created = list.find(
        (u) =>
            String(u.username || u.Username || '') === persona.documento ||
            String(u.dni || u.Dni || u.documento || '') === persona.documento
    );

    const userId = idOf(created, 'id', 'Id', 'idPersona', 'IdPersona', 'participanteId', 'ParticipanteId');
    if (!userId) {
        return {
            ok: true,
            mode: 'Auth/register',
            warning: 'Creado pero no se encontró id para editar perfil',
            nombre: `${persona.nombre} ${persona.apellido}`,
            documento: persona.documento,
            postOk: true,
            putOk: false,
        };
    }

    const put = await request('PUT', `/Auth/usuarios/${userId}/perfil`, {
        nombre: `${persona.nombre} Edit`,
        apellido: persona.apellido,
        telefono: `11-DEL-EDIT-${randInt(1000, 9999)}`,
        dni: persona.documento,
        email: `edit.del.${persona.documento}@sigdef.test`,
    });

    return {
        ok: reg.ok && put.ok,
        mode: 'Auth/register',
        userId,
        nombre: `${persona.nombre} ${persona.apellido}`,
        documento: persona.documento,
        postOk: reg.ok,
        putOk: put.ok,
        putStatus: put.status,
        errors: !put.ok ? [`PUT perfil ${put.status}: ${String(put.text).slice(0, 120)}`] : [],
    };
}

async function main() {
    console.log('=== Seed + verificación: 2 entrenadores y 2 delegados por club ===');

    if (!(await resolveApiAndLogin())) {
        console.error('❌ No se pudo autenticar en ninguna API.');
        process.exit(1);
    }

    const clubsRes = await request('GET', '/Club');
    const clubs = Array.isArray(clubsRes.data) ? clubsRes.data : [];
    if (!clubs.length) {
        console.error('❌ No hay clubes en la API.');
        process.exit(1);
    }

    console.log(`\n📍 Clubes encontrados: ${clubs.length}`);
    clubs.forEach((c) => {
        console.log(`   - ${idOf(c, 'idClub', 'IdClub')}: ${c.nombre || c.Nombre}`);
    });

    const summary = {
        clubs: clubs.length,
        entrenadoresOk: 0,
        entrenadoresFail: 0,
        delegadosOk: 0,
        delegadosFail: 0,
        issues: [],
    };

    for (const club of clubs) {
        const clubId = idOf(club, 'idClub', 'IdClub');
        const clubName = club.nombre || club.Nombre || `Club ${clubId}`;
        console.log(`\n🏢 ${clubName} (id=${clubId})`);

        for (let i = 1; i <= 2; i++) {
            process.stdout.write(`   Entrenador ${i}/2... `);
            const r = await createEntrenador(clubId, i);
            if (r.ok) {
                summary.entrenadoresOk += 1;
                console.log(`✅ ${r.nombre} (POST+PUT${r.verifyOk ? '+verify' : ''})`);
            } else {
                summary.entrenadoresFail += 1;
                console.log(`❌ ${r.step || 'error'}: ${String(r.error || r.errors?.join('; ')).slice(0, 160)}`);
                summary.issues.push(`Entrenador club ${clubId}: ${r.error || r.errors?.join('; ')}`);
            }
            await sleep(200);
        }

        for (let i = 1; i <= 2; i++) {
            process.stdout.write(`   Delegado ${i}/2... `);
            const r = await createDelegado(club, i);
            if (r.ok) {
                summary.delegadosOk += 1;
                console.log(`✅ ${r.nombre} [${r.mode}] (POST${r.putOk ? '+PUT' : ''})`);
                if (r.warning) summary.issues.push(`Delegado club ${clubId}: ${r.warning}`);
            } else {
                summary.delegadosFail += 1;
                console.log(`❌ ${r.step || 'error'}: ${String(r.error || r.errors?.join('; ')).slice(0, 160)}`);
                summary.issues.push(`Delegado club ${clubId}: ${r.error || r.errors?.join('; ')}`);
            }
            await sleep(200);
        }
    }

    console.log('\n========== RESUMEN ==========');
    console.log(`API: ${API_BASE}`);
    console.log(`Clubes: ${summary.clubs}`);
    console.log(`Entrenadores OK: ${summary.entrenadoresOk} | Fallidos: ${summary.entrenadoresFail}`);
    console.log(`Delegados OK: ${summary.delegadosOk} | Fallidos: ${summary.delegadosFail}`);
    if (summary.issues.length) {
        console.log('\nIssues:');
        summary.issues.forEach((i) => console.log(` - ${i}`));
    }

    const failed = summary.entrenadoresFail + summary.delegadosFail;
    process.exit(failed > 0 ? 2 : 0);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
