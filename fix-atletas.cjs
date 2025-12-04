const fs = require('fs');

const file = 'src/pages/Atletas/AtletasList.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add FormField and Pagination imports
content = content.replace(
    "import Button from '../../components/common/Button';",
    "import Button from '../../components/common/Button';\nimport FormField from '../../components/forms/FormField';\nimport Pagination from '../../components/common/Pagination';"
);

// 2. Add searchTerm, currentPage, itemsPerPage states
content = content.replace(
    "const [showModal, setShowModal] = useState(false);",
    "const [showModal, setShowModal] = useState(false);\n    const [searchTerm, setSearchTerm] = useState('');\n    const [currentPage, setCurrentPage] = useState(1);\n    const [itemsPerPage] = useState(6);"
);

// 3. Add filtering and pagination logic before return
const filteringLogic = `
    // Filtrar atletas por búsqueda
    const filteredAtletas = atletas.filter(atleta => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        return (
            atleta.nombrePersona?.toLowerCase().includes(search) ||
            atleta.documento?.toLowerCase().includes(search) ||
            atleta.nombreClub?.toLowerCase().includes(search) ||
            atleta.tutorInfo?.nombre?.toLowerCase().includes(search) ||
            atleta.tutorInfo?.apellido?.toLowerCase().includes(search)
        );
    });

    // Paginación
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentAtletas = filteredAtletas.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredAtletas.length / itemsPerPage);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };
`;

content = content.replace(
    /(\s+return \()/,
    filteringLogic + '\n$1'
);

// 4. Replace search input with FormField
content = content.replace(
    /<div className="search-input-wrapper">[\s\S]*?<\/div>/,
    '<FormField icon={Search} placeholder="Buscar por nombre, DNI, club..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />'
);

// 5. Replace atletas with currentAtletas in map
content = content.replace(
    /atletas\.map\(/g,
    'currentAtletas.map('
);

// 6. Add Pagination component before closing Card tag (find last </table> and add after it)
content = content.replace(
    /(<\/table>\s*<\/div>)/,
    '$1\n                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />'
);

fs.writeFileSync(file, content, 'utf8');
console.log('✓ AtletasList.jsx updated successfully');
