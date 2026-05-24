# 01 — Introducción

## ¿Qué es Nexo Emprendedor?

Nexo Emprendedor es una **plataforma SaaS de gestión de emprendimientos** diseñada para instituciones educativas, incubadoras de negocios y organizaciones que necesitan acompañar a emprendedores en su desarrollo.

### Problema que Resuelve

Las instituciones tienen sistemas fragmentados para gestionar emprendimientos. No hay trazabilidad, los formularios están mal diseñados, los permisos son incorrectos y no hay separación de datos entre empresas. Cada vez que una nueva institución quiere usar el sistema, hay que hacer cambios profundos en el código.

### Solución

Una plataforma **multi-tenant** con un solo código base, donde cada empresa tiene:
- Su propio subdominio (`uniminuto.nexoemprendedor.com`)
- Su propia configuración de marca (colores, logo)
- Su propia base de datos (esquemas separados en PostgreSQL)
- Sus propios catálogos (programas, centros, tipos de población)
- Su propio formulario de diagnóstico (dinámico)

## Perfiles de Usuario

### Administrador
Control total del sistema: usuarios, validaciones, exportación de datos, configuración.

### Emprendedor
Usuario final que recibe acompañamiento. Su acceso es **progresivo** mediante un sistema de validación en 3 etapas.

### Asesor
Profesional que brinda asesoría a los emprendedores asignados por el administrador.

## Flujo General

```
Registro → Completa Perfil → Admin agenda asesoría → 
Admin habilita diagnóstico+emprendimiento → 
Emprendedor completa diagnóstico → Admin verifica → 
Emprendedor descarga/sube carta compromiso → 
Admin verifica → Acceso completo
```

## Principios de Diseño

1. **Seguridad ante todo**: Auditoría completa de todas las operaciones
2. **Multi-tenencia nativa**: Un código, múltiples empresas
3. **Permisos restrictivos**: Cada rol hace solo lo que debe
4. **Configurable**: Los formularios y catálogos se definen en BD, no en código
5. **Exportable**: Todos los datos se pueden exportar a CSV/PDF

## Público Objetivo

- Instituciones educativas (universidades, centros de formación)
- Incubadoras y aceleradoras de negocios
- Gobiernos locales con programas de emprendimiento
- ONGs con programas de desarrollo económico
- Cámaras de comercio
