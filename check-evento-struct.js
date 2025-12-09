
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const API_URL = 'https://localhost:7112/api/Evento';

async function checkEventos() {
    try {
        // Login para obtener token (usando credenciales por defecto)
        const loginRes = await fetch('https://localhost:7112/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: 'admin123' })
        });
        const loginData = await loginRes.json();
        const token = loginData.token;

        // Get Eventos
        const res = await fetch(API_URL, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const eventos = await res.json();

        if (eventos.length > 0) {
            console.log('Keys del primer evento:', Object.keys(eventos[0]));
            console.log('Muestra del primer evento:', JSON.stringify(eventos[0], null, 2));
        } else {
            console.log('No hay eventos.');
        }
    } catch (err) {
        console.error('Error:', err.message);
    }
}

checkEventos();
