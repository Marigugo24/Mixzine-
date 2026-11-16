# Mixzine

PWA en Next.js 16 + React 19 + TypeScript + Tailwind. Crea fanzines-collage a partir de canciones y compártelos por link o imprímelos en un pliego A4 de 8 caras.

## Correr en local
    npm install
    npm run dev      # http://localhost:3000
    npm run build && npm start

## Desplegar en Vercel (con backend)
La app funciona **sin variables** (modo local, como demo). Cada pieza del backend se enciende al añadir su variable; no hay que tocar código.

1. Sube esta carpeta a GitHub y en vercel.com → Add New → Project, importa el repo (Next.js se detecta solo).
2. **Base de datos** (activa cuentas, comunidad, likes, avisos y links cortos): en el proyecto → Storage → Create → **Neon (Postgres)** y conéctalo. Vercel añade `DATABASE_URL`/`POSTGRES_URL` automáticamente. Las tablas se crean solas en la primera petición (o corre `db/schema.sql` a mano).
3. **SESSION_SECRET**: Settings → Environment Variables → `SESSION_SECRET` = salida de `openssl rand -base64 32`.
4. **Fotos** (opcional): Storage → Create → **Blob**. Añade `BLOB_READ_WRITE_TOKEN`. Sin Blob las fotos se guardan en Postgres (válido para empezar).
5. **Spotify** (opcional): crea una app en developer.spotify.com/dashboard. En *Redirect URIs* pon `https://TU-DOMINIO/api/auth/spotify/callback` (y `http://127.0.0.1:3000/api/auth/spotify/callback` para local). Añade `SPOTIFY_CLIENT_ID` y `SPOTIFY_CLIENT_SECRET`.
6. **Pagos (Wompi, opcional)**: en comercios.wompi.co → Desarrolladores copia la *llave pública*, el *secreto de integridad* y el *secreto de eventos* a `WOMPI_PUBLIC_KEY`, `WOMPI_INTEGRITY_SECRET` y `WOMPI_EVENTS_SECRET`. En *Eventos* registra la URL `https://TU-DOMINIO/api/wompi/webhook`. Empieza con llaves de pruebas (`pub_test_…`, usan el Sandbox) y cambia a producción cuando todo funcione.
7. **Correo (Resend, opcional)**: crea una cuenta en resend.com, verifica tu dominio y copia la API key a `RESEND_API_KEY`; pon el remitente en `MAIL_FROM` (p. ej. `Mixzine <hola@tu-dominio.com>`). Sin dominio verificado Resend solo entrega a tu propio correo. Con esto aparece «¿Olvidaste tu contraseña?» al entrar.
8. Redeploy. Comprueba `https://TU-DOMINIO/api/config`: debe mostrar `{"backend":true,...}`.

Variables en `.env.example`. Para probar en local: `cp .env.example .env.local`, rellénalo y `npm run dev`.

## Backend
- **Postgres** (`pg`): `users`, `fanzines` (JSONB), `likes`, `saved` (recibidos), `notifs`, `assets`. Esquema en `db/schema.sql`.
- **Cuentas**: correo + contraseña (scrypt) y Spotify OAuth. Sesión en cookie firmada HttpOnly (60 días). Freno de 8 intentos/10 min por correo y verificación de origen en toda petición que escribe.
- **API** (`src/app/api`): `auth/*`, `fanzines` (+`/[id]`, `/like`, `/guardar`), `feed` (todos · tendencias · amigos), `recibidos`, `notifs`, `upload`, `img/[id]`, `spotify/search`, `config`.
- **Links**: con cuenta el link es corto (`/z?id=…`), lleva **todas las fotos** y respeta la privacidad: *privado* (solo tú), *enlace* (quien lo tenga) y *público* (aparece en la comunidad). Sin cuenta sigue el link largo sin fotos propias.
- **Fotos**: se suben al guardar/compartir, se sirven desde `/api/img/…` (mismo origen, así el PDF y el PNG no fallan por CORS). Máx. 4 MB; JPG/PNG/WebP/GIF verificados por contenido.
- **Sincronización**: lo que ya hiciste en el dispositivo antes de crear la cuenta se sube al entrar; si falla la conexión, queda pendiente y se reintenta al abrir la app.
- **Spotify**: la búsqueda pasa por el servidor (Client Credentials, las claves nunca llegan al navegador) y cae a iTunes si Spotify no responde. Spotify ya no entrega previews de 30 s a la mayoría de apps nuevas; si necesitas escucharlas en la app, iTunes sigue siendo la fuente de previews.

