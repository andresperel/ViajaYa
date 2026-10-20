# ViajaYa Business Web

Implementación local de una SPA React + TypeScript + Vite, con React Router y React Hook Form. Comparte Express, cuentas `Usuario` y cálculo de rutas con Mobile. No utiliza Expo Web ni importa componentes o Context de Mobile. La marca se copia a `frontend-business/public/branding/`; el archivo original permanece intacto.

## Estado y límites

- Pantallas implementadas: login, registro de cuenta, alta de empresa, aceptación de invitación, inicio, solicitud, comparación, historial propio, dashboard, registros empresariales, empleados y configuración/perfil de consulta.
- Endpoints, cookies, CSRF, autorización, invitaciones y registros están implementados y se verifican con PostgreSQL embebido y HTTP locales.
- No se aplicaron migraciones remotas ni se leyó o modificó el esquema remoto. La aplicación conectada a Supabase necesita revisión del esquema y aprobación/aplicación posterior del SQL. La aplicación local desechable sí puede utilizarse ahora sin servicios remotos.
- Invitaciones reales necesitan un remitente habilitado y `RESEND_API_KEY`; si no hay configuración se responde 503, sin generar enlaces de prueba ni exponer secretos.
- No se probaron entregas reales de correo, credenciales reales de Google ni una reserva con proveedores. Las pruebas sustituyen esas respuestas, nunca crean datos reales.
- Una membresía por cuenta, compatible con las restricciones existentes. No se permite cambiar silenciosamente de empresa: requiere una futura transferencia explícita que conserve historial.
- Empresas anteriores mantienen sus miembros como empleados; no se promueve automáticamente a quien conozca un código. Su administrador debe asignarse manualmente a una cuenta verificada mediante un cambio revisado y autorizado.
- No hay facturación, pagos, reservas directas, Guest Rides, seguimiento garantizado ni estados de viaje realizado inventados.

## Usar ahora: entorno local completo y desechable

No hay credenciales de Supabase, JWT, Resend o mapas en esta copia del repositorio ni una conexión Supabase instalada. Por eso no es posible afirmar qué migraciones están aplicadas remotamente. **No se utilizaron credenciales sustitutas ni se ejecutaron llamadas remotas de escritura.**

Desde la raíz, en dos terminales:

```powershell
npm --prefix backend run start:business-local
```

```powershell
npm --prefix frontend-business run dev
```

Abrir **http://localhost:5173**. El backend escucha únicamente en `127.0.0.1:3000`. La franja superior identifica claramente el entorno de prueba. No hay cuentas ni empresas precargadas: registrá tus propias cuentas de prueba con correos `@example.test` y contraseñas que no uses en servicios reales.

1. Registrá tu cuenta de prueba e iniciá sesión.
2. Registrá la primera empresa; tu cuenta queda como administrador.
3. En Empleados, invitá otro correo de prueba.
4. Abrí **http://localhost:5173/__local/mail**, el buzón local, y copiá el enlace de aceptación a otro perfil de navegador. No se envía correo real.
5. Registrá la cuenta destinataria, iniciá sesión y aceptá la invitación.
6. En Solicitar viaje elegí, por ejemplo, **Obelisco** y **Plaza de Mayo** de las sugerencias. En este modo las rutas son simuladas y los precios usan la fórmula existente del backend.
7. Elegí un proveedor y comprobá el registro de intención en Mis viajes. No hace falta abrir la plataforma externa para probar el registro; nunca se confirma una reserva automáticamente.
8. Como administrador, consultá dashboard y viajes de empresa; probá revocar al empleado.

La base PostgreSQL se crea en memoria y desaparece al detener el backend con Ctrl+C; también desaparecen sesiones, invitaciones y buzón. La clave de firma local es aleatoria, efímera y privada al proceso: no se escribe en `.env`, no reemplaza secretos auténticos y no es una credencial de Supabase/Resend. El modo local no lee `.env`, no hace conexiones remotas y rechaza `NODE_ENV=production`. No soporta OAuth externo; Apple sigue bloqueado. El arranque normal `npm start` nunca cae silenciosamente a este modo.

