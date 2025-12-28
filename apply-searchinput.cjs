const fs = require('fs');
const path = require('path');

const files = [
    'src/pages/Clubes/ClubesList.jsx',
    'src/pages/Atletas/AtletasList.jsx',
    'src/pages/Eventos/EventosList.jsx',
    'src/pages/Inscripciones/InscripcionesList.jsx',
    'src/pages/Tutores/TutoresList.jsx'
];

files.forEach(file => {
    const filePath = path.join(__dirname, file);

    if (!fs.existsSync(filePath)) {
        console.log(`File not found: ${file}`);
        return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // Pattern 1: With value and onChange
    const pattern1 = /<div className="search-input-wrapper">\s*<Search size={18} className="search-icon" \/>\s*<input[^>]*placeholder="([^"]*)"[^>]*value={([^}]*)}[^>]*onChange={([^}]*)}[^>]*\/>\s*<\/div>/gs;
    if (pattern1.test(content)) {
        content = content.replace(pattern1, '<SearchInput value={$2} onChange={$3} placeholder="$1" />');
        changed = true;
    }

    // Pattern 2: Without value and onChange
    const pattern2 = /<div className="search-input-wrapper">\s*<Search size={18} className="search-icon" \/>\s*<input\s+type="text"\s+placeholder="([^"]*)"\s+className="search-input"\s*\/>\s*<\/div>/gs;
    if (pattern2.test(content)) {
        content = content.replace(pattern2, '<SearchInput placeholder="$1" />');
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✓ Updated: ${file}`);
    } else {
        console.log(`- No changes needed: ${file}`);
    }
});

console.log('\nDone!');
