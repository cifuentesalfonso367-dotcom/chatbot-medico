# Human Report AI

Proyecto Next.js para análisis de exámenes y generación de reportes con integración a Supabase.

## Descripción

Este repositorio contiene una aplicación de `human-report-ai` construida con:

- Next.js 14
- TypeScript
- Tailwind CSS
- Supabase para autenticación y funciones edge
- GitHub Actions para CI

## Instalación

```bash
npm install
```

## Variables de entorno

Crea un archivo `.env` en la raíz con estas variables:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=tu_clave_publica
```

> No agregues el archivo `.env` al repositorio: ya está protegido en `.gitignore`.

## Scripts disponibles

```bash
npm run dev      # Inicia la aplicación en modo desarrollo
npm run build    # Genera la aplicación para producción
npm run start    # Inicia la aplicación en modo producción
npm run lint     # Ejecuta ESLint
npm run test     # Ejecuta las pruebas con Vitest
```

## Cómo contribuir

1. Clona el repositorio.
2. Instala dependencias con `npm install`.
3. Configura tus credenciales en `.env`.
4. Inicia con `npm run dev`.

## GitHub Actions

Este proyecto incluye una acción de CI en `.github/workflows/ci.yml` que ejecuta:

- instalación de dependencias
- lint
- pruebas
- build
