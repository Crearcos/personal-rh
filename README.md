# PersonalHR

Aplicación web para la gestión de personal, solicitudes, vacaciones y desempeño. La autenticación y los datos se gestionan mediante un proyecto Supabase existente.

## Desarrollo

1. Instala dependencias con `npm ci`.
2. Copia `.env.example` a `.env` y configura `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` con la URL y clave pública del proyecto Supabase.
3. Ejecuta `npm run dev`. Para verificar, usa `npm test` y `npm run build`.

La clave pública es visible en el navegador. Nunca pongas una clave `service_role`, `sb_secret_`, contraseña o token privado en variables `VITE_`, en el código ni en el repositorio. La compilación requiere HTTPS y rechaza algunos formatos de claves privilegiadas conocidos.

## Vercel

Importa el repositorio en Vercel y configura las dos variables `VITE_` en el entorno correspondiente. La compilación usa `npm run build` y produce `dist`. `vercel.json` declara las cabeceras de seguridad; deben comprobarse junto con los flujos reales después de publicar.

## Alcance

Este repositorio contiene la aplicación web y el código de las funciones de acceso que usa la demo. No contiene datos, credenciales ni una migración completa para crear un proyecto Supabase desde cero. El APK Android requiere una configuración y un proceso de compilación adicionales.