La preparación automática agregó únicamente tres valores no secretos a `backend/.env`: los orígenes/URL de localhost y la desactivación del panel global. No modificó ningún valor previo ni archivos Mobile. Para repetir esa preparación de forma idempotente:

```powershell
npm --prefix backend run setup:business-local
npm --prefix backend run check:business-config
```

El segundo comando termina con error deliberadamente si falta configuración real; no significa que el modo desechable esté roto. No revela valores secretos ni consulta filas de usuarios. Con credenciales reales realiza solo lecturas de columnas con límite cero; el catálogo completo se verifica con el SQL de diagnóstico.

## Ejecutar con Supabase (después de configuración y aprobación)

Requiere Node compatible con las versiones fijadas en los lockfiles (verificado con Node 24). Desde la raíz, con las variables del backend configuradas:

```powershell
npm --prefix backend ci
npm --prefix frontend-business ci
npm --prefix backend start
```

En otra terminal:

```powershell
npm --prefix frontend-business run dev
```

Abrir **http://localhost:5173**. Vite escucha en loopback y reenvía `/api/business` a `http://127.0.0.1:3000`; el puerto 3000 debe coincidir con la configuración del backend. No ejecutar el script de túnel: puede modificar `frontend/.env`. No hace falta iniciar Expo.

Copiar solo las variables necesarias de `backend/.env.business.example` al entorno privado existente, sin sobrescribir sus secretos. `frontend-business/.env.example` documenta `VITE_API_URL`; dejar vacío con el proxy. Nunca poner claves Supabase privilegiadas, claves de correo, JWT ni claves de mapas en variables `VITE_*`.

## Variables

| Nombre | Uso |
| --- | --- |
| `SUPABASE_URL` | Proyecto existente; solo backend. |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave privilegiada existente, solo servidor. Un cliente anónimo no es suficiente. |
| `JWT_SECRET` | Secreto ya utilizado por el login existente. No se cambia automáticamente. |
| `BUSINESS_WEB_ORIGINS` | Orígenes exactos separados por comas, sin rutas ni barra final. |
| `BUSINESS_WEB_URL` | URL pública de la web usada para enlaces de invitación, con origen permitido. |
| `RESEND_API_KEY` | Envío de correo; no se solicita ni genera automáticamente. |
| `BUSINESS_EMAIL_FROM` | Remitente verificado de invitaciones. |
| `GOOGLE_MAPS_API_KEY` / `OPENROUTESERVICE_API_KEY` | Servicios de rutas existentes. Google requiere sus APIs habilitadas. |
| `NODE_ENV` | `production` activa cookies Secure con prefijo `__Host-` y exige orígenes HTTPS explícitos. |
| `VITE_API_URL` | Opcional; URL API pública, sin `/api/business`. Preferir mismo origen. |
| `LEGACY_BUSINESS_ADMIN_ENABLED` | Mantener `false`; panel global anterior deshabilitado por defecto. |

En producción se requiere HTTPS y proxy del mismo origen o del mismo sitio: las cookies tienen `SameSite=Lax`, `HttpOnly`, `Path=/`, sin `Domain`. Una API en otro sitio registrable no está soportada por esta configuración; no habilitar cookies cross-site sin rediseñar y revisar las protecciones. Configurar también fallback de rutas SPA a `index.html`, redirección HTTP→HTTPS, CSP, `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`, `X-Content-Type-Options: nosniff` y límites de peticiones en el proxy. No se desplegó ni configuró hosting.

## Migraciones para revisión

Para el esquema remoto, el estado actual es **NO VERIFICADO: faltan acceso y credenciales**. No puede asegurarse que falte exactamente `20261020`; también debe comprobarse qué partes previas existen. No se debe ejecutar de nuevo un archivo solo por no encontrar una marca de historial.

