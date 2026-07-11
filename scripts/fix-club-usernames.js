/**
 * Renombra usuarios de rol Club para que el username (y password) = nombre del club normalizado.
 * Ej: "Club1Fec" -> usuario/clave "club1fec"
 *
 * Uso: node scripts/fix-club-usernames.js
 */
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const API_CANDIDATES = [
    process.env.API_URL,
    'https://sporttrack-sigdef.onrender.com/api',
    'http://localhost:5029/api',
].filter(Boolean);

const CREDENTIALS = [
    { username: 'admin', password: 'admin123' },
    { username: 'admin', password: 'Admin123!' },
];

let API_BASE = '';
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

async function resolveApiAndLogin() {
    for (const base of API_CANDIDATES) {
        for (const cred of CREDENTIALS) {
            try {
                API_BASE = base;
                TOKEN = '';
                console.log(`🔑 Probando ${base} con ${cred.username}...`);
                const res = await request('POST', '/auth/login', cred);
                if (res.ok && (res.data?.token || res.data?.Token)) {
                    TOKEN = res.data.token || res.data.Token;
                    console.log(`✅ Login OK en ${base}`);
                    return true;
                }
                console.log(`   Falló (${res.status}): ${String(res.text).slice(0, 100)}`);
            } catch (e) {
                console.log(`   Error: ${e.message}`);
            }
        }
    }
    return false;
}

function userId(u) {
    return u.idUsuario ?? u.IdUsuario ?? u.id ?? u.Id ?? u.participanteId ?? u.ParticipanteId;
}

function isClubRole(u) {
    const rol = String(u.rol ?? u.Rol ?? u.rolFederacion ?? u.RolFederacion ?? '').toLowerCase();
    return rol === 'club';
}

async function main() {
    console.log('=== Fix usernames de club = nombre del club ===\n');
    if (!(await resolveApiAndLogin())) {
        console.error('❌ No se pudo autenticar como admin');
        process.exit(1);
    }

    const [usersRes, clubsRes, authUsersRes] = await Promise.all([
        request('GET', '/Usuario'),
        request('GET', '/Clubes').catch(() => request('GET', '/Club')),
        request('GET', '/Auth/usuarios'),
    ]);

    const users = Array.isArray(usersRes.data) ? usersRes.data : [];
    const clubs = Array.isArray(clubsRes.data) ? clubsRes.data : [];
    const authUsers = Array.isArray(authUsersRes.data) ? authUsersRes.data : [];

    const clubById = new Map();
    for (const c of clubs) {
        const id = c.idClub ?? c.IdClub;
        clubById.set(Number(id), c);
    }

    // Prefer Auth list (has ClubId + RolFederacion); merge with /Usuario for ids
    const clubUsers = (authUsers.length ? authUsers : users).filter((u) => {
        const clubId = u.clubId ?? u.ClubId ?? u.idClub ?? u.IdClub;
        return clubId && isClubRole(u);
    });

    console.log(`Clubes: ${clubs.length}`);
    console.log(`Usuarios club a procesar: ${clubUsers.length}\n`);

    // Count per club for suffixes when hay más de uno
    const countByClub = new Map();
    for (const u of clubUsers) {
        const cid = Number(u.clubId ?? u.ClubId ?? u.idClub ?? u.IdClub);
        countByClub.set(cid, (countByClub.get(cid) || 0) + 1);
    }
    const seenByClub = new Map();

    const usedNames = new Set();
    const results = [];

    for (const u of clubUsers) {
        const cid = Number(u.clubId ?? u.ClubId ?? u.idClub ?? u.IdClub);
        const club = clubById.get(cid);
        const clubName = club?.nombre || club?.Nombre || u.clubNombre || u.ClubNombre || `club${cid}`;
        let base = normalizeClubUsername(clubName);
        if (!base) base = `club${cid}`;

        const idx = (seenByClub.get(cid) || 0) + 1;
        seenByClub.set(cid, idx);
        let desired = idx === 1 ? base : `${base}${idx}`;
        while (usedNames.has(desired)) {
            desired = `${desired}x`;
        }
        usedNames.add(desired);

        // Resolve numeric id for PUT
        let id = userId(u);
        if (!id && users.length) {
            const match = users.find(
                (x) =>
                    String(x.username || x.Username || '').toLowerCase() ===
                    String(u.username || u.Username || '').toLowerCase()
            );
            id = match ? userId(match) : null;
        }

        const oldUser = String(u.username || u.Username || '');
        if (!id) {
            results.push({ oldUser, desired, ok: false, error: 'Sin ID de usuario' });
            continue;
        }

        if (oldUser.toLowerCase() === desired) {
            // Still reset password for easy login
            const pwd = await request('PUT', `/Auth/usuarios/${id}/password`, desired);
            results.push({
                oldUser,
                desired,
                ok: pwd.ok,
                note: pwd.ok ? 'username ya ok; password actualizado' : `password fail ${pwd.status}`,
            });
            continue;
        }

        const putUser = await request('PUT', `/Usuario/${id}`, {
            username: desired,
            Username: desired,
            estaActivo: true,
        });

        if (!putUser.ok) {
            // try Auth id from auth list
            const authId = u.id ?? u.Id;
            const putAlt =
                authId && String(authId) !== String(id)
                    ? await request('PUT', `/Usuario/${authId}`, { username: desired, estaActivo: true })
                    : putUser;
            if (!putAlt.ok) {
                results.push({
                    oldUser,
                    desired,
                    ok: false,
                    error: `PUT Usuario ${putUser.status}: ${String(putUser.text).slice(0, 120)}`,
                });
                continue;
            }
            id = authId || id;
        }

        const pwd = await request('PUT', `/Auth/usuarios/${id}/password`, desired);
        results.push({
            oldUser,
            desired,
            ok: true,
            note: pwd.ok ? 'username+password OK' : `username OK; password ${pwd.status}`,
        });
        console.log(`✅ ${oldUser} → ${desired} / ${desired}`);
    }

    console.log('\n=== Resumen (usuario / password) ===');
    for (const r of results) {
        if (r.ok) {
            console.log(`  ${r.desired}  /  ${r.desired}   (${r.oldUser})${r.note ? ' — ' + r.note : ''}`);
        } else {
            console.log(`  ❌ ${r.oldUser} → ${r.desired}: ${r.error || r.note}`);
        }
    }

    const ok = results.filter((r) => r.ok).length;
    console.log(`\nListo: ${ok}/${results.length} actualizados.`);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
