/**
 * Segunda pasada: deja 1 usuario principal por club = nombre del club (ej. club1fec / club1fec).
 * Extra: club1fec2, club1fec3...
 *
 * Uso: node scripts/fix-club-usernames-pass2.js
 */
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const API_BASE = process.env.API_URL || 'https://sporttrack-sigdef.onrender.com/api';
const CREDENTIALS = [
    { username: 'admin', password: 'admin123' },
    { username: 'admin', password: 'Admin123!' },
];

let TOKEN = '';

function normalizeClubUsername(name) {
    return String(name || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
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

async function login() {
    for (const cred of CREDENTIALS) {
        const res = await request('POST', '/auth/login', cred);
        if (res.ok && (res.data?.token || res.data?.Token)) {
            TOKEN = res.data.token || res.data.Token;
            console.log(`✅ Login OK (${cred.username})`);
            return true;
        }
    }
    return false;
}

function uid(u) {
    return u.id ?? u.Id ?? u.idUsuario ?? u.IdUsuario ?? u.participanteId ?? u.ParticipanteId;
}

function isClubRole(u) {
    const rol = String(u.rol ?? u.Rol ?? u.rolFederacion ?? u.RolFederacion ?? '').toLowerCase();
    return rol === 'club';
}

async function setUsername(id, username) {
    // temp unique first if colliding — caller handles order
    return request('PUT', `/Usuario/${id}`, { username, Username: username, estaActivo: true });
}

async function setPassword(id, password) {
    return request('PUT', `/Auth/usuarios/${id}/password`, password);
}

async function main() {
    console.log('=== Pass 2: usernames club limpios ===\n');
    if (!(await login())) {
        console.error('No login');
        process.exit(1);
    }

    const [authRes, clubsRes, usersRes] = await Promise.all([
        request('GET', '/Auth/usuarios'),
        request('GET', '/Clubes').catch(() => request('GET', '/Club')),
        request('GET', '/Usuario'),
    ]);

    const authUsers = Array.isArray(authRes.data) ? authRes.data : [];
    const clubs = Array.isArray(clubsRes.data) ? clubsRes.data : [];
    const usuarios = Array.isArray(usersRes.data) ? usersRes.data : [];

    const idByUsername = new Map();
    for (const u of [...authUsers, ...usuarios]) {
        const name = String(u.username || u.Username || '').toLowerCase();
        const id = uid(u);
        if (name && id) idByUsername.set(name, id);
    }

    const clubUsers = authUsers.filter((u) => {
        const clubId = u.clubId ?? u.ClubId ?? u.idClub ?? u.IdClub;
        return clubId && isClubRole(u);
    });

    // Group by club
    const byClub = new Map();
    for (const u of clubUsers) {
        const cid = Number(u.clubId ?? u.ClubId ?? u.idClub ?? u.IdClub);
        if (!byClub.has(cid)) byClub.set(cid, []);
        byClub.get(cid).push(u);
    }

    // Pass A: rename ALL club users to unique temp names to free desired slots
    console.log('Paso A: liberar usernames (temp)...');
    for (const u of clubUsers) {
        const id = uid(u);
        const temp = `tmpclub${id}_${Date.now().toString(36).slice(-4)}`;
        const r = await setUsername(id, temp);
        console.log(`  ${u.username || u.Username} → ${temp} (${r.status})`);
        if (r.ok) {
            u.username = temp;
            u.Username = temp;
        }
    }

    // Pass B: assign final names
    console.log('\nPaso B: asignar nombres finales...');
    const credentials = [];

    for (const club of clubs) {
        const cid = Number(club.id ?? club.Id ?? club.idClub ?? club.IdClub);
        const list = byClub.get(cid) || [];
        if (!list.length) {
            console.log(`  (sin usuarios) club ${cid} ${club.nombre || club.Nombre}`);
            continue;
        }

        const base =
            normalizeClubUsername(club.nombre || club.Nombre) || `club${cid}`;

        for (let i = 0; i < list.length; i++) {
            const u = list[i];
            const id = uid(u);
            const desired = i === 0 ? base : `${base}${i + 1}`;
            const put = await setUsername(id, desired);
            if (!put.ok) {
                console.log(`  ❌ ${desired}: ${put.status} ${String(put.text).slice(0, 80)}`);
                continue;
            }
            const pwd = await setPassword(id, desired);
            console.log(`  ✅ ${desired} / ${desired}  (pwd ${pwd.status})`);
            credentials.push({ club: club.nombre || club.Nombre, user: desired, pass: desired });
        }
    }

    console.log('\n=== Credenciales de prueba ===');
    for (const c of credentials) {
        console.log(`  ${c.club}:  ${c.user}  /  ${c.pass}`);
    }
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