En **Supabase → SQL Editor → New query**, pegar primero el contenido completo de [`backend/sql/business_schema_audit.sql`](../backend/sql/business_schema_audit.sql). Es una transacción `READ ONLY`; devuelve catálogo sin datos de cuentas, tokens ni direcciones: existencia de tablas, tipos/defaults/not-null, PK/FK/checks, índices, triggers, definiciones y permisos de funciones, RLS/políticas, grants y secuencias. Funciona incluso cuando faltan tablas Business.

Comparar la salida con los archivos SQL. `estructura_presente_revisar_definiciones` significa que las columnas están, **no que la migración esté acreditada**: también deben coincidir restricciones, relaciones, permisos, funciones y triggers. Si falta todo un grupo, ese archivo puede ser candidato a aplicación; si está parcial o difiere, preparar un SQL específico de reparación y aprobarlo primero. Si está completo, omitirlo. No ejecutar `20261014` después de `20261020`: reemplazaría el trigger reforzado por la versión anterior.

Solo después de esa verificación y de tu aprobación explícita, abrir otra consulta SQL Editor y ejecutar el contenido exacto del archivo aprobado, con su BEGIN/COMMIT completo. Ejecutar de nuevo **solo el diagnóstico de lectura**, no la migración, para confirmar el resultado. El archivo `20261020` incluye una guardia antes de DDL que rechaza IDs incompatibles o cualquier instalación previa/parcial de sus objetos.

El archivo nuevo completo es [`backend/migrations/20261020_business_web.sql`](../backend/migrations/20261020_business_web.sql). Es una migración versionada, de una sola aplicación, envuelta en una transacción; **no es un script para ejecutar repetidamente**. No está conectada al arranque ni al comando anterior `migrate:business`.

Antes de aplicar cualquier archivo, inspeccionar en modo lectura el esquema real: tablas y tipos, PK/FK, checks, índices únicos, políticas/permisos, triggers, funciones y columnas. Obtener respaldo y comprobar datos inconsistentes. No ejecutar los scripts `smoke:business` o `migrate:business` como si fueran pruebas inocuas: pueden escribir remotamente.

Prerrequisitos lógicos (aplicar solo lo que realmente falte y esté aprobado):

1. `20260828_add_estado_viaje.sql`: estado y campos de proveedor.
2. `20261007_add_business_viaje.sql`: `tipoViaje` y `motivoViaje`; no es repetible si ya existen.
3. `20261014_business_empresas.sql`: empresas, asociaciones y `empresaId`.
4. `20261020_business_web.sql`: roles, estado de empresa, datos empresariales, canal, sesiones, invitaciones, comparaciones, registros, auditoría y función transaccional.

El SQL nuevo no elimina datos, no renombra columnas Mobile y no cambia el significado del estado `pendiente`. Los nuevos viajes Web usan una secuencia en un rango separado de `Date.now()` y dentro de los enteros seguros de JavaScript. **Verificar que `Viaje.idViaje` sea bigint compatible con ese rango** y que exista la relación `Viaje.idUsuario → Usuario.idUsuario` necesaria para las consultas con PostgREST. Los IDs de servicio 1/2/3 ya forman parte del cálculo existente; verificar su correspondencia real antes de usar datos remotos.

Las nuevas tablas están cerradas a `anon`/`authenticated`, con RLS y permisos solo de servidor. La función es `SECURITY INVOKER`, con ejecución revocada a roles públicos. El JWT propio de ViajaYa no se usa como `auth.uid()` de Supabase. La clave service_role omite RLS: los filtros de Express y las comprobaciones de la función siguen siendo obligatorios.

El trigger de inserción ya existente se extiende para comprobar también empresa activa. Sus valores predeterminados siguen admitiendo los viajes personales Mobile y las empresas activas existentes. No modifica viajes anteriores ni convierte intenciones en reservas.

## Sesiones y permisos

