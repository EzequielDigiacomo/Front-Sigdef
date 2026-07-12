# 00 — Catálogo y cobertura

## Tipos de diagrama y dónde están

| Tipo | Categoría | Archivo |
|------|-----------|---------|
| Contexto (C4 L1) | Obligatorio | [01-globales](./01-globales.md#1-contexto) |
| Contenedores (C4 L2) | Obligatorio | [01-globales](./01-globales.md#2-contenedores) |
| Capas / aplicación | Obligatorio | [01-globales](./01-globales.md#3-capas) |
| Despliegue | Obligatorio / ops | [01-globales](./01-globales.md#4-despliegue) |
| Despliegue por ambiente | Opcional | [01-globales](./01-globales.md#5-despliegue-detallado) |
| Paquetes / módulos | Recomendado | [01-globales](./01-globales.md#6-paquetes) |
| Componentes (C4 L3) | Recomendado | [01-globales](./01-globales.md#7-componentes) |
| Casos de uso | Obligatorio | [02-casos…](./02-casos-actividad-estados.md#1-casos-de-uso) |
| Actividad | Recomendado | [02-casos…](./02-casos-actividad-estados.md#2-actividad) |
| Estados | Recomendado | [02-casos…](./02-casos-actividad-estados.md#3-estados) |
| ER / modelo de datos | Obligatorio | [03-er…](./03-er-clases-dominio.md) |
| Clases dominio | Obligatorio | [03-er…](./03-er-clases-dominio.md) |
| Clases aplicación | Opcional | [04-clases…](./04-clases-aplicacion.md) |
| Secuencia | Obligatorio | [05-secuencias…](./05-secuencias-api.md) |
| Secuencia red / API | Recomendado | [05-secuencias…](./05-secuencias-api.md#red-api) |

## Dominios cubiertos

- Auth / Usuario / Auditoría  
- Federación / Club / PlanSaaS  
- Personas: Atleta, Tutor, Entrenador, Delegado, Participante  
- Eventos / Inscripciones / Timing / Resultados / Live  
- Mensajería (aislamiento `SistemaOrigen`)  
- Pagos / MercadoPago  
- Documentación / Cloudinary  
- Fronts: SuperAdmin, Federación, Club (este repo)

## Repos hermanos (mismos tipos de diagrama)

| Repo | Carpeta |
|------|---------|
| **Este (FrontSigdef)** | `docs/tecnico/diagramas/` |
| **SportTrack-Front** | `docs/tecnico/diagramas/` |
| **SportTrack-Sigdef (API, ER canónico)** | `docs/tecnico/diagramas/` |

## Cómo leerlos

1. Empezá por **01-globales** (visión).  
2. Negocio: **02**.  
3. Datos: **03**.  
4. Código: **04**.  
5. Flujos: **05**.