## Recuperar contraseña
Enlace de un solo uso que vale 1 hora, enviado por Resend. Se guarda solo el hash del token, la respuesta es la misma exista o no la cuenta (no revela quién está registrado), hay tope de 3 solicitudes por hora por cuenta y, al cambiar la contraseña, se cierran las sesiones abiertas antes. Las cuentas creadas con Spotify sin contraseña también pueden crear una por este medio. Si no configuras `RESEND_API_KEY`, la opción no aparece.

## Pagos y Premium
- **Wompi Web Checkout**: el servidor crea el pago (monto y referencia propios), firma la URL con el secreto de integridad y redirige a Wompi (tarjeta, PSE, Nequi).
- **Confirmación doble**: el *webhook* (`/api/wompi/webhook`, checksum SHA-256 verificado) y, al volver a `/planes?id=…`, una consulta directa a Wompi. Se valida que monto y moneda sean los creados y es **idempotente**: un pago aprobado suma tiempo una sola vez.
- **Modelo**: cada pago compra un periodo (mensual = 30 días, anual = 365) y se suma al Premium vigente. **No hay cobro automático**: Wompi no renueva solo; para suscripciones recurrentes habría que tokenizar la tarjeta y programar los cobros.
- **Prueba de 7 días**: una vez por cuenta, sin tarjeta.
- Precios en `src/server/wompi.ts` (`PRECIOS`) y en `planes/page.tsx` (texto).
- Limitación: las funciones Premium (PDF del pliego, stickers cromados) se bloquean en el cliente; el servidor sabe quién es Premium (`/api/premium`) pero no exporta nada, así que no hay nada que proteger del lado servidor.

## Qué hay
- Bienvenida, perfil (RF01), Comunidad/Inicio, Explorar (filtros + scroll infinito), Notificaciones, Perfil/galería (RF12), Planes (COP 9.900/mes, 79.900/año, 7 días).
- Crear: búsqueda iTunes (con respaldo local), vista previa de 30 s, 6 emociones que definen la plantilla.
- Editor de 8 paneles (mm): texto, stickers, fotos (grano, duotono, borde rasgado), fondos; mover/rotar/escalar/capas/duplicar/deshacer; autoguardado.
- Compartir: link (con mensaje), WhatsApp, imagen PNG; vista del receptor en `/z` con imagen OG generada en servidor (`/api/og`).
- Pliego A4 horizontal 4×2 con imposición, guías de doblez/corte, margen de 5 mm, aviso <150 dpi y PDF a 300 dpi.

## Pendiente / supuestos
- "Mis amigos" = autores cuyos fanzines te gustaron o guardaste (no hay sistema de seguir). Los contactos de "¿A quién?" siguen siendo de ejemplo; el envío real es por link/WhatsApp.
- La búsqueda de Explorar trae hasta 48 fanzines reales por consulta (sin paginación del servidor todavía).
- Pagos: la integración con Wompi está probada con eventos simulados y firmados, pero no contra el Sandbox real de Wompi (sin internet abierto en el entorno de desarrollo). Haz una compra de prueba con tarjetas de Sandbox antes de pasar a producción.
- El envío real de correo (Resend) no se pudo probar desde el entorno de desarrollo; el flujo completo se probó con `MAIL_DEBUG=1`. Prueba una recuperación real tras configurar `RESEND_API_KEY`.
- El PDF es una imagen A4 (no texto vectorial).
- La búsqueda y el login de Spotify no se pudieron probar contra Spotify real desde el entorno de desarrollo (sin acceso a internet abierto): están probados hasta la llamada a Spotify; verifícalos con tus credenciales.