El login web reutiliza los controladores de email/contraseña y registro: mismas cuentas y bcrypt; el JWT Mobile generado internamente se descarta, nunca se entrega a React Web. El navegador recibe un secreto aleatorio de 256 bits en cookie HttpOnly. La base guarda solo su SHA-256, usuario y vencimiento absoluto de 8 horas. Login rota la sesión previa de ese navegador; logout elimina la fila. No se guardan tokens de sesión en localStorage/sessionStorage.

Antes de las mutaciones se obtiene CSRF mediante `/auth/csrf`. El servidor exige origen permitido, JSON, cookie CSRF HttpOnly y cabecera coincidente. Cada petición privada comprueba la sesión en la base. Cada endpoint de empresa comprueba membresía activa y empresa activa; cada acción administrativa comprueba rol. No se confía en empresa, usuario, rol ni precio del cuerpo o querystring.

Las operaciones SQL bloquean la cuenta y serializan cambios sobre la empresa. Alta de empresa+administrador, aceptación+consumo, modificación del último administrador y registro del viaje+metadatos se realizan en transacciones. Una revocación anterior al registro impide guardar. Un registro ya confirmado en base puede coexistir con una revocación posterior; no se borra el historial.

El panel global anterior tenía credenciales incrustadas y acceso transversal. Se quitaron las credenciales y se deshabilitó por defecto tanto su login como el middleware de sus endpoints. Mobile no se edita; su enlace antiguo mostrará el panel, pero no podrá usarlo sin habilitación explícita. Solo un entorno de mantenimiento aislado debería usar `LEGACY_BUSINESS_ADMIN_ENABLED=true`, correo y hash bcrypt configurados. Ese panel no es un administrador de empresa y puede saltarse el modelo empresarial nuevo; no habilitarlo en un servicio Business público.

Los límites de peticiones incluidos son por proceso y memoria; desplegar con una sola instancia y/o aplicar límites globales en el proxy. Un despliegue con varias instancias requiere rate limiting compartido. Programar después una limpieza autorizada de sesiones expiradas. Las comparaciones registradas conservan el snapshot para trazabilidad; no borrar comparaciones referenciadas por registros. No hay tareas remotas ni limpieza automática destructiva.

## Invitaciones

Un administrador genera una invitación de correo individual, con rol y vencimiento de 72 horas. El token aleatorio se envía solo al correo; se almacena su hash. El enlace transporta el secreto en el fragmento `#`, no en querystring. React lo retira de la barra y lo conserva en sessionStorage de esa pestaña únicamente hasta aceptar o descartar, para permitir pasar por login/registro. No se incluyen tokens en las listas ni respuestas administrativas.

Aceptar requiere sesión, posesión del enlace recibido, email de cuenta exactamente igual al destinatario, empresa activa, invitación enviada, no revocada, no usada y no vencida. La posesión del enlace enviado acredita acceso al correo para este alta, aunque el registro tradicional no tenga una verificación general de email. La operación consume el token una sola vez. Un fallo de entrega revoca la invitación y devuelve error; no entrega un enlace inseguro por pantalla. Si una entrega resulta ambigua, el administrador revoca y crea otra.

## Comparación y proveedores

`/comparaciones` llama al mismo controlador de rutas que Mobile. El adaptador Business guarda un snapshot en servidor por 15 minutos, con ARS, fuente orientativa y motivo. Omite rating, confort y llegada del conductor, que el cálculo existente fija localmente; tampoco usa las diferencias artificiales de duración por marca.

`/viajes` recibe solo ID de comparación, clave UUID de idempotencia y proveedor. La función valida propietario/empresa/vencimiento y toma precio, direcciones, servicio y motivo del snapshot. Tanto la clave de usuario como la comparación tienen restricciones únicas. Reintentar el mismo registro devuelve el existente; cambiar proveedor con la misma comparación es conflicto. La intención queda como `pendiente` en `Viaje` y `intencion_registrada` en `BusinessRegistro`. No se inventa un número de reserva.

Después del registro se muestra un enlace explícito para continuar, que evita depender de popups bloqueados tras una petición asíncrona:

