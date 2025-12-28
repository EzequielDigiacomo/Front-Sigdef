const fs = require('fs');
const path = require('path');

const replacements = [
    {
        file: 'src/pages/Clubes/ClubesList.jsx',
        search: `                <div className="filters-bar">
                    <div className="search-input-wrapper">
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Buscar club por nombre, siglas o dirección..."
                            className="search-input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>`,
        replace: `                <div className="filters-bar">
                    <SearchInput
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar club por nombre, siglas o dirección..."
                    />
                </div>`
    },
    {
        file: 'src/pages/Atletas/AtletasList.jsx',
        search: `                <div className="filters-bar">
                    <div className="search-input-wrapper">
                        <Search size={18} className="search-icon" />
                        <input type="text" placeholder="Buscar por nombre..." className="search-input" />
                    </div>
                </div>`,
        replace: `                <div className="filters-bar">
                    <SearchInput placeholder="Buscar por nombre..." />
                </div>`
    }
];

replacements.forEach(({ file, search, replace }) => {
    const filePath = path.join(__dirname, file);

    if (!fs.existsSync(filePath)) {
        console.log(`File not found: ${file}`);
        return;
    }

    let content = fs.readFileSync(filePath, 'utf8');

    if (content.includes(search)) {
        content = content.replace(search, replace);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✓ Updated: ${file}`);
    } else {
        console.log(`- Pattern not found in: ${file}`);
    }
});

console.log('\nDone!');
