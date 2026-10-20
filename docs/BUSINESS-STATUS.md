# Estado final de ViajaYa Business Web

Verificación local del 20/10/2026. No se ejecutó SQL remoto ni se crearon reservas, correos reales, commits, push o despliegues.

## Qué puede usarse ahora

La web abre en **http://localhost:5173** y el backend desechable responde en **http://127.0.0.1:3000/health**. El proxy y CSRF se comprobaron también sobre la URL exacta `localhost`, no solamente con mocks.

Funcionan localmente: registro de cuenta, login, alta de empresa y administrador, invitación individual, buzón de prueba, aceptación por destinatario, roles, sugerencias locales, comparación de tres proveedores, intención idempotente, historial propio, dashboard, registros de empresa, administración de empleados, revocación, configuración y cierre de sesión. Todo persiste únicamente mientras vive el proceso de PostgreSQL en memoria.

Los servicios locales se iniciaron con:

```powershell
# Terminal 1, desde la raíz
npm --prefix backend run start:business-local
```

```powershell
# Terminal 2, desde la raíz
npm --prefix frontend-business run dev
```

Si ya están corriendo, no iniciar una segunda copia en el mismo puerto. Ctrl+C detiene el proceso; detener el backend desechable borra sus datos de prueba. No hay usuarios, empresas ni estadísticas precargadas. El buzón es **http://localhost:5173/__local/mail**. Usar dos perfiles de navegador para administrador y empleado. El modo local rechaza producción, solo escucha en loopback y no tiene credenciales ni acceso a Supabase.

## Correcciones y comprobaciones

- Se corrigió el desbordamiento horizontal del login/registro en 390 px de ancho y se agregó un test de regresión.
- Se agregó un arranque local explícito con Express real y PostgreSQL desechable; no hay fallback automático desde el arranque de producción.
- El envío de invitaciones se desacopló: Resend en el backend normal, buzón en memoria únicamente en el entrypoint local.
- La fórmula original del backend se reutiliza en las comparaciones de prueba, sin copiar precios al frontend. Las rutas locales están marcadas como simuladas.
- Se reforzó el SQL con una guardia contra reaplicar migraciones o ignorar IDs incompatibles.
- Se corrigió una ambigüedad en idempotencia: una clave ya vinculada a otro registro produce siempre conflicto.
- Se creó un diagnóstico de catálogo completo de solo lectura y un chequeo de configuración sin valores secretos.
- La configuración automática agregó solo `BUSINESS_WEB_ORIGINS`, `BUSINESS_WEB_URL` y `LEGACY_BUSINESS_ADMIN_ENABLED=false` al archivo ignorado `backend/.env`. No reemplazó valores existentes ni generó credenciales reales.

## Resultado de pruebas

| Comprobación | Resultado |
| --- | --- |
| Backend: `npm --prefix backend test` | 54 aprobadas. Incluye SQL, HTTP, permisos, aislamiento, invitaciones, sesiones, CSRF, Apple bloqueado, Google validado y contratos Mobile. |
| Web: `npm --prefix frontend-business test` | 2 aprobadas. |
| Navegador: `npm --prefix frontend-business run test:e2e` | 8 aprobadas en Edge, con respuestas Business controladas. |
| Integración: `npm --prefix frontend-business run test:integration` | 1 recorrido completo aprobado, con Express y PostgreSQL reales locales, sin sustituir respuestas de la API Business. |
| Mobile Business y registro | 8 aprobadas, sin cambiar `frontend/`. |
| TypeScript + Vite | Build aprobado, incluidos tipos de pruebas y configuraciones. |
| Sintaxis Node | Aprobada en backend, dev, scripts y tests. |
| `git diff --check` | Aprobado. |
| Diff de `frontend/`, package y lockfile raíz | Vacío. |
| Preview real en localhost | HTTP 200, login visible, marcador local, proxy/CSRF y responsive aprobados. |

La prueba integrada recorrió alta de cuenta, empresa y primer administrador; invitación al buzón; registro del destinatario, aceptación y nuevo login; búsqueda de origen/destino, comparación Uber/Cabify/DiDi y registro; Mis viajes y dashboard; denegación del dashboard al empleado; aislamiento de otra empresa; revocación y conservación del historial. No se abrió el enlace de reserva externa.

Al faltar las dependencias Mobile, su test de registro se ejecutó con React Hook Form 7.88.0 y React 19.2.3 de su lockfile, instalados en `.verification/mobile-deps/`. `NODE_PATH` se limitó al proceso de prueba. No se instaló nada en `frontend/`. No se ejecutó Expo en dispositivo físico ni un login Google con credenciales reales.

## Supabase: qué está preparado y qué no se puede acreditar

No hay `SUPABASE_URL`, clave de servidor, credenciales SQL ni conexión Supabase disponible en esta sesión. Por eso **no se verificó el catálogo remoto**, ni puede afirmarse cuáles de las migraciones 20260828/20261007/20261014/20261020 están aplicadas. No se intentó reaplicar ninguna remotamente.