- Uber: enlace HTTPS a `m.uber.com`, con pickup/dropoff codificados según la documentación. Revisar origen, destino, categoría y precio en Uber antes de confirmar. El tipo de referencia ViajaYa no se convierte en un product_id inventado.
- Cabify: sitio oficial e instrucciones para ingresar el recorrido desde el teléfono. Su plataforma empresarial puede permitir reservas web a sus propios clientes, pero no se supone una URL de precarga pública.
- DiDi: sitio oficial argentino e instrucciones para continuar en la aplicación del teléfono. No se inventa un deep link o un flujo de reserva web.

Fuentes: [Uber Deep Links](https://developer.uber.com/docs/riders/ride-requests/tutorials/deep-links/introduction), [Cabify empresarial](https://cabify.com/static/pages/business/learning-center/manual-administradores.pdf), [DiDi Argentina](https://web.didiglobal.com/ar/pasajero/). No se llamó a Guest Rides ni se cambiaron los enlaces Mobile. Abrir el proveedor no devuelve automáticamente ID, importe final ni eventos; los webhooks anteriores no se consideran prueba de una intención sin vinculación verificable.

## Historial y estadísticas

Mis viajes filtra por usuario autenticado + empresa + tipo Business. Dashboard/listado empresarial solo para administradores, siempre por empresa. Listados de miembros, invitaciones y viajes paginados (máximo 100 por petición); filtros de fechas hasta un año. El dashboard agrega en SQL, no a partir de la primera página de historial.

La cantidad incluye registros Business del período, no viajes acreditados como realizados. Los importes agregados suman solo filas con metadatos ARS conocidos; los registros anteriores sin moneda se cuentan por separado y no se mezclan silenciosamente. Los gráficos y actividad se generan de filas reales. Cero registros muestra estado vacío; la curva diaria aparece a partir de dos días de datos. No se publican ahorros, pagos, facturas ni cantidad de viajes realizados sin evidencia.

## Apple: bloqueo temporal autorizado

`POST /social-login` con `provider: apple` devuelve 403 antes de consultar o escribir usuarios. El cliente actual envía email/nombre pero no una credencial verificable. El bloqueo se aplica también a tokens de texto inventados: no existe un bypass de configuración. No se modifican otras rutas de autenticación, pantallas, Expo, Context, OAuth cliente ni viajes. Email/contraseña y Google conservan el contrato y se verifican en las pruebas.

Para restaurarlo en una tarea posterior autorizada:

1. Hacer que el cliente Apple envíe un identity token y un nonce generado para la operación; no confiar en email/nombre enviados.
2. Verificar firma RS256 con claves JWKS oficiales de Apple, `kid`, issuer `https://appleid.apple.com`, audiencia exacta configurada, vencimiento, nonce y protección contra repetición. Cachear y rotar JWKS con límites seguros.
3. Asociar mediante identidad estable `iss`+`sub`; tratar correctamente email privado y la ausencia de email en accesos posteriores. Nunca vincular una identidad no verificada por coincidencia de email.
4. Agregar pruebas de firma inválida, issuer/audience/nonce incorrectos, expiración, repetición y recuperación segura de la asociación antes de retirar el 403.

**Tokens JWT emitidos antes del bloqueo:** el formato anterior no identifica qué método los emitió. No es posible revocar selectivamente los Apple antiguos sin infraestructura adicional. No se rotó `JWT_SECRET` ni se invalidaron las sesiones de los demás usuarios. Antes de publicar, esperar que venzan todos los tokens anteriores según `JWT_EXPIRES_IN` (7 días por defecto) o acordar una revocación/rotación global explícita. No afirmar que esos tokens preexistentes quedaron anulados por el bloqueo.

## Endpoints nuevos

Prefijo `/api/business`:

| Método y ruta | Permiso |
| --- | --- |
| GET `/auth/csrf` | Bootstrap CSRF, origen permitido. |
| POST `/auth/register`, `/auth/login` | Origen + CSRF + límites. |
| POST `/auth/logout` | Sesión + origen + CSRF. |
| GET `/contexto` | Sesión. |
| POST `/empresas` | Sesión, sin membresía anterior. |
| POST `/invitaciones/aceptar` | Sesión y destinatario/token válidos. |
| PATCH `/empresa` | Administrador de empresa activa. |
| GET `/empleados`, `/invitaciones` | Administrador. |
| PATCH `/empleados/:id` | Administrador; último administrador protegido. |
| POST `/invitaciones`, `/invitaciones/:id/revocar` | Administrador. |
| GET `/direcciones/sugerencias` | Miembro activo. |
| POST `/comparaciones`, `/viajes` | Miembro activo; viajes solo propios. |
| GET `/mis-viajes`, `/resumen-personal` | Miembro activo, datos propios. |
| GET `/viajes`, `/estadisticas` | Administrador, datos de su empresa. |

## Pruebas sin datos reales

Resultado final y límites de verificación: ver [`BUSINESS-STATUS.md`](BUSINESS-STATUS.md). El diff de `frontend/` está vacío. Los archivos de prueba usan fixtures aisladas; la aplicación normal no trae cuentas, empleados, viajes ni estadísticas de ejemplo.

```powershell
npm --prefix backend run test:business
npm --prefix backend run test:business-web
npm --prefix frontend-business run build
npm --prefix frontend-business test
npm --prefix frontend-business run test:e2e
npm --prefix frontend-business run test:integration
```

`test:business-web` usa PGlite (PostgreSQL real embebido en memoria), un esquema mínimo desechable y las cuatro migraciones locales. Prueba constraints, roles de base, comandos transaccionales e integración HTTP. El adaptador PostgREST de pruebas no es una implementación del servicio real: las relaciones y el esquema deben validarse en staging después de aprobar migraciones. PGlite serializa sus peticiones; los bloqueos se ejecutan en SQL, pero no se simuló contención real entre conexiones PostgreSQL independientes.

Las pruebas Playwright usan Edge instalado, levantan Vite solo en loopback e interceptan todas las llamadas Business. Sus cuentas/empresas/importes de fixture están exclusivamente en archivos de prueba, nunca en la aplicación. No envían invitaciones ni abren reservas reales. Si no está Edge, configurar un navegador de pruebas autorizado antes de ejecutar. No se instalan navegadores automáticamente.

`test:integration` es una suite adicional sin respuestas Business interceptadas: navegador → Vite → Express real → PostgreSQL desechable. Usa los puertos 5174/3001, tres contextos de navegador y el buzón local. Verifica el recorrido empresarial completo, aislamiento y revocación. Solo reemplaza los servicios externos de correo/rutas mediante el entrypoint de desarrollo explícito; bloquea cualquier intento de solicitud externa. No usa el backend abierto en el puerto 3000 ni deja datos allí. Los tests E2E de interfaz pueden reutilizar el Vite ya abierto en 5173 porque sustituyen todas sus respuestas Business.

Se ejecutaron también los tests Mobile existentes de Business y registro. Faltaba React Hook Form en esa instalación; para no modificar `frontend/`, se instalaron RHF **7.88.0** y React **19.2.3** (versiones de su lockfile) en `.verification/mobile-deps/` y se usó `NODE_PATH` solo en el proceso de prueba. No se compiló Expo ni se probó un dispositivo físico o un Google real.

## Recorrido manual después de aprobar configuración y migraciones

1. Crear una cuenta de prueba autorizada o usar una cuenta existente; iniciar sesión y registrar una empresa. Confirmar que su creador sea administrador.
2. Invitar un correo controlado por el equipo; abrir el enlace en un perfil separado de navegador, crear/iniciar sesión con ese correo y aceptar. Probar también destinatario incorrecto, enlace vencido y reuso.
3. Como empleado, solicitar un recorrido seleccionando dos sugerencias, indicar motivo y comparar. Elegir un proveedor, comprobar intención pendiente y continuar mediante el enlace oficial.
4. Consultar Mis viajes: solo registros propios. Como administrador, revisar dashboard e historial empresarial para el mismo período.
5. Crear una segunda empresa con otra cuenta de prueba. Intentar acceder a IDs de miembros/comparaciones/invitaciones de la primera: debe fallar.
6. Revocar al empleado; comprobar que no puede comparar ni registrar nuevos viajes. Intentar revocar al último administrador: debe rechazarse.
7. Cerrar sesión y comprobar que la cookie anterior ya no autoriza. Comparaciones y recorridos no se guardan en el historial de navegación ni en almacenamiento persistente del frontend.
8. Verificar Mobile con email/contraseña y Google en el entorno autorizado. Apple debe indicar el bloqueo temporal. Los viajes anteriores permanecen sin modificaciones.

Estas comprobaciones manuales sí crean registros: realizarlas únicamente en un entorno de prueba autorizado después de aprobar sus migraciones. No se ejecutaron contra Supabase durante esta implementación.

## Archivos de la entrega

Nuevos:

- `frontend-business/`: configuración Vite/TypeScript, lockfile, ejemplo de entorno, marca, SPA, CSS, tipos, cliente HTTP, sesión, contexto temporal de comparación, páginas y pruebas Vitest/Playwright.
- `backend/src/business/router.js`, `security.js`, `providers.js`: API empresarial, cookies/CSRF/límites y continuación externa.
- `backend/src/business/email.js`: envío de invitaciones desacoplado; producción usa Resend y el entrypoint local un buzón efímero.
- `backend/dev/startBusinessLocal.cjs`, `postgrestLocal.cjs`: arranque explícito del entorno desechable y adaptador SQL local.
- `backend/scripts/checkBusinessConfiguration.cjs`, `setupBusinessLocalConfiguration.cjs`: diagnóstico de lectura y configuración pública idempotente.
- `backend/sql/business_schema_audit.sql`: catálogo completo de solo lectura para Supabase SQL Editor.
- `backend/migrations/20261020_business_web.sql`: SQL completo pendiente de aprobación.
- `backend/.env.business.example`: nombres de configuración sin secretos.
- `backend/tests/businessWebDatabase.cjs`, `businessWebDatabase.test.cjs`, `businessWebHttp.test.cjs`, `businessWebSecurity.test.cjs`: motor PostgreSQL local, pruebas SQL/HTTP/seguridad.
- `backend/tests/businessWebAudit.test.cjs`, `frontend-business/integration/`, configuración de Playwright y script de preview: auditoría, guardias de migración y prueba real de punta a punta local.
- `docs/BUSINESS-WEB.md`: este documento.

Modificados:

- `backend/src/app.js`: montaje de la API y CORS/body limit solo para Business.
- `backend/src/controllers/authController.js`: únicamente bloqueo temporal de Apple en el login social, autorizado por el usuario.
- `backend/src/controllers/routeController.js`: exportación adicional de la fórmula existente para reutilizarla en el entorno de prueba; sus endpoints y cálculos Mobile no cambian.
- `backend/src/routes/businessRoutes.js`: desactivación por defecto del administrador global inseguro, eliminación de credenciales incrustadas y consulta de estado empresarial.
- `backend/tests/companyAccess.test.cjs`: fixtures explícitas para probar el panel legacy opt-in; no credenciales predeterminadas del producto.
- `backend/package.json` y lockfile: comandos de pruebas y PGlite como dependencia de desarrollo.
- `README.md`, `BUSINESS.md` y `.gitignore`: documentación actual, marcado del documento anterior como histórico y exclusión de artefactos de compilación/pruebas.

No se cambiaron `frontend/`, el `package.json` raíz ni su lockfile, Expo, integraciones Mobile ni migraciones anteriores. No hay commits, push, publicación, ejecución de SQL remoto ni credenciales nuevas de servicios creadas.
