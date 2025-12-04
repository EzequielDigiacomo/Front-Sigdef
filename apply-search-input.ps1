# Script para aplicar SearchInput en todos los módulos
$files = @(
    "c:\Users\Trabajo-Desktop\source\ResposFront\SIGDEF-Front\src\pages\Clubes\ClubesList.jsx",
    "c:\Users\Trabajo-Desktop\source\ResposFront\SIGDEF-Front\src\pages\Atletas\AtletasList.jsx",
    "c:\Users\Trabajo-Desktop\source\ResposFront\SIGDEF-Front\src\pages\Eventos\EventosList.jsx",
    "c:\Users\Trabajo-Desktop\source\ResposFront\SIGDEF-Front\src\pages\Inscripciones\InscripcionesList.jsx",
    "c:\Users\Trabajo-Desktop\source\ResposFront\SIGDEF-Front\src\pages\Tutores\TutoresList.jsx"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        
        # Add SearchInput import if not present
        if ($content -notmatch "SearchInput") {
            $content = $content -replace "(import.*from '.*Pagination';)", "`$1`nimport SearchInput from '../../components/common/SearchInput';"
            $content = $content -replace ", Search", ""
        }
        
        # Replace search-input-wrapper div with SearchInput component
        $oldPattern = '                    <div className="search-input-wrapper">\s*<Search size={18} className="search-icon" />\s*<input[^>]*placeholder="([^"]*)"[^>]*value={([^}]*)}[^>]*onChange={([^}]*)}[^>]*/>\s*</div>'
        $newPattern = '                    <SearchInput value={$2} onChange={$3} placeholder="$1" />'
        
        $content = $content -replace $oldPattern, $newPattern
        
        Set-Content $file -Value $content -NoNewline
        Write-Host "Updated: $file"
    }
}

Write-Host "Done!"