Sí se verificó en PostgreSQL local que el esquema mínimo más las cuatro migraciones se crea correctamente: 9 tablas, 80 columnas, 104 restricciones de catálogo, 27 índices, 1 trigger de aplicación y 2 funciones Business. Las 5 tablas Business tienen RLS. Estos números describen únicamente el esquema desechable; no se atribuyen al remoto. Las pruebas también comprueban que una reaplicación se rechaza antes de DDL y conserva datos existentes.

SQL exacto preparado:

1. [`backend/sql/business_schema_audit.sql`](../backend/sql/business_schema_audit.sql): pegar y ejecutar primero en Supabase SQL Editor; es `READ ONLY` y no devuelve filas de usuarios.
2. [`backend/migrations/20261020_business_web.sql`](../backend/migrations/20261020_business_web.sql): propuesta definitiva local, pendiente de contrastar con el diagnóstico y de aprobación explícita para DDL remoto.
3. Prerrequisitos para comparar, no repetir a ciegas: [`20261007`](../backend/migrations/20261007_add_business_viaje.sql), [`20261014`](../backend/migrations/20261014_business_empresas.sql) y [`estados`](../backend/migrations/20260828_add_estado_viaje.sql).

La salida del diagnóstico debe acreditar columnas/tipos, restricciones, índices, funciones, permisos/RLS y trigger. Si ya coinciden, omitir el archivo aplicado. Si hay un despliegue parcial, preparar una reparación específica y aprobarla antes de tocarlo. Las instrucciones detalladas están en [BUSINESS-WEB.md](BUSINESS-WEB.md#migraciones-para-revisión). No ejecutar `migrate:business` ni `smoke:business` como parte de estas pruebas locales.

## Configuración que requiere intervención

| Dato | Estado y acción requerida |
| --- | --- |
| `SUPABASE_URL` | Ausente. Restaurar la URL auténtica del proyecto. |
| `SUPABASE_SERVICE_ROLE_KEY` | Ausente. Restaurar la clave auténtica, solo en backend. |
| `JWT_SECRET` | Ausente. Restaurar el secreto existente que usa Mobile; no rotarlo automáticamente. |
| Esquema remoto | Ejecutar primero el diagnóstico de lectura; aprobar solo el SQL que realmente falte y sea compatible. |
| `RESEND_API_KEY` | Ausente. Configurar una clave auténtica del servicio autorizado. |
| `BUSINESS_EMAIL_FROM` | Ausente. Definir un remitente con dominio verificado y DNS de correo habilitado en Resend. |
| URL de invitación | Localhost ya configurado para esta computadora. Para destinatarios externos hace falta una URL accesible, permitida por CORS; no se publicó ninguna. |
| Mapas | Faltan ambas opciones: `GOOGLE_MAPS_API_KEY` o `OPENROUTESERVICE_API_KEY`. Configurar al menos una con sus APIs/cuotas habilitadas. |

No se enviaron emails reales: el buzón prueba generación, aceptación, uso único, vencimiento/revocación y destinatario, pero no acredita entregabilidad de Resend. Las rutas reales tampoco se probaron sin credenciales; el backend normal responde error de configuración, no ofrece datos simulados silenciosamente.

Con las credenciales auténticas restauradas y las migraciones aprobadas/aplicadas, detener el backend desechable y usar:

```powershell
npm --prefix backend run check:business-config
npm --prefix backend start
npm --prefix frontend-business run dev
```

Los dos últimos comandos se ejecutan en terminales separadas. El chequeo es de lectura; no aplica SQL. No compartir secretos por chat ni colocarlos en `VITE_*`/`EXPO_PUBLIC_*`.

## Proveedores y Mobile

Se revisaron las fuentes oficiales: [Uber Deep Links](https://developer.uber.com/docs/riders/ride-requests/tutorials/deep-links/introduction), [Cabify Argentina](https://cabify.com/ar) y [DiDi Pasajero Argentina](https://web.didiglobal.com/ar/pasajero/). Uber permite continuar en su experiencia web; Cabify y DiDi se presentan como sitios oficiales/instrucciones de teléfono, sin inventar una URL de precarga o una reserva confirmada. No se ejecutó Guest Rides ni se abrió una reserva real.

Mobile conserva sus archivos e integraciones. El único cambio autorizado al login social sigue siendo rechazar Apple sin verificación segura, antes de leer/escribir usuarios. Email/contraseña y Google mantienen el contrato y pasan las pruebas con credenciales externas simuladas. No se alteraron viajes existentes. La recuperación segura de Apple y la limitación de los JWT antiguos están documentadas en [BUSINESS-WEB.md](BUSINESS-WEB.md#apple-bloqueo-temporal-autorizado).
