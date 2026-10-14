# ViajaYa Business

El panel Desktop se sirve desde el backend: `http://localhost:3000/business-admin/` (reemplazar 3000 por el puerto configurado).

Administrador hardcodeado para la demostración: `admin@viajaya.com`, contraseña `ViajaYaAdmin2026!`. La sesión dura dos horas. Estas credenciales son de la demo y deben reemplazarse antes de publicar en producción.

## Estado verificado

Migración aplicada en Supabase y configuración del backend comprobada. Se probó el flujo HTTP contra la base real: alta de empresa, correos autorizados, login, acceso por código, viajes personales y corporativos, estadísticas, inactivación y reactivación. También se comprobó que la base rechaza viajes de empleados inactivos y que las tablas corporativas no son visibles con la clave pública. Los registros temporales usados para verificar el flujo fueron eliminados. Las compilaciones de Web y Android pasaron; la interfaz en un dispositivo físico queda para la comprobación manual.

Los archivos backend/.env y frontend/.env se conservan localmente y ya no tienen seguimiento en Git.

## Configuración

Las migraciones existentes de estado y clasificación de viajes ya estaban aplicadas al verificar el proyecto. La migración `backend/migrations/20261014_business_empresas.sql` crea EmpresaCorporativa y EmpresaUsuario y agrega empresaId a Viaje. No modifica la tabla Empresa existente. El backend necesita una clave de Supabase con permisos de servidor (service role o secret), conservada únicamente en SUPABASE_SERVICE_ROLE_KEY de backend/.env. Las tablas nuevas tienen RLS activado y no permiten acceso directo desde Mobile.

Se puede aplicar con la integración administrativa de Supabase o con `npm --prefix backend run migrate:business` después de configurar SUPABASE_ACCESS_TOKEN en backend/.env. El script usa el proyecto indicado por SUPABASE_URL, verifica las migraciones anteriores, aplica la nueva migración y configura una clave de servidor existente si todavía no hay una. No imprime claves ni las copia al frontend. No hace falta compartir secretos por chat. La migración se puede volver a ejecutar sin borrar datos.

`npm --prefix backend run check:business` comprueba la clave de servidor, JWT_SECRET y las columnas necesarias. Solo indica que Business está listo cuando la configuración y las consultas pasan.

Conservar JWT_SECRET de al menos 32 caracteres, iniciar el backend con `npm start` y Mobile con su EXPO_PUBLIC_API_URL configurada. No hay envío automático de invitaciones: el administrador comparte el código que muestra el panel.

## Comprobación de la entrega

1. Desde Perfil → ViajaYa Business → Administrar empresas, abrir el panel web (también se puede usar la URL directa), iniciar sesión como administrador y crear una empresa. Verificar su código.
2. Agregar el correo de una cuenta Mobile. También se puede autorizar un correo antes de que se registre.
3. Iniciar sesión en Mobile, abrir Perfil e ingresar el código. Verificar el nombre de empresa y el inicio corporativo. Se puede elegir el modo personal desde Perfil.
4. Guardar un viaje Business y usar Actualizar estadísticas en el panel para consultar el uso.
5. Inactivar al empleado. Un nuevo guardado corporativo debe rechazarse; al volver a Inicio o Perfil se verifica la habilitación y vuelve al modo personal. La cuenta personal y el historial anterior se conservan.
6. Reactivarlo e ingresar nuevamente el código si hace falta. Probar un código inválido y un correo no autorizado: ambos deben rechazarse.
7. Cerrar sesión de admin y comprobar que las operaciones administrativas exigen autenticación.

Cada correo pertenece a una empresa. Activo significa habilitado, no conectado en tiempo real. Las estadísticas incluyen cantidad de viajes, realizados, gasto estimado sin cancelados, empleados habilitados y cuentas vinculadas; los importes son estimaciones, no facturación. El último ingreso corresponde al uso del código. Los viajes históricos sin empresaId no se asignan retroactivamente.

Pruebas: `npm run test:business` en backend y frontend, y `npm run test:registration` en frontend.

La prueba optativa `npm --prefix backend run smoke:business` verifica el flujo HTTP con Supabase real y elimina únicamente sus registros temporales. No llama a proveedores de transporte.
