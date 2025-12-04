
import https from 'https';

// Deshabilitar verificación SSL para localhost
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const API_BASE = 'https://localhost:7112/api';

async function checkApi() {
    console.log('🔑 Iniciando sesión...');
    try {
        const loginRes = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: 'admin123' })
        });

        if (!loginRes.ok) throw new Error('Login failed');
        const { token } = await loginRes.json();

        console.log('📡 Obteniendo atletas de selección...');
        const res = await fetch(`${API_BASE}/Atleta/seleccion`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.status === 404) {
            console.log('⚠️ Endpoint /Atleta/seleccion no existe (404).');
        } else if (!res.ok) {
            console.log(`❌ Error ${res.status}: ${res.statusText}`);
        } else {
            const data = await res.json();
            if (data && data.length > 0) {
                console.log('🔍 Primer atleta de selección encontrado:');
                console.log(JSON.stringify(data[0], null, 2));
            } else {
                console.log('⚠️ No se encontraron atletas de selección.');
            }
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkApi();
