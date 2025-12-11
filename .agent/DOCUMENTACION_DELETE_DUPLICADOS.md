# Implementación de Validación de Duplicados y DELETE de Documentos

## 1. BACKEND - Agregar endpoint DELETE

Agrega este método en tu `DocumentacionController.cs`:

```csharp
[HttpDelete("{id}")]
public async Task<IActionResult> Delete(int id)
{
    try
    {
        // Buscar el documento
        var documento = await _context.DocumentacionPersonas
            .FirstOrDefaultAsync(d => d.Id == id);

        if (documento == null)
            return NotFound($"No se encontró el documento con ID {id}");

        // Eliminar de Cloudinary si existe PublicId
        if (!string.IsNullOrEmpty(documento.PublicId))
        {
            try
            {
                var deleteParams = new DeletionParams(documento.PublicId);
                var deleteResult = await _cloudinary.DestroyAsync(deleteParams);
                
                if (deleteResult.Result != "ok")
                {
                    Console.WriteLine($"⚠️ Advertencia: No se pudo eliminar de Cloudinary: {deleteResult.Error?.Message}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"⚠️ Error al eliminar de Cloudinary: {ex.Message}");
                // Continuamos con la eliminación de la BD aunque falle Cloudinary
            }
        }

        // Eliminar de la base de datos
        _context.DocumentacionPersonas.Remove(documento);
        await _context.SaveChangesAsync();

        return Ok(new { success = true, message = "Documento eliminado correctamente" });
    }
    catch (Exception ex)
    {
        return StatusCode(500, $"Error al eliminar documento: {ex.Message}");
    }
}
```

También necesitas agregar este using al inicio del archivo:
```csharp
using CloudinaryDotNet.Actions;
```

## 2. FRONTEND - Validación de Duplicados

En `DocumentUploadModal.jsx`, necesitas:

### A) Recibir los documentos existentes como prop:
```javascript
const DocumentUploadModal = ({ 
    isOpen, 
    onClose, 
    onSuccess, 
    personId, 
    personName, 
    existingDocuments = [] 
}) => {
```

### B) Agregar estado para modal de duplicado:
```javascript
const [showDuplicateModal, setShowDuplicateModal] = useState(false);
```

### C) Validar antes de subir en `handleUpload`:
```javascript
const handleUpload = async () => {
    if (!selectedFile || !personId) return;

    // Verificar si ya existe un documento de este tipo
    const documentoExistente = existingDocuments.find(
        doc => doc.tipoDocumento === parseInt(docType)
    );

    if (documentoExistente) {
        setShowDuplicateModal(true);
        return;
    }

    // ... resto del código de upload
};
```

### D) Agregar el modal de advertencia al final del componente:
```javascript
{/* Modal de Advertencia - Documento Duplicado */}
<ConfirmationModal
    isOpen={showDuplicateModal}
    onClose={() => setShowDuplicateModal(false)}
    onConfirm={() => setShowDuplicateModal(false)}
    title="Documento ya existe"
    message={`Ya existe un documento de tipo "${TIPO_DOCUMENTO_MAP[docType]}" cargado. Por favor, elimine el documento existente antes de subir uno nuevo.`}
    type="info"
    confirmText="Entendido"
    showCancel={false}
/>
```

### E) Pasar los documentos desde el componente padre:

En el componente que usa `DocumentUploadModal` (probablemente en la grilla de atletas), pasa los documentos:

```javascript
<DocumentUploadModal
    isOpen={showUploadModal}
    onClose={() => setShowUploadModal(false)}
    onSuccess={handleUploadSuccess}
    personId={selectedPersonId}
    personName={selectedPersonName}
    existingDocuments={documents} // <-- AGREGAR ESTO
/>
```

## 3. Verificar el endpoint DELETE

El endpoint DELETE debería ser:
- **URL**: `DELETE /api/Documentacion/{id}`
- **Parámetro**: `id` (int) - ID del documento a eliminar
- **Respuesta exitosa**: `{ success: true, message: "Documento eliminado correctamente" }`
- **Respuesta error**: Status 404 o 500 con mensaje de error

## Resumen de cambios necesarios:

### Backend:
1. ✅ Agregar método `Delete(int id)` en `DocumentacionController`
2. ✅ Agregar `using CloudinaryDotNet.Actions;`

### Frontend:
1. ✅ Agregar prop `existingDocuments` a `DocumentUploadModal`
2. ✅ Agregar estado `showDuplicateModal`
3. ✅ Validar duplicados en `handleUpload`
4. ✅ Agregar `ConfirmationModal` para advertencia de duplicado
5. ✅ Pasar `documents` desde el componente padre

¿Necesitas ayuda con algún paso específico?
