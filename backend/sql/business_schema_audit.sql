-- Run this FIRST in Supabase SQL Editor. READ ONLY: no account rows, secrets,
-- invitations, prices or addresses are returned. Safe even if tables are absent.
BEGIN TRANSACTION READ ONLY;
WITH wanted(name) AS (
  VALUES ('Usuario'),('Viaje'),('EmpresaCorporativa'),('EmpresaUsuario'),
    ('BusinessSesion'),('BusinessInvitacion'),('BusinessComparacion'),('BusinessRegistro'),('BusinessAuditoria')
), relations AS (
  SELECT c.*,n.nspname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND c.relname IN (SELECT name FROM wanted)
), required(version,table_name,column_name) AS (
  VALUES
    ('20260828','Viaje','estado'),('20260828','Viaje','fechaConfirmacion'),('20260828','Viaje','proveedor'),('20260828','Viaje','idViajeProveedor'),('20260828','Viaje','estadoProveedor'),('20260828','Viaje','ultimoEventoProveedor'),
    ('20261007','Viaje','tipoViaje'),('20261007','Viaje','motivoViaje'),
    ('20261014','EmpresaCorporativa','id'),('20261014','EmpresaCorporativa','nombre'),('20261014','EmpresaCorporativa','codigo'),('20261014','EmpresaCorporativa','creada'),
    ('20261014','EmpresaUsuario','id'),('20261014','EmpresaUsuario','empresaId'),('20261014','EmpresaUsuario','email'),('20261014','EmpresaUsuario','usuarioId'),('20261014','EmpresaUsuario','activo'),('20261014','EmpresaUsuario','fechaAcceso'),('20261014','Viaje','empresaId'),
    ('20261020','EmpresaCorporativa','activa'),('20261020','EmpresaCorporativa','razonSocial'),('20261020','EmpresaCorporativa','identificacionFiscal'),('20261020','EmpresaCorporativa','direccion'),('20261020','EmpresaUsuario','rol'),('20261020','Viaje','canalOrigen'),
    ('20261020','BusinessSesion','tokenHash'),('20261020','BusinessSesion','usuarioId'),('20261020','BusinessSesion','creada'),('20261020','BusinessSesion','expira'),
    ('20261020','BusinessInvitacion','id'),('20261020','BusinessInvitacion','empresaId'),('20261020','BusinessInvitacion','email'),('20261020','BusinessInvitacion','rol'),('20261020','BusinessInvitacion','tokenHash'),('20261020','BusinessInvitacion','invitanteId'),('20261020','BusinessInvitacion','creada'),('20261020','BusinessInvitacion','expira'),('20261020','BusinessInvitacion','enviada'),('20261020','BusinessInvitacion','aceptada'),('20261020','BusinessInvitacion','revocada'),('20261020','BusinessInvitacion','aceptadaPor'),
    ('20261020','BusinessComparacion','id'),('20261020','BusinessComparacion','empresaId'),('20261020','BusinessComparacion','usuarioId'),('20261020','BusinessComparacion','datos'),('20261020','BusinessComparacion','creada'),('20261020','BusinessComparacion','expira'),
    ('20261020','BusinessRegistro','id'),('20261020','BusinessRegistro','viajeId'),('20261020','BusinessRegistro','comparacionId'),('20261020','BusinessRegistro','usuarioId'),('20261020','BusinessRegistro','empresaId'),('20261020','BusinessRegistro','clave'),('20261020','BusinessRegistro','proveedor'),('20261020','BusinessRegistro','estado'),('20261020','BusinessRegistro','moneda'),('20261020','BusinessRegistro','fuente'),('20261020','BusinessRegistro','creada'),
    ('20261020','BusinessAuditoria','id'),('20261020','BusinessAuditoria','empresaId'),('20261020','BusinessAuditoria','actorId'),('20261020','BusinessAuditoria','accion'),('20261020','BusinessAuditoria','recursoId'),('20261020','BusinessAuditoria','creada')
), checks AS (
  SELECT r.*,EXISTS(SELECT 1 FROM information_schema.columns c WHERE c.table_schema='public' AND c.table_name=r.table_name AND c.column_name=r.column_name) AS present FROM required r
)
SELECT jsonb_build_object(
  'nota','La presencia de columnas no prueba por sí sola que una migración esté aplicada. Revisar todas las definiciones antes de decidir. No repetir archivos presentes ni completar despliegues parciales a ciegas.',
  'estado_columnas',(SELECT jsonb_agg(to_jsonb(s)) FROM (SELECT version,count(*) AS esperadas,count(*) FILTER(WHERE present) AS presentes,CASE WHEN bool_and(present) THEN 'estructura_presente_revisar_definiciones' WHEN bool_or(present) THEN 'PARCIAL_no_ejecutar_sin_revision' ELSE 'ausente' END AS estado FROM checks GROUP BY version ORDER BY version) s),
  'faltantes',(SELECT coalesce(jsonb_agg(jsonb_build_object('version',version,'tabla',table_name,'columna',column_name)),'[]'::jsonb) FROM checks WHERE NOT present),
  'tablas',(SELECT jsonb_agg(jsonb_build_object('tabla',w.name,'existe',r.oid IS NOT NULL,'rls',r.relrowsecurity,'force_rls',r.relforcerowsecurity)) FROM wanted w LEFT JOIN relations r ON r.relname=w.name),
  'columnas',(SELECT coalesce(jsonb_agg(jsonb_build_object('tabla',r.relname,'columna',a.attname,'tipo',format_type(a.atttypid,a.atttypmod),'not_null',a.attnotnull,'default',pg_get_expr(d.adbin,d.adrelid)) ORDER BY r.relname,a.attnum),'[]'::jsonb) FROM relations r JOIN pg_attribute a ON a.attrelid=r.oid AND a.attnum>0 AND NOT a.attisdropped LEFT JOIN pg_attrdef d ON d.adrelid=r.oid AND d.adnum=a.attnum),
  'restricciones',(SELECT coalesce(jsonb_agg(jsonb_build_object('tabla',r.relname,'nombre',c.conname,'tipo',c.contype,'validada',c.convalidated,'definicion',pg_get_constraintdef(c.oid))),'[]'::jsonb) FROM pg_constraint c JOIN relations r ON r.oid=c.conrelid),
  'indices',(SELECT coalesce(jsonb_agg(jsonb_build_object('tabla',r.relname,'valido',i.indisvalid,'unico',i.indisunique,'definicion',pg_get_indexdef(i.indexrelid))),'[]'::jsonb) FROM pg_index i JOIN relations r ON r.oid=i.indrelid),
  'triggers',(SELECT coalesce(jsonb_agg(jsonb_build_object('tabla',r.relname,'nombre',t.tgname,'habilitado',t.tgenabled,'definicion',pg_get_triggerdef(t.oid))),'[]'::jsonb) FROM pg_trigger t JOIN relations r ON r.oid=t.tgrelid WHERE NOT t.tgisinternal),
  'funciones',(SELECT coalesce(jsonb_agg(jsonb_build_object('firma',p.oid::regprocedure::text,'security_definer',p.prosecdef,'config',p.proconfig,'permisos',p.proacl,'definicion',pg_get_functiondef(p.oid))),'[]'::jsonb) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname IN ('validar_empresa_viaje','business_web_command')),
  'politicas',(SELECT coalesce(jsonb_agg(to_jsonb(p)),'[]'::jsonb) FROM pg_policies p WHERE p.schemaname='public' AND p.tablename IN (SELECT name FROM wanted)),
  'permisos_tablas',(SELECT coalesce(jsonb_agg(to_jsonb(g)),'[]'::jsonb) FROM information_schema.role_table_grants g WHERE g.table_schema='public' AND g.table_name IN (SELECT name FROM wanted)),
  'secuencias',(SELECT coalesce(jsonb_agg(to_jsonb(s)-'last_value'),'[]'::jsonb) FROM pg_sequences s WHERE s.schemaname='public' AND s.sequencename IN ('business_web_viaje_id','BusinessAuditoria_id_seq')),
  'riesgos_preflight',jsonb_build_object(
    'usuario_id_bigint',EXISTS(SELECT 1 FROM pg_attribute WHERE attrelid=to_regclass('public."Usuario"') AND attname='idUsuario' AND atttypid='bigint'::regtype AND NOT attisdropped),
    'viaje_id_bigint',EXISTS(SELECT 1 FROM pg_attribute WHERE attrelid=to_regclass('public."Viaje"') AND attname='idViaje' AND atttypid='bigint'::regtype AND NOT attisdropped),
    'historial_migraciones_disponible',to_regclass('supabase_migrations.schema_migrations') IS NOT NULL
  )
) AS diagnostico_business;
COMMIT;
